import { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";


function UpdatePassword() {
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState("");
  
  

  async function handlePasswordUpdate() {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      alert("Error: " + error.message);
      setErrorMessage(error.message);
    } else {
    //  alert("Password updated! You can now log in.");
      setErrorMessage("Password updated! You can now log in.");
      navigate("/existing-user"); // Redirect to league selection
    }
  }

  return (
    <div className="screen-container">
      <h2 className="title">Reset Your Password</h2>
      <input
        type="password"
        placeholder="New Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="input"
      />
      <button onClick={handlePasswordUpdate} className="button">Update Password</button>
      {errorMessage && <p className="error-text">{errorMessage}</p>}

      <style jsx>{`
        .screen-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
          background-color: #121212;
          color: white;
          padding: 20px;
        }

        .title {
          font-size: 24px;
          margin-bottom: 20px;
        }

        .input {
          width: 100%;
          max-width: 300px;
          padding: 10px;
          margin-bottom: 15px;
          border: 1px solid rgba(0, 255, 127, 0.3);
          border-radius: 4px;
          font-size: 16px;
          box-shadow: 0 4px 10px rgba(0, 255, 127, 0.3);

        }

        .button {
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

        .button:hover {
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
}

export default UpdatePassword;
