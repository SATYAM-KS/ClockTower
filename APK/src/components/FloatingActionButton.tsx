import React from 'react';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './FloatingActionButton.css';

const FloatingActionButton: React.FC = () => {
  const navigate = useNavigate();

  const handleReportIncident = () => {
    navigate('/report', { state: { fromHome: true } });
  };

  return (
    <button
      className="floating-action-button"
      onClick={handleReportIncident}
      title="Report Incident"
      aria-label="Report Incident"
    >
      <Plus size={24} />
    </button>
  );
};

export default FloatingActionButton;
