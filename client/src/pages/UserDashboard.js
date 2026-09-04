import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/Dashboard.css';

function UserDashboard({ onLogout }) {
  const [itineraries, setItineraries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchUserProfile();
    fetchItineraries();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/user/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUserInfo(response.data.user);
    } catch (err) {
      console.error('Failed to load user profile', err);
    }
  };

  const fetchItineraries = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/itinerary', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setItineraries(response.data.itineraries);
    } catch (err) {
      console.error('Failed to load itineraries', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItinerary = async (id) => {
    if (window.confirm('Are you sure you want to delete this itinerary?')) {
      try {
        await axios.delete(`http://localhost:5000/api/itinerary/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        fetchItineraries();
      } catch (err) {
        console.error('Failed to delete itinerary', err);
      }
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

      <div className="dashboard-content">
        <div className="section">
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
                  <h3>{itinerary.title}</h3>
                  <p className="mountain-name">{itinerary.mountain_name}</p>
                  <div className="itinerary-details">
                    <p><strong>Duration:</strong> {new Date(itinerary.start_date).toLocaleDateString()} - {new Date(itinerary.end_date).toLocaleDateString()}</p>
                    <p><strong>Difficulty:</strong> {itinerary.difficulty}</p>
                    {itinerary.public_transport_method && (
                      <p><strong>Transport:</strong> {itinerary.public_transport_method}</p>
                    )}
                  </div>
                  <div className="card-actions">
                    <Link to={`/itinerary/${itinerary.id}`} className="btn-secondary">
                      View & Edit
                    </Link>
                    <button
                      onClick={() => handleDeleteItinerary(itinerary.id)}
                      className="btn-danger"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default UserDashboard;
