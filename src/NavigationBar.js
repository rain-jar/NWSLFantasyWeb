import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useLeague } from "./LeagueContext";
import { supabase } from "./supabaseClient";
import { AppBar, Toolbar, Button, Menu, MenuItem, Typography } from "@mui/material";


const NavigationBar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { users, userId, leagueId, userLeagues, handleLogout, timerStart, lockStatus } = useLeague(); // Fetch user's leagues from context
    const [anchorEl, setAnchorEl] = useState(null);
    const [leagues, setAvailableLeagues] = useState ([]);
    const [isLoading, setLoading] = useState(true);


    useEffect(()=> {
        console.log("TimerStart is :", timerStart);
        console.log("League Lock Status is :", lockStatus);
    }, [])

    const fetchLeagues = async () => {
        const { data, error } = await supabase
        .from("league_rosters")
        .select("league_id, leagues(league_name), team_name")
        .eq("user_id", userId);

        if (error) {
            console.error("Error fetching user leagues:", error);
        } else {
            const formattedLeagues = (data.map((entry) => ({
            id: entry.league_id,
            name: entry.leagues.league_name,
            team_name: entry.team_name
            })));
            setAvailableLeagues(formattedLeagues);
            console.log("Setting User Leagues ", formattedLeagues)
        }
    };
    /*
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            await fetchLeagues();
            setLoading(false);
        };
        if (leagueId) {
        fetchData();
        }
    }, []);

    if(isLoading) return null;
*/
   // console.log("User Leagues in Navigation ", userLeagues, users, leagueId, userId);
    //const userName = users.find((m) => m.id === userId).user_name;
   // const leagueName = userLeagues.find((m) => m.id === leagueId).name;

    const handleMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    return (
        <AppBar position="static" sx={{ background: "black", color: "white" }}>
            <Toolbar>
                <Button 
                    color="inherit" 
                    onClick={() => navigate("/join")}
                    className={location.pathname === "/create-join" ? "active-nav" : ""}
                >
                    Home
                </Button>

                <Button 
                    color="inherit" 
                    onClick={() => navigate("/players")}
                    className={location.pathname === "/players" ? "active-nav" : ""}
                >
                    Players
                </Button>

                <Button 
                    color="inherit" 
                    onClick={() => navigate("/league-standings")}
                    className={location.pathname === "/league-standings" ? "active-nav" : ""}
                >
                    League
                </Button>

                <Button 
                    color="inherit" 
                    onClick={() => navigate("/my-team")}
                    className={location.pathname === "/my-team" ? "active-nav" : ""}
                >
                    My Team
                </Button>
                <Button 
                    color="inherit" 
                    onClick={() => navigate("/draft")}
                    className={location.pathname === "/draft" ? "active-nav" : ""}
                >
                    Draft
                </Button>


                <div style={{ marginLeft: "auto" }}>                
                    <Button 
                    color="inherit" 
                    onClick={handleMenuOpen} 
                    endIcon={<span style={{ fontSize: "1rem" }}>▼</span>}
                    className={location.pathname.includes("/league") ? "active-nav" : ""}
                    >
                    Leagues
                    </Button>
                </div>
{/*
                <Typography variant="h9" className="team-name">User : {userName}  </Typography>
                <Typography variant="h9" className="team-name">      </Typography>
                <Typography variant="h9" className="team-name"> League : {leagueName}</Typography>
*/}            
                <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                    {userLeagues.map((league) => (
                    <MenuItem key={league.id} onClick={() => navigate(`/league/${league.id}`)}>
                        {league.name}
                    </MenuItem>
                    ))}
                </Menu>

                {userId && ( // ✅ Show Logout only if user is logged in
                    <Button 
                        color="inherit" 
                        onClick={handleLogout}
                    >   
                    Logout
                    </Button>
                )}

                {/* Styles */}
                <style jsx>{`
                    .active-nav {
                        border-bottom: 2px solid white; /* Underline effect */
                        font-weight: bold;
                    }
                `}</style>
            </Toolbar>



        </AppBar>
    );
};

export default NavigationBar;
