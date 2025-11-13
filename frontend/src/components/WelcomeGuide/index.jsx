import React, { useState } from "react";
import { Button, TextField, Box } from "@mui/material";
import { useNavigate } from "@tanstack/react-router";

export default function WelcomeGuide() {
  const navigate = useNavigate();
  const stored = JSON.parse(localStorage.getItem("user"));
  const user = stored?.user;
  const [joinCode, setJoinCode] = useState("");
  const [householdName, setHouseholdName] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCreateHousehold() {
    if (loading) return;
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5001/api/auth/create-household", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          household_name: householdName || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Error creating household");
        setLoading(false);
        return;
      }

      // Update localStorage
      stored.user.household_id = data.household.household_id;
      stored.user.household = data.household.household_name;
      stored.user.join_code = data.household.join_code;
      stored.user.role = "owner";
      localStorage.setItem("user", JSON.stringify(stored));
      localStorage.setItem("hasSeenWelcome", "true"); // Mark as seen

      navigate({ to: "/dashboard" });
    } catch (err) {
      alert("Network error");
      setLoading(false);
    }
  }

  async function handleJoinHousehold() {
    if (loading || !joinCode.trim()) return;
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5001/api/auth/join-household", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          join_code: joinCode.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Error joining household");
        setLoading(false);
        return;
      }

      // Update localStorage  
      stored.user.household_id = data.household_id;
      stored.user.household = data.household_name;
      stored.user.role = "member";
      localStorage.setItem("user", JSON.stringify(stored));
      localStorage.setItem("hasSeenWelcome", "true"); // Mark as seen

      navigate({ to: "/dashboard" });
    } catch (err) {
      alert("Network error");
      setLoading(false);
    }
  }

  function handleSkip() {
    // Mark that user has seen welcome page
    localStorage.setItem("hasSeenWelcome", "true");
    navigate({ to: "/dashboard" });
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        padding: "20px",
        maxWidth: "600px",
        margin: "0 auto",
      }}
    >
      <h1>Welcome to Stocker!</h1>
      <p style={{ textAlign: "center", marginBottom: "40px", color: "#666" }}>
        Get started by creating or joining a household to manage your pantry inventory together.
      </p>

      {/* Create Household */}
      <Box sx={{ width: "100%", marginBottom: "30px" }}>
        <h3>Create New Household</h3>
        <TextField
          fullWidth
          label="Household Name (Optional)"
          value={householdName}
          onChange={(e) => setHouseholdName(e.target.value)}
          sx={{ marginBottom: "10px" }}
        />
        <Button
          fullWidth
          variant="contained"
          onClick={handleCreateHousehold}
          disabled={loading}
        >
          Create Household
        </Button>
      </Box>

      {/* Join Household */}
      <Box sx={{ width: "100%", marginBottom: "30px" }}>
        <h3>Join Existing Household</h3>
        <TextField
          fullWidth
          label="Enter Join Code"
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value)}
          sx={{ marginBottom: "10px" }}
        />
        <Button
          fullWidth
          variant="contained"
          color="secondary"
          onClick={handleJoinHousehold}
          disabled={loading || !joinCode.trim()}
        >
          Join Household
        </Button>
      </Box>

      {/* Skip */}
      <Box sx={{ textAlign: "center", width: "100%" }}>
        <p style={{ color: "#666", marginBottom: "10px", fontSize: "14px" }}>
          You can skip for now and set up household later in Settings.
        </p>
        <Button variant="outlined" onClick={handleSkip} disabled={loading}>
          Skip for Now
        </Button>
      </Box>
    </Box>
  );
}

