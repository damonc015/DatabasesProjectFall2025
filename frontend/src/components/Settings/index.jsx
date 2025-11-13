import React, { useState, useEffect } from "react";
import { TextField, Button } from "@mui/material";

export default function Settings() {
  const stored = JSON.parse(localStorage.getItem("user"));
  const user = stored?.user;
  const isOwner = user?.role === "owner";

  // user info
  const [displayName, setDisplayName] = useState(user?.display_name || "");
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");

  // join household
  const [joinCode, setJoinCode] = useState("");

  // members (only for owner)
  const [members, setMembers] = useState([]);

  // Fetch members only if owner
  useEffect(() => {
    async function loadMembers() {
        if (!isOwner || !user?.household_id) return;

        const res = await fetch(
          `http://localhost:5001/api/auth/members/${user.household_id}`
        );
      const data = await res.json();
      setMembers(data.members || []);
    }

    loadMembers();
  }, []);


  async function handleSaveName() {
    const res = await fetch("http://localhost:5001/api/auth/update-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: user.id,
        display_name: displayName,
      }),
    });

    const data = await res.json();
    if (!res.ok) return alert(data.error || "Error");

    stored.user.display_name = displayName;
    localStorage.setItem("user", JSON.stringify(stored));

    alert("Display name updated!");
  }

  async function handleUpdatePassword() {
    const res = await fetch("http://localhost:5001/api/auth/update-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: user.id,
        old_password: oldPw,
        new_password: newPw,
      }),
    });

    const data = await res.json();
    if (!res.ok) return alert(data.error || "Error");

    alert("Password updated!");
    setOldPw("");
    setNewPw("");
  }

  async function handleJoinHousehold() {
    const res = await fetch("http://localhost:5001/api/auth/join-household", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: user.id,
        join_code: joinCode,
      }),
    });

    const data = await res.json();
    if (!res.ok) return alert(data.error || "Error");

    stored.user.household_id = data.household_id;
    localStorage.setItem("user", JSON.stringify(stored));

    alert("Joined household!");
    window.location.reload();
  }

  async function handleRemoveUser() {
    const dropdown = document.getElementById("removeUserSelect");
    const username = dropdown.value;

    if (!username) return alert("Select a member");

    const res = await fetch("http://localhost:5001/api/auth/remove-member", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });

    const data = await res.json();
    if (!res.ok) return alert(data.error || "Error");

    alert(`User "${username}" removed.`);

    window.location.reload();
  }

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
      <h2>Settings</h2>

      {/* Update Display Name */}
      <div style={{ marginBottom: "30px" }}>
        <h3>Display Name</h3>
        <TextField
          fullWidth
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
        <Button variant="contained" style={{ marginTop: "10px" }} onClick={handleSaveName}>
          Save
        </Button>
      </div>

      {/* Change Password */}
      <div style={{ marginBottom: "30px" }}>
        <h3>Change Password</h3>
        <TextField
          type="password"
          fullWidth
          placeholder="Old Password"
          value={oldPw}
          onChange={(e) => setOldPw(e.target.value)}
        />
        <TextField
          type="password"
          fullWidth
          placeholder="New Password"
          style={{ marginTop: "10px" }}
          value={newPw}
          onChange={(e) => setNewPw(e.target.value)}
        />
        <Button variant="contained" style={{ marginTop: "10px" }} onClick={handleUpdatePassword}>
          Update
        </Button>
      </div>

      {/* Join Household */}
      <div style={{ marginBottom: "30px" }}>
        <h3>Join Household</h3>

        <TextField
          fullWidth
          placeholder={
            isOwner
              ? "Owner cannot join another household"
              : "Enter Join Code"
          }
          value={joinCode}
          disabled={isOwner}
          onChange={(e) => setJoinCode(e.target.value)}
        />

        <Button
          variant="contained"
          style={{ marginTop: "10px" }}
          disabled={isOwner || joinCode.trim() === ""}
          onClick={() =>
            !isOwner &&
            joinCode.trim() !== "" &&
            handleJoinHousehold()
          }
        >
          Join
        </Button>
      </div>

      {/* Owner Only */}
      {isOwner && (
        <div style={{ marginTop: "40px" }}>
          <h3>Household Controls (Owner Only)</h3>

          {/* Display Join Code */}
          <p>
            Join Code:{" "}
            <strong>{user?.join_code || "N/A"}</strong>
          </p>

          {/* Remove member */}
          <h4>Remove User</h4>

          {members.length > 0 && (
            <select id="removeUserSelect" style={{ width: "100%", padding: "8px" }}>
              {members
              .filter((m) => Number(m.UserID) !== Number(user.id)) 
              .map((m) => (
              <option key={m.UserID} value={m.UserName}>
                {m.DisplayName || m.UserName}
              </option>
              ))}
            </select>
          )}

          <Button variant="contained" style={{ marginTop: "10px" }} onClick={handleRemoveUser}>
            Remove
          </Button>
        </div>
      )}
    </div>
  );
}