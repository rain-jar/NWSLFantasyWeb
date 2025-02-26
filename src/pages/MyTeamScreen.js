import React, { useEffect, useState } from "react";
import { Button, Select, MenuItem, Table, TableContainer, TableHead, TableRow, TableCell, TableBody, Paper, Card, CardContent, Typography } from "@mui/material";
import NavigationBar from "../NavigationBar";
import { supabase } from "../supabaseClient";
import { LeagueProvider, useLeague } from "../LeagueContext";


const MyTeamScreen = ({playersBase}) => {
  const [statsFilter, setStatsFilter] = useState("2024");
  const { leagueParticipants, setLeagueParticipants, userId, users } = useLeague();
  const [currentUserData, setcurrentUserData] = useState([]); 

  console.log("Checking league participants before update ", leagueParticipants, userId, users);

  const teamName = leagueParticipants.find((m) => m.user_id === userId).team_name || {};
  const userName = users.find((m) => m.id === userId).user_name || {};
  console.log("TeamName and userName ", teamName, userName);
  const teamRecord = "5-12-0"; // Randomized W-L-T record
  const totalPoints = "1425"; // Randomized total points

  const fetchPlayers = async () => {
    try{
      let seasonTeamData, matchData, error1, error2;
      let currentRoster
      currentRoster = leagueParticipants.find((m) => m.user_id === userId).roster;
      console.log("Current Roster is ", currentRoster);
      console.log("Start of MyTeam Filter for: ", statsFilter);
      /*
      ({ data: seasonTeamData, error: error1 } = await supabase.from("players_base").select("*"));   // Fetch Season Stats
      if (error1) throw new Error("❌ Error fetching season stats: " + error1.message);
      */
      if (statsFilter === "2024") {
        const currentSeasonPlayers = currentRoster.map((player) => {
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

        const sortedRoster = [...currentSeasonPlayers].sort((a, b) => {
          console.log("Current roster is :", currentSeasonPlayers);
          const posA = a.position.split("-")[0]; // Use first position for hybrid roles
          const posB = b.position.split("-")[0];
          return positionOrder[posA] - positionOrder[posB];
        });

        setcurrentUserData(sortedRoster);

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
        const currentTeamPlayers = currentRoster.map((player) => {
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
        console.log("Players in players table and on this current user roster: ", currentTeamPlayers);

        const positionOrder = { GK: 1, DF: 2, MF: 3, FW: 4 };

        const sortedRoster = [...currentTeamPlayers].sort((a, b) => {
          console.log("Current roster is :", currentTeamPlayers);
          const posA = a.position.split("-")[0]; // Use first position for hybrid roles
          const posB = b.position.split("-")[0];
          return positionOrder[posA] - positionOrder[posB];
        });

        setcurrentUserData(sortedRoster);
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
            <MenuItem value="week1">Week 1</MenuItem>
          </Select>
        </div>

        {/* Button Row */}
        <div className="button-row">
          <Button className="action-btn">Add Player</Button>
          <Button className="action-btn">Drop Player</Button>
        </div>

        {/* Team Players Table */}
        <TableContainer component={Paper} className="players-table">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Pos</TableCell>
                <TableCell></TableCell>
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
                    <TableRow key={index}>
                    <TableCell>{player.position}</TableCell>
                    <TableCell><Button className="add-btn" sx={{"&:hover": {backgroundColor: "kellygreen", color: "black"}}}>Add</Button></TableCell>
                    <TableCell><img src={process.env.PUBLIC_URL + "/placeholder.png"} alt={player.name} className="player-img" /></TableCell>
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

        {/* Styles */}
        <style jsx>{`
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
            filter: blur(0.3px); /* Slight blur for smoother edges */
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

            .players-table {
              flex-grow: 1; 
              width: 90%;
              margin: 0 auto;
              background: white;
              font-family: "American Typewriter", serif;
            }
        `}</style>
      </div>
    </div>
  );
};

export default MyTeamScreen;
