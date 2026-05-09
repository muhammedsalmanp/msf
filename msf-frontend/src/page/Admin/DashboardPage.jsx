import React from 'react';
import {
  FaUsers,
  FaLeaf,
  FaMapMarkedAlt,
  FaUserShield,
} from 'react-icons/fa';
import AdminActions from './AdminComponents/AdminActions';

const DashboardPage = () => {
  const cards = [
    {
      title: 'Total Units',
      count: 18,
      icon: <FaMapMarkedAlt className="text-3xl text-green-600" />,
      bg: 'bg-[#dcfce7]', // soft green
    },
    {
      title: 'MSF Members',
      count: 124,
      icon: <FaUsers className="text-3xl text-blue-600" />,
      bg: 'bg-[#dbeafe]', // soft blue
    },
    {
      title: 'Haritha Team',
      count: 39,
      icon: <FaLeaf className="text-3xl text-lime-600" />,
      bg: 'bg-[#f7fee7]', // soft lime
    },
    {
      title: 'Pending Approvals',
      count: 5,
      icon: <FaUserShield className="text-3xl text-red-600" />,
      bg: 'bg-[#fee2e2]', // soft red
    },
  ];

  return (
    <div className="p-6 md:ml min-h-screen bg-[#f0fbf4]">
      <h1 className="text-3xl font-semibold mb-6 text-gray-700">Dashboard Overview</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, idx) => (
          <div
            key={idx}
            className={`rounded-xl p-5 shadow-md ${card.bg} hover:scale-[1.02] transition-transform`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">{card.title}</p>
                <h2 className="text-2xl font-bold">{card.count}</h2>
              </div>
              {card.icon}
            </div>
          </div>
        ))}
      </div>
      <AdminActions/>
      {/* Recent Activity */}
      <div className="mt-10 p-6 rounded-lg shadow-md bg-[#e6f5ec]">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Recent Activities</h2>
        <ul className="space-y-3 text-sm text-gray-700">
          <li>✅ <span className="font-medium">MSF Unit Cheekode</span> added 2 new members</li>
          <li>🕒 <span className="font-medium">Haritha Committee</span> report updated</li>
          <li>🔄 <span className="font-medium">Unit Ponnad</span> submitted an update request</li>
          <li>⚠️ <span className="font-medium">5 registrations</span> pending approval</li>
        </ul>
      </div>
    </div>
  );
};

export default DashboardPage;
