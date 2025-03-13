import React from "react";
import { TextField, Button, Select, MenuItem, Table, TableContainer, TableHead, TableRow, TableCell, TableBody, Paper, Modal, Box, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { LeagueProvider, useLeague } from "../LeagueContext";
import NavigationBar from "../NavigationBar";
import PlayerDetailsModal from "./PlayerDetailsModal";



const PlayersScreen = ({playersBase}) => {

  const { availablePlayers, setAvailablePlayer } = useLeague();
  const { leagueParticipants, setLeagueParticipants, userId, leagueId, lockStatus } = useLeague();

  const [search, setSearch] = useState("");
  const [positionFilter, setPositionFilter] = useState("All");
  const [teamFilter, setTeamFilter] = useState("");
  const [statsFilter, setStatsFilter] = useState("2024");
  const [sortField, setSortField] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc");


  const [playerStats, setPlayerStats] = useState([...playersBase]);
  const [filteredPlayers, setFilteredPlayers] = useState([...playersBase]);
  const [isDataFetched, setIsDataFetched] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [openInfoModal, setOpenInfoModal] = useState(false);
  const [selectedPlayerInfo, setSelectedPlayerInfo] = useState([]);



  const positions = ["All", "FW", "MF", "DF", "GK"];
  const teams = ["Spirit", "Pride", "Gotham FC", "Thorns", "Chicago Stars", "Reign, Dash", "NC Courage", "Royals", "KC Current","Louisville", "Angel City", "SD Wave", "Bay FC"]; // More teams can be added
  const statsSeasons = ["2024"]; // More seasons can be added

  const players = []; // Placeholder for player data

  const fetchPlayerStats = async () => {
    if (!isDataFetched) {
      console.log("Fetching Player Stats...");
      const { data, error } = await supabase.from("players_base").select("*");
      if (error) {
        console.error("Error fetching player stats:", error);
        return;
      }
      setPlayerStats(data);
      setFilteredPlayers(data);
      setIsDataFetched(true);
      console.log("Players Base data is fetched", data);
    }
  };
/*
  useEffect(() => {
    fetchPlayerStats();
  }, []);
*/

useEffect(() => {
  const newLeagueCreated = localStorage.getItem("newLeagueCreated");
  const newUserJoined = localStorage.getItem("newUserJoined");

  if (newLeagueCreated) {
      console.log("🔄 Auto-refreshing after league creation...");
      localStorage.removeItem("newLeagueCreated"); // ✅ Ensure it runs only once
      window.location.reload(); // ✅ One-time refresh
  }

  if (newUserJoined) {
    console.log("🔄 Auto-refreshing after user joining...");
    localStorage.removeItem("newUserJoined"); // ✅ Ensure it runs only once
    window.location.reload(); // ✅ One-time refresh
}

}, []);



  useEffect(() => {
    fetchPlayers().then((updatedList) => {
      console.log("updated List ", updatedList);
      filterPlayers(updatedList); // Pass fetched list for filtering
    });
  }, [search, positionFilter, teamFilter, statsFilter, availablePlayers]);

  
  const fetchPlayers = async (playerListTemp) => {
    try{
      let playerListFull, matchData, error1, error2;
      console.log("starting to fetch players for: ", statsFilter);
      console.log("available Players list is ". availablePlayers);
      playerListFull = availablePlayers.map((player) => {
        const seasonMerge = playersBase.find((m) => m.id === player.player_id) || {};
        return {
          ...player,
          name : seasonMerge.name || "",
          team : seasonMerge.team || "",
          position : seasonMerge.position || "",
          goals: seasonMerge.goals || 0,
          assists: seasonMerge.assists || 0,
          Minutes: seasonMerge.Minutes || 0,
          PKMissed: seasonMerge.PKMissed || 0,
          "Goals Against": seasonMerge["Goals Against"] || 0,
          Saves: seasonMerge.Saves || 0,
          "Clean Sheet": seasonMerge["Clean Sheet"] || 0,
          "Yellow Cards": seasonMerge["Yellow Cards"] || 0,
          "Red Cards": seasonMerge["Red Cards"] || 0,
          image_url : seasonMerge.image_url || "",
          FantasyPoints: seasonMerge.FantasyPoints || 0,
          injuries: seasonMerge.injuries || 0,
          description: seasonMerge.description || 0,
        };
      });
      console.log("✅ Season - Full Available Player List :", playerListFull);

      if (statsFilter === "2024") {
        console.log("For season filter - returning playerListFull");
        playerListTemp = playerListFull;
        return playerListTemp;

      } else if (statsFilter === "Week 1") {
        // Fetch Match Stats
        ({ data: matchData, error: error2 } = await supabase
          .from("players")
          .select("*"));
        //  .eq("week", 1)); 
        if (error2) 
          throw new Error("❌ Error fetching match stats: " + error2.message);
        else
          console.log("fetched weekly data: ", matchData);

        // 🔄 **Merge Data: Default to 0s if player has no match data**
        const mergedPlayers = playerListFull.map((player) => {
          const matchStats = matchData.find((m) => m.id === player.player_id) || {};
          return {
            ...player,
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
          };
        }); 
        console.log("New Player View merged for Weekly data", mergedPlayers);
        playerListTemp = mergedPlayers;
        return playerListTemp;
      }
    } catch (err) {
      console.error("🔥 Unexpected fetch error:", err);
    }
};

  const filterPlayers = (updatedList) => {
    console.log("Inside Filters");
    let filtered = [...playerStats];

    if (statsFilter) {
      filtered = [...updatedList];
    }
  
    if (search) {
      filtered = filtered.filter((player) =>
        player.name.toLowerCase().includes(search.toLowerCase())
      );
    }
  
    if (positionFilter && positionFilter !== "All") {
      filtered = filtered.filter((player) => player.position.includes(positionFilter));
    }
  
    if (teamFilter) {
      filtered = filtered.filter((player) => player.team === teamFilter);
    }
  
    setFilteredPlayers(filtered);
    console.log("🔄 Filtered Players:", filtered);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  
    const sortedPlayers = [...filteredPlayers].sort((a, b) => {
      let valA = a[field];
      let valB = b[field];
  
      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();
  
      if (typeof valA === "number" && typeof valB === "number") {
        return sortOrder === "asc" ? valA - valB : valB - valA;
      }
  
      return sortOrder === "asc" ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
    });
  
    setFilteredPlayers(sortedPlayers);
  };
  
  const handleAdd = async(player) => {
    console.log("Add Logic");

    const currentRoster = leagueParticipants.find((participant) => participant.user_id == userId).roster || []; 
    console.log("Current Roster ", currentRoster);
    console.log("Player to Add ", player);

    const currentPlayer = {
      "league_id": player.league_id,
      "name": player.name,
      "onroster": player.onroster,
      "player_id": player.player_id,
      "position": player.position,
      "image_url": player.image_url,
    }

    // **Append new player**
    const updatedRoster = [...currentRoster, currentPlayer];


    const { error: rosterError } = await supabase
      .from("league_rosters")
      .update({ roster: updatedRoster })
      .eq("league_id", leagueId)
      .eq("user_id",userId);

    if (rosterError) {
      console.error("Error updating roster:", rosterError);
    }    

    // Remove player from availablePlayers in Supabase
    const { error: playerError } = await supabase
    .from("league_players")
    .update({ onroster: true })
    .eq("player_id", player.player_id)
    .eq("league_id", leagueId);
    console.log("Player: "+player.name+"'s onRoster status is set to true in Supabase")

  }

  const handleInfo = async(player) => {
  //  alert("Testing Scroll image");
    setSelectedPlayerInfo(player);
    setOpenInfoModal(true);
  }

  return (
    <div>
      <NavigationBar/>
        <div className="players-screen">
          <h1 className="title">Player List</h1>
          
          {/* Search Bar */}
          <TextField 
            variant="outlined" 
            placeholder="Search players..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)}
            className="search-bar"
          />
          
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
          
          {/* Team & Stats Filters */}
          <div className="dropdown-filters">
            <Select 
              value={teamFilter} 
              onChange={(e) => setTeamFilter(e.target.value)} 
              className="filter-select"
              style={{ minWidth: "150px" }}
              displayEmpty
            >
              <MenuItem value="">All Teams</MenuItem>
              {teams.map((team) => (
                <MenuItem key={team} value={team}>{team}</MenuItem>
              ))}
            </Select>
            
            <Select value={statsFilter} onChange={(e) => setStatsFilter(e.target.value)} className="filter-select">
              {statsSeasons.map((season) => (
                <MenuItem key={season} value={season}>{season}</MenuItem>
              ))}
            </Select>
          </div>
          
          {/* Players Table */}
          <TableContainer component={Paper} className="players-table">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>   </TableCell>
                  <TableCell>   </TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>   </TableCell>
                  <TableCell>Team</TableCell>
                  <TableCell>Pos</TableCell>
                  <TableCell onClick={() => handleSort("FantasyPoints")} style={{ cursor: "pointer" }}>Fpts</TableCell>
                  <TableCell onClick={() => handleSort("Minutes")} style={{ cursor: "pointer" }}>Mins</TableCell>
                  <TableCell onClick={() => handleSort("goals")} style={{ cursor: "pointer" }}>Gls</TableCell>
                  <TableCell onClick={() => handleSort("assists")} style={{ cursor: "pointer" }}>Ast</TableCell>
                  <TableCell onClick={() => handleSort("PKMissed")} style={{ cursor: "pointer" }}>PKM</TableCell>
                  <TableCell onClick={() => handleSort("Goals Against")} style={{ cursor: "pointer" }}>GA</TableCell>
                  <TableCell onClick={() => handleSort("Saves")} style={{ cursor: "pointer" }}>Svs</TableCell>
                  <TableCell onClick={() => handleSort("Yellow Cards")} style={{ cursor: "pointer" }}>YC</TableCell>
                  <TableCell onClick={() => handleSort("Red Cards")} style={{ cursor: "pointer" }}>RC</TableCell>
                  <TableCell onClick={() => handleSort("Clean Sheet")} style={{ cursor: "pointer" }}>CS</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredPlayers.map((player, index) => (
                  <TableRow key={index}>
                    <TableCell><Button className="add-btn"
                    disabled={lockStatus === 'predraft' || lockStatus === 'draft'}
                    onClick={() => {
                      setSelectedPlayer(player);
                      setOpenModal(true); // ✅ Open modal when row is clicked
                    }}
                    sx={{"&:hover": {backgroundColor: "darkgreen", color: "white"}}}>Add</Button></TableCell>
                    <TableCell><img src={ process.env.PUBLIC_URL + "/placeholder.png"} alt={player.name} className="player-img"   onError={(e) => { e.target.onerror = null; e.target.src = process.env.PUBLIC_URL + "/placeholder.png"; }}/></TableCell>
                    <TableCell>{player.name}</TableCell>
                    <TableCell sx={{ cursor: "pointer" }}>
                      <img src={process.env.PUBLIC_URL + "/scroll.png"} onClick={() => {handleInfo(player)}} alt="scroll" className="player-img"   onError={(e) => { e.target.onerror = null; e.target.src = process.env.PUBLIC_URL + "/placeholder.png"; }}/>
                    </TableCell>
                    <TableCell>{player.team}</TableCell>
                    <TableCell>{player.position}</TableCell>
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
                Are you sure you want to add {selectedPlayer.name}?
              </Typography>

              <div className="modal-actions">
                <Button 
                  className="confirm-btn" 
                  onClick={() => { 
                    handleAdd(selectedPlayer); // ✅ Call drop function
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
          
          {selectedPlayerInfo && (
            <PlayerDetailsModal open={openInfoModal} onClose={() => setOpenInfoModal(false)} player={selectedPlayerInfo} />
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
                
            .players-screen {
              width: 100%;
              background: black;
              color: white;
              text-align: center;
              padding: 20px;
              min-height: 100vh;
              justify-content: space-between;
            }

            .title {
              font-size: 2rem;
              margin-bottom: 20px;
            }

            .search-bar {
              width: 50%;
              background: white;
              border-radius: 20px;
              margin-bottom: 20px;
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

            .dropdown-filters {
              display: flex;
              justify-content: center;
              gap: 10px; /* Adds space between buttons */
              margin-bottom: 20px;
            }

            .filter-select {
              background: white;
              color: black;
              border-radius: 10px;
              min-width: 150px;
              padding: 1px;
            }

            .filter-select .MuiSelect-icon {
              color: black; /* Ensures dropdown arrow visibility */
            }

            .MuiMenu-paper {
              background: white !important;
              color: black !important;
            }

            .add-btn {
              border-radius: 20px;
              background: #62FCDA;
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
              border-radius: 20%;
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
          `}</style>
        </div>
    </div>
  );
};

export default PlayersScreen;

