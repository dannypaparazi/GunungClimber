import React, { useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import 'leaflet/dist/leaflet.css';
import StarRating from './StarRating';
import unescoSites from '../data/unescoSites';
import makanSpotsByRegion from '../data/makanSpots';
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
const MAKAN_ICON = markerIcon('orange');

const DEFAULT_CENTER = [4.2105, 101.9758]; // Roughly central Malaysia

const staticMakanSpots = Object.entries(makanSpotsByRegion).flatMap(([region, spots]) =>
  spots.map((spot) => ({ ...spot, region }))
);

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
  { key: 'makan', label: 'Makan Spot' },
];

function FlyToLocation({ target, zoom }) {
  const map = useMap();

  React.useEffect(() => {
    if (target) {
      map.flyTo(target, zoom);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  return null;
}

function DashboardMap({ pins, userMakanSpots = [] }) {
  const [visible, setVisible] = useState({ planned: true, hiked: true, public: true, unesco: true, makan: true });
  const [makanQuery, setMakanQuery] = useState('');
  const [flyTarget, setFlyTarget] = useState(null);

  const makanSpots = useMemo(
    () => [...staticMakanSpots, ...userMakanSpots],
    [userMakanSpots]
  );

  const toggleCategory = (key) => {
    setVisible((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const visiblePins = pins.filter((pin) => visible[pinCategory(pin)]);

  const trimmedQuery = makanQuery.trim().toLowerCase();
  const makanMatches = trimmedQuery
    ? makanSpots.filter(
        (spot) =>
          spot.name.toLowerCase().includes(trimmedQuery) ||
          spot.location.toLowerCase().includes(trimmedQuery) ||
          spot.specialty.toLowerCase().includes(trimmedQuery)
      )
    : [];

  const handleSelectMakanMatch = (spot) => {
    setVisible((prev) => ({ ...prev, makan: true }));
    setFlyTarget([spot.lat, spot.lng]);
    setMakanQuery(spot.name);
  };

  return (
    <div className="dashboard-map">
      <div className="dashboard-map-search">
        <input
          type="text"
          value={makanQuery}
          onChange={(e) => setMakanQuery(e.target.value)}
          placeholder="Search makan spots (e.g. laksa, Penang)..."
          className="dashboard-map-search-input"
        />
        {makanMatches.length > 0 && (
          <ul className="dashboard-map-search-results">
            {makanMatches.map((spot) => (
              <li key={spot.id}>
                <button type="button" onClick={() => handleSelectMakanMatch(spot)}>
                  <strong>{spot.name}</strong> — {spot.location}
                </button>
              </li>
            ))}
          </ul>
        )}
        {trimmedQuery && makanMatches.length === 0 && (
          <ul className="dashboard-map-search-results">
            <li className="dashboard-map-search-empty">No makan spots found</li>
          </ul>
        )}
      </div>

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
        {visible.makan && makanSpots.map((spot) => (
          <Marker key={spot.id} position={[spot.lat, spot.lng]} icon={MAKAN_ICON}>
            <Popup>
              <div className="dashboard-map-popup">
                <h4>{spot.name}</h4>
                <p className="mountain-name">{spot.location}</p>
                <p><strong>Specialty:</strong> {spot.specialty}</p>
                <p>{spot.description}</p>
              </div>
            </Popup>
          </Marker>
        ))}
        <FlyToLocation target={flyTarget} zoom={13} />
      </MapContainer>
    </div>
  );
}

export default DashboardMap;
