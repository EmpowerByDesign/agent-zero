import React from 'react';

const TopNav: React.FC = () => {
  const taskDate = new Date('2025-09-15T12:20:59-04:00');
  const formattedDate = taskDate.toLocaleString();

  return (
    <nav className="flex justify-between items-center p-4 bg-gray-800 text-white shadow-md">
      <div className="flex space-x-6">
        <a href="#" className="hover:text-gray-300">Chats</a>
        <a href="#" className="hover:text-gray-300">Tasks</a>
        <a href="#" className="hover:text-gray-300">Settings</a>
      </div>
      <div className="flex items-center space-x-4">
        <span className="text-sm">{formattedDate}</span>
        <div className="text-2xl cursor-pointer">🔔</div>
      </div>
    </nav>
  );
};

export default TopNav;
