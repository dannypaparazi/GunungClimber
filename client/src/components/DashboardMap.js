import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import 'leaflet/dist/leaflet.css';
import '../styles/DashboardMap.css';

function markerIcon(color) {
  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });
}

const PLANNED_ICON = markerIcon('blue');
const HIKED_ICON = markerIcon('green');
const PUBLIC_ICON = markerIcon('yellow');

const DEFAULT_CENTER = [4.2105, 101.9758]; // Roughly central Malaysia

function isAlreadyHiked(pin) {
  return new Date(pin.end_date) < new Date();
}

function pinIcon(pin) {
  if (!pin.is_own) return PUBLIC_ICON;
  return isAlreadyHiked(pin) ? HIKED_ICON : PLANNED_ICON;
}

function DashboardMap({ pins }) {
  return (
    <div className="dashboard-map">
      <div className="dashboard-map-legend">
        <span><span className="dot dot-planned" /> Planned hikes</span>
        <span><span className="dot dot-hiked" /> Already hiked</span>
        <span><span className="dot dot-public" /> Open to public</span>
      </div>

      <MapContainer center={DEFAULT_CENTER} zoom={6} className="dashboard-map-canvas">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {pins.map((pin) => (
          <Marker
            key={pin.id}
            position={[pin.meeting_lat, pin.meeting_lng]}
            icon={pinIcon(pin)}
          >
            <Popup>
              <div className="dashboard-map-popup">
                <h4>{pin.title}</h4>
                <p className="mountain-name">{pin.mountain_name}</p>
                <p>
                  {new Date(pin.start_date).toLocaleDateString()} - {new Date(pin.end_date).toLocaleDateString()}
                </p>
                <p>Difficulty: {pin.difficulty}</p>
                {pin.meeting_point && <p>Meeting point: {pin.meeting_point}</p>}
                <p className="owner">
                  {pin.is_own ? 'Your hike' : `By ${pin.owner_full_name || pin.owner_username}`}
                </p>
                {pin.is_own && (
                  <Link to={`/itinerary/${pin.id}`} className="btn-secondary">
                    View & Edit
                  </Link>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

export default DashboardMap;
