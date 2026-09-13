/**
 * Request details and update history.
 * Refactored to fetch and update data directly from Supabase.
 */
import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Alert, SkeletonTable, StatusBadge, Timeline, Toast, UrgencyLabel } from '../components/Ui.jsx';
import { formatDateTime, timeAgo } from '../utils/format.js';

/** Mapped to your Supabase database enum states */
const NEXT_STATUS = {
  assigned: { status: 'in_progress', label: 'Start work' },
  in_progress: { status: 'resolved', label: 'Mark as completed' },
  resolved: null
};

export default function RequestDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [data, setData] = useState(null);
  const [note, setNote] = useState('');
  const [statusComment, setStatusComment] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState(location.state?.flash || '');
  const [busy, setBusy] = useState(false);

  // Helper to fetch the ticket, join profile data, and format it for your existing UI
  const fetchFullTicket = async () => {
    const { data: ticket, error: tErr } = await supabase
      .from('maintenance_tickets')
      .select('*, reporter:profiles!reported_by(full_name, student_number), assignee:profiles!assigned_to(full_name, role)')
      .eq('id', id)
      .single();

    if (tErr) throw tErr;

    const { data: history, error: hErr } = await supabase
      .from('ticket_updates')
      .select('*, author:profiles!updated_by(full_name)')
      .eq('ticket_id', id)
      .order('created_at', { ascending: true });

    if (hErr) throw hErr;

    return {
      request: {
        id: ticket.id,
        category: ticket.category_id,
        residence: ticket.residence_building,
        room: ticket.room_number,
        urgency: ticket.urgency,
        description: ticket.description,
        status: ticket.status,
        created_at: ticket.created_at,
        updated_at: ticket.updated_at,
        completed_at: ticket.status === 'resolved' ? ticket.updated_at : null,
        student_name: ticket.reporter?.full_name || 'Student',
        student_email: ticket.reporter?.student_number ? `${ticket.reporter.student_number}@ufh.ac.za` : '',
        assigned_to: ticket.assigned_to,
        assigned_name: ticket.assignee?.full_name,
        assigned_trade: ticket.assignee?.role,
        photo_url: ticket.photo_url
      },
      updates: history.map(u => ({
        id: u.id,
        created_at: u.created_at,
        author_name: u.author?.full_name || 'Staff',
        message: u.update_message
      }))
    };
  };

  useEffect(() => {
    fetchFullTicket()
      .then(setData)
      .catch((err) => setError(err.message));
  }, [id]);

  const run = async (actionFn, successMessage) => {
    setError('');
    setMessage('');
    setBusy(true);
    try {
      await actionFn();
      const updatedData = await fetchFullTicket();
      setData(updatedData);
      setMessage(successMessage);
      setNote('');
      setStatusComment('');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  // Supabase action functions to replace your previous API calls
  const assignToMe = async () => {
    await supabase.from('maintenance_tickets').update({ assigned_to: user.id, status: 'assigned' }).eq('id', id);
    await supabase.from('ticket_updates').insert({ ticket_id: id, updated_by: user.id, update_message: 'Job assigned and claimed.' });
  };

  const updateStatus = async (newStatus, comment) => {
    await supabase.from('maintenance_tickets').update({ status: newStatus }).eq('id', id);
    await supabase.from('ticket_updates').insert({ ticket_id: id, updated_by: user.id, update_message: comment || `Status changed to ${newStatus.replace('_', ' ')}.` });
  };

  const addNote = async (noteText) => {
    await supabase.from('ticket_updates').insert({ ticket_id: id, updated_by: user.id, update_message: noteText });
  };

  if (error && !data) return <Alert type="error">{error}</Alert>;
  if (!data) {
    return (
      <div className="card">
        <SkeletonTable rows={4} />
      </div>
    );
  }

  const { request, updates } = data;
  const isMaintenance = ['maintenance', 'tradesperson', 'facilities_admin'].includes(user?.user_metadata?.role);
  const isMine = request.assigned_to === user.id;
  const next = NEXT_STATUS[request.status];

  return (
    <>
      <div className="detail-banner">
        <div>
          <h1>
            #{request.id.slice(0, 8)} &middot; {request.category}
          </h1>
          <div className="meta">
            {request.residence}, room {request.room} &middot; logged {timeAgo(request.created_at)}
          </div>
        </div>
        <div className="spacer" />
        <StatusBadge status={request.status} />
        <UrgencyLabel urgency={request.urgency} />
      </div>

      <Toast message={message} onDone={() => setMessage('')} />
      <Alert type="error">{error}</Alert>

      <div className="detail-grid">
        <div>
          <div className="card">
            <h2>Fault details</h2>
            <dl className="definitions">
              <dt>Reference</dt>
              <dd>#{request.id.slice(0, 8)}</dd>

              <dt>Student</dt>
              <dd>
                {request.student_name}
                {isMaintenance && request.student_email ? ` (${request.student_email})` : ''}
              </dd>

              <dt>Residence</dt>
              <dd>{request.residence}</dd>

              <dt>Room</dt>
              <dd>{request.room}</dd>

              <dt>Urgency</dt>
              <dd>
                <UrgencyLabel urgency={request.urgency} />
              </dd>

              <dt>Description</dt>
              <dd>{request.description}</dd>

              <dt>Status</dt>
              <dd>
                <StatusBadge status={request.status} />
              </dd>

              <dt>Assigned to</dt>
              <dd>
                {request.assigned_name
                  ? `${request.assigned_name}${request.assigned_trade ? ` (${request.assigned_trade})` : ''}`
                  : 'Not yet taken by a tradesperson'}
              </dd>

              <dt>Submitted</dt>
              <dd>{formatDateTime(request.created_at)}</dd>

              <dt>Last updated</dt>
              <dd>{formatDateTime(request.updated_at)}</dd>

              <dt>Completed</dt>
              <dd>{request.completed_at ? formatDateTime(request.completed_at) : 'Not yet'}</dd>
            </dl>

            {/* Supabase returns the public photo URL directly, no need for blob generation */}
            {request.photo_url && (
              <>
                <h3 style={{ marginTop: '20px' }}>Photo from the student</h3>
                <img className="photo" src={request.photo_url} alt="Reported maintenance problem" />
              </>
            )}
          </div>

          {isMaintenance && (
            <div className="card action-panel">
              <h2>Actions</h2>

              {!request.assigned_to && (
                <>
                  <p>No one has taken this job yet.</p>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => run(assignToMe, 'Job assigned to you.')}
                  >
                    Assign to me
                  </button>
                </>
              )}

              {request.assigned_to && !isMine && (
                <Alert type="info">
                  This job belongs to {request.assigned_name}. Only they can update it.
                </Alert>
              )}

              {isMine && (
                <>
                  {next ? (
                    <div className="field">
                      <label htmlFor="status-comment">Note to go with the status change (optional)</label>
                      <input
                        id="status-comment"
                        value={statusComment}
                        onChange={(event) => setStatusComment(event.target.value)}
                        placeholder="Replaced damaged light fitting."
                      />
                      <div className="form-actions">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => run(() => updateStatus(next.status, statusComment), `Status changed to ${next.label}.`)}
                        >
                          {next.label}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <Alert type="info">This request is resolved. No further changes are possible.</Alert>
                  )}

                  <div className="field" style={{ marginTop: '14px' }}>
                    <label htmlFor="note">Add a progress note</label>
                    <input
                      id="note"
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                      placeholder="Checked the light fitting. Replacement bulb required."
                    />
                    <div className="form-actions">
                      <button
                        type="button"
                        className="btn-secondary"
                        disabled={busy || note.trim().length < 3}
                        onClick={() => run(() => addNote(note), 'Note added.')}
                      >
                        Add note
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="card">
          <h2>History</h2>
          <Timeline updates={updates} />
        </div>
      </div>

      <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>
        Back
      </button>
    </>
  );
}