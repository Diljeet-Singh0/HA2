import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const AnalyticsDashboard = ({ complaints }) => {
  // Calculate analytics data
  const getAnalyticsData = () => {
    const statusCount = { Pending: 0, 'In Progress': 0, Resolved: 0 };
    const categoryCount = {};
    const priorityCount = { Low: 0, Medium: 0, High: 0 };
    const monthlyData = {};
    
    complaints.forEach(complaint => {
      // Status count
      statusCount[complaint.status] = (statusCount[complaint.status] || 0) + 1;
      
      // Category count
      categoryCount[complaint.category] = (categoryCount[complaint.category] || 0) + 1;
      
      // Priority count
      priorityCount[complaint.priority] = (priorityCount[complaint.priority] || 0) + 1;
      
      // Monthly data
      const month = new Date(complaint.createdAt).toLocaleDateString('en-US', { month: 'short' });
      monthlyData[month] = (monthlyData[month] || 0) + 1;
    });

    return { statusCount, categoryCount, priorityCount, monthlyData };
  };

  const { statusCount, categoryCount, priorityCount, monthlyData } = getAnalyticsData();

  // Chart data configurations
  const statusChartData = {
    labels: Object.keys(statusCount),
    datasets: [
      {
        label: 'Complaints by Status',
        data: Object.values(statusCount),
        backgroundColor: [
          'rgba(255, 205, 86, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(75, 192, 192, 0.8)',
        ],
        borderColor: [
          'rgb(255, 205, 86)',
          'rgb(54, 162, 235)',
          'rgb(75, 192, 192)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const categoryChartData = {
    labels: Object.keys(categoryCount),
    datasets: [
      {
        label: 'Complaints by Category',
        data: Object.values(categoryCount),
        backgroundColor: [
          'rgba(255, 99, 132, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 205, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(153, 102, 255, 0.8)',
          'rgba(201, 203, 207, 0.8)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const priorityChartData = {
    labels: Object.keys(priorityCount),
    datasets: [
      {
        label: 'Complaints by Priority',
        data: Object.values(priorityCount),
        backgroundColor: [
          'rgba(75, 192, 192, 0.8)', // Green for Low
          'rgba(255, 159, 64, 0.8)',  // Orange for Medium
          'rgba(255, 99, 132, 0.8)',  // Red for High
        ],
        borderWidth: 1,
      },
    ],
  };

  const monthlyTrendData = {
    labels: Object.keys(monthlyData),
    datasets: [
      {
        label: 'Monthly Complaints Trend',
        data: Object.values(monthlyData),
        borderColor: 'rgb(54, 162, 235)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        tension: 0.3,
      },
    ],
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Status Chart */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">Complaints by Status</h3>
        <div className="h-64">
          <Doughnut 
            data={statusChartData} 
            options={{ 
              maintainAspectRatio: false,
              plugins: {
                legend: { position: 'bottom' }
              }
            }} 
          />
        </div>
      </div>

      {/* Category Chart */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">Complaints by Category</h3>
        <div className="h-64">
          <Bar 
            data={categoryChartData} 
            options={{ 
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false }
              }
            }} 
          />
        </div>
      </div>

      {/* Priority Chart */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">Complaints by Priority</h3>
        <div className="h-64">
          <Doughnut 
            data={priorityChartData} 
            options={{ 
              maintainAspectRatio: false,
              plugins: {
                legend: { position: 'bottom' }
              }
            }} 
          />
        </div>
      </div>

      {/* Monthly Trend */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">Monthly Trend</h3>
        <div className="h-64">
          <Line 
            data={monthlyTrendData} 
            options={{ 
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false }
              }
            }} 
          />
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;