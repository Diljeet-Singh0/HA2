import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icon
const createCustomIcon = (color = 'red') => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      "></div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
};

const MapComponent = ({ 
  onLocationSelect, 
  initialLocation, 
  isSelecting = true,
  height = '300px',
  showSearch = true
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const [currentLocation, setCurrentLocation] = useState(initialLocation);
  const [searchQuery, setSearchQuery] = useState('');

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map with OpenStreetMap tiles
    const map = L.map(mapRef.current).setView(
      initialLocation ? [initialLocation.lat, initialLocation.lng] : [20.5937, 78.9629], 
      13
    );

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19
    }).addTo(map);

    mapInstanceRef.current = map;

    // Add initial marker if location provided
    if (initialLocation) {
      markerRef.current = L.marker([initialLocation.lat, initialLocation.lng], {
        icon: createCustomIcon('#dc2626')
      })
        .addTo(map)
        .bindPopup('Complaint Location')
        .openPopup();
    }

    // Add click listener for location selection
    if (isSelecting) {
      map.on('click', async (e) => {
        const location = {
          lat: e.latlng.lat,
          lng: e.latlng.lng
        };

        setCurrentLocation(location);

        // Update or create marker
        if (markerRef.current) {
          markerRef.current.setLatLng(e.latlng);
        } else {
          markerRef.current = L.marker(e.latlng, {
            icon: createCustomIcon('#dc2626')
          })
            .addTo(map)
            .bindPopup('Selected Location')
            .openPopup();
        }

        // Get address using OpenStreetMap Nominatim
        try {
          const address = await getAddressFromCoordinates(location.lat, location.lng);
          onLocationSelect(location, address);
        } catch (error) {
          console.error('Error getting address:', error);
          const fallbackAddress = `Latitude: ${location.lat.toFixed(6)}, Longitude: ${location.lng.toFixed(6)}`;
          onLocationSelect(location, fallbackAddress);
        }
      });
    }

    // Add current location button
    if (isSelecting) {
      const locationControl = L.control({ position: 'topright' });
      locationControl.onAdd = function(map) {
        const div = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
        div.innerHTML = `
          <button style="
            background: white;
            border: none;
            border-radius: 4px;
            padding: 8px;
            cursor: pointer;
            box-shadow: 0 1px 5px rgba(0,0,0,0.4);
          " title="Find my location">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0 0 13 3.06V1h-2v2.06A8.994 8.994 0 0 0 3.06 11H1v2h2.06A8.994 8.994 0 0 0 11 20.94V23h2v-2.06A8.994 8.994 0 0 0 20.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/>
            </svg>
          </button>
        `;
        
        div.onclick = getCurrentLocation;
        return div;
      };
      locationControl.addTo(map);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }
    };
  }, [onLocationSelect, initialLocation, isSelecting]);

  // Get address from coordinates using OpenStreetMap Nominatim
  const getAddressFromCoordinates = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch address');
      }

      const data = await response.json();
      
      if (data && data.display_name) {
        return data.display_name;
      }
      
      return `Latitude: ${lat.toFixed(6)}, Longitude: ${lng.toFixed(6)}`;
    } catch (error) {
      console.error('Error getting address:', error);
      throw error;
    }
  };

  // Search for location
  const searchLocation = async (query) => {
    if (!query.trim()) return;

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          const location = {
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon)
          };
          
          setCurrentLocation(location);
          mapInstanceRef.current.setView([location.lat, location.lng], 16);
          
          // Update marker
          if (markerRef.current) {
            markerRef.current.setLatLng([location.lat, location.lng]);
          } else {
            markerRef.current = L.marker([location.lat, location.lng], {
              icon: createCustomIcon('#dc2626')
            })
              .addTo(mapInstanceRef.current)
              .bindPopup('Searched Location')
              .openPopup();
          }
          
          onLocationSelect(location, data[0].display_name);
        }
      }
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  // Get current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };

        setCurrentLocation(location);
        mapInstanceRef.current.setView([location.lat, location.lng], 16);

        // Update marker
        if (markerRef.current) {
          markerRef.current.setLatLng([location.lat, location.lng]);
        } else {
          markerRef.current = L.marker([location.lat, location.lng], {
            icon: createCustomIcon('#2563eb')
          })
            .addTo(mapInstanceRef.current)
            .bindPopup('Your Current Location')
            .openPopup();
        }

        try {
          const address = await getAddressFromCoordinates(location.lat, location.lng);
          onLocationSelect(location, address);
        } catch (error) {
          console.error('Error getting address:', error);
        }
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('Unable to get your current location');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  return (
    <div className="map-container">
      {/* Search Bar */}
      {showSearch && isSelecting && (
        <div className="mb-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search for a location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchLocation(searchQuery)}
              className="w-full p-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              onClick={() => searchLocation(searchQuery)}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.3-4.3"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Map */}
      <div 
        ref={mapRef} 
        style={{ 
          width: '100%', 
          height, 
          borderRadius: '8px',
        }} 
      />

      {/* Coordinates Display */}
      {currentLocation && (
        <div className="mt-2 text-xs text-gray-600">
          Coordinates: {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
        </div>
      )}
    </div>
  );
};

export default MapComponent;