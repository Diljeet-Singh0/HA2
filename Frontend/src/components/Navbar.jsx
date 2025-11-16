import React from 'react';

const Navbar = ({ user, logout }) => {
  return (
    <nav
      className="
        relative
        bg-gradient-to-r from-slate-800 via-slate-900 to-gray-900
        border-b border-gray-700
        shadow-2xl
        transition-all duration-300
        mb-6
      "
    >
      <div className="px-6 sm:px-8">
        <div className="flex justify-between items-center h-16">

          {/* Brand */}
          <h1 className="
            text-xl font-bold text-white tracking-tight
            drop-shadow-md select-none
          ">
            <span className="
              px-4 py-2 rounded-lg
             
              backdrop-blur-sm
              border border-blue-400/30
              shadow-lg
            ">
              Complaint Management System
            </span>
          </h1>

          {/* Mobile Role */}
          <div className="sm:hidden">
            <span className="
              text-white text-sm font-medium
              bg-gray-700/80 px-3 py-1.5 rounded-md
              border border-gray-600
              shadow
            ">
              {user.role}
            </span>
          </div>

          {/* Desktop Info */}
          <div className="hidden sm:flex items-center space-x-6">

            <div className="flex flex-col items-end leading-tight">
              <span className="text-xs text-gray-300 font-medium">Welcome</span>
              <span className="text-white font-semibold text-base">
                {user.name}
                <span className="text-gray-400 text-sm ml-1">({user.role})</span>
              </span>
            </div>

            <div className="w-px h-7 bg-gray-600"></div>

            {/* Logout Button */}
            <button
              onClick={logout}
              className="
                bg-gradient-to-r from-red-600 to-red-700
                hover:from-red-700 hover:to-red-800
                text-white px-5 py-2.5
                rounded-lg
                font-medium
                border border-red-500/30
                shadow-lg
                transition-all duration-200
                hover:shadow-xl
                flex items-center space-x-2
                hover:scale-105 active:scale-95
              "
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Logout</span>
            </button>

          </div>

          {/* Mobile Logout */}
          <div className="sm:hidden">
            <button
              onClick={logout}
              className="
                bg-red-600 hover:bg-red-700
                text-white p-2.5
                rounded-lg
                border border-red-500/30
                shadow-lg
                active:scale-95
                transition-all duration-200
              "
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>

        </div>
      </div>
    </nav>
  );
};

export default Navbar;