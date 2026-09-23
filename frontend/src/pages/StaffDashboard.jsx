import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { supabase } from '../supabaseClient.js';
import { Alert, Loading } from '../components/Ui.jsx';

export default function StaffDashboard() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [departmentName, setDepartmentName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDepartmentQueue();
  }, [user]);

  const fetchDepartmentQueue = async () => {
    try {
      setLoading(true);
      
      // 1. Get Mr. Tabalaza's (or current user's) profile to find their department_id
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('department_id, categories(name)')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      
      // If they don't have a department assigned, stop here
      if (!profile.department_id) {
        setError('Your account is not assigned to a maintenance department.');
        setLoading(false);
        return;
      }

      setDepartmentName(profile.categories.name);

      // 2. Fetch only the tickets that match this specific department
      const { data: queue, error: queueError } = await supabase
        .from('maintenance_tickets')
        .select(`
          id, 
          description, 
          status, 
          urgency, 
          residence_building, 
          room_number, 
          created_at,
          assigned_to
        `)
        .eq('category_id', profile.department_id)
        .order('created_at', { ascending: false });

      if (queueError) throw queueError;
      
      setTickets(queue);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Action: Accept a job
  const handleAcceptJob = async (ticketId) => {
    try {
      const { error } = await supabase
        .from('maintenance_tickets')
        .update({ 
          status: 'in_progress', 
          assigned_to: user.id 
        })
        .eq('id', ticketId);

      if (error) throw error;
      
      // Refresh the UI to show the ticket is now accepted
      setTickets(tickets.map(t => 
        t.id === ticketId ? { ...t, status: 'in_progress', assigned_to: user.id } : t
      ));
    } catch (err) {
      alert(`Failed to accept job: ${err.message}`);
    }
  };

  // Action: Mark job as resolved
  const handleResolveJob = async (ticketId) => {
    try {
      const { error } = await supabase
        .from('maintenance_tickets')
        .update({ status: 'resolved' })
        .eq('id', ticketId);

      if (error) throw error;
      
      setTickets(tickets.map(t => 
        t.id === ticketId ? { ...t, status: 'resolved' } : t
      ));
    } catch (err) {
      alert(`Failed to resolve job: ${err.message}`);
    }
  };

  if (loading) return <Loading label="Loading department queue..." />;

  return (
    <div className="staff-dashboard">
      <header style={{ marginBottom: '2rem' }}>
        <h1>{departmentName} Department Queue</h1>
        <p>Review and assign incoming maintenance faults.</p>
      </header>

      {error && <Alert type="error">{error}</Alert>}

      <div className="ticket-grid" style={{ display: 'grid', gap: '1rem' }}>
        {tickets.length === 0 ? (
          <p>No active faults for your department. Great job!</p>
        ) : (
          tickets.map(ticket => (
            <div 
              key={ticket.id} 
              className="ticket-card" 
              style={{ 
                border: '1px solid #e2e8f0', 
                padding: '1.5rem', 
                borderRadius: '8px',
                backgroundColor: ticket.status === 'resolved' ? '#f8fafc' : '#ffffff'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span style={{ fontWeight: 'bold' }}>
                  {ticket.residence_building} - Room {ticket.room_number}
                </span>
                <span style={{ 
                  padding: '4px 8px', 
                  borderRadius: '4px', 
                  fontSize: '0.875rem',
                  backgroundColor: ticket.urgency === 'high' ? '#fee2e2' : '#f1f5f9',
                  color: ticket.urgency === 'high' ? '#ef4444' : '#475569'
                }}>
                  {ticket.status.toUpperCase()}
                </span>
              </div>
              
              <p style={{ marginBottom: '1.5rem', color: '#334155' }}>
                {ticket.description}
              </p>

              <div className="ticket-actions" style={{ display: 'flex', gap: '1rem' }}>
                {ticket.status === 'open' && (
                  <button 
                    onClick={() => handleAcceptJob(ticket.id)}
                    style={{ background: '#3586DA', color: 'white', padding: '8px 16px', borderRadius: '4px', border: 'none', cursor: 'pointer' }}
                  >
                    Accept Job
                  </button>
                )}
                
                {ticket.status === 'in_progress' && ticket.assigned_to === user.id && (
                  <button 
                    onClick={() => handleResolveJob(ticket.id)}
                    style={{ background: '#10b981', color: 'white', padding: '8px 16px', borderRadius: '4px', border: 'none', cursor: 'pointer' }}
                  >
                    Mark Resolved
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}