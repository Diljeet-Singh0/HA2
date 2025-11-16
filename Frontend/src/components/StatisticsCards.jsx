import React from 'react';

const StatisticsCards = ({ complaints }) => {
  const stats = {
    total: complaints.length,
    pending: complaints.filter(c => c.status === 'Pending').length,
    inProgress: complaints.filter(c => c.status === 'In Progress').length,
    resolved: complaints.filter(c => c.status === 'Resolved').length,
    highPriority: complaints.filter(c => c.priority === 'High').length,
    avgResolutionTime: 'N/A' // You can calculate this if you have resolution dates
  };

  const StatCard = ({ title, value, color, icon }) => (
    <div className={`bg-white p-6 rounded-lg shadow-md border-l-4 ${color}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className="text-3xl text-gray-400">
          {icon}
        </div>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <StatCard
        title="Total Complaints"
        value={stats.total}
        color="border-blue-500"
        icon="📊"
      />
      <StatCard
        title="Pending"
        value={stats.pending}
        color="border-yellow-500"
        icon="⏳"
      />
      <StatCard
        title="In Progress"
        value={stats.inProgress}
        color="border-blue-400"
        icon="🔄"
      />
      <StatCard
        title="Resolved"
        value={stats.resolved}
        color="border-green-500"
        icon="✅"
      />
      <StatCard
        title="High Priority"
        value={stats.highPriority}
        color="border-red-500"
        icon="🚨"
      />
      <StatCard
        title="Resolution Rate"
        value={`${Math.round((stats.resolved / stats.total) * 100)}%`}
        color="border-purple-500"
        icon="📈"
      />
      <StatCard
        title="Avg. Response Time"
        value={stats.avgResolutionTime}
        color="border-orange-500"
        icon="⏱️"
      />
      <StatCard
        title="Categories"
        value={new Set(complaints.map(c => c.category)).size}
        color="border-indigo-500"
        icon="🏷️"
      />
    </div>
  );
};

export default StatisticsCards;