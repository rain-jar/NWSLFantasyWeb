import React, { useState, useEffect } from "react";
import { Button, Table, TableContainer, TableHead, TableRow, TableCell, TableBody, Paper, Card, CardContent, Typography } from "@mui/material";
import NavigationBar from "../NavigationBar";
import { useLeague } from "../LeagueContext";
import { supabase } from "../supabaseClient";
import {subscribeToDraftUpdates} from "../supabaseListeners";
import { useRef } from "react";



const DraftScreen = ({playersBase}) => {

    const { availablePlayers, setAvailablePlayers, leagueId, users, userId, userLeagues } = useLeague();
    const { leagueParticipants, setLeagueParticipants} = useLeague();
    const [positionFilter, setPositionFilter] = useState("All");
    
    const [players, setPlayers] = useState([...availablePlayers]);
    const [filteredPlayers, setFilteredPlayers] = useState([...availablePlayers]);
    const [loading, setLoading] = useState(false); // Add loading state
    const [draftTurn, setdraftTurn] = useState(false);
    const [draftStateId, setDraftStateId] = useState(null);
    const [currentRound, setCurrentRound] = useState(1);
    const [currentPick, setCurrentPick] = useState(0);
    const [draftOrder, setDraftOrder] = useState([users]);
    const [isDrafting, setIsDrafting] = useState(false); 
    const isDraftingRef = useRef(false); // ✅ Instant update for isDrafting

    //Timer State variables. 
    const [timer, setTimer] = useState(90); // 90-second countdown
    const [isPaused, setIsPaused] = useState(false);
    let timerInterval = null; // To store the interval reference
    const hasTimerStarted = useRef(false); // ✅ Track whether timer has started
    const isDraftStarted = useRef(false);
    const [draftingMessage, setDraftingMessage] = useState("");
    const draftingMessageRef = useRef("");
    let autoDraftTimeout = null; // Store timeout reference
    let isAutoDrafting = false; // Track if auto-draft is in progress
    const { timerRef } = useLeague(); // ✅ Use shared timerRef

    const safeTimerRef = timerRef ?? { current: null }; // ✅ Use fallback object if timerRef is undefined

    console.log("✅ TimerRef:", safeTimerRef.current);

    const positions = ["All", "FW", "MF", "DF", "GK"];
    let leagueName;

    const leagueNameArray = userLeagues.find((participant) => participant.id === leagueId);
    if (leagueNameArray) {
        leagueName = leagueNameArray.name;
    }else{
        leagueName = "Fantasy League";
    }
 //   const currentRound = 1; // Placeholder for now
    const playersLeft = 20; // Placeholder for now
    const userTurn = false; // Placeholder - will be dynamic later
    /*
    console.log("Available Players ", availablePlayers);
    console.log("Players ", players);
    console.log("filteredPlayers ", filteredPlayers);
    */

    useEffect(() => {
        const unsubscribe = subscribeToDraftUpdates(setCurrentRound, setCurrentPick, setDraftOrder);
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            //console.log("Drafting Message timer");
            setDraftingMessage(draftingMessageRef.current);
        }, 20); // ✅ Poll ref value to update UI without excessive re-renders
        return () => clearInterval(interval);
    }, []);

    //Starting Draft-Timer When Pick Updates
    useEffect(() => {

        const fetchandsetWaiter = async() => {

            console.log("🔥 Checking if timer should start");
            //  console.log("Current Top Player is ", filteredPlayers[0]);
          
            hasTimerStarted.current = false;  
            draftingMessageRef.current = "";  
            console.log("DraftState Id before checking for a timer in useEffect ", draftStateId);
      
            if (!draftStateId) {
                console.log("⏳ Waiting for draftStateId before fetching timer...");
                return; // ✅ Exit early if draftStateId is not yet available
            }
    
        
            const fetchTimer = async () => {
                console.log("Fetch Timer called");
    
                // ✅ First, check if a timer is already running in Supabase
                const { data, error } = await supabase
                    .from("draft_state")
                    .select("timer, timer_start")
                    .eq("id", draftStateId)
                    .single();
    
                if (error || !data) {
                    console.log("⚠️ No timer data found in Supabase, starting fresh.");
                } else {
                    console.log("Data received, retrieving timer in fetch timer");
                    const timerStartUTC = (new Date(data.timer_start).getTime() / 1000); // ✅ Convert to UTC timestamp
                    const currentTimeUTC = (new Date().getTime()/1000); // ✅ Get current time in GMT

                    const elapsedTime = Math.floor((currentTimeUTC - timerStartUTC)/1000); // ✅ Use UTC difference
                    const remainingTime = Math.max(0, data.timer - elapsedTime);
                    console.log("Remaining time is ", remainingTime,"Timer :", data.timer, "Timer start was : ", data.timer_start);
                    console.log("Timer start (UTC):", timerStartUTC);
                    console.log("Current time (UTC):", currentTimeUTC);
                    console.log("Elapsed Time (Seconds):", elapsedTime);
                    console.log("Remaining Time:", remainingTime);
    
                    if (remainingTime > 0) {
                        console.log("⏳ Timer is already running in Supabase, resuming from:", remainingTime);
                        console.log("🕒 Current TimerRef Value: ", timerRef.current);
                        setTimer(remainingTime);
    
                        // ✅ If timer has already started, prevent restarting it
                        hasTimerStarted.current = remainingTime > 0 && remainingTime < 90;
                        console.log("hasTimerStarted ", hasTimerStarted.current);
            
                        // ✅ Ensure Supabase is also updated immediately
                        await supabase
                        .from("draft_state")
                        .update({ timer: remainingTime })
                        .eq("id", draftStateId);
    
                        return; // ✅ Do NOT start a new timer if one is active
                    }
                }
            };
          
            await fetchTimer();
            console.log("Awaiting fetching data");
      
            // ✅ Clear existing timer when pick changes (prevents previous user from seeing active timer)
            if (timerRef.current) {
                console.log("🛑 Clearing old timer as pick changed");
                clearInterval(timerRef.current);
                timerRef.current = null;
                setTimer(90); // ✅ Reset UI timer instantly
            }

            //Start the timer after clear intervals and confirming there is a need for a new timer. 
            const timeout = setTimeout(() => {
                if (!isPaused && draftOrder[currentPick]?.user_id === userId && !hasTimerStarted.current) {
                    console.log("🔥 Starting timer for current user");
                    hasTimerStarted.current = true;
                    startDraftTimer();
                } else {
                    console.log("⏳ Not your turn, timer will not start. Message from useEffect");
                }
            }, 5000);
        
            return () => clearTimeout(timeout);

        };

        fetchandsetWaiter();

    }, [currentPick, draftStateId]); // ✅ Runs when draft progresses OR user navigates back
    
    

    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true); 
            await fetchDraftState();
           // console.log("DraftScreen fetches draft state - currentPick:", currentPick, " currentRound:", currentRound);
            setLoading(false);
          //  console.log(" Loading inside Initial fetches", loading);
        };
    
        fetchInitialData();
    }, [leagueId, leagueParticipants]);


    useEffect(() => {
        const fetchData = async () => {
       //     console.log("Calling Filters due to filter change");
            await filterPlayers();
        };
        fetchData();
    }, [positionFilter, players]);

    useEffect(() => {
    //    console.log("After listening to the PlayerUpdate listener ", loading);
        const fetchMergedData = async() => {
            if (!loading && availablePlayers?.length > 0) {
    //            console.log("Fetched Available Players from Listener ", availablePlayers);
                await mergeFunc();
    //            console.log("Did you wait for FilterPlayers in MergeFunc?");
            }
        }
        fetchMergedData();
      }, [availablePlayers, loading]);


    const mergeFunc = async () => {
        const mergedList = availablePlayers.map((player) => {
            const statsMatch = playersBase.find((m) => m.id === player.player_id) || {};
            return {
              ...player,
              name: statsMatch.name || "",
              position: statsMatch.position || "",
              image_url: statsMatch.image_url || "",
            };
          });
        //  console.log("Merge Func complete");
          setPlayers(mergedList);
          await filterPlayers();
        //  console.log("Waited for filterPlayers in MergeFunc");
    }

    const teams = leagueParticipants.map((user) => ({
        id: user.user_id,
        name: user.team_name,
        roster: user.roster,
      }));
    
    const currentUser = users.find((user) => user.id === userId );

    const filterPlayers = async() => {
    //    console.log("Inside Filters ", positionFilter);
    //    console.log("Players ", players.length);
        let filtered;
        if (positionFilter){
            filtered = [...players];
        }
      
        if (positionFilter && positionFilter !== "All") {
          filtered = filtered.filter((player) => player.position.includes(positionFilter));
        }

        setFilteredPlayers(filtered);
    //    console.log("🔄 Filtered Players:", filtered);
    };

    const fetchDraftState = async () => {
        try{
        //  console.log("League Id is ", leagueId);
        //  console.log("loading in Draft State is ", loading);
          const { data, error } = await supabase.from("draft_state")
          .select("*")
          .eq("id", leagueId);
        //  console.log("Draft State data fetched before update ", data);
      
          if (error || data.length == 0) {
           console.error("Error fetching draft state:", error);
           const { data: newData, error: insertError } = await supabase
                  .from("draft_state")
                  .insert([{ id: leagueId, current_round: 1, current_pick: 0, draft_order: leagueParticipants }])
                  .select()
                  .single();
  
              if (insertError) {
                  console.error("Error initializing draft state:", insertError);
                  return;
              }
              setDraftStateId(newData.id);
              setCurrentRound(newData.current_round);
              setCurrentPick(newData.current_pick);
              setDraftOrder(newData.draft_order);
              /*
              console.log("Draft State is fetched for the first time for League ",leagueId);
              console.log("Initial Draft is : Current Pick: ",newData.currentPick, " CurrentRound: ", newData.currentRound);
              console.log("Whereas Initial App Draft  is : Current Pick: ",currentPick, " CurrentRound: ", currentRound);
  */
          } else {
        //  console.log("Draft Fetch is successful ");
          setDraftStateId(data[0].id);
          setCurrentRound(data[0].current_round);
          setCurrentPick(data[0].current_pick);
          setDraftOrder(data[0].draft_order); // Default to teams if empty
        //  console.log("Fetch State on App.tsx render ", data, "Current pick: ", data[0].current_pick, " Current Round: ", data[0].current_round, "Draft Order ", data[0].draft_order, "DraftStateId ", draftStateId);
          }
        } catch (err) {
          console.log("🔥 Unexpected fetch error:", err);
        }
    }; 

    //Defining startDraftTimer Function
    const startDraftTimer = async () => {
        if (draftOrder[currentPick]?.user_id !== userId) return;
    
        console.log("🔥 Starting new draft timer");
    
        if (timerRef.current) clearInterval(timerRef.current);
    
        const initialTime = 90;
        setTimer(initialTime);
    
        // ✅ Save timer start time to Supabase
        console.log("DraftState Id before saving start time ", draftStateId);
        console.log("Timer is being set with timer_start :", new Date().toISOString());
        await supabase
            .from("draft_state")
            .update({ timer: initialTime, timer_start: new Date().toISOString() })
            .eq("id", draftStateId);
    
        timerRef.current = setInterval(async () => {
            setTimer((prevTime) => {
                if (prevTime <= 1) {
                    clearInterval(timerRef.current);
                    timerRef.current = null;
                    autoDraft();
                    return 0;
                }
                return prevTime - 1;
            });
    
            // ✅ Continuously update the timer in Supabase
        //    console.log("DraftStateId during timer ", draftStateId, timer);
            await supabase
                .from("draft_state")
                .update({ timer: timer - 1 })
                .eq("id", draftStateId);
        }, 1000);
    };
    

    const autoDraft = async () => {
        if (isAutoDrafting) {
            console.log("🚨 Skipping duplicate autoDraft call!");
            return;
        }
    
        isAutoDrafting = true; // ✅ Mark auto-draft as in progress
        console.log("🔥 autoDraft function called at:", new Date().toISOString());
    
        if (isDraftingRef.current) {
            console.log("🔥 Resetting isDrafting for back-to-back picks.");
            isDraftingRef.current = false; // ✅ Reset before proceeding
            setIsDrafting(false);
            await new Promise((resolve) => setTimeout(resolve, 50)); 
        }
    
        if (draftOrder[currentPick]?.user_id !== userId) {
            console.log("Autodraft is returning because it's not your turn");
            isAutoDrafting = false;
            return;
        }
    
        console.log("Auto-picking for", draftOrder[currentPick].team_name);
        draftingMessageRef.current = "Drafting... Please wait";
    
        const topPlayer = filteredPlayers[1];
        if (!topPlayer) {
            console.log("No players left to auto-draft");
            isAutoDrafting = false;
            return;
        }
    
        console.log("Auto-drafting ", topPlayer.name);
    
        if (autoDraftTimeout) clearTimeout(autoDraftTimeout);
    
        autoDraftTimeout = setTimeout(() => {
            console.log("🔥 Executing handleDraft in autoDraft");
    
            isDraftingRef.current = false; // ✅ Ensure it's reset before handling draft
            setIsDrafting(false); // ✅ Reset again before calling handleDraft()
            handleDraft(topPlayer);
            
            autoDraftTimeout = null;
            isAutoDrafting = false; 
        }, 5000);
    };
    
/*
    console.log("Draft Order team ", draftOrder[currentPick].team_name);
    console.log("Roster is ", draftOrder[currentPick]);
    console.log("Loading ", loading);
*/

// Position Constraints

    const maxPlayersPerTeam = 11;
    const minPositions = { FW: 1, MF: 3, DF: 3, GK: 1 };
    const maxPositions = { FW: 4, MF: 5, DF: 5, GK: 1 };


    const currentTeam = draftOrder[currentPick];
/*
    console.log ("Current Team in DraftScreen is ", currentTeam);
    console.log ("Test ", userLeagues, leagueId);
*/

    // Helper Functions
    const nextTurn = async() => {
        console.log("currentPick: ",currentPick," currentRound: ",currentRound);
        console.log("Draft Order inside Next Turn ", draftOrder);
        let newPick = currentPick;
        let newRound = currentRound;
        let newDraftOrder = [...draftOrder];

        if (newPick < newDraftOrder.length - 1) {
            newPick++;
        } else {
            newRound++;
            newDraftOrder.reverse(); // Reverse for snake draft
            newPick = 0;
        }
        
        // Update local state
        setCurrentPick(newPick);
        setCurrentRound(newRound);
        setDraftOrder(newDraftOrder);
        console.log("currentPick: ",newPick," currentRound: ",newRound)
        
        if (!draftStateId) return;

        // Save draft state to Supabase
        const { error } = await supabase
            .from("draft_state")
            .update({
            current_round: newRound,
            current_pick: newPick,
            draft_order: newDraftOrder
            })
            .eq("id", draftStateId); // Replace with actual draft state row ID
        
        if (error) {
            console.error("Error updating draft state:", error);
        }

    /*
        console.log('came to update after pick'+currentPick+' and draft size is'+draftOrder.length);
        if (currentPick < draftOrder.length - 1) {
            currentPick++;
            console.log('now its pick '+ currentPick);
        } else {
            currentRound++;
            draftOrder.reverse(); // Reverse the draft order for the next round
            currentPick = 0;
            console.log("Pick order has reversed. Current Pick is " + currentPick);
        }
        */
    }

    const isValidPick = (team, player) => {
        const positionCount = {
            FW: team.roster.filter(p => p.position.includes("FW")).length,
            MF: team.roster.filter(p => p.position.includes("MF")).length,
            DF: team.roster.filter(p => p.position.includes("DF")).length,
            GK: team.roster.filter(p => p.position.includes("GK")).length
        };

        // Position constraints
        if (player.position.includes("GK") && positionCount.GK >= maxPositions.GK) {console.log("Already has a GK"); return false;}
        if (team.roster.length >= maxPlayersPerTeam) {console.log("No Spots Left"); return false;}

        if (team.roster.length < maxPlayersPerTeam) {
            const playerPositions = player.position.split("-");
            const canFit = playerPositions.some(pos => positionCount[pos] < maxPositions[pos]);
            if (!canFit) {console.log("Player Position already filled"); return false;}
        }

            // **Min Position Check**: If the team is reaching 11 players, ensure all min requirements are met
            if (team.roster.length === maxPlayersPerTeam - 1) {
                for (const pos in minPositions) {
                if (positionCount[pos] < minPositions[pos] && !player.position.includes(pos)) {
                    return false; // This pick would make the team invalid
                }
                }
            }

        return true;
    }


    const handleDraft = async(player) => {
        if (isDraftingRef.current) {
            console.log("Returning from handleDraft because isDrafting is:", isDraftingRef.current);
            return;
        }
    
        isDraftingRef.current = true; // ✅ Immediately block duplicate drafts

        setIsDrafting(true); // ✅ Sync with state


        draftingMessageRef.current = "Drafting... Please wait"; // ✅ Instant update
        console.log("Drafting team is "+ draftOrder[currentPick].team_name);

        if (userId != draftOrder[currentPick].user_id){
            console.log ("It's not the current user's turn");
            setdraftTurn(true);
            isDraftingRef.current = false; 
            setIsDrafting(false);
            return false;
        }

        //Stopping Timer since Draft button was clicked. 
        clearInterval(timerInterval); // Stop the timer on manual draft
        setTimer(90); // Reset timer for next pick
      //  isDraftStarted.current = true;  // ✅ Mark draft as started when first draft is made

        const team = teams.find(t => t.id === draftOrder[currentPick].user_id);

        if (!team || player.onroster || !isValidPick(team, player)) {
            console.log(`Invalid pick: ${player.name}`);
            isDraftingRef.current = false; 
            setIsDrafting(false);
            return false;
        }

        let assignedPosition = player.position;
        if (player.position.includes("-")) {
            const possiblePositions = player.position.split("-");
            assignedPosition = possiblePositions.find(pos => team.roster.filter(p => p.position.includes(pos)).length < maxPositions[pos]) || possiblePositions[0];
        }


    //    const success = draftPlayer(currentTeam.id, player, playerList, teams);
    //    if (success) {

                // **Fetch current roster**
            console.log("Current Pick before assigning currentRoster ", draftOrder[currentPick]);
            console.log("Current League Participants ", leagueParticipants);
            const currentRoster = leagueParticipants.find((participant) => participant.team_name == draftOrder[currentPick].team_name).roster;


            console.log("Roster before updating with draft player ", currentRoster);
            // ** Append new player**
            const updatedRoster = [...currentRoster, player];

            const { error } = await supabase
            .from("league_rosters")
            .update({ roster: updatedRoster })
            .eq("league_id", draftOrder[currentPick].league_id)
            .eq("user_id",draftOrder[currentPick].user_id);
            console.log(`${draftOrder[currentPick].team_name} drafted ${player.name}`);

            if (error) {
                console.error("Error updating roster:", error);
                setIsDrafting(false);
                alert("Failed to update roster. Try again.");
                return;
            }else{
                console.log("Roster updated successfully in Supabase!");
            }
            
            // Update Player Status in availablePlayers in Supabase
            const { error: playerError } = await supabase
            .from("league_players")
            .update({ onroster: true })
            .eq("player_id", player.player_id)
            .eq("league_id", draftOrder[currentPick].league_id);
            console.log("Player: "+player.name+"'s onRoster status is true in the players table in Supabase")

            if (playerError) {
            console.error("Error updating player from available players:", playerError);
            setIsDrafting(false);
            return;
            }

            //updateUserRoster(draftOrder[currentPick].id, (prevRoster) => [...prevRoster, { ...player, assignedPosition }]);
            //setPlayers((prevPlayers) => prevPlayers.filter((p) => p.name !== player.name));
            //setAvailablePlayers((prevPlayers) => prevPlayers.filter((p) => p.name !== player.name));
            console.log(`${draftOrder[currentPick].team_name} drafted ${player.name} as ${assignedPosition}`);


        //setPlayers([...playerList]); // Update available players
        // if (currentTeam.id === 1) {
                //onNotify([...currentTeam.roster]); 
            //onNotify((prevRoster) => [...prevRoster, player]); // Notify App about Team 1's updated roster
        // }
            await nextTurn();
            console.log('current Team is ' + draftOrder[currentPick].team_name);
           // setCurrentTeam(draftOrder[currentPick]); // Update current team
         //   onPick(player);

            isDraftingRef.current = false; // ✅ Unlock drafting immediately

            setIsDrafting(false);

    //    }
    };

    /*
    console.log ("Current Pick : ", currentPick, "Current Round: ", currentRound);
    console.log ("Draft Order ", draftOrder);
    console.log ("League Participants ", leagueParticipants);
    */


    return (
        <div>
        <NavigationBar />
        <div className="draft-screen">
            {/* Draft Info Card */}
            <Card className="draft-card">
            <CardContent>
                <Typography variant="h5" className="draft-league-name">{leagueName}</Typography>
                <Typography variant="h6" className="draft-details">Drafting Team : {draftOrder[currentPick].team_name} |  Round: {currentRound} | Players Left: {availablePlayers.length}
                </Typography>
                <Typography variant="h6" className="draft-league-name">Time Left: {timer}s</Typography>
                {draftingMessage && <Typography variant="h6">{draftingMessage}</Typography>}
                {timer === 90 || timer === 0 ? (
                    <Typography variant="h6">Another User is drafting. Please wait for your turn</Typography>) : null}


              {/*  <Typography variant="h6" className="draft-status">
                 It is the turn of : {draftOrder[currentPick].team_name}
                {userTurn ? "Your Turn to Pick" : "Waiting for Other Picks..."}
                </Typography>*/}
            </CardContent>
            </Card>

            {/* Position Filters */}
            <div className="position-filters">
            {positions.map((pos) => (
                <Button 
                key={pos} 
                onClick={() => setPositionFilter(pos)}
                className={`filter-btn ${positionFilter === pos ? "active" : ""}`}
                >
                {pos}
                </Button>
            ))}
            </div>

            {/* Player Pool Table */}
            <TableContainer component={Paper} className="player-pool-table">
            <Table>
                <TableHead>
                <TableRow>
                    <TableCell>     </TableCell>
                    <TableCell>Player Name</TableCell>
                    <TableCell>Position</TableCell>
                    <TableCell>Action</TableCell>
                </TableRow>
                </TableHead>
                <TableBody>
                {filteredPlayers.map((player, index) => (
                  <TableRow key={index}
                    sx={{ cursor: "pointer", "&:hover": { backgroundColor: "rgba(16, 86, 51, 0.1)" } }} // Hover effect for better UX
                  >
                    <TableCell><img src={player.image_url || process.env.PUBLIC_URL + "/placeholder.png"} alt={player.name} className="player-img"   onError={(e) => { e.target.onerror = null; e.target.src = process.env.PUBLIC_URL + "/placeholder.png"; }}/></TableCell>
                    <TableCell>{player.name}</TableCell>
                    <TableCell>{player.position}</TableCell>
                    <TableCell><Button className="add-btn" 
                        sx={{"&:hover": {backgroundColor: "kellygreen", color: "black"}}} 
                        onClick={() => handleDraft(player)}
                        disabled={isDrafting} // ✅ Disable when function is running
                    >Draft</Button></TableCell>
                    
                  </TableRow>
                ))}
                </TableBody>
            </Table>
            </TableContainer>

            {/* Styles */}
            <style jsx>{`

            html, body {
                overflow-x: hidden; /* ✅ Prevents horizontal scrolling */
                background-color: black; /* ✅ Ensures no white space appears */
            }

            body {
                min-height: 100vh; /* ✅ Ensures body takes full height */
                margin: 0; /* ✅ Removes any default margin that might cause shifting */
                padding: 0;
            }

            .draft-screen {
                width: 100%;
                background: black;
                color: white;
                text-align: center;
                padding: 20px;
                min-height: 100vh;
                justify-content: space-between;
            }

            .draft-card {
                flex-grow: 1; 
                width: 90%;
                margin: 20px auto;
                background: white;
                color: black;
                display: flex;
                justify-content: space-between;
                padding: 15px;
                border-radius: 12px;
                box-shadow: 5px 5px 15px rgba(0, 0, 0, 0.4), -5px -5px 15px rgba(255, 255, 255, 0.1);
            }

            .draft-league-name {
                text-align: left;
            }

            .draft-details {
                text-align: right;
            }

            .draft-status {
                text-align: center;
                font-weight: bold;
                margin-top: 10px;
            }

            .position-filters {
              display: flex;
              justify-content: center;
              gap: 10px; /* Adds space between buttons */
              margin-bottom: 20px;
            }

            .filter-btn {
              border-radius: 20px;
              background: white;
              color: black;
              transition: 0.3s;
              min-width: 80px;
            }

            .filter-btn:hover {
              background: kellygreen;
              color: black;
            }

            .filter-btn.active {
              background: darkgreen; /* Ensures contrast */
              color: white;
              font-weight: bold;
            }

            .player-img {
              width: 40px;
              height: 40px;
              border-radius: 50%;
            }

            .player-pool-table {
                flex-grow: 1; 
                width: 90%;
                margin: 20px auto;
                background: white;
                font-family: "American Typewriter", serif;
            }
            `}</style>
        </div>
        </div>
    );
};

export default DraftScreen;
