import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
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

function FlyToLocation({ target, zoom }) {
  const map = useMap();

  useEffect(() => {
    if (target) {
      map.flyTo(target, zoom);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  return null;
}

function MapPicker({ latitude, longitude, onChange }) {
  const hasPosition = latitude != null && longitude != null;
  const [center] = useState(hasPosition ? [latitude, longitude] : DEFAULT_CENTER);
  const [flyTarget, setFlyTarget] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

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
        const { latitude: lat, longitude: lng } = pos.coords;
        onChange(lat, lng);
        setFlyTarget([lat, lng]);
      },
      () => {
        alert('Unable to retrieve your location');
      }
    );
  };

  const handleClear = () => {
    onChange(null, null);
  };

  const handleSearch = async () => {
    const query = searchQuery.trim();
    if (!query) return;

    setIsSearching(true);
    setSearchError('');
    setSearchResults([]);

    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&countrycodes=my&q=${encodeURIComponent(query)}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Search request failed');
      const results = await response.json();
      if (results.length === 0) {
        setSearchError('No locations found');
      }
      setSearchResults(results);
    } catch (err) {
      setSearchError('Unable to search for that location');
    } finally {
      setIsSearching(false);
    }
  };

  const handleResultSelect = (result) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    onChange(lat, lng);
    setFlyTarget([lat, lng]);
    setSearchResults([]);
    setSearchQuery(result.display_name);
  };

  return (
    <div className="map-picker">
      <div className="map-picker-search">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSearch();
            }
          }}
          placeholder="Search for a place or address..."
          className="map-picker-search-input"
        />
        <button type="button" className="btn-secondary" onClick={handleSearch} disabled={isSearching}>
          {isSearching ? 'Searching...' : 'Search'}
        </button>

        {(searchResults.length > 0 || searchError) && (
          <ul className="map-picker-search-results">
            {searchError ? (
              <li className="map-picker-search-empty">{searchError}</li>
            ) : (
              searchResults.map((result) => (
                <li key={result.place_id}>
                  <button type="button" onClick={() => handleResultSelect(result)}>
                    {result.display_name}
                  </button>
                </li>
              ))
            )}
          </ul>
        )}
      </div>

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
        <FlyToLocation target={flyTarget} zoom={14} />
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
