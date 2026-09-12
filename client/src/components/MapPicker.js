import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import 'leaflet/dist/leaflet.css';
import '../styles/MapPicker.css';

// CRA's bundler breaks Leaflet's default marker icon URLs; rebuild them explicitly.
const defaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

const DEFAULT_CENTER = [4.2105, 101.9758]; // Roughly central Malaysia

function LocationMarker({ position, onSelect }) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });

  return position ? <Marker position={position} /> : null;
}

function MapPicker({ latitude, longitude, onChange }) {
  const hasPosition = latitude != null && longitude != null;
  const [center] = useState(hasPosition ? [latitude, longitude] : DEFAULT_CENTER);

  const position = hasPosition ? [latitude, longitude] : null;

  const handleSelect = (lat, lng) => {
    onChange(lat, lng);
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        alert('Unable to retrieve your location');
      }
    );
  };

  const handleClear = () => {
    onChange(null, null);
  };

  return (
    <div className="map-picker">
      <div className="map-picker-toolbar">
        <span className="map-picker-hint">Click on the map to pin the meeting point</span>
        <div className="map-picker-actions">
          <button type="button" onClick={handleUseMyLocation} className="btn-secondary">
            Use My Location
          </button>
          {hasPosition && (
            <button type="button" onClick={handleClear} className="btn-danger">
              Clear Pin
            </button>
          )}
        </div>
      </div>

      <MapContainer center={center} zoom={7} className="map-picker-map">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker position={position} onSelect={handleSelect} />
      </MapContainer>

      {hasPosition && (
        <div className="map-picker-coords">
          📍 Pinned at {latitude.toFixed(5)}, {longitude.toFixed(5)}
        </div>
      )}
    </div>
  );
}

export default MapPicker;
