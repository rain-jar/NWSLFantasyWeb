import React, { useState } from "react";
import { loginUser } from "../authService";
import {  Button, TextField, Card, CardContent } from "@mui/material";

import { useNavigate } from "react-router-dom";
import { useLeague } from "../LeagueContext";
import { wait } from "@testing-library/user-event/dist/utils";

const LoginScreen = ({onSelectedId}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const { setUsers, setCurrentUserId, userId } = useLeague();
  const navigate = useNavigate();

  const handleLogin = async  () => {
    const result = await loginUser(email, password);
    console.log("In Login Page");
    console.log("Waiting for loginAuth");
    if (result.success) {
      console.log("Waited for loginAuth ", result);
      const userLevelSet = async() => {
        onSelectedId(result.user.id);
        console.log("Setting user and userId ", result.user.id, result.userId);
        return {success: true};

      }
      const resUserLevelSet = await userLevelSet();
      console.log("Waiting for userLevelSet", userId);
      if (resUserLevelSet.success) {
          wait(10);
          console.log("userLevelSet is complete",  userId)
          navigate("/join"); // Redirect to league selection
        } else {
          console.log("userId is not set yet ");
        }
    } else {
      setErrorMessage(result.error);
    }
  };

  return (
      <div>
        <div className="screen-container">
          <Card className="league-form-card">
            <CardContent>
              <h2 className="screen-title">Login</h2>
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
              <Button className="confirm-btn" onClick={handleLogin} fullWidth>
                Login
              </Button>
            </CardContent>
          </Card>
          <Button className="passwordreset-btn" onClick={() => navigate("/forgot-password")}>
                Forgot Password?
          </Button>
          <Button className="passwordreset-btn" onClick={() => navigate("/create-profile")}>
                Create A Profile?
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
            box-shadow: 0 4px 10px #62FCDA;
          }
          
          .confirm-btn:hover {
            background: #62FCDA;
            color: black;
            border-color: darkgreen;
          }
          
          .error-text {
            color: red;
            font-size: 14px;
            text-align: center;
          }

          .passwordreset-btn {
            background: white;
            color: black;
            width : "100%";
            border: 2px solid kellygreen;
            border-radius: 30px;
            padding: 10px 20px;
            font-weight: bold;
            font-size: 0.8rem;
            box-shadow: 0 10px 10px rgba(0, 255, 127, 0.3);
            margin-top: 15px;
          }
          
          .passwordreset-btn:hover {
            background: darkgreen;
            color: white;
            border-color: darkgreen;
          }

          
          `}</style>
      </div>
    );

};

const styles = {
  container: {
    backgroundColor: "#121212",
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    gap: "10px",
  },
  title: {
    fontSize: "24px",
    fontWeight: "bold",
  },
  input: {
    width: "250px",
    padding: "10px",
    margin: "5px",
    borderRadius: "5px",
    border: "1px solid #444",
    backgroundColor: "#222",
    color: "#fff",
  },
  button: {
    backgroundColor: "#007bff",
    color: "#fff",
    padding: "10px",
    border: "none",
    borderRadius: "1px",
    //width : "100%",
    cursor: "pointer",
  },
  error: {
    color: "red",
    fontSize: "14px",
  },
};

export default LoginScreen;
