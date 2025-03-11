import React, { useEffect, useState } from "react";
import { Button, Select, MenuItem, Table, TableContainer, TableHead, TableRow, TableCell, TableBody, Paper, Card, CardContent, Typography, Modal, Box } from "@mui/material";
import NavigationBar from "../NavigationBar";
import { supabase } from "../supabaseClient";
import { LeagueProvider, useLeague } from "../LeagueContext";


const MyTeamScreen = ({playersBase}) => {
  const [statsFilter, setStatsFilter] = useState("2024");
  const { leagueParticipants, setLeagueParticipants, userId, users, availablePlayers, leagueId } = useLeague();
  const [currentUserData, setcurrentUserData] = useState([]); 
  const [selectedPlayer, setSelectedPlayer] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [currentBenchData, setCurrentBenchData] = useState([]);

  console.log("Checking league participants before update ", leagueParticipants, userId, users);
  console.log("Current User Data ", currentUserData);

  let teamName, userName;

  const teamNameArray = leagueParticipants.find((m) => m.user_id === userId) || {};
  if (teamNameArray) {
      teamName = teamNameArray.team_name;
  }else{
      teamName = "Team Name";
  }

  const userNameArray = users.find((m) => m.id === userId) || {};
  if (userNameArray) {
      userName = userNameArray.user_name;
  }else{
      userName = "Team Name";
  }

//  const teamName = leagueParticipants.find((m) => m.user_id === userId).team_name || {};
//  const userName = users.find((m) => m.id === userId).user_name || {};
  console.log("TeamName and userName ", teamName, userName);
  const teamRecord = "5-12-0"; // Randomized W-L-T record
  const totalPoints = "1425"; // Randomized total points

  const fetchPlayers = async () => {
    try{
      let seasonTeamData, matchData, error1, error2;
      let currentRoster, currentRosterArray;

      const MAX_MAIN_PLAYERS = 7;
      const MAX_BENCH_PLAYERS = 1;
      const TOTAL_TEAM_SIZE = MAX_MAIN_PLAYERS + MAX_BENCH_PLAYERS;
      const REQUIRED_POSITIONS = { FW: 2, MF: 2, DF: 2, GK: 1 };



      currentRosterArray = leagueParticipants.find((m) => m.user_id === userId);
      currentRoster = currentRosterArray.roster;
      console.log("Current Roster is ", currentRoster);
      console.log("Start of MyTeam Filter for: ", statsFilter);

      // ✅ Process Main Team (First MAX_MAIN_PLAYERS indexes, filter out nulls)
      const mainTeam = currentRoster
          .slice(0, MAX_MAIN_PLAYERS) 
          .filter(p => p && p.player_id);

      // ✅ Process Bench Team (Indexes after MAX_MAIN_PLAYERS, up to full roster length, filter out nulls)
      const bench = currentRoster
          .slice(MAX_MAIN_PLAYERS, TOTAL_TEAM_SIZE)
          .filter(p => p && p.player_id);

      if (statsFilter === "2024") {
      //  const filteredRoster = currentRoster.filter(player => player && player.player_id); // ✅ Remove empty spots
        const currentSeasonMainPlayers = mainTeam.map((player) => {
          const seasonMerge = playersBase.find((m) => m.id === player.player_id) || {};
          return {
            ...player,
            team : seasonMerge.team || "",
            goals: seasonMerge.goals || 0,
            assists: seasonMerge.assists || 0,
            Minutes: seasonMerge.Minutes || 0,
            PKMissed: seasonMerge.PKMissed || 0,
            "Goals Against": seasonMerge["Goals Against"] || 0,
            Saves: seasonMerge.Saves || 0,
            "Clean Sheet": seasonMerge["Clean Sheet"] || 0,
            "Yellow Cards": seasonMerge["Yellow Cards"] || 0,
            "Red Cards": seasonMerge["Red Cards"] || 0,
            FantasyPoints: seasonMerge.FantasyPoints || 0,
          };
        })

        const currentSeasonBenchPlayers = bench.map((player) => {
          const seasonMerge = playersBase.find((m) => m.id === player.player_id) || {};
          return {
            ...player,
            team : seasonMerge.team || "",
            goals: seasonMerge.goals || 0,
            assists: seasonMerge.assists || 0,
            Minutes: seasonMerge.Minutes || 0,
            PKMissed: seasonMerge.PKMissed || 0,
            "Goals Against": seasonMerge["Goals Against"] || 0,
            Saves: seasonMerge.Saves || 0,
            "Clean Sheet": seasonMerge["Clean Sheet"] || 0,
            "Yellow Cards": seasonMerge["Yellow Cards"] || 0,
            "Red Cards": seasonMerge["Red Cards"] || 0,
            FantasyPoints: seasonMerge.FantasyPoints || 0,
          };
        })

        const positionOrder = { GK: 1, DF: 2, MF: 3, FW: 4 };

        const sortedRoster = [...currentSeasonMainPlayers].filter(player => player.position).sort((a, b) => {
          console.log("Current roster is :", currentSeasonMainPlayers);
          const posA = a.position.split("-")[0] || "ZZ"; // ✅ Ensure no crash on undefined
          const posB = b.position.split("-")[0] || "ZZ";
          return positionOrder[posA] - positionOrder[posB];
      });

        setcurrentUserData(sortedRoster);
        setCurrentBenchData(currentSeasonBenchPlayers);

        return;
      } else if (statsFilter === "week1") {
        // Fetch Match Stats
        ({ data: matchData, error: error2 } = await supabase
          .from("players")
          .select("*"));
        //  .eq("week", 1)); 
        if (error2) 
          throw new Error("❌ Error fetching match stats: " + error2.message);
        else
          console.log("fetched weekly data: ", matchData);
          console.log("roster is ", currentRoster);

        const mergedTeamPlayers = playersBase.map((player) => {
          const matchStats = matchData.find((m) => m.id === player.id) || {};
          return {
            ...player,
            Opponent : matchStats.Opponent || "DNP",
            goals: matchStats.goals || 0,
            assists: matchStats.assists || 0,
            Minutes: matchStats.Minutes || 0,
            PKMissed: matchStats.PKMissed || 0,
            "Goals Against": matchStats["Goals Against"] || 0,
            Saves: matchStats.Saves || 0,
            "Clean Sheet": matchStats["Clean Sheet"] || 0,
            "Yellow Cards": matchStats["Yellow Cards"] || 0,
            "Red Cards": matchStats["Red Cards"] || 0,
            FantasyPoints: matchStats.FantasyPoints || 0,
          }
        });

        // 🔄 **Merge Data: Default to 0s if player has no match data**
      //  const filteredRoster = currentRoster.filter(player => player && player.player_id); // ✅ Remove empty spots
        const currentMainTeamPlayers = mainTeam.map((player) => {
          const seasonMerge = mergedTeamPlayers.find((m) => m.id === player.player_id) || {};
          return {
            ...player,
            team : seasonMerge.team || "",
            goals: seasonMerge.goals || 0,
            assists: seasonMerge.assists || 0,
            Minutes: seasonMerge.Minutes || 0,
            PKMissed: seasonMerge.PKMissed || 0,
            "Goals Against": seasonMerge["Goals Against"] || 0,
            Saves: seasonMerge.Saves || 0,
            "Clean Sheet": seasonMerge["Clean Sheet"] || 0,
            "Yellow Cards": seasonMerge["Yellow Cards"] || 0,
            "Red Cards": seasonMerge["Red Cards"] || 0,
            FantasyPoints: seasonMerge.FantasyPoints || 0,
          };
        })

        const currentBenchPlayers = bench.map((player) => {
          const seasonMerge = mergedTeamPlayers.find((m) => m.id === player.player_id) || {};
          return {
            ...player,
            team : seasonMerge.team || "",
            goals: seasonMerge.goals || 0,
            assists: seasonMerge.assists || 0,
            Minutes: seasonMerge.Minutes || 0,
            PKMissed: seasonMerge.PKMissed || 0,
            "Goals Against": seasonMerge["Goals Against"] || 0,
            Saves: seasonMerge.Saves || 0,
            "Clean Sheet": seasonMerge["Clean Sheet"] || 0,
            "Yellow Cards": seasonMerge["Yellow Cards"] || 0,
            "Red Cards": seasonMerge["Red Cards"] || 0,
            FantasyPoints: seasonMerge.FantasyPoints || 0,
          };
        })
        console.log("Players in players table and on this current user roster: ", currentMainTeamPlayers);

        const positionOrder = { GK: 1, DF: 2, MF: 3, FW: 4 };

        const sortedRoster = [...currentMainTeamPlayers].filter(player => player.position).sort((a, b) => {
          console.log("Current roster is :", currentMainTeamPlayers);
          const posA = a.position.split("-")[0] || "ZZ"; // ✅ Ensure no crash on undefined
          const posB = b.position.split("-")[0] || "ZZ";
          return positionOrder[posA] - positionOrder[posB];
      });

        setcurrentUserData(sortedRoster);
        setCurrentBenchData(currentBenchPlayers);
        return;
      }
    } catch (err) {
      console.error("🔥 Unexpected fetch error:", err);
    }
  };

  useEffect(() => {
    console.log("Checking league participants after update ", leagueParticipants);
    fetchPlayers();
  }, [leagueParticipants, statsFilter]);

  const handleDrop = async(player) => {
    console.log("Needs to define player drop");
    const currentRoster = leagueParticipants.find((participant) => participant.user_id == userId).roster || []; 

    const updatedRoster = currentRoster.filter((p) => p.player_id !== player.player_id);

    console.log("🔍 Before updating availablePlayers:", availablePlayers);
    const { error: rosterError } = await supabase
      .from("league_rosters")
      .update({ roster: updatedRoster })
      .eq("league_id", leagueId)
      .eq("user_id",userId);

    if (rosterError) {
      console.error("Error updating roster:", rosterError);
      return;
    }

    // Add player back to availablePlayers in Supabase
    console.log("🔍 Before inserting playerList:", availablePlayers);
    const { error: playerError } = await supabase
      .from("league_players")
      .update({ onroster: false })
      .eq("player_id", player.player_id)
      .eq("league_id", leagueId);
      console.log("Player: "+player.name+"'s onRoster status is false in the players table in Supabase")


    if (playerError) {
      console.error("Error adding player back:", playerError);
      return;
    }


  };


  return (
    <div>
      <NavigationBar />
      <div className="my-team-screen">
        {/* Team Card */}
        <Card className="team-card">
          <CardContent>
            <Typography variant="h5" className="team-name">{teamName}</Typography>
            <Typography variant="h6" className="user-name">{userName}</Typography>
            <Typography variant="h7" className="team-stats">Record: {teamRecord} | Points: {totalPoints}</Typography>
          </CardContent>
        </Card>

        {/* Filter Row */}
        <div className="filter-row">
          <Select value={statsFilter} onChange={(e) => setStatsFilter(e.target.value)} className="filter-select">
            <MenuItem value="2024">2024 Season</MenuItem>
          {/*  <MenuItem value="week1">Week 1</MenuItem>*/}
          </Select>
        </div>

        {/* Button Row */}
        <div className="button-row">
          <Button className="action-btn">Add Player</Button>
          <Button className="action-btn">Drop Player</Button>
        </div>

        <div className="table-gap">
        <Typography variant="h5" className="bench-gap">Starting XI</Typography>
        </div>

        {/* Team Players Table */}
        <TableContainer component={Paper} className="players-table">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Pos</TableCell>
                <TableCell></TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Team</TableCell>
                <TableCell>Fpts</TableCell>
                <TableCell>Mins</TableCell>
                <TableCell>Gls</TableCell>
                <TableCell>Ast</TableCell>
                <TableCell>PKM</TableCell>
                <TableCell>GA</TableCell>
                <TableCell>Svs</TableCell>
                <TableCell>YC</TableCell>
                <TableCell>RC</TableCell>
                <TableCell>CS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
                {currentUserData.map((player, index) => (
                    <TableRow key={index}
                      onClick={() => {
                        setSelectedPlayer(player);
                        setOpenModal(true); // ✅ Open modal when row is clicked
                      }}
                      sx={{ cursor: "pointer", "&:hover": { backgroundColor: "rgba(16, 86, 51, 0.1)" } }} // Hover effect for better UX
                    >
                    <TableCell>{player.position}</TableCell>
                    <TableCell><img src={player.image_url || process.env.PUBLIC_URL + "/placeholder.png"} alt={player.name} className="player-img"   onError={(e) => { e.target.onerror = null; e.target.src = process.env.PUBLIC_URL + "/placeholder.png"; }}/></TableCell>
                    <TableCell>{player.name}</TableCell>
                    <TableCell>{player.team}</TableCell>
                    <TableCell>{player.FantasyPoints}</TableCell>
                    <TableCell>{player.Minutes}</TableCell>
                    <TableCell>{player.goals}</TableCell>
                    <TableCell>{player.assists}</TableCell>
                    <TableCell>{player.PKMissed}</TableCell>
                    <TableCell>{player["Goals Against"]}</TableCell>
                    <TableCell>{player.Saves}</TableCell>
                    <TableCell>{player["Yellow Cards"]}</TableCell>
                    <TableCell>{player["Red Cards"]}</TableCell>
                    <TableCell>{player["Clean Sheet"]}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>

        <div className="table-gap">
        <Typography variant="h5" className="bench-gap">Bench</Typography>
        </div>

        {/* Team Players Table */}
        <TableContainer component={Paper} className="players-table">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Pos</TableCell>
              <TableCell></TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Team</TableCell>
              <TableCell>Fpts</TableCell>
              <TableCell>Mins</TableCell>
              <TableCell>Gls</TableCell>
              <TableCell>Ast</TableCell>
              <TableCell>PKM</TableCell>
              <TableCell>GA</TableCell>
              <TableCell>Svs</TableCell>
              <TableCell>YC</TableCell>
              <TableCell>RC</TableCell>
              <TableCell>CS</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
              {currentBenchData.map((player, index) => (
                  <TableRow key={index}
                    onClick={() => {
                      setSelectedPlayer(player);
                      setOpenModal(true); // ✅ Open modal when row is clicked
                    }}
                    sx={{ cursor: "pointer", "&:hover": { backgroundColor: "rgba(16, 86, 51, 0.1)" } }} // Hover effect for better UX
                  >
                  <TableCell>{player.position}</TableCell>
                  <TableCell><img src={player.image_url || process.env.PUBLIC_URL + "/placeholder.png"} alt={player.name} className="player-img"   onError={(e) => { e.target.onerror = null; e.target.src = process.env.PUBLIC_URL + "/placeholder.png"; }}/></TableCell>
                  <TableCell>{player.name}</TableCell>
                  <TableCell>{player.team}</TableCell>
                  <TableCell>{player.FantasyPoints}</TableCell>
                  <TableCell>{player.Minutes}</TableCell>
                  <TableCell>{player.goals}</TableCell>
                  <TableCell>{player.assists}</TableCell>
                  <TableCell>{player.PKMissed}</TableCell>
                  <TableCell>{player["Goals Against"]}</TableCell>
                  <TableCell>{player.Saves}</TableCell>
                  <TableCell>{player["Yellow Cards"]}</TableCell>
                  <TableCell>{player["Red Cards"]}</TableCell>
                  <TableCell>{player["Clean Sheet"]}</TableCell>
                  </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>

        {selectedPlayer && (
          <Modal open={openModal} onClose={() => setOpenModal(false)}>
            <Box className="modal-box">
              <Typography variant="h6" className="modal-text">
                Are you sure you want to drop {selectedPlayer.name}?
              </Typography>

              <div className="modal-actions">
                <Button 
                  className="confirm-btn" 
                  onClick={() => { 
                    handleDrop(selectedPlayer); // ✅ Call drop function
                    setOpenModal(false); 
                  }}
                >
                  Yes
                </Button>
                <Button 
                  className="cancel-btn" 
                  onClick={() => setOpenModal(false)}
                >
                  No
                </Button>
              </div>
            </Box>
          </Modal>
        )}        

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

          
          .my-team-screen {
            width: 100%;
            background: black;
            color: white;
            text-align: center;
            padding: 20px;
            min-height: 100vh;
            justify-content: space-between;
          }

          .team-card {
            width: 90%;
            margin: 20px auto;
            background: white;
            color: black;
            display: flex;
            justify-content: space-between;
            padding: 15px;
            border-radius: 12px; /* Smooth edges */
            box-shadow: 25px 25px 25px rgba(7, 91, 47, 0.4), -5px -5px 5px rgba(11, 82, 45, 0.1); /* Embossed effect */
         //   filter: blur(0.3px); /* Slight blur for smoother edges */
          }

          .team-name {
            text-align: left;
          }
            .user-name {
                text-align: left;
            }

          .team-stats {
            text-align: right;
          }

          .filter-row {
            margin: 20px 0;
          }

          .filter-select {
            background: white;
            color: black;
            border-radius: 5px;
          }

          .button-row {
            display: flex;
            justify-content: center;
            gap: 15px;
            margin: 20px 0;
          }

          .action-btn {
            border-radius: 20px;
            background: black;
            color: white;
            border: 2px solid white;
            transition: 0.3s;
          }

          .action-btn:hover {
            background: kellygreen;
            color: white;
          }

            .MuiMenu-paper {
              background: white !important;
              color: black !important;
            }

            .add-btn {
              border-radius: 20px;
              background: white;
              color: black;
              transition: 0.3s;
            }

            .add-btn:hover {
              background: kellygreen !important;
              color: black !important;
            }

            
            .player-img {
              width: 40px;
              height: 40px;
              border-radius: 50%;
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

            .cancel-btn {
              background: gray;
              color: white;
              border-radius: 20px;
              padding: 8px 20px;
              font-weight: bold;
            }

            .cancel-btn:hover {
              background: darkgray;
            }


            .players-table {
              flex-grow: 1; 
              width: 90%;
              margin: 0 auto;
              background: white;
              font-family: "American Typewriter", serif;
            }

            .table-gap {
              flex-grow: 1; 
              width: 90%;
              margin: 0 auto;
              margin-top: 20px;
              margin-bottom: 20px;
            }

            .bench-gap {
            text-align: left;
            }

              
        `}</style>
      </div>
    </div>
  );
};

export default MyTeamScreen;
