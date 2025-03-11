import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { resetPassword } from "../authService"; 
import {  Button, TextField, Card, CardContent } from "@mui/material";


function ForgotPassword() {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();
  const [Message, setMessage] = useState("");
  

  const handleReset = async () => {
    const response = await resetPassword(email);
    if (response.success) {
      alert(response.message);
      setMessage("Please check your email for the recovery link. ", response.message);
    } else {
    //  alert("Error: " + response.error);
      setMessage(response.error);
    }
  }; 

  return (
    <div>
      <div className="screen-container">
        <Card className="league-form-card">
          <CardContent>
            <h1 className="title">Forgot Password?</h1>
            <h5 className="subtitle">
              All good. Enter your account's email address and we’ll send you a link to reset your password.
            </h5>
            {Message && <p className="error-text">{Message}</p>}

          <TextField
              label="Email"
              variant="outlined"
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="league-input"
              InputLabelProps={{ style: { color: "#aaa" } }}
            />
            <Button className="confirm-btn" onClick={handleReset} fullWidth>
                Send Reset Link
            </Button>
          </CardContent>
        </Card>
        <Button className="passwordreset-btn" onClick={() => navigate("/existing-user")}>
                  Return to Login
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
        
        .title {
          text-align: center;
          color: white;
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 20px;
        }

        .subtitle {
          text-align: center;
          color: white;
          font-size: 14px;
          font-weight: bold;
          margin-bottom: 20px;
          line-height: 1.5;
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
          color: white;
          font-size: 14px;
          font-weight: bold;
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
}

export default ForgotPassword;
