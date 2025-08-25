import React from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';

const FloatingButton: React.FC = () => {
  return (
    <Link to="/report" className="floating-button">
      <button className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
        <Plus size={24} />
      </button>
    </Link>
  );
};

export default FloatingButton;