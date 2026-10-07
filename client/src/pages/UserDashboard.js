import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { auth } from '../firebase';
import {
  getUserProfile,
  getMyItineraries,
  getMapPins,
  getMyFriends,
  getIncomingFriendRequests,
  getUserDirectory,
  getMyInvites,
  respondToInvite,
  deleteItinerary,
  updateItinerary,
  sendFriendRequest,
  acceptFriendship,
  removeFriendship,
  getUserMakanSpots,
  addMakanSpot,
  deleteMakanSpot,
} from '../firestoreApi';
import DashboardMap from '../components/DashboardMap';
import MapPicker from '../components/MapPicker';
import StarRating from '../components/StarRating';
import makanSpots from '../data/makanSpots';
import '../styles/Dashboard.css';

const MAKAN_REGIONS = ['Peninsular Malaysia', 'Sabah', 'Sarawak', 'Singapore'];

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

function HikesTab({ itineraries, loading, pins, invites, userMakanSpots, onDelete, onTogglePublic, onRespondInvite }) {
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
        <DashboardMap pins={pins} userMakanSpots={userMakanSpots} />
      </div>
    </div>
  );
}

const FRIEND_TYPE_LABELS = {
  hike: 'Hike Friend',
  makan: 'Makan Friend',
};

function FriendsTab({ friends, requests, users, onSendRequest, onAccept, onRemove }) {
  const hikeFriends = friends.filter((f) => f.friend_type !== 'makan');
  const makanFriends = friends.filter((f) => f.friend_type === 'makan');

  return (
    <div className="friends-layout">
      {requests.length > 0 && (
        <div className="friends-section">
          <h3>Friend Requests</h3>
          <ul className="friends-list">
            {requests.map((req) => (
              <li key={req.friendship_id}>
                <span>
                  {req.full_name || req.username}
                  <span className={`friend-type-badge friend-type-${req.friend_type}`}>
                    {FRIEND_TYPE_LABELS[req.friend_type]}
                  </span>
                </span>
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
        <h3>Hike Friends</h3>
        {hikeFriends.length === 0 ? (
          <div className="empty-state"><p>No hike friends yet. Add some below!</p></div>
        ) : (
          <ul className="friends-list">
            {hikeFriends.map((friend) => (
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
        <h3>Makan Friends</h3>
        {makanFriends.length === 0 ? (
          <div className="empty-state"><p>No makan friends yet. Add some below!</p></div>
        ) : (
          <ul className="friends-list">
            {makanFriends.map((friend) => (
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
                  <>
                    <button className="btn-secondary" onClick={() => onSendRequest(user.id, 'hike')}>Add as Hike Friend</button>
                    <button className="btn-secondary" onClick={() => onSendRequest(user.id, 'makan')}>Add as Makan Friend</button>
                  </>
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

function MakanTab({ userSpots, currentUid, onAddSpot, onDeleteSpot }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    specialty: '',
    description: '',
    region: MAKAN_REGIONS[0],
    lat: null,
    lng: null,
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePinChange = (lat, lng) => {
    setFormData((prev) => ({ ...prev, lat, lng }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.lat == null || formData.lng == null) {
      setError('Pick a location on the map below');
      return;
    }

    setSubmitting(true);
    try {
      await onAddSpot(formData);
      setFormData({
        name: '',
        location: '',
        specialty: '',
        description: '',
        region: MAKAN_REGIONS[0],
        lat: null,
        lng: null,
      });
      setShowForm(false);
    } catch (err) {
      console.error('Failed to add makan spot', err);
      setError('Failed to add makan spot');
    } finally {
      setSubmitting(false);
    }
  };

  const userSpotsByRegion = {};
  userSpots.forEach((spot) => {
    const region = spot.region || 'Other';
    (userSpotsByRegion[region] = userSpotsByRegion[region] || []).push(spot);
  });

  return (
    <div className="makan-layout">
      <div className="makan-add-section">
        <div className="section-header">
          <h2>Community Makan Spots</h2>
          <button type="button" className="btn-primary" onClick={() => setShowForm((v) => !v)}>
            {showForm ? 'Cancel' : 'Add Makan Spot'}
          </button>
        </div>

        {showForm && (
          <form className="makan-add-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="makan-name">Name</label>
                <input
                  id="makan-name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Restoran Yut Kee"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="makan-location">Location</label>
                <input
                  id="makan-location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g. Kuala Lumpur"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="makan-specialty">Specialty</label>
                <input
                  id="makan-specialty"
                  name="specialty"
                  value={formData.specialty}
                  onChange={handleChange}
                  placeholder="e.g. Roti babi, kaya toast"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="makan-region">Region</label>
                <select id="makan-region" name="region" value={formData.region} onChange={handleChange}>
                  {MAKAN_REGIONS.map((region) => (
                    <option key={region} value={region}>{region}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="makan-description">Description</label>
              <textarea
                id="makan-description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="What makes it worth the trip?"
                required
              />
            </div>

            <div className="form-group">
              <label>Pin Location on Map</label>
              <MapPicker latitude={formData.lat} longitude={formData.lng} onChange={handlePinChange} />
            </div>

            {error && <div className="error-message">{error}</div>}

            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Adding...' : 'Add Makan Spot'}
            </button>
          </form>
        )}
      </div>

      {Object.entries(makanSpots).map(([region, spots]) => (
        <div key={region} className="makan-region">
          <h3>{region}</h3>
          <div className="makan-grid">
            {spots.map((spot) => (
              <div key={spot.id} className="makan-card">
                <h4>{spot.name}</h4>
                <p className="makan-location">{spot.location}</p>
                <p className="makan-specialty">{spot.specialty}</p>
                <p>{spot.description}</p>
              </div>
            ))}
          </div>
        </div>
      ))}

      {Object.entries(userSpotsByRegion).map(([region, spots]) => (
        <div key={`user-${region}`} className="makan-region">
          <h3>{region} <span className="makan-region-badge">Community-added</span></h3>
          <div className="makan-grid">
            {spots.map((spot) => (
              <div key={spot.id} className="makan-card">
                <h4>{spot.name}</h4>
                <p className="makan-location">{spot.location}</p>
                <p className="makan-specialty">{spot.specialty}</p>
                <p>{spot.description}</p>
                {spot.added_by === currentUid && (
                  <button type="button" className="btn-danger" onClick={() => onDeleteSpot(spot.id)}>
                    Delete
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
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
  const [userMakanSpots, setUserMakanSpots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState(null);
  const navigate = useNavigate();
  const uid = auth.currentUser.uid;

  useEffect(() => {
    fetchUserProfile();
    fetchItineraries();
    fetchPins();
    fetchFriends();
    fetchFriendRequests();
    fetchUsers();
    fetchInvites();
    fetchUserMakanSpots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUserProfile = async () => {
    try {
      setUserInfo(await getUserProfile(uid));
    } catch (err) {
      console.error('Failed to load user profile', err);
    }
  };

  const fetchItineraries = async () => {
    try {
      setLoading(true);
      setItineraries(await getMyItineraries(uid));
    } catch (err) {
      console.error('Failed to load itineraries', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPins = async () => {
    try {
      setPins(await getMapPins(uid));
    } catch (err) {
      console.error('Failed to load map pins', err);
    }
  };

  const fetchFriends = async () => {
    try {
      setFriends(await getMyFriends(uid));
    } catch (err) {
      console.error('Failed to load friends', err);
    }
  };

  const fetchFriendRequests = async () => {
    try {
      setFriendRequests(await getIncomingFriendRequests(uid));
    } catch (err) {
      console.error('Failed to load friend requests', err);
    }
  };

  const fetchUsers = async () => {
    try {
      setUsers(await getUserDirectory(uid));
    } catch (err) {
      console.error('Failed to load users', err);
    }
  };

  const fetchInvites = async () => {
    try {
      setInvites(await getMyInvites(uid));
    } catch (err) {
      console.error('Failed to load invites', err);
    }
  };

  const fetchUserMakanSpots = async () => {
    try {
      setUserMakanSpots(await getUserMakanSpots());
    } catch (err) {
      console.error('Failed to load community makan spots', err);
    }
  };

  const handleAddMakanSpot = async (spot) => {
    await addMakanSpot(uid, spot);
    fetchUserMakanSpots();
  };

  const handleDeleteMakanSpot = async (spotId) => {
    try {
      await deleteMakanSpot(spotId);
      fetchUserMakanSpots();
    } catch (err) {
      console.error('Failed to delete makan spot', err);
    }
  };

  const handleRespondInvite = async (inviteId, status) => {
    try {
      await respondToInvite(inviteId, status);
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
        await deleteItinerary(id);
        fetchItineraries();
        fetchPins();
      } catch (err) {
        console.error('Failed to delete itinerary', err);
      }
    }
  };

  const handleTogglePublic = async (itinerary) => {
    try {
      await updateItinerary(itinerary.id, { ...itinerary, is_public: !itinerary.is_public });
      fetchItineraries();
      fetchPins();
    } catch (err) {
      console.error('Failed to update itinerary privacy', err);
    }
  };

  const handleSendRequest = async (userId, friendType) => {
    try {
      await sendFriendRequest(uid, userId, friendType);
      refreshFriendData();
    } catch (err) {
      console.error('Failed to send friend request', err);
    }
  };

  const handleAcceptRequest = async (friendshipId) => {
    try {
      await acceptFriendship(friendshipId);
      refreshFriendData();
    } catch (err) {
      console.error('Failed to accept friend request', err);
    }
  };

  const handleRemoveFriendship = async (friendshipId) => {
    try {
      await removeFriendship(friendshipId);
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
        <button
          className={`dashboard-tab ${activeTab === 'makan' ? 'active' : ''}`}
          onClick={() => setActiveTab('makan')}
        >
          Makan
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
              userMakanSpots={userMakanSpots}
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
          {activeTab === 'makan' && (
            <MakanTab
              userSpots={userMakanSpots}
              currentUid={uid}
              onAddSpot={handleAddMakanSpot}
              onDeleteSpot={handleDeleteMakanSpot}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default UserDashboard;
