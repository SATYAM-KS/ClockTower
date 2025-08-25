import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Clock, Users, Star, Plus } from 'lucide-react';
import Header from '../components/Header';
import './Events.css';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  category: 'safety' | 'community' | 'awareness' | 'training';
  attendees: number;
  maxAttendees?: number;
  isSpecial: boolean;
}

const Events: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'today' | 'upcoming' | 'special'>('all');

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setEvents([
        {
          id: '1',
          title: 'Community Safety Workshop',
          description: 'Learn essential safety techniques and emergency response',
          date: '2024-01-16',
          time: '10:00 AM',
          location: 'Community Center Hall A',
          category: 'training',
          attendees: 45,
          maxAttendees: 60,
          isSpecial: true
        },
        {
          id: '2',
          title: 'Neighborhood Watch Meeting',
          description: 'Monthly meeting to discuss local safety concerns',
          date: '2024-01-16',
          time: '7:00 PM',
          location: 'City Hall Conference Room',
          category: 'community',
          attendees: 28,
          maxAttendees: 40,
          isSpecial: false
        },
        {
          id: '3',
          title: 'Self-Defense Class for Women',
          description: 'Free self-defense training session for women',
          date: '2024-01-17',
          time: '6:00 PM',
          location: 'Recreation Center Gym',
          category: 'training',
          attendees: 32,
          maxAttendees: 25,
          isSpecial: true
        },
        {
          id: '4',
          title: 'Crime Prevention Awareness Walk',
          description: 'Community walk to raise awareness about crime prevention',
          date: '2024-01-18',
          time: '9:00 AM',
          location: 'Central Park Main Entrance',
          category: 'awareness',
          attendees: 67,
          isSpecial: false
        }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'safety': return 'bg-red-100 text-red-800';
      case 'community': return 'bg-blue-100 text-blue-800';
      case 'awareness': return 'bg-green-100 text-green-800';
      case 'training': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const isToday = (dateString: string) => {
    const today = new Date().toISOString().split('T')[0];
    return dateString === today;
  };

  const filteredEvents = events.filter(event => {
    switch (filter) {
      case 'today': return isToday(event.date);
      case 'upcoming': return new Date(event.date) > new Date();
      case 'special': return event.isSpecial;
      default: return true;
    }
  });

  if (loading) {
    return (
      <div className="events-page">
        <Header title="Events" />
        <div className="events-loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="events-page">
      <Header title="Events" />
      {/* Filter Tabs */}
      <div className="events-filter-tabs">
        {['all', 'today', 'upcoming', 'special'].map((filterType) => (
          <button
            key={filterType}
            onClick={() => setFilter(filterType as any)}
            className={`events-filter-btn${filter === filterType ? ' events-filter-btn-active' : ''}`}
          >
            {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
          </button>
        ))}
      </div>
      {/* Today's Special Events */}
      {events.some(e => isToday(e.date) && e.isSpecial) && (
        <div className="events-banner">
          <div className="events-banner-icon">
            <Star size={20} />
          </div>
          <div className="events-banner-content">
            <h3>TODAY'S SPECIAL EVENTS</h3>
            <p>Don't miss these important events happening today</p>
          </div>
        </div>
      )}
      {/* Add Event Button */}
      <div className="events-add-btn">
        <button className="events-action-btn events-action-btn-primary">
          <Plus size={20} />
          <span>Create New Event</span>
        </button>
      </div>
      {/* Events List */}
      <div className="events-list">
        {filteredEvents.length === 0 ? (
          <div className="events-card events-card-empty">
            <Calendar size={48} className="events-empty-icon" />
            <h3 className="events-title">No Events Found</h3>
            <p className="events-description">No events match your current filter.</p>
          </div>
        ) : (
          filteredEvents.map((event) => (
            <div key={event.id} className="events-card">
              <div className="events-card-header">
                <span className={`events-category events-category-${event.category}`}>{event.category.toUpperCase()}</span>
                {event.isSpecial && <Star size={16} className="events-special-star" />}
                {isToday(event.date) && <span className="events-today-badge">TODAY</span>}
              </div>
              <h4 className="events-title">{event.title}</h4>
              <p className="events-description">{event.description}</p>
              <div className="events-meta">
                <div className="events-meta-item"><Calendar size={16} /> {event.date}</div>
                <div className="events-meta-item"><Clock size={16} /> {event.time}</div>
                <div className="events-meta-item"><MapPin size={16} /> {event.location}</div>
                <div className="events-meta-item"><Users size={16} /> {event.attendees}{event.maxAttendees && `/${event.maxAttendees}`} attending</div>
              </div>
              <div className="events-divider"></div>
              <div className="events-card-actions">
                <button className="events-action-btn events-action-btn-secondary">View Details</button>
                <button className="events-action-btn events-action-btn-primary">
                  {event.maxAttendees && event.attendees >= event.maxAttendees ? 'Waitlist' : 'Join Event'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      {/* Event Statistics */}
      <div className="events-stats">
        <h3 className="events-stats-title">Event Statistics</h3>
        <div className="events-stats-grid">
          <div className="events-stats-item">
            <div className="events-stats-value events-stats-primary">{events.filter(e => isToday(e.date)).length}</div>
            <div className="events-stats-label">Today's Events</div>
          </div>
          <div className="events-stats-item">
            <div className="events-stats-value events-stats-yellow">{events.filter(e => e.isSpecial).length}</div>
            <div className="events-stats-label">Special Events</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Events;