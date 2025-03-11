import React, { useState } from "react";
import { Button, TextField,  Card, CardContent } from "@mui/material";
import {signUpUser} from "../authService";
import { useNavigate } from "react-router-dom";
import { useLeague } from "../LeagueContext";



const SignupScreen = ( {onSelectedId}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const { setUsers, setCurrentUserId } = useLeague();
  const navigate = useNavigate();

  const handleSignup = async () => {
    console.log("In handle sign up");
    const result = await signUpUser(email, password, username);
    console.log("Waiting for result");
    if (result.success) {
        console.log("Waited for Result ", result);
        const userLevelSet = async() => {
            const data = { id: result.userId, user_name : username };
            console.log("Data in SignUpScreen ", data);
            setUsers((prevUsers) => (Array.isArray(prevUsers) ? [...prevUsers, data] : [data]));
            onSelectedId(data.id);
            return{success: true};
        }
        const resUserLevelSet = await userLevelSet();
        console.log("Waiting for userLevelSet");
        if (resUserLevelSet.success) {
            console.log("userLevelSet is complete")
            navigate("/join"); // Redirect to league selection
          } else {
            setErrorMessage(result.error);
          }
      } else {
        setErrorMessage(result.error);
      }
    };
/*
  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Create Your Profile</h2>
      <input style={styles.input} type="text" placeholder="Enter your name" onChange={(e) => setUsername(e.target.value)} />
      <input style={styles.input} type="email" placeholder="Enter email" onChange={(e) => setEmail(e.target.value)} />
      <input style={styles.input} type="password" placeholder="Enter password" onChange={(e) => setPassword(e.target.value)} />
      <Button className="action-btn" onClick={handleSignup}>Continue</Button>
      {errorMessage && <p>{errorMessage}</p>}
    </div>
  );
  */

  return (
    <div>
      <div className="screen-container">
        <Card className="league-form-card">
          <CardContent>
            <h2 className="screen-title">Create Your Profile</h2>
            <TextField
              label="Username"
              variant="outlined"
              fullWidth
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="league-input"
              InputLabelProps={{ style: { color: "#aaa" } }}
            />
            <TextField
              label="Email"
              variant="outlined"
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="league-input"
              InputLabelProps={{ style: { color: "#aaa" } }}
            />
            <TextField
              label="Password"
              type="password"
              variant="outlined"
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="league-input"
              InputLabelProps={{ style: { color: "#aaa" } }}
            />
            {errorMessage && <p className="error-text">{errorMessage}</p>}
            <Button className="confirm-btn" onClick={handleSignup} fullWidth>
              Continue
            </Button>
          </CardContent>
        </Card>
        <Button className="action-btn" onClick={() => navigate("/existing-user")}>
          Already have an account? Login
        </Button>
      </div>
      <style jsx>{`
        .screen-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
          background-color: #121212;
        }

        .screen-title {
          text-align: center;
          color: white;
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 20px;
        }

        .league-form-card {
          background: #222;
          color: white;
          width: 350px;
          padding: 20px;
          border-radius: 15px;
          box-shadow: 0 4px 10px rgba(0, 255, 127, 0.3);
        }

        .league-input {
          background: white;
          color: black;
          margin-bottom: 15px;
        }

        .action-btn {
          background: white;
          color: black;
          border: 2px solid kellygreen;
          border-radius: 30px;
          padding: 12px 24px;
          font-weight: bold;
          font-size: 1rem;
          box-shadow: 0 10px 10px rgba(0, 255, 127, 0.3);
          margin-top: 15px;
        }

        .action-btn:hover {
          background: darkgreen;
          color: white;
          border-color: darkgreen;
        }

        .confirm-btn {
          background: white;
          color: black;
          border-radius: 30px;
          padding: 12px 24px;
          font-weight: bold;
          font-size: 1rem;
          box-shadow: 0 4px 10px rgba(0, 255, 127, 0.3);
        }

        .confirm-btn:hover {
          background: darkgreen;
          color: white;
          border-color: darkgreen;
        }

        .error-text {
          color: red;
          font-size: 14px;
          text-align: center;
        }

      `}</style>
    </div>
  );
};

export default SignupScreen;
