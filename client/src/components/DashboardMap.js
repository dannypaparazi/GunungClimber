import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import 'leaflet/dist/leaflet.css';
import StarRating from './StarRating';
import unescoSites from '../data/unescoSites';
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
const UNESCO_ICON = markerIcon('violet');

const DEFAULT_CENTER = [4.2105, 101.9758]; // Roughly central Malaysia

function isAlreadyHiked(pin) {
  return new Date(pin.end_date) < new Date();
}

function pinCategory(pin) {
  if (!pin.is_own) return 'public';
  return isAlreadyHiked(pin) ? 'hiked' : 'planned';
}

function pinIcon(pin) {
  switch (pinCategory(pin)) {
    case 'public':
      return PUBLIC_ICON;
    case 'hiked':
      return HIKED_ICON;
    default:
      return PLANNED_ICON;
  }
}

const LEGEND_ITEMS = [
  { key: 'planned', label: 'Planned hikes' },
  { key: 'hiked', label: 'Already hiked' },
  { key: 'public', label: 'Open to public' },
  { key: 'unesco', label: 'UNESCO Heritage Site' },
];

function DashboardMap({ pins }) {
  const [visible, setVisible] = useState({ planned: true, hiked: true, public: true, unesco: true });

  const toggleCategory = (key) => {
    setVisible((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const visiblePins = pins.filter((pin) => visible[pinCategory(pin)]);

  return (
    <div className="dashboard-map">
      <div className="dashboard-map-legend">
        {LEGEND_ITEMS.map((item) => (
          <button
            key={item.key}
            type="button"
            className={`legend-toggle ${visible[item.key] ? '' : 'inactive'}`}
            onClick={() => toggleCategory(item.key)}
          >
            <span className={`dot dot-${item.key}`} /> {item.label}
          </button>
        ))}
      </div>

      <MapContainer center={DEFAULT_CENTER} zoom={6} className="dashboard-map-canvas">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {visiblePins.map((pin) => (
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
                <p>Difficulty: <StarRating value={pin.difficulty} readOnly /></p>
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
        {visible.unesco && unescoSites.map((site) => (
          <Marker key={site.id} position={[site.lat, site.lng]} icon={UNESCO_ICON}>
            <Popup>
              <div className="dashboard-map-popup">
                <h4>{site.name}</h4>
                <p className="mountain-name">UNESCO World Heritage Site ({site.category}, {site.year})</p>
                <p>{site.description}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

export default DashboardMap;
