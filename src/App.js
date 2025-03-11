
import './App.css';
import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient.js";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import WelcomeScreen from "./pages/WelcomeScreen";
import ProfileScreen from './pages/ProfileScreen';
import ProfileListScreen from './pages/ProfileListScreen.js';
import CreateJoinScreen from './pages/CreateJoinScreen'; 
import LeagueSetupScreen from './pages/LeagueSetupScreen';
import PlayersScreen from './pages/PlayersScreen.js';
import MyTeamScreen from './pages/MyTeamScreen.js';
import LeagueScreen from './pages/LeagueScreen.js';
import DraftScreen from './pages/DraftScreen.js';
import { LeagueProvider, useLeague } from "./LeagueContext";
import SignupScreen from './pages/SignUpScreen.js';
import LoginScreen from './pages/LoginScreen.js';
import DebugComponent from './pages/DebugComponent.js';
import UpdatePassword from './pages/UpdatePassword.js';
import ForgotPassword from './pages/ForgotPassword.js';
import AboutPage from './pages/AboutPage.js';
import CreateJoinScreenAdmin from './pages/CreateJoinScreenAdmin.js';


function App() {

  const [users, setUsers] = useState([]); // Store multiple users
  const [currentUserId, setCurrentUserId] = useState(null);
  const [selectedLeagueId, setSelectedLeagueId] = useState(null);
  const [playerStats, setPlayerStats] = useState([]);
  const [isDataFetched, setIsDataFetched] = useState(false);
  const [loading, setLoading] = useState(true); // Add loading state

// ✅ Use `useLeague()` to access `userId`
const ProtectedRoute = ({ children }) => {
  const { userId, loading } = useLeague(); 
  console.log("loading and userId ", loading, userId);
  if(loading){
    console.log("Returning without rendering");
    return null;
  }
  return userId ? children : <Navigate to="/" replace />;
};


    useEffect(() => {
      const fetchData = async () => {
        setLoading(true);
        await fetchPlayerStats();
        setLoading(false);
      };
        fetchData();
    }, []);

    const fetchPlayerStats = async () => {
      if (!isDataFetched) {
        console.log("Fetching Player Stats...");
        const { data, error } = await supabase.from("players_base").select("*");
        if (error) {
          console.error("Error fetching player stats:", error);
          return;
        }
        setPlayerStats(data);
        setIsDataFetched(true);
        console.log("Players Base data is fetched in App.tsx",data );
      }
    };


  const handleSaveProfile = async (userName) => {

    console.log("Profile saved for user:", userName);
    
    const newUser = {
      user_name: userName
    };
    console.log("newUser array created");
    try{
      // Insert new user into Supabase
      console.log("Adding a User");
  
      const { data, error } = await supabase.from("users").insert([newUser]).select();

      if (error) {
        console.error("Error saving user:", error);
        alert("Failed to save profile. Try again.");
        return;
      }


      setUsers((prevUsers) => [...prevUsers, data[0]]);
      setCurrentUserId(data[0].id);
      console.log("Setting the following details:", data, data[0].id, users);
    }catch (err) {
      console.error("Uexpected error", err)
    }




  };

  const onUserSelect = async(userId) => {
    console.log("User Selected is ", userId);
    setCurrentUserId(userId);
  }

  return (
    <LeagueProvider currentLeagueId={selectedLeagueId} currentUserId={currentUserId}>
      <Router>
        <DebugComponent/>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<WelcomeScreen />} />
          <Route path="/create-profile" element={<SignupScreen onSelectedId={(newUserId) => setCurrentUserId(newUserId)}/>}/>
          <Route path="/existing-user" element={<LoginScreen onSelectedId={(newUserId) => setCurrentUserId(newUserId)}/>}/>
          <Route path="/update-password" element={<UpdatePassword/>}/>
          <Route path="/forgot-password" element={<ForgotPassword/>}/>
          <Route path="/about" element={<AboutPage/>}/>

          {/* Protected Routes (Only accessible when logged in) */}
          <Route path="/join" element={
            <ProtectedRoute>
              <CreateJoinScreen currentUser={{ id: currentUserId }} onLeagueChosen={(newLeagueId) => setSelectedLeagueId(newLeagueId)}/>
            </ProtectedRoute>
          } />
         <Route path="/create-join" element={
            <ProtectedRoute>
              <CreateJoinScreenAdmin currentUser={{ id: currentUserId }} onLeagueChosen={(newLeagueId) => setSelectedLeagueId(newLeagueId)}/>
            </ProtectedRoute>
          } />
          <Route path="/league-setup" element={
            <ProtectedRoute>
              <LeagueSetupScreen onLeagueChosen={(newLeagueId) => setSelectedLeagueId(newLeagueId)}/>
            </ProtectedRoute> 
            } />
          <Route path="/players" element={
            <ProtectedRoute>
              <PlayersScreen playersBase={playerStats}/>
            </ProtectedRoute>
          } />
          <Route path="/my-team" element={
            <ProtectedRoute>
              <MyTeamScreen playersBase={playerStats}/>
            </ProtectedRoute>
          } />
          <Route path="/league-standings" element={
            <ProtectedRoute>
              <LeagueScreen/>
            </ProtectedRoute>
          } />
          <Route path="/draft" element={
            <ProtectedRoute>
              <DraftScreen playersBase={playerStats}/>
            </ProtectedRoute>
          } />

          {/* Catch-All Redirect */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </LeagueProvider>
  );
}

export default App;
