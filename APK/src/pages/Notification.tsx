import { useEffect, useState } from 'react';
import './Notification.css';
import Header from '../components/Header';
import { supabase } from '../supabaseClient';


interface NotificationItem {
  id: string;
  sender_id: string;
  message: string;
  read: boolean;
  created_at: string;
  sender?: {
    username?: string;
  };
}

interface NotificationRequest {
  id: string;
  requester_id: string;
  status?: string;
  requester?: {
    username?: string;
    email?: string;
    phone?: string;
  } | null;
  fromPhone?: string;
  message?: string;
  relationship?: string;
}

const Notification: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [requests, setRequests] = useState<NotificationRequest[]>([]);

  // Fetch SOS notifications
  useEffect(() => {
    async function fetchNotifications() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const oneHourAgo = new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('notifications')
        .select('id, sender_id, message, read, created_at, sender:sender_id (username)')
        .eq('recipient_id', user.id)
        .gte('created_at', oneHourAgo)
        .order('created_at', { ascending: false });
      if (!error && data) setNotifications(data.map(n => ({
        ...n,
        sender: Array.isArray(n.sender) ? n.sender[0] : n.sender
      })));
    }
    fetchNotifications();
  }, []);

  // Fetch emergency contact requests
  useEffect(() => {
    async function fetchRequests() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from('emergency_contact_requests')
        .select('id, requester_id, status, relationship, requester:requester_id (username, email, phone)')
        .eq('target_id', user.id)
        .eq('status', 'pending');
      if (!error && data) setRequests(data.map(req => ({ ...req, requester: Array.isArray(req.requester) ? req.requester[0] : req.requester })));
    }
    fetchRequests();
  }, []);

  // Accept request logic
  const handleAccept = async (id: string, requester_id: string, relationship?: string) => {
    // Update request to accepted
    const { error: updateError } = await supabase
      .from('emergency_contact_requests')
      .update({ status: 'accepted' })
      .eq('id', id);
    if (updateError) {
      alert('Failed to update request: ' + updateError.message);
      return;
    }
    // Add to emergency_contacts
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error: insertError } = await supabase.from('emergency_contacts').insert([
        { user_id: requester_id, contact_id: user.id, relationship: relationship || null }
      ]);
      if (insertError) {
        alert('Failed to add to emergency contacts: ' + insertError.message);
        return;
      }
      // Optionally, notify the requester
      await supabase.from('notifications').insert([
        {
          recipient_id: requester_id,
          sender_id: user.id,
          message: `${user.email || 'A user'} accepted your emergency contact request!`,
          read: false
        }
      ]);
    }
    setRequests(requests.filter(req => req.id !== id));
  };

  // Decline request logic
  const handleDecline = async (id: string, requester_id: string) => {
    await supabase
      .from('emergency_contact_requests')
      .update({ status: 'declined' })
      .eq('id', id);
    // Optionally, notify the requester
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('notifications').insert([
        {
          recipient_id: requester_id,
          sender_id: user.id,
          message: `${user.email || 'A user'} declined your emergency contact request.`,
          read: false
        }
      ]);
    }
    setRequests(requests.filter(req => req.id !== id));
  };

  return (
    <>
      <Header title="Notifications" showBack={true} />
      <div className="notification-page">
        <h3>SOS Alerts</h3>
        {notifications.length === 0 ? (
          <div className="notification-empty">No new notifications.</div>
        ) : (
          <ul className="notification-list">
            {notifications.map(n => (
              <li key={n.id} className="notification-item">
                <span className="notification-message">
                  <strong>{n.sender?.username}</strong> needs help!<br />
                  <span style={{ fontSize: '0.95em', color: '#666' }}>
                    {new Date(n.created_at).toLocaleString()}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
        <h3>Contact Requests</h3>
        {requests.length === 0 ? (
          <div className="notification-empty">No new contact requests.</div>
        ) : (
          <ul className="notification-list">
            {requests.map(req => (
              <li key={req.id} className="notification-item">
                <span className="notification-message">
                  {req.requester?.username || req.requester?.email || req.requester_id} wants to add you as an emergency contact.
                  {req.relationship ? ` (Relationship: ${req.relationship})` : ''}
                </span>
                <div className="notification-actions">
                  <button className="notification-accept" onClick={() => handleAccept(req.id, req.requester_id, req.relationship)}>Accept</button>
                  <button className="notification-decline" onClick={() => handleDecline(req.id, req.requester_id)}>Decline</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
};

export default Notification; 