import React from 'react';
import { ArrowLeft, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Header.css';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  onHamburgerClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ title = '', showBack = false, onHamburgerClick }) => {
  const navigate = useNavigate();

  return (
    <header className="header gradient-bg">
      <div className="header-inner">
        <div className="header-side left">
          {showBack && (
            <button onClick={() => navigate(-1)} className="header-icon-btn">
              <ArrowLeft size={20} />
            </button>
          )}
        </div>

        <h1 className="header-title">{title}</h1>

        <div className="header-side right">
          <button
            className="header-icon-btn header-hamburger"
            onClick={() => {
              console.log('Hamburger menu clicked (desktop header)');
              if (onHamburgerClick) onHamburgerClick();
            }}
            aria-label="Open menu"
          >
            <Menu size={26} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
