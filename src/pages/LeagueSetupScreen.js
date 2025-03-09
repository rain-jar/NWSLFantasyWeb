import React, { useState, useEffect } from "react";
import { Box, Button, Typography, Container, TextField, List, ListItem, ListItemButton, ListItemText, MenuItem, Select, Card, CardContent } from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useLeague } from "../LeagueContext";
import {subscribeToLeagueInserts} from "../supabaseListeners";


const LeagueSetupScreen = ({onLeagueChosen}) => {
  const location = useLocation();
  const { leagueParticipants, setLeagueParticipants, leagueId} = useLeague();
  
  const { mode, leagueName, createLeagueId, userId, leagues } = location.state;
  const [teamName, setTeamName] = useState("");
  const [leagueType, setLeagueType] = useState("Standard H2H");
  const [availableLeagues, setAvailableLeagues] = useState([]);
  const [selectedLeague, setSelectedLeague] = useState(null);
  const [isReChecking, setIsRechecking] = useState(true);
  const [participants, setParticipants] = useState([]);
   const navigate = useNavigate();
  

  useEffect(() => {
    const unsubscribe = subscribeToLeagueInserts(setAvailableLeagues);
    supabase.getChannels().forEach(channel => console.log("Active channel:", channel));
    return () => unsubscribe(); // Cleanup
  }, []);

  useEffect(() => {
    if (mode === "join") {
      fetchAvailableLeagues().then((leagueList) => {
        setAvailableLeagues(leagueList);
      });
    }
  }, [mode]);
/*
  useEffect(() => {
    if(mode === "join" && leagueId){
      
   //   if(isReChecking === false) { 
        console.log("Redoing DraftState since LP has changed ", leagueParticipants);
        console.log("Context League Id : ", leagueId );
        console.log(" IsRechecking is ", isReChecking);
        reinitializeDraftState(leagueId);
    //  }else{
    //    console.log("Returning due to isRechecking ", isReChecking); 

    //  }
    }
  }, [leagueParticipants])
  */

  const fetchAvailableLeagues = async (leagueList) => {
    const { data, error } = await supabase.from("leagues").select("*");
    if (error) {
      console.error("Error fetching leagues:", error);
      return;
    }

    leagueList = data;
    console.log("Available Leagues are: ", leagueList);
    console.log("User Leagues ", leagues);


    try{
      //Check for available leagues out of all the leagues 
      const registeredLeagueIds = leagues.map((league) => league.id);
      const joinableLeagues = leagueList.filter((league) => !registeredLeagueIds.some((p) => p === league.league_id)
      );
      console.log("Joinable Leagues", joinableLeagues );

      const { data: draftData, error: draftError } = await supabase.from("draft_state").select("*");
      if (draftError) {
        console.error("Error fetching draft state in LeagueSetup:", error);
        return;
      }

      //Check for only unlocked leagues 
      const unLockedLeagueStates = draftData.filter((league) => league.lockstatus === "predraft");
      const unLockedLeagues = joinableLeagues.filter((league) => unLockedLeagueStates.some((p) => p.id === league.league_id));
      console.log("UnLocked and Available Leagues are : ", unLockedLeagues);
      
      //Find the user count in those unlocked & available leagues. 
      const leagueUserCount = unLockedLeagues.map( async(league) => {
        const userCount = await fetchLeagueUserCount(league.league_id);
       // console.log("leagueUserCount ", league.league_id, userCount.data);
        return {...league, 
          userCount : userCount?.data ?? 0};
      })

      const resolvedLeagues = await Promise.all(leagueUserCount);

      console.log("Joinable Leagues with user count ", resolvedLeagues);

      leagueList = [...resolvedLeagues];
    } catch (err) {
      console.error("🔥 Unexpected fetch error:", err);
    }
    return leagueList || [];
  };

  const initializeLeaguePlayers = async (createLeagueId) => {
    try {
      // Fetch all player IDs from players_base
      const { data: players, error: fetchError } = await supabase
        .from("players_base")
        .select("id");
  
      if (fetchError) {
        console.error("❌ Error fetching players:", fetchError.message);
        return;
      }
  
      if (!players || players.length === 0) {
        console.warn("⚠️ No players found in players_base.");
        return;
      }
  
      // Prepare batch insert data
      const leaguePlayersData = players.map((player) => ({
        league_id: createLeagueId,
        player_id: player.id,
        onroster: false, // Default value
      }));
  
      // Insert into league_players
      const { error: insertError } = await supabase
        .from("league_players")
        .insert(leaguePlayersData);
  
      if (insertError) {
        console.error("❌ Error inserting into league_players:", insertError.message);
      } else {
        console.log("✅ League players initialized successfully.");
      }
    } catch (err) {
      console.error("🔥 Unexpected error initializing league_players:", err);
    }
  };

  const fetchLeagueUserCount = async(leagueIdParam) => {
    try{
      console.log("Going to fetch league user count ", leagueIdParam);
      const { data : playerCountFetch, error } = await supabase.from("league_rosters")
        .select("*")
        .eq("league_id", leagueIdParam);
        if (!error) {
          console.log("Fetched latest userCountData ", playerCountFetch);
          return {success: true, data: playerCountFetch?.length};
        }else {
          console.log(" Didn't fetch userCountData ");
          return { success: false, data: null};
        }
    }catch(err){
      console.log("🔥 Unexpected fetch error while fetching userCountData:", err);
    }
  }

  const fetchLeagueParticipants = async (finalLeagueId) => {
    try{
      console.log("Going to fetch league participants ", finalLeagueId);
      const { data : participantData, error } = await supabase.from("league_rosters")
        .select("*")
        .eq("league_id", finalLeagueId);
        if (!error) {
          setLeagueParticipants(participantData);
          setParticipants(participantData);
          console.log("Fetched and set latest leagueparticipants ", participantData);
          return {success: true, data: participantData};
        }else {
          console.log(" Didn't fetch leagueParticipants ");
          return { success: false, data: []};
        }
    }catch(err){
      console.log("🔥 Unexpected fetch error while fetching LP:", err);
    }
  };

  const reinitializeDraftState = async (finalLeagueId, participantParam) => {
      const isUpdated = false;
      let lockValue = "predraft";
    try {
      // Fetch all player IDs from players_base
      console.log("League Id ", finalLeagueId);
      console.log("League Participants before initializing Draft State ", leagueParticipants);
      console.log("Local Participants list before initializing Draft State ", participantParam);

      const { data, fetchError } = await supabase.from("draft_state")
      .select("*")
      .eq("id", finalLeagueId);
  
      if (fetchError) {
        console.error("❌ Error fetching draftState while joining league : ", fetchError.message);
        return;
      }else{
        console.log("Fetched draft-state is ", data[0]);
      }
  
      if (!data || data.length === 0) {
        console.log("⚠️ Draft is not set yet. So setting the draft state for the first time for League: ", finalLeagueId, data);
        const { data: newData, error: insertError } = await supabase
        .from("draft_state")
        .insert([{ id: finalLeagueId, current_round: 1, current_pick: 0, draft_order: participantParam, lockstatus: lockValue }])
        .select()
        .single();

        if (insertError) {
          console.error("❌ Error inserting into draft_state while joining league:", insertError.message);
        } else {
          console.log("✅ Draft-State set while joining since it wasn't set yet. ", newData);
        }

      }else{

        if (participantParam.length >=3 ) {
          lockValue = "draft";
        }else{
          lockValue = "predraft";
        }
      // Since the draft-state is already set, updating the draft order with latest teams. 
        console.log("Since the draft-state is already set, updating the draft state with reinitialized state.")
        const { data: newData, error: insertError } = await supabase
              .from("draft_state")
              .update({ current_round: 1, current_pick: 0, draft_order: participantParam, lockstatus: lockValue })
              .eq("id", finalLeagueId)
              .select()
              .single();

              if (insertError) {
                console.error("Error re-initializing draft state while joining:", insertError);
                return;
              }else{
                console.log("✅ Draft-State re-initialized with latest teams ",  newData, participantParam);
              }
      }

    } catch (err) {
      console.error("🔥 Unexpected error initializing draft_state:", err);
    }
  };

  const initializeCheck = async() => {
    console.log("Turning isRechecking false");
    console.log("But its not turning, so just calling reinitializeDraftState here");
    //setIsRechecking(false);
    await reinitializeDraftState(leagueId);
    console.log("Waited for reinitialize insided initializeCheck ", leagueParticipants);
  }

  const addNewUser = async(finalLeagueId) => {
    console.log("Going to add new user");
    try{
      const { error } = await supabase.from("league_rosters").insert([
        {
          league_id: finalLeagueId,
          user_id: userId,
          team_name: teamName,
          roster: [],
          status: "active",
        },
      ]);
  
      if (error) {
        alert("Failed to save league setup.");
        console.error("Supabase error:", error);
        return;
      }else {
        console.log("✅ League Table updated with latest User ");
      }
    }catch(err){
      console.log("🔥 Unexpected fetch error while adding new user:", err);
    }
  }

  const handleConfirmSetup = async () => {


    console.log("Mode is ", mode);
    console.log("League Participants before confirming ", leagueParticipants);
    if (!teamName.trim()) {
      alert("Please enter a team name.");
      return;
    }
    const finalLeagueId = mode === "create" ? createLeagueId : selectedLeague?.league_id;
    if (!finalLeagueId) {
      alert("No league selected.");
      return;
    }

    await onLeagueChosen(finalLeagueId);
    console.log("Waiting for leagueId to change ");

    console.log("League Id before inserting new user ", finalLeagueId, leagueId);
    await addNewUser(finalLeagueId);
    console.log("Waiting for new user to be added in ", leagueParticipants);


    const fetchParticipant = await fetchLeagueParticipants(finalLeagueId);
    console.log("Waiting for leagueParticipants to be fetched ", leagueParticipants, participants);
    console.log("Participant fetching was a success? ", fetchParticipant.success);
    console.log("Participant data fetched was ", fetchParticipant.data);

    if (mode === "create"){
        await initializeLeaguePlayers(createLeagueId);
        await reinitializeDraftState(finalLeagueId, fetchParticipant.data);
        localStorage.setItem("newLeagueCreated", "true");
    }else{

        console.log("Players table for this league is already setup because mode is : ", mode);
        console.log("Checking and if needed re-initializing draft-state. Mode : ", finalLeagueId);
        await reinitializeDraftState(finalLeagueId, fetchParticipant.data);
        console.log("waited for draft-state reinitialization");
        localStorage.setItem("newUserJoined", "true");
    }

    navigate("/players");
  };

return (
  <div>
    <div className="league-setup-screen">
      {/* League Setup Card */}
      <Card className="league-setup-card">
        <CardContent>
          <Typography variant="h5" className="title">
            {mode === "create" ? "Create League" : "Join a League"}
          </Typography>

          {mode === "create" ? (
            <>
              <Typography variant="h6" className="league-info">League: {leagueName}</Typography>
              <Typography variant="h6" className="league-info">League Type</Typography>
              <Select
                value={leagueType}
                disabled
                fullWidth
                className="league-select"
              >
                <MenuItem value="Standard H2H">Standard H2H</MenuItem>
              </Select>

              <Typography variant="h6" className="league-info">Your Team Name</Typography>
              <TextField
                placeholder="Enter Team Name"
                fullWidth
                className="team-name-input"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
              />

              <Button className="confirm-btn" onClick={handleConfirmSetup}>
                Confirm & Proceed
              </Button>
            </>
          ) : (
            <>
              <Typography variant="h6" className="league-info">Select a League</Typography>
              <List>
                {availableLeagues.map((league) => (
                  <ListItem key={league.league_id} disablePadding>
                    <ListItemButton
                      className="league-item"
                      onClick={() => {
                        setSelectedLeague(league);
                      //  setIsRechecking(false);
                        console.log ("Selected League ", league.league_id);
                      //  console.log("isRechecking ", isReChecking);
                      }}
                    >
                      <ListItemText primary={league.league_name} secondary={`League spots filled: ${league.userCount}/10`} />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>

              {selectedLeague && (
                <>
                  <Typography variant="h6" className="league-info">Your Team Name</Typography>
                  <TextField
                    placeholder="Enter Team Name"
                    fullWidth
                    className="team-name-input"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                  />

                  <Button className="confirm-btn" onClick={handleConfirmSetup}>
                    Join League
                  </Button>
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>

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

      .league-setup-screen {
        width: 100%;
        background: black;
        color: white;
        text-align: center;
        padding: 20px;
        min-height: 100vh;
        justify-content: space-between;
      }

      .league-setup-card {
        width: 80%;
        margin: 20px auto;
        background: white;
        color: black;
        padding: 15px;
        border-radius: 12px;
        box-shadow: 5px 5px 15px rgba(0, 255, 127, 0.2), -5px -5px 15px rgba(0, 255, 127, 0.1);
      }

      .title {
        font-size: 1.5rem;
        margin-bottom: 15px;
      }

      .league-info {
        font-size: 1.1rem;
        margin-top: 15px;
      }

      .league-select {
        background: white;
        color: black;
        border-radius: 5px;
        margin-top: 10px;
      }

      .team-name-input {
        background: white;
        color: black;
        margin-top: 10px;
        border-radius: 5px;
      }

      .league-item {
          text-align: center;
          color: black;
          background: rgba(5, 5, 5, 0.3); /* ✅ Subtle contrast */
          border: 2px solid rgba(243, 247, 245, 0.5); /* ✅ Greenish border */
          border-radius: 12px; /* ✅ Smooth edges */
          padding: 10px;
          margin: 8px 0; /* ✅ Adds spacing between items */
          box-shadow: 0 4px 10px rgba(7, 43, 25, 0.2); /* ✅ Soft glow effect */
          transition: 0.3s ease-in-out;
      }

      .league-item:hover {
        background: rgba(14, 59, 37, 0.8);
        box-shadow: 0 6px 15px rgba(12, 52, 32, 0.4);
      }

      .confirm-btn {
        background: kellygreen;
        color: black;
        border-radius: 30px;
        padding: 12px 24px;
        font-weight: bold;
        font-size: 1rem;
        box-shadow: 0 4px 10px rgba(0, 255, 127, 0.3);
        margin-top: 20px;
      }

      .confirm-btn:hover {
        background: darkgreen;
        color: white;
      }
    `}</style>
  </div>
);


};

export default LeagueSetupScreen;
