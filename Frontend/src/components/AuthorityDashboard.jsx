import React, { useState, useEffect } from 'react';
import { complaintsAPI, getImageUrl } from '../utils/api.js';
import AnalyticsDashboard from './AnalyticsDashboard';
import StatisticsCards from './StatisticsCards';

const AuthorityDashboard = () => {
  const [complaints, setComplaints] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    priority: '',
    dateRange: '',
    search: ''
  });
  const [activeTab, setActiveTab] = useState('analytics'); // 'analytics' or 'list'

  useEffect(() => {
    fetchComplaints();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [complaints, filters]);

  const fetchComplaints = async () => {
    try {
      const response = await complaintsAPI.getAllComplaints();
      setComplaints(response.data);
    } catch (error) {
      alert('Error fetching complaints');
    }
  };

  const applyFilters = () => {
    let filtered = [...complaints];

    if (filters.status) {
      filtered = filtered.filter(complaint => complaint.status === filters.status);
    }

    if (filters.category) {
      filtered = filtered.filter(complaint => complaint.category === filters.category);
    }

    if (filters.priority) {
      filtered = filtered.filter(complaint => complaint.priority === filters.priority);
    }

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(complaint => 
        complaint.title.toLowerCase().includes(searchTerm) ||
        complaint.description.toLowerCase().includes(searchTerm) ||
        complaint.location.toLowerCase().includes(searchTerm) ||
        complaint.user?.name.toLowerCase().includes(searchTerm)
      );
    }

    setFilteredComplaints(filtered);
  };

  const updateStatus = async (id, status) => {
    try {
      await complaintsAPI.updateStatus(id, status);
      fetchComplaints();
    } catch (error) {
      alert('Error updating status');
    }
  };

  const updatePriority = async (id, priority) => {
    try {
      await complaintsAPI.updatePriority(id, priority);
      fetchComplaints();
    } catch (error) {
      alert('Error updating priority');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'In Progress': return 'bg-blue-100 text-blue-800';
      case 'Resolved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-800';
      case 'Medium': return 'bg-orange-100 text-orange-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Authority Dashboard</h1>
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-2 rounded-md ${
                activeTab === 'analytics' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              📊 Analytics
            </button>
            <button
              onClick={() => setActiveTab('list')}
              className={`px-4 py-2 rounded-md ${
                activeTab === 'list' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              📋 Complaints List
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h3 className="text-lg font-semibold mb-4">Advanced Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full p-2 border rounded-md"
              >
                <option value="">All Status</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className="w-full p-2 border rounded-md"
              >
                <option value="">All Categories</option>
                <option value="Infrastructure">Infrastructure</option>
                <option value="Sanitation">Sanitation</option>
                <option value="Security">Security</option>
                <option value="Electrical">Electrical</option>
                <option value="Water">Water</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={filters.priority}
                onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                className="w-full p-2 border rounded-md"
              >
                <option value="">All Priorities</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
              <select
                value={filters.dateRange}
                onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
                className="w-full p-2 border rounded-md"
              >
                <option value="">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                placeholder="Search complaints..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full p-2 border rounded-md"
              />
            </div>
          </div>

          {/* Filter Summary */}
          <div className="mt-4 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Showing {filteredComplaints.length} of {complaints.length} complaints
              {filters.status && ` • Status: ${filters.status}`}
              {filters.category && ` • Category: ${filters.category}`}
              {filters.priority && ` • Priority: ${filters.priority}`}
            </div>
            <button
              onClick={() => setFilters({ status: '', category: '', priority: '', dateRange: '', search: '' })}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 text-sm"
            >
              Clear All
            </button>
          </div>
        </div>

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <>
            <StatisticsCards complaints={filteredComplaints} />
            <AnalyticsDashboard complaints={filteredComplaints} />
          </>
        )}

                {/* Complaints List Tab */}
        {activeTab === 'list' && (
          <div className="grid gap-6">
            {filteredComplaints.map((complaint) => (
              <div key={complaint._id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{complaint.title}</h3>
                    <p className="text-sm text-gray-500">By: {complaint.user?.name} ({complaint.user?.email})</p>
                  </div>
                  <div className="flex gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(complaint.status)}`}>
                      {complaint.status}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(complaint.priority)}`}>
                      {complaint.priority}
                    </span>
                  </div>
                </div>
                
                <p className="text-gray-600 mb-4">{complaint.description}</p>
                
                {/* Display Images if any */}
                {complaint.images && complaint.images.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Images:</p>
                    <div className="flex gap-2 flex-wrap">
                      {complaint.images.map((image, index) => (
                        <img
                          key={index}
                          src={getImageUrl(image)}
                          alt={`Complaint ${index + 1}`}
                          className="w-20 h-20 object-cover rounded-md border"
                        />
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-500 mb-4">
                  <div>
                    <strong>Category:</strong> {complaint.category}
                  </div>
                  <div>
                    <strong>Location:</strong> {complaint.location}
                  </div>
                  <div>
                    <strong>Created:</strong> {new Date(complaint.createdAt).toLocaleDateString()}
                  </div>
                  <div>
                    <strong>Last Updated:</strong> {new Date(complaint.updatedAt).toLocaleDateString()}
                  </div>
                </div>

                {/* Status Update Buttons */}
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Update Status:</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateStatus(complaint._id, 'Pending')}
                      className={`flex-1 py-2 px-3 rounded text-sm ${
                        complaint.status === 'Pending' 
                          ? 'bg-yellow-600 text-white' 
                          : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                      }`}
                    >
                      Pending
                    </button>
                    <button
                      onClick={() => updateStatus(complaint._id, 'In Progress')}
                      className={`flex-1 py-2 px-3 rounded text-sm ${
                        complaint.status === 'In Progress' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                      }`}
                    >
                      In Progress
                    </button>
                    <button
                      onClick={() => updateStatus(complaint._id, 'Resolved')}
                      className={`flex-1 py-2 px-3 rounded text-sm ${
                        complaint.status === 'Resolved' 
                          ? 'bg-green-600 text-white' 
                          : 'bg-green-100 text-green-800 hover:bg-green-200'
                      }`}
                    >
                      Resolved
                    </button>
                  </div>
                </div>

                {/* Priority Update Buttons */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Update Priority:</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => updatePriority(complaint._id, 'Low')}
                      className={`flex-1 py-2 px-3 rounded text-sm ${
                        complaint.priority === 'Low' 
                          ? 'bg-green-600 text-white' 
                          : 'bg-green-100 text-green-800 hover:bg-green-200'
                      }`}
                    >
                      Low Priority
                    </button>
                    <button
                      onClick={() => updatePriority(complaint._id, 'Medium')}
                      className={`flex-1 py-2 px-3 rounded text-sm ${
                        complaint.priority === 'Medium' 
                          ? 'bg-orange-600 text-white' 
                          : 'bg-orange-100 text-orange-800 hover:bg-orange-200'
                      }`}
                    >
                      Medium Priority
                    </button>
                    <button
                      onClick={() => updatePriority(complaint._id, 'High')}
                      className={`flex-1 py-2 px-3 rounded text-sm ${
                        complaint.priority === 'High' 
                          ? 'bg-red-600 text-white' 
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                      }`}
                    >
                      High Priority
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredComplaints.length === 0 && complaints.length > 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No complaints match your filters.</p>
          </div>
        )}

        {complaints.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No complaints found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthorityDashboard;