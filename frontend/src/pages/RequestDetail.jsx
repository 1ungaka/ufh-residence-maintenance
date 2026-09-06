/**
 * Request details and update history.
 *
 * A student sees the facts and the history. The maintenance worker sees the
 * same, plus the action panel: take the job, move the status forward and add
 * progress notes.
 */
import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { api, fetchRequestImage } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Alert, SkeletonTable, StatusBadge, Timeline, Toast, UrgencyLabel } from '../components/Ui.jsx';
import { formatDateTime, timeAgo } from '../utils/format.js';

/** What the assigned worker can do next, given the current status. */
const NEXT_STATUS = {
  Assigned: { status: 'In Progress', label: 'Start work' },
  'In Progress': { status: 'Completed', label: 'Mark as completed' },
  Completed: { status: 'Closed', label: 'Close request' }
};

export default function RequestDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [data, setData] = useState(null);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [note, setNote] = useState('');
  const [statusComment, setStatusComment] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState(location.state?.flash || '');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .getRequest(id)
      .then(setData)
      .catch((err) => setError(err.message));
  }, [id]);

  useEffect(() => {
    if (!data?.request?.has_image) return undefined;
    let objectUrl;
    fetchRequestImage(id)
      .then((url) => {
        objectUrl = url;
        setPhotoUrl(url);
      })
      .catch(() => {});
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [data?.request?.has_image, id]);

  const run = async (action, successMessage) => {
    setError('');
    setMessage('');
    setBusy(true);
    try {
      const result = await action();
      setData(result);
      setMessage(successMessage);
      setNote('');
      setStatusComment('');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
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
  const isMaintenance = user.role === 'maintenance';
  const isMine = request.assigned_to === user.id;
  const next = NEXT_STATUS[request.status];

  return (
    <>
      <div className="detail-banner">
        <div>
          <h1>
            #{request.id} &middot; {request.category}
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
              <dd>#{request.id}</dd>

              <dt>Student</dt>
              <dd>
                {request.student_name}
                {isMaintenance && request.student_email ? ` (${request.student_email})` : ''}
              </dd>

              <dt>Residence</dt>
              <dd>{request.residence}</dd>

              <dt>Room</dt>
              <dd>{request.room}</dd>

              <dt>Category</dt>
              <dd>{request.category}</dd>

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

            {photoUrl && (
              <>
                <h3 style={{ marginTop: '20px' }}>Photo from the student</h3>
                <img className="photo" src={photoUrl} alt="Reported maintenance problem" />
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
                    onClick={() =>
                      run(() => api.assignRequest(request.id), 'Job assigned to you.')
                    }
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
                          onClick={() =>
                            run(
                              () => api.updateStatus(request.id, next.status, statusComment),
                              `Status changed to ${next.status}.`
                            )
                          }
                        >
                          {next.label}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <Alert type="info">This request is closed. No further changes are possible.</Alert>
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
                        onClick={() => run(() => api.addNote(request.id, note), 'Note added.')}
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
