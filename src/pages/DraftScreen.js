import React, { useState, useEffect } from "react";
import { Button, Table, TableContainer, TableHead, TableRow, TableCell, TableBody, Paper, Card, CardContent, Typography, Box, Modal } from "@mui/material";
import NavigationBar from "../NavigationBar";
import { useLeague } from "../LeagueContext";
import { supabase } from "../supabaseClient";
import {subscribeToDraftUpdates} from "../supabaseListeners";
import { useRef } from "react";


const DraftScreen = ({playersBase}) => {

    const { availablePlayers, setAvailablePlayers, leagueId, users, userId, userLeagues } = useLeague();
    const { leagueParticipants, setLeagueParticipants, timerStart, lockStatus} = useLeague();
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
    const timerRef = useRef(null); // ✅ Persist timer reference
    const [draftingMessage, setDraftingMessage] = useState("");
    const [modalMessage, setModalMessage] = useState("");
    const draftingMessageRef = useRef("");
    let autoDraftTimeout = null; // Store timeout reference
    let isAutoDrafting = false; // Track if auto-draft is in progress
    const lastProcessedPick = useRef(null);
    const lastProcessedTimerStart = useRef(null);
    const fullTeamsCountRef = useRef(0);
    const { fullTeamsCount, setFullTeamsCount } = useLeague();



    const positions = ["All", "FW", "MF", "DF", "GK"];
    let leagueName;

    const leagueNameArray = userLeagues.find((participant) => participant.id === leagueId);
    if (leagueNameArray) {
        leagueName = leagueNameArray.name;
    }else{
        leagueName = "Fantasy League";
    }
 //   const currentRound = 1; // Placeholder for now
    const playersLeft = 30; // Placeholder for now
    const userTurn = false; // Placeholder - will be dynamic later
    /*
    console.log("Available Players ", availablePlayers);
    console.log("Players ", players);
    console.log("filteredPlayers ", filteredPlayers);
    */

    useEffect(() => {
        const unsubscribe = subscribeToDraftUpdates(setCurrentRound, setCurrentPick, setDraftOrder, setFullTeamsCount);
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            //console.log("Drafting Message timer");
            setDraftingMessage(draftingMessageRef.current);
        }, 20); // ✅ Poll ref value to update UI without excessive re-renders
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const fetchFullTeamsCount = async () => {
            const { data, error } = await supabase
                .from("draft_state")
                .select("full_teams_count")
                .eq("id", leagueId)
                .single();
            if (!error && data) {
                console.log("Fetched full teams count in DraftScreen", data.full_teams_count);

                // ✅ Prevent overwriting with an older value
                if (data.full_teams_count >= fullTeamsCountRef.current) {
                    fullTeamsCountRef.current = data.full_teams_count;
                    setFullTeamsCount(data.full_teams_count);
                } else {
                    console.log("Skipping update: Supabase value is older than local state");
                }
            }else{
                console.log("Error fetching fullTeamsCount in DraftScreen");
            }
        };
        fetchFullTeamsCount();
    }, [fullTeamsCount]);



    //Updating Draft-Timer --> When Pick Updates or when user navigate or refreshes the page. 
    useEffect(() => {
        if (!timerStart || !draftOrder[currentPick]?.user_id) {   
            console.log("Returning due to either ", timerStart, " or ", draftOrder[currentPick]?.user_id);         
            return;
        }

        if(lockStatus !== "draft"){
            console.log("Returning since draft status is inactive");
            return;
        }

        console.log("Entering drafting useEffect");
        console.log("Teams Full Counter in useEffect , ", fullTeamsCountRef.current);
        if (fullTeamsCountRef.current >= leagueParticipants.length) {
            console.log("✅ All teams are full. Ending the draft.");
            lockUpdate(); //Updates the lock status to postdraft once draft is finished. 
            return; // ✅ Stop the draft
        }
        
        console.log("Current pick ", currentPick, "Timer Start ", timerStart);
        console.log("LastProcessed Pick ", lastProcessedPick.current);
        console.log("LastProcessedTimer ", lastProcessedTimerStart.current);
        console.log("League Participants is ", leagueParticipants);

    // ✅ Allow the effect to run if timerStart has changed, even if currentPick is the same
        const isNewPick = lastProcessedPick.current !== currentPick;
        const isNewTimerStart = lastProcessedTimerStart.current !== timerStart;

        console.log("Going into UseEffect ", isNewPick, isNewTimerStart);

            // ✅ Prevent duplicate runs only if both values are unchanged
        if (!isNewPick && !isNewTimerStart) {
            console.log("⏳ Skipping redundant timer update - Pick:", currentPick, "Timer Start:", timerStart);
            // 🔥 Force re-sync timer if the user navigated away and returned
            const elapsedTime = Math.floor((Date.now() - Date.parse(timerStart)) / 1000);
            const remainingTime = Math.max(90 - elapsedTime, 0);
            console.log ("Elapsed Time : ", elapsedTime, " And Remaining Time : ", remainingTime);
            console.log("Current Pick is ", draftOrder[currentPick].user_id, draftOrder[currentPick].team_name);

            if (draftOrder[currentPick]?.user_id !== userId) {
                console.log("👀 User is NOT the drafter, setting timer to 90s.");
                setTimer(90); // ✅ Other users always see 90s
                return;
            }

        }

        console.log("Setting the latest values for pick and time start");
        lastProcessedPick.current = currentPick;
        lastProcessedTimerStart.current = timerStart; // ✅ Ensure the latest timerStart is always used

        console.log("🕒 Before Calculation : TimeStart", timerStart, "CurrentTime : ", new Date().toISOString());
        console.log("Checking for time : Current Time :", Date.now(), "TimerStart :", Date.parse(timerStart));

        // ✅ Determine if the timer should start fresh or resume from stored timerStart
        const isUserTurn = draftOrder[currentPick]?.user_id === userId;
        const elapsedTime = Math.floor((Date.now() - Date.parse(timerStart)) / 1000);
        const remainingTime = Math.max(90 - elapsedTime, 0); // Ensure it never goes negative
        console.log("Current Pick is ", draftOrder[currentPick].team_name, draftOrder[currentPick]);
        console.log("🕒 Timer Logic - User Turn:", isUserTurn, "Elapsed Time:", elapsedTime, "Remaining Time:", remainingTime);
    
        // ✅ Clear any existing timers before setting a new one
        if (timerRef.current) clearInterval(timerRef.current);
    
        if (isUserTurn) {
            if (elapsedTime >= 90) {
                console.log("⏳ Timer expired, auto-resetting...");
                setTimer(90);
            //    autoDraft(); // Auto-draft if timer has fully elapsed
            }/* else {*/
                console.log("🔥 Starting draft timer from", remainingTime, "seconds.");
                setTimer(remainingTime);
                timerRef.current = setInterval(() => {
                    setTimer((prevTime) => {
                        if (prevTime <= 1) {
                            clearInterval(timerRef.current);
                            console.log("⏳ Timer ran out, auto-drafting...");
                            autoDraft();
                            return 0;
                        }
                        return prevTime - 1;
                    });
                }, 1000);
            //}
        } else {
            console.log("⏳ Not user's turn, timer will not start.");
            setTimer(90); // Ensure UI shows correct remaining time but does not start a timer
        }
    
        return () => clearInterval(timerRef.current);
    }, [timerStart, currentPick, draftOrder, fullTeamsCount]); // ✅ Runs when `timerStart` or `currentPick` updates
    


    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true); 
            await fetchDraftState();
        //    console.log("DraftScreen fetches draft state - currentPick:", currentPick, " currentRound:", currentRound);
            setLoading(false);
        //    console.log(" Loading inside Initial fetches", loading);
        };
    
        fetchInitialData();
    }, [leagueId, leagueParticipants]);


    useEffect(() => {
        const fetchData = async () => {
     //       console.log("Calling Filters due to filter change");
            await filterPlayers();
        };
        fetchData();
    }, [positionFilter, players]);

    useEffect(() => {
      //  console.log("After listening to the PlayerUpdate listener ", loading);
        const fetchMergedData = async() => {
            if (!loading && availablePlayers?.length > 0) {
       //         console.log("Fetched Available Players from Listener ", availablePlayers);
                await mergeFunc();
       //         console.log("Did you wait for FilterPlayers in MergeFunc?");
            }
        }
        fetchMergedData();
      }, [availablePlayers, loading]);


    const lockUpdate = async() => {
        const { data: newData, error: insertError } = await supabase
        .from("draft_state")
        .update({ lockstatus: "postdraft" })
        .eq("id", leagueId)
        .select()
        .single();

        if (insertError) {
            console.error("Error updating lock status after end of league :", insertError);
            return;
        }else{
            console.log("✅ After end of draft, Lock Status updated to  ",  newData.lockstatus);
        }
    }

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
          console.log("League Id is ", leagueId);
        //  console.log("loading in Draft State is ", loading);
          const { data, error } = await supabase.from("draft_state")
          .select("*")
          .eq("id", leagueId);
        //  console.log("Draft State data fetched before update ", data);
      
          if (error || data.length == 0) {
        //   console.error("Error fetching draft state:", error);
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
        //      console.log("Draft State is fetched for the first time for League ",leagueId);
        //      console.log("Initial Draft is : Current Pick: ",newData.currentPick, " CurrentRound: ", newData.currentRound);
        //      console.log("Whereas Initial App Draft  is : Current Pick: ",currentPick, " CurrentRound: ", currentRound);
  
          } else {
        //  console.log("Draft Fetch is successful ");
          setDraftStateId(data[0].id);
          setCurrentRound(data[0].current_round);
          setCurrentPick(data[0].current_pick);
          setDraftOrder(data[0].draft_order); // Default to teams if empty
        //  console.log("Fetch State on App.tsx render ", data, "Current pick: ", data[0].current_pick, " Current Round: ", data[0].current_round, "Draft Order ", data[0].draft_order);
          }
        } catch (err) {
          console.log("🔥 Unexpected fetch error:", err);
        }
    }; 

    //Defining startDraftTimer Function
    const startDraftTimer = async() => {
        draftingMessageRef.current = ""; // ✅ Clear message when timer actually starts

        if (draftOrder[currentPick]?.user_id !== userId) {
            draftingMessageRef.current = ""; // ✅ Clear message when timer actually starts
            console.log("⏳ Not your turn, timer will not start. Current turn is for :", draftOrder[currentPick]?.team_name);
            return; // ✅ Exit if it's not the user's turn
        }

        console.log("🔥 Starting new draft timer");
    
        if (timerRef.current) clearInterval(timerRef.current); // ✅ Ensure only one timer runs
    
        setTimer(90); // Reset timer

        // ✅ Update `timer_start` in Supabase
        console.log("Timer start being set in Supabase");
        const { error } = await supabase
            .from("draft_state")
            .update({ timer_start: new Date().toISOString() })
            .eq("id", leagueId); // Ensure correct draft state entry is updated

        if (error) {
            console.error("❌ Error updating draft timer in Supabase:", error);
            return;
        }else{
            console.log("✅ Timer start set in Supabase");
        }

        timerRef.current = setInterval(() => {
            setTimer((prevTime) => {
                if (prevTime <= 1) {
                    clearInterval(timerRef.current);
                    timerRef.current = null; // ✅ Prevent lingering intervals
                    console.log("🔥 Calling autoDraft from startDraftTimer");
                    autoDraft();
                    return 0;
                }
                return prevTime - 1;
            });
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

    const MAX_MAIN_PLAYERS = 7;
    const MAX_BENCH_PLAYERS = 1;
    const TOTAL_TEAM_SIZE = MAX_MAIN_PLAYERS + MAX_BENCH_PLAYERS;
    const REQUIRED_POSITIONS = { FW: 2, MF: 2, DF: 2, GK: 1 };


    const currentTeam = draftOrder[currentPick];
/*
    console.log ("Current Team in DraftScreen is ", currentTeam);
    console.log ("Test ", userLeagues, leagueId);
*/


    // Helper Functions
    const nextTurn = async(wasFull = false) => {

        console.log("currentPick: ",currentPick," currentRound: ",currentRound);
        console.log("Draft Order inside Next Turn ", draftOrder);
        
        let newPick = currentPick;
        let newRound = currentRound;
        let newDraftOrder = [...draftOrder];

        const totalTeams = leagueParticipants.length;
        const previousUserId = draftOrder[currentPick]?.user_id; // ✅ Track previous user ID

        // ✅ Ensure we don’t enter an infinite loop if all teams are full
        if (fullTeamsCountRef.current >= totalTeams) {
            console.log("✅ All teams are full. Ending the draft.");
            return;
        }

        //Save timer_start to Supabase
        if (!timerStart || draftOrder[newPick]?.user_id === userId) {
            console.log("🔄 First draft OR Snake draft detected - setting timerStart in Supabase.");
          //  const adjustedTimerStart = new Date(Date.now() + 10000).toISOString(); // ✅ Offset by 5s
          //  console.log("✅Offset the timer by sec for back-to-back draft")

            const { error } = await supabase
                .from("draft_state")
                .update({ timer_start: new Date().toISOString() })
                .eq("id", draftStateId);
        
            if (error) {
                console.error("❌ Error initializing timer_start in Supabase:", error);
            } else {
                console.log("✅ TimerStart initialized in Supabase for first draft pick.");
            }
        }
        


        // ✅ Increment the pick normally
        if (newPick < newDraftOrder.length - 1) {
            newPick++;
        } else {
            newRound++;
            newDraftOrder.reverse(); // Reverse for snake draft
            newPick = 0;
        }

        while (wasFull && newDraftOrder[newPick]?.user_id === previousUserId) {
            console.log("Skipping back-to-back pick for full team...");
            if (newPick < newDraftOrder.length - 1) {
                newPick++;
            } else {
                newRound++;
                newDraftOrder.reverse();
                newPick = 0;
            }
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

    }

    /*
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
    */

    const isValidPick = (team, player) => {
        console.log("Entering isValidPick");
    
        // Split roster into main team and bench
        const mainTeam = team.roster.slice(0, MAX_MAIN_PLAYERS).filter(p => p && p.position); // ✅ Remove empty spots
        const bench = team.roster.slice(MAX_MAIN_PLAYERS).filter(p => p && p.position); // ✅ Remove empty spots        
        console.log("Main Team ", mainTeam);
        console.log("Bench ", bench);
    
        // Count positions in main team (fixing hybrid position issue)
        const positionCount = { FW: 0, MF: 0, DF: 0, GK: 0 };
        mainTeam.forEach(player => {
            if (!player.position) return; // ✅ Extra safeguard against undefined positions
            const [primary, secondary] = player.position.split("-");
            if (positionCount[primary] < REQUIRED_POSITIONS[primary]) {
                positionCount[primary]++;
            } else if (secondary && positionCount[secondary] < REQUIRED_POSITIONS[secondary]) {
                positionCount[secondary]++;
            }
        });

        console.log("Position Count ", positionCount);
    
        // Check if team is full
        const nonEmptyPlayers = team.roster.filter(p => p && p.player_id).length; // ✅ Count only valid players

        if (nonEmptyPlayers >= TOTAL_TEAM_SIZE) {
            console.log("No Spots Left");
            setModalMessage("No Spots Left. Your team is complete");
            return { isValid: false, teamFull: true };
        }
    
        // Check if player is already on the roster
        if (team.roster.filter(p => p && p.player_id).some(p => p.player_id === player.player_id)) { 
            console.log("Player already drafted");
            return { isValid: false };
        }
        
    
        const playerPositions = player.position.split("-");
        let canFitInMain = playerPositions.some(pos => positionCount[pos] < REQUIRED_POSITIONS[pos]);
    
        // Main team check
        if (mainTeam.length < MAX_MAIN_PLAYERS) {
            if (canFitInMain) {
                console.log("Going to the Main Team");
                return { isValid: true, assignToBench: false, teamFull: false }; // ✅ Assign to main team
            }
        }
    
        // Bench check
        if (bench.length < MAX_BENCH_PLAYERS) {
            console.log("Going to the bench");
            return { isValid: true, assignToBench: true, teamFull: false };  // ✅ Assign to bench
        }
    
        // Ensure last pick meets minimum position requirements
        if (team.roster.length === TOTAL_TEAM_SIZE - 1) {
            for (const pos in REQUIRED_POSITIONS) {
                if (positionCount[pos] < REQUIRED_POSITIONS[pos] && !player.position.includes(pos)) {
                    console.log("Final pick must satisfy minimum position requirements");
                    setModalMessage("Team Almost Full. ",positionCount[pos], " position still not full. Try again");
                    return { isValid: false, teamFull: false };  // ✅ Default invalid return
                }
            }
        }
    
        console.log("Player Position already filled");
        setModalMessage("Player Position is Filled. Try Again");
        return { isValid: false };
    };
    
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

      //  isDraftStarted.current = true;  // ✅ Mark draft as started when first draft is made

        const team = teams.find(t => t.id === draftOrder[currentPick].user_id);

        if (!team || player.onroster ) {
            console.log(`Invalid pick: ${player.name} because Player onroster is :`, player.onroster);
            isDraftingRef.current = false; 
            setIsDrafting(false);
            return false;
        }

        const { isValid, assignToBench, teamFull } = isValidPick(team, player);
        if (!isValid) {
            console.log(`Invalid pick: ${player.name}`);
            isDraftingRef.current = false;
            setIsDrafting(false);

            if (teamFull){
                fullTeamsCountRef.current++;
                setFullTeamsCount(prev => prev + 1);
                console.log("Teams that are full (in handleDraft) ", fullTeamsCountRef.current);
            
                await supabase
                    .from("draft_state")
                    .update({ full_teams_count: fullTeamsCountRef.current })
                    .eq("id", leagueId);
            
                if (fullTeamsCountRef.current >= leagueParticipants.length) {
                    console.log("✅ All teams are full. Ending the draft.");
                    return false; // ✅ Stop the draft
                }
            
                await nextTurn(true); // ✅ Skip this team and go to the next turn. Passing true to indicate team is full.
                return false;
            }

            return false;
        }

        //Stopping Timer since Draft button was clicked and the pick is valid. 
        clearInterval(timerInterval); // Stop the timer on manual draft
        setTimer(90); // Reset timer for next pick
/*
        let assignedPosition = player.position;
        if (player.position.includes("-")) {
            const possiblePositions = player.position.split("-");
            assignedPosition = possiblePositions.find(pos => team.roster.filter(p => p.position.includes(pos)).length < maxPositions[pos]) || possiblePositions[0];
        }
*/
    //    const success = draftPlayer(currentTeam.id, player, playerList, teams);
    //    if (success) {

                // **Fetch current roster**
            console.log("Current Pick before assigning currentRoster ", draftOrder[currentPick]);
            console.log("Current League Participants ", leagueParticipants);
            const currentRoster = leagueParticipants.find((participant) => participant.team_name == draftOrder[currentPick].team_name).roster;
            console.log("Roster before updating with draft player ", currentRoster);


            // ** Append new player - to either main team or bench**
            let updatedRoster = [...currentRoster];
            const benchStartIndex = MAX_MAIN_PLAYERS;
            const benchEndIndex = MAX_MAIN_PLAYERS + MAX_BENCH_PLAYERS;
            
            if (assignToBench) {
                const firstEmptyBenchIndex = [...Array(MAX_BENCH_PLAYERS)]
                .map((_, i) => updatedRoster[benchStartIndex + i]) // ✅ Explicitly check bench slots
                .findIndex(p => !p || !p.player_id); // ✅ Finds true empty slot
            
                console.log("firtEmptyBenchIndex ", firstEmptyBenchIndex);
                if (firstEmptyBenchIndex !== -1) {
                    updatedRoster[benchStartIndex + firstEmptyBenchIndex] = player;
                } else {
                    console.error("🚨 Bench is full, but validation failed to catch it!");
                    return false;
                }
            } else {
                const firstEmptyMainIndex = updatedRoster.findIndex(p => !p || !p.player_id);

                if (firstEmptyMainIndex !== -1) {
                    updatedRoster[firstEmptyMainIndex] = player; // ✅ Fill first empty slot
                } else {
                    updatedRoster.push(player); // ✅ No empty slots → add normally
                }
            }

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

            console.log(`${draftOrder[currentPick].team_name} drafted ${player.name}`);

            await nextTurn(false); //Passing false to indicate teams are not full yet.
            console.log('current Team is ' + draftOrder[currentPick].team_name);

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
                {lockStatus == "draft" ? (
                    <>
                        <Typography variant="h6" className="draft-details">Drafting Team : {draftOrder[currentPick].team_name} |  Round: {currentRound} | Players Left: {availablePlayers.length}
                        </Typography>
                        {draftOrder[currentPick]?.user_id === userId ? (
                            <Typography variant="h6" className="draft-league-name">
                                Time Left: {timer}s
                            </Typography>
                        ) : (
                            <Typography variant="h6" className="draft-league-name">Timer is {timer}. {draftOrder[currentPick].team_name} is drafting. Please wait for your turn
                            </Typography>
                        )}
                    </>
                ):lockStatus === "postdraft" ? (
                    <Typography variant="h6" className="draft-league-name"> Drafting is done
                    </Typography>
                ):(
                    <Typography variant="h6" className="draft-league-name"> Draft has not begun. 
                    </Typography>
                )}

                {/*  {draftingMessage && <Typography variant="h6">{draftingMessage}</Typography>}
                {timer === 90 ? (
                    <Typography variant="h6">{draftOrder[currentPick].team_name} is drafting. Please wait for your turn</Typography>) : null}
            */}

              {/*  <Typography variant="h6" className="draft-status">
                 It is the turn of : {draftOrder[currentPick].team_name}
                {userTurn ? "Your Turn to Pick" : "Waiting for Other Picks..."}
                </Typography>*/}
            </CardContent>
            </Card>

            <Button className="draft-start-btn" 
                        sx={{"&:hover": {backgroundColor: "kellygreen", color: "black"}}} 
                    //    onClick={() => handleDraft(player)}// ✅ Disable when function is running
                    >Start Draft</Button>


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
                    <TableCell><img src={ process.env.PUBLIC_URL + "/placeholder.png"} alt={player.name} className="player-img"   onError={(e) => { e.target.onerror = null; e.target.src = process.env.PUBLIC_URL + "/placeholder.png"; }}/></TableCell>
                    <TableCell>{player.name}</TableCell>
                    <TableCell>{player.position}</TableCell>
                    <TableCell><Button className="add-btn" 
                        sx={{"&:hover": {backgroundColor: "darkgreen", color: "white"}}} 
                        onClick={() => handleDraft(player)}
                        disabled={isDrafting || lockStatus === "predraft" || lockStatus === "postdraft"} // ✅ Disable when function is running
                    >Draft</Button></TableCell>
                    
                  </TableRow>
                ))}
                </TableBody>
            </Table>
            </TableContainer>

            {/* Draft Validation Modal */}
            <Modal open={!!modalMessage} onClose={() => setModalMessage("")}>
                <Box className="modal-box">
                    <Typography variant="h6" className="modal-text">
                    {modalMessage}
                    </Typography>
                    <div className="modal-actions">
                    <Button 
                        className="confirm-btn" 
                        onClick={() => { 
                        setModalMessage(""); // ✅ Close modal
                        }}
                    >
                        OK
                    </Button>
                    </div>
                </Box>
            </Modal>

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
                text-align: left;
            }

            .draft-status {
                text-align: center;
                font-weight: bold;
                margin-top: 10px;
            }

            .draft-start-btn {
              border-radius: 20px;
              background: #62FCDA;
              color: black;
              transition: 0.3s;
              min-width: 80px;
              margin-bottom: 20px;
            }

            .draft-start-btn:hover {
              background: kellygreen;
              color: black;
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
              background: darkgreen;
              color: white;
            }

            .filter-btn.active {
              background: #62FCDA; /* Ensures contrast */
              color: black;
              font-weight: bold;
            }

            .player-img {
              width: 40px;
              height: 40px;
              border-radius: 50%;
            }

            .add-btn {
              border-radius: 20px;
              background: #62FCDA;
              color: black;
              transition: 0.3s;
            }

            .add-btn:hover {
              background: darkgreen
              color: black !important;
            }

                        .modal-box {
              background: black;
              color: white;
              padding: 25px;
              width: 300px;
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              text-align: center;
              border-radius: 12px;
              box-shadow: 5px 5px 15px rgba(0, 255, 127, 0.2), -5px -5px 15px rgba(0, 255, 127, 0.1);
              border: 1px solid rgba(0, 255, 127, 0.5);
            }

            .modal-text {
              font-size: 1.2rem;
              margin-bottom: 20px;
            }

            .modal-actions {
              display: flex;
              justify-content: center;
              gap: 15px;
            }

            .confirm-btn {
              background: white;
              color: black;
              border-radius: 20px;
              padding: 8px 20px;
              font-weight: bold;
            }

            .confirm-btn:hover {
              background: darkgreen;
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
