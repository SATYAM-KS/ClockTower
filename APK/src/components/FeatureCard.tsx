import React from 'react';
import { Link, To } from 'react-router-dom';
import { DivideIcon as LucideIcon } from 'lucide-react';
import './FeatureCard.css';

interface FeatureCardProps {
  title: string;
  icon: typeof LucideIcon;
  to: string;
  state?: any;
  className?: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ 
  title, 
  icon: Icon, 
  to, 
  state,
  className = '' 
}) => {
  return (
    <Link to={to} state={state} className={`feature-card ${className}`} tabIndex={0}>
      <div className="feature-card-inner">
        <div className="icon-bg">
          <Icon size={40} />
        </div>
        <h3 className="feature-title">{title}</h3>
      </div>
    </Link>
  );
};

export default FeatureCard;