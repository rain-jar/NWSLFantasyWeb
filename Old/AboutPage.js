import React, { useState } from "react";
import { Box, Button, TextField, Typography, Container, Card, CardContent } from "@mui/material";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import { FaTwitter } from "react-icons/fa";
import { SiBluesky } from "react-icons/si";
import { createClient } from "@supabase/supabase-js";
import { supabase } from "../supabaseClient";


// Supabase Client (Replace with actual credentials)
/*
const supabase = createClient(
  "https://your-supabase-url.supabase.co",
  "your-supabase-anon-key"
);
*/

const AboutPage = () => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    const blockedDomains = ["test.com", "example.com", "mailinator.com", "fake.com"];
    const emailDomain = email.split("@")[1];

    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/) || blockedDomains.includes(emailDomain)) {
      alert("Please enter a valid email address.");
      return;
    }

    const { data, error } = await supabase.from("waitlist").insert([{ email }]);

    if (error) {
      alert("Something went wrong. Please try again.");
    } else {
      setSubmitted(true);
    }
  };

  return (
    <Container maxWidth="false" sx={{ textAlign: "center", paddingY: 4, color: "white", backgroundColor: "black" }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
        <img src="/woso-logo.png" alt="WoSo Fantasy Logo" style={{ height: 60 }} />
        <Typography variant="h4" sx={{ color: "#62FCDA", fontWeight: "bold" }}>WoSo Fantasy</Typography>
        <Box>
          <a href="https://twitter.com/WoSoFantasy" target="_blank" rel="noopener noreferrer">
            <FaTwitter color="#62FCDA" size={24} style={{ marginRight: 10 }} />
          </a>
          <a href="https://bsky.app/profile/wosofantasy.bsky.social" target="_blank" rel="noopener noreferrer">
            <SiBluesky color="#62FCDA" size={24} />
          </a>
        </Box>
      </Box>

      {/* Main Content */}
      <Typography variant="h5" gutterBottom>
        Fantasy Leagues for Women's Soccer
      </Typography>
      <Typography variant="subtitle1" gutterBottom>
        Draft the future of soccer
      </Typography>

      {/* Swiper Carousel */}
      <Box sx={{ width: "80%", maxWidth: 700, margin: "auto", mt: 3 }}>
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

      {/* Email Subscription */}
      <Card sx={{ backgroundColor: "black", color: "white", padding: 3, marginTop: 3 }}>
        <CardContent>
          {submitted ? (
            <Typography color="#4aff4a">Thank you for the interest! You'll hear from us shortly.</Typography>
          ) : (
            <Box display="flex" flexDirection="column" alignItems="center">
              <TextField
                label="Enter your email"
                variant="outlined"
                fullWidth
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                sx={{ marginBottom: 2, backgroundColor: "white", borderRadius: 2 }}
              />
              <Button variant="contained" sx={{ backgroundColor: "white", color: "black" }} onClick={handleSubmit}>
                Keep Me Posted
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
    </Container>
  );
};

export default AboutPage;
