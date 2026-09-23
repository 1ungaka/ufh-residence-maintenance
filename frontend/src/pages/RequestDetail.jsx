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
import { isStaff } from '../utils/roles.js';
import { shortRef } from '../components/RequestTable.jsx';
import { defaultStatusText, parseUpdate, statusMessage, STATUS_HEADLINE } from '../utils/updates.js';

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
  const [visitNote, setVisitNote] = useState('');
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

    const { data: category } = await supabase
      .from('categories')
      .select('name')
      .eq('id', ticket.category_id)
      .maybeSingle();

    const { data: history, error: hErr } = await supabase
      .from('ticket_updates')
      .select('*, author:profiles!updated_by(full_name, role)')
      .eq('ticket_id', id)
      .order('created_at', { ascending: true });

    if (hErr) throw hErr;

    const studentName = ticket.reporter?.full_name || 'Student';

    // The ticket itself is the first entry, so the history always starts at "Fault logged".
    const timeline = [
      {
        id: 'logged',
        created_at: ticket.created_at,
        status: 'logged',
        headline: STATUS_HEADLINE.logged,
        text: '',
        author_name: studentName,
        author_is_student: true
      },
      ...history.map((u) => {
        const { status, text } = parseUpdate(u.update_message);
        const fromStudent = u.updated_by === ticket.reported_by;
        const name = u.author?.full_name || (fromStudent ? studentName : 'Maintenance staff');
        return {
          id: u.id,
          created_at: u.created_at,
          status,
          headline: status
            ? STATUS_HEADLINE[status] || 'Status changed'
            : fromStudent ? 'Comment from the student' : `Update from ${name.split(' ')[0]}`,
          text,
          author_name: name,
          author_is_student: fromStudent
        };
      })
    ];

    return {
      request: {
        id: ticket.id,
        category: category?.name || 'General',
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
        reported_by: ticket.reported_by,
        assigned_name: ticket.assignee?.full_name,
        assigned_trade: ticket.assignee?.role,
        photo_url: ticket.photo_url
      },
      updates: timeline
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
      setVisitNote('');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const myName = user?.user_metadata?.full_name;

  // Row-level security can silently match zero rows instead of raising an error,
  // so ask for the updated row back and treat "nothing came back" as refused.
  const updateTicket = async (changes) => {
    const { data: rows, error: err } = await supabase
      .from('maintenance_tickets')
      .update(changes)
      .eq('id', id)
      .select('id');
    if (err) throw err;
    if (!rows || rows.length === 0) throw new Error('You are not allowed to change this request.');
  };

  const postUpdate = async (updateMessage) => {
    const { error: err } = await supabase
      .from('ticket_updates')
      .insert({ ticket_id: id, updated_by: user.id, update_message: updateMessage });
    if (err) throw err;
  };

  const assignToMe = async (visitNote) => {
    await updateTicket({ assigned_to: user.id, status: 'assigned' });
    await postUpdate(statusMessage('assigned', visitNote.trim() || defaultStatusText('assigned', myName)));
  };

  const updateStatus = async (newStatus, comment) => {
    await updateTicket({ status: newStatus });
    await postUpdate(statusMessage(newStatus, comment.trim() || defaultStatusText(newStatus, myName)));
  };

  const addNote = (noteText) => postUpdate(noteText.trim());

  if (error && !data) return <Alert type="error">{error}</Alert>;
  if (!data) {
    return (
      <div className="card">
        <SkeletonTable rows={4} />
      </div>
    );
  }

  const { request, updates } = data;
  const isMaintenance = isStaff(user);
  const isMine = request.assigned_to === user.id;
  const isReporter = !isMaintenance && request.reported_by === user.id;
  const isOpen = request.status !== 'resolved';
  const next = NEXT_STATUS[request.status];

  return (
    <>
      <div className="detail-banner">
        <div>
          <h1>
            {shortRef(request.id)} &middot; {request.category}
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
              <dd>{shortRef(request.id)}</dd>

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
                <div className="field">
                  <p>No one has taken this job yet.</p>
                  <label htmlFor="visit-note">Message to the student (optional)</label>
                  <textarea
                    id="visit-note"
                    className="short"
                    value={visitNote}
                    onChange={(event) => setVisitNote(event.target.value)}
                    placeholder="I'll come to your room tomorrow between 10:00 and 12:00. Please make sure someone is there."
                  />
                  <p className="hint">The student sees this in the request history and on their dashboard.</p>
                  <div className="form-actions">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => run(() => assignToMe(visitNote), 'Job accepted. The student can see your message.')}
                    >
                      Accept this job
                    </button>
                  </div>
                </div>
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
                      <label htmlFor="status-comment">Message to the student (optional)</label>
                      <textarea
                        id="status-comment"
                        className="short"
                        value={statusComment}
                        onChange={(event) => setStatusComment(event.target.value)}
                        placeholder={next.status === 'resolved'
                          ? 'Replaced the damaged light fitting. Everything is working again.'
                          : 'On my way now. I will need about an hour.'}
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
                    <textarea
                      id="note"
                      className="short"
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                      placeholder="Checked the light fitting. Waiting for a replacement part, back on Thursday."
                    />
                    <p className="hint">Progress notes are shown to the student.</p>
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

          {isReporter && isOpen && (
            <div className="field timeline-reply">
              <label htmlFor="student-comment">Add a comment for the tradesperson</label>
              <textarea
                id="student-comment"
                className="short"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="I'm in my room after 14:00 on weekdays. The light flickers before it goes off."
              />
              <div className="form-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={busy || note.trim().length < 3}
                  onClick={() => run(() => addNote(note), 'Comment added.')}
                >
                  Add comment
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>
        Back
      </button>
    </>
  );
}