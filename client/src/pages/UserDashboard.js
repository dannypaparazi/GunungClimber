import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import DashboardMap from '../components/DashboardMap';
import StarRating from '../components/StarRating';
import '../styles/Dashboard.css';

const API_BASE = 'http://localhost:5001/api';

function parseDateOnly(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

const INVITE_STATUS_LABELS = {
  invited: 'Invited',
  not_interested: 'Not interested',
  interested: 'Interested',
  going: 'Going',
};

function InvitationsSection({ invites, onRespond }) {
  if (invites.length === 0) return null;

  return (
    <div className="invitations-section">
      <h2>Hike Invitations</h2>
      <ul className="friends-list">
        {invites.map((invite) => (
          <li key={invite.invite_id}>
            <span>
              {invite.title} &mdash; {invite.mountain_name}
              <span className="invite-owner"> (invited by {invite.owner_full_name || invite.owner_username})</span>
            </span>
            <div className="friends-list-actions">
              {['not_interested', 'interested', 'going'].map((status) => (
                <button
                  key={status}
                  className={`rsvp-btn rsvp-${status} ${invite.status === status ? 'active' : ''}`}
                  onClick={() => onRespond(invite.invite_id, status)}
                >
                  {INVITE_STATUS_LABELS[status]}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function HikesTab({ itineraries, loading, pins, invites, onDelete, onTogglePublic, onRespondInvite }) {
  return (
    <div className="hikes-layout">
      <div className="hikes-list">
        <InvitationsSection invites={invites} onRespond={onRespondInvite} />

        <div className="section-header">
          <h2>My Hiking Itineraries</h2>
          <Link to="/itinerary/new" className="btn-primary">
            Plan New Hike
          </Link>
        </div>

        {loading ? (
          <p>Loading itineraries...</p>
        ) : itineraries.length === 0 ? (
          <div className="empty-state">
            <p>No itineraries yet. Start planning your first hiking adventure!</p>
          </div>
        ) : (
          <div className="itineraries-grid">
            {itineraries.map((itinerary) => (
              <div key={itinerary.id} className="itinerary-card">
                <div className="itinerary-card-header">
                  <h3>{itinerary.title}</h3>
                  <span className={`privacy-badge ${itinerary.is_public ? 'public' : 'private'}`}>
                    {itinerary.is_public ? 'Public' : 'Private'}
                  </span>
                </div>
                <p className="mountain-name">{itinerary.mountain_name}</p>
                <div className="itinerary-details">
                  <p><strong>Duration:</strong> {new Date(itinerary.start_date).toLocaleDateString()} - {new Date(itinerary.end_date).toLocaleDateString()}</p>
                  <p><strong>Difficulty:</strong> <StarRating value={itinerary.difficulty} readOnly /></p>
                  {itinerary.public_transport_method && (
                    <p><strong>Transport:</strong> {itinerary.public_transport_method}</p>
                  )}
                </div>
                <div className="card-actions">
                  <Link to={`/itinerary/${itinerary.id}`} className="btn-secondary">
                    View & Edit
                  </Link>
                  <button onClick={() => onTogglePublic(itinerary)} className="btn-secondary">
                    {itinerary.is_public ? 'Make Private' : 'Make Public'}
                  </button>
                  <button onClick={() => onDelete(itinerary.id)} className="btn-danger">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="hikes-map">
        <div className="section-header">
          <h2>Hike Map</h2>
        </div>
        <DashboardMap pins={pins} />
      </div>
    </div>
  );
}

function FriendsTab({ friends, requests, users, onSendRequest, onAccept, onRemove }) {
  return (
    <div className="friends-layout">
      {requests.length > 0 && (
        <div className="friends-section">
          <h3>Friend Requests</h3>
          <ul className="friends-list">
            {requests.map((req) => (
              <li key={req.friendship_id}>
                <span>{req.full_name || req.username}</span>
                <div className="friends-list-actions">
                  <button className="btn-secondary" onClick={() => onAccept(req.friendship_id)}>Accept</button>
                  <button className="btn-danger" onClick={() => onRemove(req.friendship_id)}>Decline</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="friends-section">
        <h3>My Friends</h3>
        {friends.length === 0 ? (
          <div className="empty-state"><p>No friends yet. Add some below!</p></div>
        ) : (
          <ul className="friends-list">
            {friends.map((friend) => (
              <li key={friend.friendship_id}>
                <span>{friend.full_name || friend.username}</span>
                <div className="friends-list-actions">
                  <button className="btn-danger" onClick={() => onRemove(friend.friendship_id)}>Remove</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="friends-section">
        <h3>Find People</h3>
        <ul className="friends-list">
          {users.map((user) => (
            <li key={user.id}>
              <span>{user.full_name || user.username}</span>
              <div className="friends-list-actions">
                {user.relationship === 'none' && (
                  <button className="btn-secondary" onClick={() => onSendRequest(user.id)}>Add Friend</button>
                )}
                {user.relationship === 'pending_sent' && <span className="friend-status">Request sent</span>}
                {user.relationship === 'pending_received' && (
                  <button className="btn-secondary" onClick={() => onAccept(user.friendship_id)}>Accept Request</button>
                )}
                {user.relationship === 'friends' && <span className="friend-status">Friends</span>}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function CalendarTab({ itineraries }) {
  const [selectedDate, setSelectedDate] = useState(new Date());

  const hikesByDate = useMemo(() => {
    const map = {};
    itineraries.forEach((itinerary) => {
      const start = parseDateOnly(itinerary.start_date);
      const end = parseDateOnly(itinerary.end_date);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const key = formatDateKey(d);
        if (!map[key]) map[key] = [];
        map[key].push(itinerary);
      }
    });
    return map;
  }, [itineraries]);

  const selectedHikes = hikesByDate[formatDateKey(selectedDate)] || [];

  return (
    <div className="calendar-layout">
      <div className="calendar-widget">
        <Calendar
          value={selectedDate}
          onChange={setSelectedDate}
          tileContent={({ date, view }) =>
            view === 'month' && hikesByDate[formatDateKey(date)] ? <div className="calendar-hike-dot" /> : null
          }
        />
      </div>

      <div className="calendar-details">
        <h3>{selectedDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h3>
        {selectedHikes.length === 0 ? (
          <p className="empty-state">No hikes on this day.</p>
        ) : (
          <ul className="friends-list">
            {selectedHikes.map((hike) => (
              <li key={hike.id}>
                <span>{hike.title} &mdash; {hike.mountain_name}</span>
                <Link to={`/itinerary/${hike.id}`} className="btn-secondary">View</Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function UserDashboard({ onLogout }) {
  const [activeTab, setActiveTab] = useState('hikes');
  const [itineraries, setItineraries] = useState([]);
  const [pins, setPins] = useState([]);
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  useEffect(() => {
    fetchUserProfile();
    fetchItineraries();
    fetchPins();
    fetchFriends();
    fetchFriendRequests();
    fetchUsers();
    fetchInvites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await axios.get(`${API_BASE}/user/profile`, { headers });
      setUserInfo(response.data.user);
    } catch (err) {
      console.error('Failed to load user profile', err);
    }
  };

  const fetchItineraries = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/itinerary`, { headers });
      setItineraries(response.data.itineraries);
    } catch (err) {
      console.error('Failed to load itineraries', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPins = async () => {
    try {
      const response = await axios.get(`${API_BASE}/itinerary/map/pins`, { headers });
      setPins(response.data.pins);
    } catch (err) {
      console.error('Failed to load map pins', err);
    }
  };

  const fetchFriends = async () => {
    try {
      const response = await axios.get(`${API_BASE}/friends`, { headers });
      setFriends(response.data.friends);
    } catch (err) {
      console.error('Failed to load friends', err);
    }
  };

  const fetchFriendRequests = async () => {
    try {
      const response = await axios.get(`${API_BASE}/friends/requests`, { headers });
      setFriendRequests(response.data.requests);
    } catch (err) {
      console.error('Failed to load friend requests', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_BASE}/friends/users`, { headers });
      setUsers(response.data.users);
    } catch (err) {
      console.error('Failed to load users', err);
    }
  };

  const fetchInvites = async () => {
    try {
      const response = await axios.get(`${API_BASE}/itinerary/invites/mine`, { headers });
      setInvites(response.data.invites);
    } catch (err) {
      console.error('Failed to load invites', err);
    }
  };

  const handleRespondInvite = async (inviteId, status) => {
    try {
      await axios.put(`${API_BASE}/itinerary/invites/${inviteId}`, { status }, { headers });
      fetchInvites();
    } catch (err) {
      console.error('Failed to update invite response', err);
    }
  };

  const refreshFriendData = () => {
    fetchFriends();
    fetchFriendRequests();
    fetchUsers();
  };

  const handleDeleteItinerary = async (id) => {
    if (window.confirm('Are you sure you want to delete this itinerary?')) {
      try {
        await axios.delete(`${API_BASE}/itinerary/${id}`, { headers });
        fetchItineraries();
        fetchPins();
      } catch (err) {
        console.error('Failed to delete itinerary', err);
      }
    }
  };

  const handleTogglePublic = async (itinerary) => {
    try {
      await axios.put(`${API_BASE}/itinerary/${itinerary.id}`, { ...itinerary, is_public: !itinerary.is_public }, { headers });
      fetchItineraries();
      fetchPins();
    } catch (err) {
      console.error('Failed to update itinerary privacy', err);
    }
  };

  const handleSendRequest = async (userId) => {
    try {
      await axios.post(`${API_BASE}/friends/request`, { addressee_id: userId }, { headers });
      refreshFriendData();
    } catch (err) {
      console.error('Failed to send friend request', err);
    }
  };

  const handleAcceptRequest = async (friendshipId) => {
    try {
      await axios.post(`${API_BASE}/friends/${friendshipId}/accept`, {}, { headers });
      refreshFriendData();
    } catch (err) {
      console.error('Failed to accept friend request', err);
    }
  };

  const handleRemoveFriendship = async (friendshipId) => {
    try {
      await axios.delete(`${API_BASE}/friends/${friendshipId}`, { headers });
      refreshFriendData();
    } catch (err) {
      console.error('Failed to remove friendship', err);
    }
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Welcome, {userInfo?.full_name || userInfo?.username}</h1>
          <button onClick={() => { onLogout(); navigate('/login'); }} className="btn-logout">
            Logout
          </button>
        </div>
      </header>

      <div className="dashboard-tabs">
        <button
          className={`dashboard-tab ${activeTab === 'hikes' ? 'active' : ''}`}
          onClick={() => setActiveTab('hikes')}
        >
          Hikes
        </button>
        <button
          className={`dashboard-tab ${activeTab === 'friends' ? 'active' : ''}`}
          onClick={() => setActiveTab('friends')}
        >
          Friends
        </button>
        <button
          className={`dashboard-tab ${activeTab === 'calendar' ? 'active' : ''}`}
          onClick={() => setActiveTab('calendar')}
        >
          Calendar
        </button>
      </div>

      <div className="dashboard-content">
        <div className="section">
          {activeTab === 'hikes' && (
            <HikesTab
              itineraries={itineraries}
              loading={loading}
              pins={pins}
              invites={invites}
              onDelete={handleDeleteItinerary}
              onTogglePublic={handleTogglePublic}
              onRespondInvite={handleRespondInvite}
            />
          )}
          {activeTab === 'friends' && (
            <FriendsTab
              friends={friends}
              requests={friendRequests}
              users={users}
              onSendRequest={handleSendRequest}
              onAccept={handleAcceptRequest}
              onRemove={handleRemoveFriendship}
            />
          )}
          {activeTab === 'calendar' && <CalendarTab itineraries={itineraries} />}
        </div>
      </div>
    </div>
  );
}

export default UserDashboard;
