import React, { useState } from "react";
import { Box, Button, TextField, Typography, Container, Card, CardContent } from "@mui/material";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import { FaTwitter } from "react-icons/fa";
import { SiBluesky } from "react-icons/si";
import { createClient } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";


// Supabase Client (Replace with actual credentials)
const supabase = createClient(
  "https://yrjyxuwlhkiwfbvksvmy.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlyanl4dXdsaGtpd2Zidmtzdm15Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkwODMyNDQsImV4cCI6MjA1NDY1OTI0NH0.GTkod-XOzmFrqFzyD_Wqt9Qf5rMfGiljnsxXzBRCpRk"
);

const AboutPage = () => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();
  

  const handleSubmit = async () => {
    const blockedDomains = ["test.com", "example.com", "mailinator.com", "fake.com"];
    const emailDomain = email.split("@")[1];

    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/) || blockedDomains.includes(emailDomain)) {
      alert("Please enter a valid email address.");
      return;
    }

    const { data, error } = await supabase.from("woso_signup_emails").insert([{ email }]);

    if (error) {
      alert("Something went wrong. Please try again.");
    } else {
      setSubmitted(true);
    }
  };

  return (
    <>
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
        .container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background: linear-gradient(135deg, #1e1e1e, #3a3a3a);
            color: white;
        }
        .header {
            width: 100%;
            font-size: 30px;
            max-width: 100%;
            word-wrap: break-word;
            display: flex;
            justify-content: space-between; /* Ensures icons stay on the right */
            align-items: center;
            padding: 10px 0px;
            position: absolute; /* Make it overlay instead of taking space */
            top: 0;
            left: 0;
            right: 0;
            z-index: 10; /* Keep it above other content */

            @media (max-width: 768px) { /* Adjust for mobile */
                font-size: 24px;
                flex-direction: row;
                align-items: center;
            }
        }
        .logo {
            height: 60px; /* Increase height */
            width: auto; /* Maintain aspect ratio */
            margin-right: 10px;
        }
        .title {
            font-size: 24px;
            font-weight: bold;
            color: #62FCDA;
            font-family: "American Typewriter", Georgia, serif;
        }

        .Main{
            text-align: center;
            width: 100%;
            max-width: 700px;
            justify-content: center;
            margin-top :90px;
            padding : 10px;
        }
        .heading{
            font-size: 30px;
            font-weight: bold;
            margin-bottom: 10px;
            max-width: 100%; /* Prevents overflow */
            word-wrap: break-word;

            @media (max-width: 768px) { /* Adjust for mobile */
                font-size: 22px;
            }
        }

        .tagline{
            font-size: 22px;
            font-weight: bold;
            margin-bottom: 30px;
            @media (max-width: 768px) { /* Adjust for mobile */
                font-size: 18px;
            }
        }
        .carousel-container {
            width: 100%;
            max-width: 700px;
            display: flex;
            justify-content: center;
            height: auto;
            margin-bottom: 20px;
            overflow: hidden;
            position: relative;
            border-radius: 15px;
            overflow: hidden;

            &::before {
                content: "";
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                border-radius: inherit;
                box-shadow: inset 5px 5px 10px #62FCDA,
                            inset -5px -5px 10px #62FCDA;
                pointer-events: none; /* Ensures it doesn’t block interactions */
                z-index: 10;
            }

            .swiper-slide:nth-child(1) { /* First slide (16:9) */
                aspect-ratio: 16 / 9;
                max-height: 350px; /* Adjust height as needed */
                width: 100%; /* Prevent bleeding */
            }

            .swiper-slide:nth-child(2),
            .swiper-slide:nth-child(3) { /* Second & Third slides (9:16) */
                aspect-ratio: 9 / 16;
                max-height: 400px; /* Adjust height as needed */
            }
        }

        .subtitle{
            font-size: 18px;
            margin-bottom: 18px;
        }
        .EmailContainer {
            display: flex;
            flex-direction: column;
            align-items: center;

        }
        .emailinput {
            padding: 1px;
            color: white;
            width: 80%;
            background : black;
            border-radius: 20px;
            border: none;
            outline: none;
            margin-bottom: 20px;
            box-shadow: 0px 1px 5px #62FCDA; /* Soft shadow */
            transition: box-shadow 0.3s ease-in-out;

            &:focus {
                background : black;
                border-radius: 20px;
                box-shadow: 0px 4px 10px #62FCDA; /* Stronger shadow on focus */
            }
        }
        .SubmitButton{
            padding: 10px 20px;
            border-radius: 20px;
            border: none;
            background-color: white;
            color: black;
            font-size: 16px;
            cursor: pointer;
            &:hover {
                background-color: #62FCDA;
                box-shadow: 0px 4px 10px #62FCDA; /* Stronger shadow on focus */
            }
        }
        .SuccessMessage {
            font-size: 16px;
            color: #4aff4a;
        }
        .SocialContainer{
            display: flex;
            min-width: 100px;
            gap: 15px;
            margin-left: auto; /* Pushes icons to the right */

            a {
                color: #62FCDA;
                font-size: 24px;
                transition: transform 0.2s ease-in-out;

                &:hover {
                transform: scale(1.1);
                }
            }
        }

      `}</style>
      <div className="container">
        {/* Header */}
        <Box className="header">
          <img src="/woso-logo.png" alt="WoSo Fantasy Logo" className="logo"/>
          <Typography variant="h4" className="title">WoSo Fantasy</Typography>
          <Box className ="SocialContainer">
            <a href="https://twitter.com/WoSoFantasy" target="_blank" rel="noopener noreferrer">
              <FaTwitter color="#62FCDA" size={24} style={{ marginRight: 10 }} />
            </a>
            <a href="https://bsky.app/profile/wosofantasy.bsky.social" target="_blank" rel="noopener noreferrer">
              <SiBluesky color="#62FCDA" size={24} />
            </a>
          </Box>
        </Box>

        {/* Main Content */}
        <div className="Main">
            <Typography variant="h5" className="heading" gutterBottom>
            Fantasy Leagues for Women's Soccer
            </Typography>
            <Typography variant="subtitle1" className="tagline"gutterBottom>
            Draft the future of soccer
            </Typography>

            {/* Swiper Carousel */}
            <Box className="carousel-container">
            <Swiper modules={[Pagination, Autoplay]} pagination={{ clickable: true }} autoplay={{ delay: 44000 }}>
                <SwiperSlide>
                <video controls autoPlay muted playsInline width="100%" height="100%">
                    <source src="/app-preview-desktop.mp4" type="video/mp4" />
                </video>
                </SwiperSlide>
                <SwiperSlide>
                <video controls autoPlay muted playsInline width="100%" height="100%">
                    <source src="/app-preview-android.webm" type="video/webm" />
                </video>
                </SwiperSlide>
                <SwiperSlide>
                <video controls autoPlay muted playsInline width="100%" height="100%">
                    <source src="/app-preview-ioscut.mp4" type="video/mp4" />
                </video>
                </SwiperSlide>
            </Swiper>
            </Box>

            <Typography variant="subtitle1" className="subtitle"gutterBottom>
            NWSL Fantasy Season launching on March 9th!            
            </Typography>

            {/* Email Subscription */}
            <div className="EmailContainer">
                    {submitted ? (
                    <Typography className ="SuccessMessage" color="white">Thank you for the interest! You'll hear from us shortly.</Typography>
                    ) : (
                    <>
                        <TextField
                        label="Enter your email"
                        variant="outlined"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        sx={{
                            "& .MuiInputLabel-root": { color: "#62FCDA" }, // Default label color
                            "& .MuiInputLabel-root.Mui-focused": { color: "#62FCDA" }, // Color when focused
                            "& .MuiInputBase-input": { color: "white" }, // Changes text color to white

                          }}                        
                        className="emailinput"
                        />
                        <Button variant="contained" className="SubmitButton"onClick={handleSubmit}>
                        Keep Me Posted
                        </Button>
                    </>
                    )}
            </div>
        </div>
      </div>
    </>
  );
};

export default AboutPage;
