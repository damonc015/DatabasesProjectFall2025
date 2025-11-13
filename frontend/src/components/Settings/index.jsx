import React, { useState, useEffect } from "react";
import { TextField, Button, Tabs, Tab, Box } from "@mui/material";

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
  
  // create household
  const [householdName, setHouseholdName] = useState("");

  // members (only for owner)
  const [members, setMembers] = useState([]);
  
  // tab state
  const [currentTab, setCurrentTab] = useState(0);

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
    stored.user.household = data.household_name;
    stored.user.role = "member";
    localStorage.setItem("user", JSON.stringify(stored));
    localStorage.setItem("hasSeenWelcome", "true"); // Mark as seen

    alert("Joined household!");
    window.location.reload();
  }

  async function handleCreateHousehold() {
    const res = await fetch("http://localhost:5001/api/auth/create-household", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: user.id,
        household_name: householdName || null,
      }),
    });

    const data = await res.json();
    if (!res.ok) return alert(data.error || "Error");

    // Update localStorage
    stored.user.household_id = data.household.household_id;
    stored.user.household = data.household.household_name;
    stored.user.join_code = data.household.join_code;
    stored.user.role = "owner";
    localStorage.setItem("user", JSON.stringify(stored));
    localStorage.setItem("hasSeenWelcome", "true"); // Mark as seen

    alert("Household created successfully!");
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

  async function handleDissolveHousehold() {
    if (!window.confirm("Are you sure you want to remove all members from this household? This cannot be undone.")) {
      return;
    }
  
    const res = await fetch("http://localhost:5001/api/auth/dissolve-household", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: user.id }),
    });
  
    const data = await res.json();
    if (!res.ok) return alert(data.error || "Error");
  
    alert("All members removed from household.");

    // clear data for local storage user and reset role to member
    stored.user.household_id = null;
    stored.user.join_code = null;
    stored.user.role = "member"; // Reset role from owner to member
    localStorage.setItem("user", JSON.stringify(stored));

    window.location.reload();
  }

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      overflowY: "auto",
      overflowX: "hidden",
      backgroundColor: "#f5f5f5"
    }}>
      <div className="settings-page" style={{ 
        padding: "20px", 
        maxWidth: "900px", 
        margin: "0 auto",
        paddingTop: "80px",
        minHeight: "100vh"
      }}>
        <h2>Settings</h2>

        <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)} sx={{ marginBottom: "30px" }}>
          <Tab label="Personal Settings" />
          <Tab label="Household Management" />
        </Tabs>

        {/* Personal Settings Tab */}
        {currentTab === 0 && (
          <Box>
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
          </Box>
        )}

        {/* Household Management Tab */}
        {currentTab === 1 && (
          <Box>
            {!user?.household_id ? (
              // No household - show create/join options
              <>
                <div style={{ marginBottom: "30px" }}>
                  <h3>Create New Household</h3>
                  <TextField
                    fullWidth
                    label="Household Name (Optional)"
                    value={householdName}
                    onChange={(e) => setHouseholdName(e.target.value)}
                    sx={{ marginBottom: "10px" }}
                  />
                  <Button
                    variant="contained"
                    onClick={handleCreateHousehold}
                  >
                    Create Household
                  </Button>
                </div>

                <div style={{ marginBottom: "30px" }}>
                  <h3>Join Existing Household</h3>
                  <TextField
                    fullWidth
                    placeholder="Enter Join Code"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    sx={{ marginBottom: "10px" }}
                  />
                  <Button
                    variant="contained"
                    color="secondary"
                    disabled={joinCode.trim() === ""}
                    onClick={handleJoinHousehold}
                  >
                    Join Household
                  </Button>
                </div>
              </>
            ) : (
              // Has household - show management options
              <>
                {isOwner && (
                  // Owner: show create/join sections but disabled
                  <>
                    <div style={{ marginBottom: "30px" }}>
                      <h3>Create New Household</h3>
                      <TextField
                        fullWidth
                        value={householdName}
                        disabled={true}
                        placeholder="Owner cannot create a new household"
                        sx={{ marginBottom: "10px" }}
                      />
                      <Button
                        variant="contained"
                        disabled={true}
                      >
                        Create Household
                      </Button>
                    </div>

                    <div style={{ marginBottom: "30px" }}>
                      <h3>Join Existing Household</h3>
                      <TextField
                        fullWidth
                        placeholder="Owner cannot join another household"
                        value={joinCode}
                        disabled={true}
                        sx={{ marginBottom: "10px" }}
                      />
                      <Button
                        variant="contained"
                        color="secondary"
                        disabled={true}
                      >
                        Join Household
                      </Button>
                    </div>
                  </>
                )}

                {!isOwner && (
                  <div style={{ marginBottom: "30px" }}>
                    <h3>Join Another Household</h3>
                    <TextField
                      fullWidth
                      placeholder="Enter Join Code"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value)}
                      sx={{ marginBottom: "10px" }}
                    />
                    <Button
                      variant="contained"
                      disabled={joinCode.trim() === ""}
                      onClick={handleJoinHousehold}
                    >
                      Join
                    </Button>
                  </div>
                )}

                {/* Owner Only */}
                {isOwner && (
                  <div style={{ marginTop: "40px" }}>
                    <h3>Household Controls (Owner Only)</h3>

                    <p>
                      Join Code:{" "}
                      <strong>{user?.join_code || "N/A"}</strong>
                    </p>

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

                    <h4 style={{ marginTop: "30px", color: "red" }}>Dissolve Household</h4>
                    <p style={{ color: "gray", marginBottom: "10px" }}>
                      This action cannot be undone. All members will be removed from the household.
                    </p>

                    <Button
                      variant="contained"
                      color="error"
                      onClick={handleDissolveHousehold}
                    >
                      Dissolve Household
                    </Button>
                  </div>
                )}
              </>
            )}
          </Box>
        )}
      </div>
    </div>
  );
}