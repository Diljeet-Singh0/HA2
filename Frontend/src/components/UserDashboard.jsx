import React, { useState, useEffect, useCallback } from 'react';
import { complaintsAPI, getImageUrl } from '../utils/api.js';
import MapComponent from './MapComponent.jsx';

const UserDashboard = () => {
  const [complaints, setComplaints] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingComplaint, setEditingComplaint] = useState(null);
  const [selectedImages, setSelectedImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [mapLocation, setMapLocation] = useState(null);
  const [showMap, setShowMap] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Infrastructure',
    location: '',
    coordinates: null
  });

  useEffect(() => {
    fetchComplaints();
  }, []);

  // Auto-detect location when form opens for new complaints
  useEffect(() => {
    if (showForm && !editingComplaint) {
      getCurrentLocation();
    }
  }, [showForm, editingComplaint]);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const response = await complaintsAPI.getMyComplaints();
      setComplaints(response.data);
    } catch (error) {
      console.error('Error fetching complaints:', error);
      alert('Error fetching complaints');
    } finally {
      setLoading(false);
    }
  };

  // Get precise current location
  const getCurrentLocation = () => {
    setLocationLoading(true);
    setLocationError('');
    setMapLocation(null);
    
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const coordinates = { lat: latitude, lng: longitude };
        
        setMapLocation(coordinates);
        
        try {
          const address = await getPreciseAddress(latitude, longitude);
          
          setFormData(prev => ({
            ...prev,
            location: address,
            coordinates: coordinates
          }));
          setLocationError('');
        } catch (error) {
          console.error('Error getting address:', error);
          const fallbackAddress = `Latitude: ${latitude.toFixed(6)}, Longitude: ${longitude.toFixed(6)}`;
          setFormData(prev => ({
            ...prev,
            location: fallbackAddress,
            coordinates: coordinates
          }));
          setLocationError('Could not get precise address, but coordinates are captured.');
        } finally {
          setLocationLoading(false);
        }
      },
      (error) => {
        setLocationLoading(false);
        let errorMessage = '';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location permissions.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location unavailable. Please check your device location services.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location detection timed out. Please try again.';
            break;
          default:
            errorMessage = 'Failed to detect location.';
            break;
        }
        
        setLocationError(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  };

  // Get precise address from coordinates
  const getPreciseAddress = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      
      if (response.ok) {
        const data = await response.json();
        return data.display_name || `Latitude: ${lat.toFixed(6)}, Longitude: ${lng.toFixed(6)}`;
      }
      
      return `Latitude: ${lat.toFixed(6)}, Longitude: ${lng.toFixed(6)}`;
    } catch (error) {
      console.error('Address fetch error:', error);
      throw new Error('Failed to get precise address');
    }
  };

  // Handle location selection from map
  const handleLocationSelect = useCallback((coordinates, address) => {
    setMapLocation(coordinates);
    setFormData(prev => ({
      ...prev,
      location: address,
      coordinates: coordinates
    }));
    setLocationError('');
  }, []);

  // Retry location detection
  const retryLocationDetection = () => {
    getCurrentLocation();
  };

  // Toggle map view
  const toggleMap = () => {
    setShowMap(!showMap);
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedImages(files);
  };

  const handleDeleteImage = async (complaintId, imageName) => {
    if (window.confirm('Are you sure you want to delete this image?')) {
      try {
        await complaintsAPI.deleteImage(complaintId, imageName);
        fetchComplaints();
        if (editingComplaint && editingComplaint._id === complaintId) {
          setEditingComplaint(prev => ({
            ...prev,
            images: prev.images.filter(img => img !== imageName)
          }));
        }
      } catch (error) {
        alert('Error deleting image');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate location is captured
    if (!formData.location.trim() || !formData.coordinates) {
      alert('Location is required. Please select a location from the map or enable location detection.');
      return;
    }

    setLoading(true);
    try {
      const submitData = new FormData();
      submitData.append('title', formData.title);
      submitData.append('description', formData.description);
      submitData.append('category', formData.category);
      submitData.append('location', formData.location);
      submitData.append('coordinates', JSON.stringify(formData.coordinates));
      
      selectedImages.forEach((image) => {
        submitData.append('images', image);
      });

      if (editingComplaint) {
        await complaintsAPI.update(editingComplaint._id, submitData);
      } else {
        await complaintsAPI.create(submitData);
      }
      
      setShowForm(false);
      setEditingComplaint(null);
      setFormData({ 
        title: '', 
        description: '', 
        category: 'Infrastructure', 
        location: '',
        coordinates: null 
      });
      setSelectedImages([]);
      setLocationError('');
      setMapLocation(null);
      setShowMap(false);
      fetchComplaints();
    } catch (error) {
      alert('Error saving complaint: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (complaint) => {
    setEditingComplaint(complaint);
    
    // Parse coordinates if they exist
    let coordinates = null;
    if (complaint.coordinates) {
      try {
        coordinates = typeof complaint.coordinates === 'string' 
          ? JSON.parse(complaint.coordinates)
          : complaint.coordinates;
      } catch (e) {
        console.error('Error parsing coordinates:', e);
      }
    }
    
    setFormData({
      title: complaint.title,
      description: complaint.description,
      category: complaint.category,
      location: complaint.location,
      coordinates: coordinates
    });
    
    setMapLocation(coordinates);
    setSelectedImages([]);
    setLocationError('');
    setShowForm(true);
    setShowMap(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this complaint?')) {
      try {
        await complaintsAPI.delete(id);
        fetchComplaints();
      } catch (error) {
        alert('Error deleting complaint');
      }
    }
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'Pending': return {
        bg: 'bg-amber-50',
        text: 'text-amber-800',
        border: 'border-amber-200',
        dot: 'bg-amber-400'
      };
      case 'In Progress': return {
        bg: 'bg-blue-50',
        text: 'text-blue-800',
        border: 'border-blue-200',
        dot: 'bg-blue-400'
      };
      case 'Resolved': return {
        bg: 'bg-emerald-50',
        text: 'text-emerald-800',
        border: 'border-emerald-200',
        dot: 'bg-emerald-400'
      };
      default: return {
        bg: 'bg-gray-50',
        text: 'text-gray-800',
        border: 'border-gray-200',
        dot: 'bg-gray-400'
      };
    }
  };

  const getPriorityVariant = (priority) => {
    switch (priority) {
      case 'High': return 'text-red-600 font-medium';
      case 'Medium': return 'text-orange-600';
      case 'Low': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      Infrastructure: 'text-blue-600 bg-blue-50 border-blue-200',
      Sanitation: 'text-green-600 bg-green-50 border-green-200',
      Security: 'text-red-600 bg-red-50 border-red-200',
      Electrical: 'text-amber-600 bg-amber-50 border-amber-200',
      Water: 'text-cyan-600 bg-cyan-50 border-cyan-200',
      Other: 'text-gray-600 bg-gray-50 border-gray-200'
    };
    return colors[category] || colors.Other;
  };

  const filteredComplaints = complaints.filter(complaint => {
    if (activeFilter === 'all') return true;
    return complaint.status === activeFilter;
  });

  const stats = {
    total: complaints.length,
    pending: complaints.filter(c => c.status === 'Pending').length,
    inProgress: complaints.filter(c => c.status === 'In Progress').length,
    resolved: complaints.filter(c => c.status === 'Resolved').length,
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Complaint Management</h1>
              <p className="text-gray-600 text-sm">Track and manage your service requests</p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors duration-200 flex items-center gap-2 text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Complaint
            </button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Total</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">{stats.total}</p>
              </div>
              <div className="text-gray-400">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Pending</p>
                <p className="text-2xl font-semibold text-amber-600 mt-1">{stats.pending}</p>
              </div>
              <div className="text-amber-500">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">In Progress</p>
                <p className="text-2xl font-semibold text-blue-600 mt-1">{stats.inProgress}</p>
              </div>
              <div className="text-blue-500">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Resolved</p>
                <p className="text-2xl font-semibold text-emerald-600 mt-1">{stats.resolved}</p>
              </div>
              <div className="text-emerald-500">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors duration-200 ${
                activeFilter === 'all' 
                  ? 'bg-gray-900 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Complaints
            </button>
            <button
              onClick={() => setActiveFilter('Pending')}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors duration-200 ${
                activeFilter === 'Pending' 
                  ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setActiveFilter('In Progress')}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors duration-200 ${
                activeFilter === 'In Progress' 
                  ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              In Progress
            </button>
            <button
              onClick={() => setActiveFilter('Resolved')}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors duration-200 ${
                activeFilter === 'Resolved' 
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Resolved
            </button>
          </div>
        </div>

        {/* Complaint Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-xl">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingComplaint ? 'Edit Complaint' : 'Register New Complaint'}
                </h2>
                {!editingComplaint && (
                  <p className="text-sm text-gray-600 mt-1">
                    Location detection is required for complaint registration
                  </p>
                )}
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Complaint Title</label>
                    <input
                      type="text"
                      placeholder="Enter a clear title for your complaint"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-colors duration-200"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      placeholder="Provide detailed description of the issue"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-colors duration-200"
                      rows="4"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-colors duration-200"
                      >
                        <option value="Infrastructure">Infrastructure</option>
                        <option value="Sanitation">Sanitation</option>
                        <option value="Security">Security</option>
                        <option value="Electrical">Electrical</option>
                        <option value="Water">Water</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Location *{!editingComplaint && (
                          <span className="text-red-500 ml-1">(Required)</span>
                        )}
                      </label>
                      
                      {/* Location Detection Status */}
                      {!editingComplaint && locationLoading && (
                        <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            <span className="text-sm text-blue-700 font-medium">
                              Detecting your location...
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {!editingComplaint && locationError && (
                        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-sm text-red-700 font-medium">Location Required</span>
                          </div>
                          <p className="text-xs text-red-600 mb-2">{locationError}</p>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={retryLocationDetection}
                              className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700 transition-colors duration-200"
                            >
                              Retry Auto-detection
                            </button>
                            <button
                              type="button"
                              onClick={toggleMap}
                              className="bg-gray-600 text-white px-3 py-1 rounded text-xs hover:bg-gray-700 transition-colors duration-200"
                            >
                              Select from Map
                            </button>
                          </div>
                        </div>
                      )}
                      
                      {!editingComplaint && formData.location && !locationLoading && !locationError && (
                        <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-sm text-green-700 font-medium">Location Detected</span>
                          </div>
                          <button
                            type="button"
                            onClick={toggleMap}
                            className="mt-2 text-xs text-green-700 underline hover:text-green-800"
                          >
                            View on Map
                          </button>
                        </div>
                      )}

                      <input
                        type="text"
                        placeholder={editingComplaint ? "Location of the issue" : "Auto-detecting location..."}
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 transition-colors duration-200"
                        required
                        readOnly={!editingComplaint && !locationError}
                      />
                      
                      <div className="flex gap-2 mt-2">
                        {!editingComplaint && (
                          <button
                            type="button"
                            onClick={retryLocationDetection}
                            className="text-xs text-gray-600 hover:text-gray-800 underline"
                          >
                            Retry Auto-detection
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={toggleMap}
                          className="text-xs text-blue-600 hover:text-blue-800 underline"
                        >
                          {showMap ? 'Hide Map' : 'Select Location on Map'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Leaflet Map Section */}
                  {showMap && (
                    <div className="col-span-full">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Location on Map
                      </label>
                      <MapComponent
                        onLocationSelect={handleLocationSelect}
                        initialLocation={mapLocation}
                        isSelecting={true}
                        height="400px"
                        showSearch={true}
                      />
                    </div>
                  )}

                  {/* Image Upload Section */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Attach Images
                      </label>
                      <div className="border border-gray-300 rounded-lg p-4">
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleImageSelect}
                          className="hidden"
                          id="image-upload"
                        />
                        <label htmlFor="image-upload" className="cursor-pointer flex items-center gap-3">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-gray-600">Upload supporting images</span>
                        </label>
                      </div>
                      {selectedImages.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm text-gray-600">
                            {selectedImages.length} file(s) selected
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Existing Images */}
                    {editingComplaint && editingComplaint.images && editingComplaint.images.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Current Images
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                          {editingComplaint.images.map((image, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={getImageUrl(image)}
                                alt={`Evidence ${index + 1}`}
                                className="w-full h-20 object-cover rounded border border-gray-300"
                              />
                              <button
                                type="button"
                                onClick={() => handleDeleteImage(editingComplaint._id, image)}
                                className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-700"
                                title="Remove image"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="submit"
                    disabled={loading || (!editingComplaint && (!formData.location.trim() || !formData.coordinates))}
                    className="flex-1 bg-gray-900 text-white py-3 px-6 rounded-lg hover:bg-gray-800 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Processing...' : (editingComplaint ? 'Update Complaint' : 'Submit Complaint')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingComplaint(null);
                      setFormData({ 
                        title: '', 
                        description: '', 
                        category: 'Infrastructure', 
                        location: '',
                        coordinates: null 
                      });
                      setSelectedImages([]);
                      setLocationError('');
                      setMapLocation(null);
                      setShowMap(false);
                    }}
                    className="flex-1 bg-white text-gray-700 py-3 px-6 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors duration-200 font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Complaints List */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredComplaints.map((complaint) => {
              const statusVariant = getStatusVariant(complaint.status);
              const complaintCoordinates = complaint.coordinates 
                ? (typeof complaint.coordinates === 'string' 
                    ? JSON.parse(complaint.coordinates) 
                    : complaint.coordinates)
                : null;

              return (
                <div key={complaint._id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:border-gray-300 transition-colors duration-200">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getCategoryColor(complaint.category)}`}>
                            {complaint.category}
                          </span>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${statusVariant.dot}`}></div>
                            <span className={`text-sm font-medium ${statusVariant.text}`}>
                              {complaint.status}
                            </span>
                          </div>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{complaint.title}</h3>
                        <p className="text-gray-600 text-sm mb-3">{complaint.description}</p>
                      </div>
                    </div>

                    {/* Complaint Location Map */}
                    {complaintCoordinates && (
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Complaint Location
                        </label>
                        <div className="border border-gray-300 rounded-lg overflow-hidden">
                          <MapComponent
                            initialLocation={complaintCoordinates}
                            isSelecting={false}
                            height="200px"
                            showSearch={false}
                          />
                        </div>
                      </div>
                    )}

                    {/* Images */}
                    {complaint.images && complaint.images.length > 0 && (
                      <div className="mb-4">
                        <div className="flex gap-2">
                          {complaint.images.map((image, index) => (
                            <img
                              key={index}
                              src={getImageUrl(image)}
                              alt={`Evidence ${index + 1}`}
                              className="w-16 h-16 object-cover rounded border border-gray-300"
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-6 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="max-w-xs truncate">{complaint.location}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{new Date(complaint.createdAt).toLocaleDateString()}</span>
                        </div>
                        <span className={getPriorityVariant(complaint.priority)}>
                          {complaint.priority} Priority
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(complaint)}
                          className="bg-white text-gray-700 px-4 py-2 rounded border border-gray-300 hover:bg-gray-50 transition-colors duration-200 text-sm font-medium flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(complaint._id)}
                          className="bg-white text-red-600 px-4 py-2 rounded border border-red-200 hover:bg-red-50 transition-colors duration-200 text-sm font-medium flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredComplaints.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {activeFilter === 'all' ? 'No complaints registered' : `No ${activeFilter.toLowerCase()} complaints`}
            </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              {activeFilter === 'all' 
                ? 'Get started by submitting your first service request or complaint.' 
                : `There are no ${activeFilter.toLowerCase()} complaints in your records.`
              }
            </p>
            {activeFilter === 'all' && (
              <button
                onClick={() => setShowForm(true)}
                className="bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors duration-200 font-medium"
              >
                Submit New Complaint
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;