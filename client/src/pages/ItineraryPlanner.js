import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import MapPicker from '../components/MapPicker';
import StarRating from '../components/StarRating';
import '../styles/ItineraryPlanner.css';

function ItineraryPlanner({ onLogout }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [formData, setFormData] = useState({
    title: '',
    mountain_name: '',
    start_date: '',
    end_date: '',
    difficulty: 3,
    description: '',
    public_transport_method: '',
    meeting_point: '',
    meeting_lat: null,
    meeting_lng: null,
    is_public: false,
  });
  const [error, setError] = useState('');
  const [isCustomMountain, setIsCustomMountain] = useState(false);
  const [friends, setFriends] = useState([]);
  const [invites, setInvites] = useState([]);

  const INVITE_STATUS_LABELS = {
    invited: 'Invited',
    not_interested: 'Not interested',
    interested: 'Interested',
    going: 'Going',
  };

  const malaysianMountainsByRegion = {
    'Peninsular Malaysia': [
      'Gunung Tahan',
      'Gunung Korbu',
      'Gunung Yong Belar',
      'Gunung Chamah',
      'Gunung Gayong',
      'Gunung Ledang',
      'Gunung Irau',
      'Gunung Ulu Sepat',
      'Gunung Berembun',
      'Gunung Jerai',
      'Gunung Benom',
      'Gunung Nuang',
      'Gunung Bunga Buah',
      'Gunung Angsi',
      'Gunung Datuk',
      'Gunung Stong',
      'Gunung Brinchang',
      'Gunung Bubu',
      'Gunung Semangkok',
    ],
    Sabah: [
      'Gunung Kinabalu',
      'Gunung Tambuyukon',
      'Gunung Trus Madi',
      'Gunung Alab',
      'Gunung Lotung',
      'Gunung Silam',
      'Gunung Madalon',
    ],
    Sarawak: [
      'Gunung Mulu',
      'Gunung Api',
      'Gunung Benarat',
      'Gunung Murud',
      'Gunung Santubong',
      'Gunung Gading',
      'Bukit Batu Lawi',
    ],
  };

  const allMountains = Object.values(malaysianMountainsByRegion).flat();
  const OTHER_MOUNTAIN = '__other__';

  const publicTransportOptions = [
    'Bus',
    'Train',
    'Taxi/Grab',
    'Combined (Bus + Train)',
    'Self Drive',
  ];

  useEffect(() => {
    if (id) {
      fetchItinerary();
      fetchFriends();
      fetchInvites();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchItinerary = async () => {
    try {
      const response = await axios.get(`http://localhost:5001/api/itinerary/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFormData(response.data.itinerary);
      if (response.data.itinerary.mountain_name && !allMountains.includes(response.data.itinerary.mountain_name)) {
        setIsCustomMountain(true);
      }
    } catch (err) {
      setError('Failed to load itinerary');
    }
  };

  const fetchFriends = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/friends', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFriends(response.data.friends);
    } catch (err) {
      console.error('Failed to load friends', err);
    }
  };

  const fetchInvites = async () => {
    try {
      const response = await axios.get(`http://localhost:5001/api/itinerary/${id}/invites`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setInvites(response.data.invites);
    } catch (err) {
      console.error('Failed to load invites', err);
    }
  };

  const handleInviteFriend = async (friendId) => {
    try {
      await axios.post(
        `http://localhost:5001/api/itinerary/${id}/invites`,
        { friend_id: friendId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchInvites();
    } catch (err) {
      console.error('Failed to invite friend', err);
    }
  };

  const handleRemoveInvite = async (inviteId) => {
    try {
      await axios.delete(`http://localhost:5001/api/itinerary/invites/${inviteId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchInvites();
    } catch (err) {
      console.error('Failed to remove invite', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handlePinChange = (lat, lng) => {
    setFormData((prev) => ({ ...prev, meeting_lat: lat, meeting_lng: lng }));
  };

  const handleMountainSelectChange = (e) => {
    const { value } = e.target;
    if (value === OTHER_MOUNTAIN) {
      setIsCustomMountain(true);
      setFormData((prev) => ({ ...prev, mountain_name: '' }));
    } else {
      setIsCustomMountain(false);
      setFormData((prev) => ({ ...prev, mountain_name: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (id) {
        await axios.put(`http://localhost:5001/api/itinerary/${id}`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        navigate('/dashboard');
      } else {
        const response = await axios.post('http://localhost:5001/api/itinerary', formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        navigate(`/itinerary/${response.data.itinerary.id}`);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save itinerary');
    }
  };

  return (
    <div className="planner-container">
      <header className="planner-header">
        <h1>{id ? 'Edit Itinerary' : 'Plan Your Hike'}</h1>
        <button onClick={() => { onLogout(); navigate('/login'); }} className="btn-logout">
          Logout
        </button>
      </header>

      <div className="planner-content planner-layout">
        <div className="planner-form-column">
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="itinerary-form">
          <div className="form-section">
            <h3>Basic Information</h3>

            <div className="form-group">
              <label htmlFor="title">Itinerary Title</label>
              <input
                id="title"
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="e.g., Kinabalu Challenge 2024"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="mountain_name">Mountain</label>
                <select
                  id="mountain_name"
                  name="mountain_name"
                  value={isCustomMountain ? OTHER_MOUNTAIN : formData.mountain_name}
                  onChange={handleMountainSelectChange}
                  required={!isCustomMountain}
                >
                  <option value="">Select a mountain</option>
                  {Object.entries(malaysianMountainsByRegion).map(([region, mountains]) => (
                    <optgroup key={region} label={region}>
                      {mountains.map((mountain) => (
                        <option key={mountain} value={mountain}>
                          {mountain}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                  <option value={OTHER_MOUNTAIN}>Other (please specify)</option>
                </select>
                {isCustomMountain && (
                  <input
                    type="text"
                    name="mountain_name"
                    value={formData.mountain_name}
                    onChange={handleInputChange}
                    placeholder="Enter mountain name"
                    required
                    style={{ marginTop: '0.5rem' }}
                  />
                )}
              </div>

              <div className="form-group">
                <label htmlFor="difficulty">Difficulty Level</label>
                <div id="difficulty">
                  <StarRating
                    value={formData.difficulty}
                    onChange={(star) => setFormData((prev) => ({ ...prev, difficulty: star }))}
                  />
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="start_date">Start Date</label>
                <input
                  id="start_date"
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="end_date">End Date</label>
                <input
                  id="end_date"
                  type="date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="privacy-toggle">
                <input
                  type="checkbox"
                  name="is_public"
                  checked={!!formData.is_public}
                  onChange={(e) => setFormData((prev) => ({ ...prev, is_public: e.target.checked }))}
                />
                Make this hike public
              </label>
              <p className="privacy-toggle-hint">
                {formData.is_public
                  ? 'Visible on the shared map for all users to see.'
                  : 'Private — only visible on your own map.'}
              </p>
            </div>
          </div>

          <div className="form-section">
            <h3>Transportation & Location</h3>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="public_transport_method">Transport Method</label>
                <select
                  id="public_transport_method"
                  name="public_transport_method"
                  value={formData.public_transport_method}
                  onChange={handleInputChange}
                >
                  <option value="">Select method</option>
                  {publicTransportOptions.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="meeting_point">Meeting Point</label>
                <input
                  id="meeting_point"
                  type="text"
                  name="meeting_point"
                  value={formData.meeting_point}
                  onChange={handleInputChange}
                  placeholder="e.g., KL Sentral Station"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Pin Meeting Point on Map</label>
              <MapPicker
                latitude={formData.meeting_lat}
                longitude={formData.meeting_lng}
                onChange={handlePinChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description & Notes</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Add any additional details about your hiking plan..."
                rows="4"
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary">
              {id ? 'Update Itinerary' : 'Create Itinerary'}
            </button>
            <button type="button" onClick={() => navigate('/dashboard')} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
        </div>

        <div className="invite-column">
          <h3>Invite Friends</h3>
          {!id ? (
            <p className="invite-hint">Save this hike first, then invite friends to join.</p>
          ) : friends.length === 0 ? (
            <p className="invite-hint">Add some friends first to invite them on a hike.</p>
          ) : (
            <ul className="invite-list">
              {friends.map((friend) => {
                const invite = invites.find((inv) => inv.invitee_id === friend.id);
                return (
                  <li key={friend.friendship_id}>
                    <span className="invite-friend-name">{friend.full_name || friend.username}</span>
                    {invite ? (
                      <div className="invite-status-row">
                        <span className={`invite-status-badge status-${invite.status}`}>
                          {INVITE_STATUS_LABELS[invite.status]}
                        </span>
                        <button type="button" className="btn-danger" onClick={() => handleRemoveInvite(invite.id)}>
                          Uninvite
                        </button>
                      </div>
                    ) : (
                      <button type="button" className="btn-secondary" onClick={() => handleInviteFriend(friend.id)}>
                        Invite
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default ItineraryPlanner;
