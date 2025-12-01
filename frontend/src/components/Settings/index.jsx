import React, { useState, useEffect, useCallback } from "react";
import React, { useState, useEffect, useCallback } from "react";
import { TextField, Button, Tabs, Tab, Box } from "@mui/material";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useCurrentUser, CURRENT_USER_QUERY_KEY } from "../../hooks/useCurrentUser";
import { useQueryClient } from "@tanstack/react-query";
import { useCurrentUser, CURRENT_USER_QUERY_KEY } from "../../hooks/useCurrentUser";

export default function Settings() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isLoading, refreshUser } = useCurrentUser();
  const queryClient = useQueryClient();
  const { user, isLoading, refreshUser } = useCurrentUser();
  const isOwner = user?.role === "owner";

  const [displayName, setDisplayName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");

  const [joinCode, setJoinCode] = useState('');

  const [householdName, setHouseholdName] = useState('');

  const [members, setMembers] = useState([]);
  const [confirmUsername, setConfirmUsername] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const [currentTab, setCurrentTab] = useState(0);

  useEffect(() => {
    setDisplayName(user?.display_name || "");
  }, [user?.display_name]);

  useEffect(() => {
    setDisplayName(user?.display_name || "");
  }, [user?.display_name]);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate({ to: "/login" });
    }
  }, [isLoading, navigate, user]);

  const loadMembers = useCallback(async () => {
    if (!isOwner || !user?.household_id) {
      setMembers([]);
      return;
    }
    if (!isLoading && !user) {
      navigate({ to: "/login" });
    }
  }, [isLoading, navigate, user]);

  const loadMembers = useCallback(async () => {
    if (!isOwner || !user?.household_id) {
      setMembers([]);
      return;
    }

    try {
      const res = await fetch(`/api/auth/members/${user.household_id}`, {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("Failed to fetch members");
      }
    try {
      const res = await fetch(`/api/auth/members/${user.household_id}`, {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("Failed to fetch members");
      }
      const data = await res.json();
      setMembers(data.members || []);
    } catch (error) {
      setMembers([]);
    } catch (error) {
      setMembers([]);
    }
  }, [isOwner, user?.household_id]);
  }, [isOwner, user?.household_id]);

  useEffect(() => {
  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  async function handleSaveName() {
    if (!user?.id) return;
    const res = await fetch("/api/auth/update-profile", {
    if (!user?.id) return;
    const res = await fetch("/api/auth/update-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      credentials: "include",
      body: JSON.stringify({
        user_id: user.id,
        display_name: displayName,
      }),
    });

    const data = await res.json();
    if (!res.ok) return alert(data.error || 'Error');

    await refreshUser();
    await refreshUser();
    alert("Display name updated!");
  }

  async function handleUpdatePassword() {
    if (!user?.id) return;
    const res = await fetch("/api/auth/update-profile", {
    if (!user?.id) return;
    const res = await fetch("/api/auth/update-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      credentials: "include",
      body: JSON.stringify({
        user_id: user.id,
        old_password: oldPw,
        new_password: newPw,
      }),
    });

    const data = await res.json();
    if (!res.ok) return alert(data.error || 'Error');

    alert('Password updated!');
    setOldPw('');
    setNewPw('');
  }

  async function handleJoinHousehold() {
    if (!user?.id) return;
    const res = await fetch("/api/auth/join-household", {
    if (!user?.id) return;
    const res = await fetch("/api/auth/join-household", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      credentials: "include",
      body: JSON.stringify({
        user_id: user.id,
        join_code: joinCode,
      }),
    });

    const data = await res.json();
    if (!res.ok) return alert(data.error || 'Error');

    await refreshUser();
    await loadMembers();
    setJoinCode("");
    await refreshUser();
    await loadMembers();
    setJoinCode("");
    alert("Joined household!");
  }

  async function handleCreateHousehold() {
    if (!user?.id) return;
    const res = await fetch("/api/auth/create-household", {
    if (!user?.id) return;
    const res = await fetch("/api/auth/create-household", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      credentials: "include",
      body: JSON.stringify({
        user_id: user.id,
        household_name: householdName || null,
      }),
    });

    const data = await res.json();
    if (!res.ok) return alert(data.error || 'Error');

    await refreshUser();
    await loadMembers();
    setHouseholdName("");
    await refreshUser();
    await loadMembers();
    setHouseholdName("");
    alert("Household created successfully!");
  }

  async function handleRemoveUser() {
    const dropdown = document.getElementById('removeUserSelect');
    const username = dropdown.value;

    if (!username) return alert('Select a member');

    const res = await fetch("/api/auth/remove-member", {
    const res = await fetch("/api/auth/remove-member", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      credentials: "include",
      body: JSON.stringify({ username }),
    });

    const data = await res.json();
    if (!res.ok) return alert(data.error || 'Error');

    await loadMembers();
    await refreshUser();
    await loadMembers();
    await refreshUser();
    alert(`User "${username}" removed.`);
  }

  async function handleDeleteAccount() {
    if (!user?.id) return;

    if (confirmUsername.trim() !== user?.username) {
      return alert('Type your username to confirm deletion.');
    }

    const confirmed = window.confirm('Are you sure? This will permanently delete your account.');

    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const res = await fetch(
        `/api/auth/account/${user.id}`,
        `/api/auth/account/${user.id}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ confirm_username: confirmUsername.trim() }),
        }
      );

      const data = await res.json();
      if (!res.ok) {
        return alert(data.error || 'Failed to delete account');
      }

      queryClient.setQueryData(CURRENT_USER_QUERY_KEY, null);
      queryClient.setQueryData(CURRENT_USER_QUERY_KEY, null);
      alert("Account deleted!");
      navigate({ to: "/login" });
    } catch (error) {
      alert('Network error');
    } finally {
      setIsDeleting(false);
    }
  }


  if (isLoading || !user) {
    return null;
  }

  if (isLoading || !user) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflowY: 'auto',
        overflowX: 'hidden',
        backgroundColor: '#f5f5f5',
      }}
    >
      <div
        className='settings-page'
        style={{
          padding: '20px',
          maxWidth: '900px',
          margin: '0 auto',
          paddingTop: '80px',
          minHeight: '100vh',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>Settings</h2>
          <Button variant='outlined' onClick={() => navigate({ to: '/dashboard' })}>
            Back to Dashboard
          </Button>
        </div>

        <Tabs value={currentTab} onChange={(e, newValue) => setCurrentTab(newValue)} sx={{ marginBottom: '30px' }}>
          <Tab label='Personal Settings' />
          <Tab label='Household Management' />
        </Tabs>

        {/* Personal Settings Tab */}
        {currentTab === 0 && (
          <Box>
            <div style={{ marginBottom: '30px' }}>
              <h3>Display Name</h3>
              <TextField fullWidth value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
              <Button className='button' variant='contained' style={{ marginTop: '10px' }} onClick={handleSaveName}>
                Save
              </Button>
            </div>

            <div style={{ marginBottom: '30px' }}>
              <h3>Change Password</h3>
              <TextField
                type='password'
                fullWidth
                placeholder='Old Password'
                value={oldPw}
                onChange={(e) => setOldPw(e.target.value)}
              />
              <TextField
                type='password'
                fullWidth
                placeholder='New Password'
                style={{ marginTop: '10px' }}
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
              />
              <Button
                className='button'
                variant='contained'
                style={{ marginTop: '10px' }}
                onClick={handleUpdatePassword}
              >
                Update
              </Button>
            </div>

            <div
              style={{
                marginBottom: '30px',
                border: '1px solid #f44336',
                borderRadius: '8px',
                padding: '20px',
                backgroundColor: '#fff5f5',
              }}
            >
              <h3 style={{ color: '#d32f2f' }}>Delete Account Permanently</h3>
              <p style={{ color: '#555' }}>Account deletion is permanent and cannot be undone.</p>
              <TextField
                fullWidth
                label='Type your username to confirm'
                value={confirmUsername}
                onChange={(e) => setConfirmUsername(e.target.value)}
                sx={{ marginTop: '10px' }}
              />
              <Button
                className='button'
                variant='contained'
                color='error'
                style={{ marginTop: '10px' }}
                disabled={confirmUsername.trim() !== (user?.username || '') || isDeleting}
                onClick={handleDeleteAccount}
              >
                {isDeleting ? 'Deleting...' : 'Delete Account'}
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
                <div style={{ marginBottom: '30px' }}>
                  <h3>Create New Household</h3>
                  <TextField
                    fullWidth
                    label='Household Name (Optional)'
                    value={householdName}
                    onChange={(e) => setHouseholdName(e.target.value)}
                    sx={{ marginBottom: '10px' }}
                  />
                  <Button className='button' variant='contained' onClick={handleCreateHousehold}>
                    Create Household
                  </Button>
                </div>

                <div style={{ marginBottom: '30px' }}>
                  <h3>Join Existing Household</h3>
                  <TextField
                    fullWidth
                    placeholder='Enter Join Code'
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    sx={{ marginBottom: '10px' }}
                  />
                  <Button
                    className='button'
                    variant='contained'
                    disabled={joinCode.trim() === ''}
                    onClick={handleJoinHousehold}
                  >
                    Join Household
                  </Button>
                </div>
              </>
            ) : (
              // Has household - show management options
              <>
                {/* Create/Join options - available for both owner and member */}
                <div style={{ marginBottom: '30px' }}>
                  <h3>Create New Household</h3>
                  <p style={{ color: 'gray', marginBottom: '10px' }}>
                    Creating a new household will automatically remove you from your current household.
                  </p>
                  <TextField
                    fullWidth
                    label='Household Name (Optional)'
                    value={householdName}
                    onChange={(e) => setHouseholdName(e.target.value)}
                    sx={{ marginBottom: '10px' }}
                  />
                  <Button className='button' variant='contained' onClick={handleCreateHousehold}>
                    Create Household
                  </Button>
                </div>

                <div style={{ marginBottom: '30px' }}>
                  <h3>Join Another Household</h3>
                  <p style={{ color: 'gray', marginBottom: '10px' }}>
                    Joining a new household will automatically remove you from your current household.
                  </p>
                  <TextField
                    fullWidth
                    placeholder='Enter Join Code'
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    sx={{ marginBottom: '10px' }}
                  />
                  <Button
                    className='button'
                    variant='contained'
                    disabled={joinCode.trim() === ''}
                    onClick={handleJoinHousehold}
                  >
                    Join
                  </Button>
                </div>

                {/* Owner Only */}
                {isOwner && (
                  <div style={{ marginTop: '40px' }}>
                    <h3>Household Controls (Owner Only)</h3>

                    <p>
                      Join Code: <strong>{user?.join_code || 'N/A'}</strong>
                    </p>

                    <h4>Remove User</h4>
                    {members.length > 0 && (
                      <select id='removeUserSelect' style={{ width: '100%', padding: '8px' }}>
                        {members
                          .filter((m) => Number(m.UserID) !== Number(user.id))
                          .map((m) => (
                            <option key={m.UserID} value={m.UserName}>
                              {m.DisplayName || m.UserName}
                            </option>
                          ))}
                      </select>
                    )}

                    <Button
                      className='button'
                      variant='contained'
                      style={{ marginTop: '10px' }}
                      onClick={handleRemoveUser}
                    >
                      Remove
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
