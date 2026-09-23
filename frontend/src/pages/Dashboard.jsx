/** Dashboard. The Supabase queries return different shapes per role, so one page serves both. */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Alert, Empty, SkeletonStats, SkeletonTable, Stat } from '../components/Ui.jsx';
import RequestTable, { shortRef } from '../components/RequestTable.jsx';
import { formatHours, timeAgo } from '../utils/format.js';
import { parseUpdate, STATUS_HEADLINE } from '../utils/updates.js';
import { isStaff } from '../utils/roles.js';

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const fullName = user?.user_metadata?.full_name || 'Student';
  const isMaintenance = isStaff(user);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        if (!isMaintenance) {
          // --- STUDENT DASHBOARD ---
          const { data: tickets, error: tErr } = await supabase
            .from('maintenance_tickets')
            .select('*')
            .eq('reported_by', user.id)
            .order('created_at', { ascending: false });

          if (tErr) throw tErr;

          const counts = {
            total: tickets.length,
            Submitted: tickets.filter((t) => t.status === 'logged').length,
            Assigned: tickets.filter((t) => t.status === 'assigned').length,
            'In Progress': tickets.filter((t) => t.status === 'in_progress').length,
            Completed: tickets.filter((t) => t.status === 'resolved').length,
            Closed: 0
          };

          // Latest messages from maintenance staff on this student's requests.
          let latest = [];
          if (tickets.length > 0) {
            const { data: rows } = await supabase
              .from('ticket_updates')
              .select('id, ticket_id, update_message, created_at, updated_by, author:profiles!updated_by(full_name)')
              .in('ticket_id', tickets.map((t) => t.id))
              .neq('updated_by', user.id)
              .order('created_at', { ascending: false })
              .limit(5);
            latest = rows || [];
          }

          setData({
            role: 'student',
            counts,
            recent: tickets.slice(0, 5),
            latest
          });
        } else {
          // --- MAINTENANCE DASHBOARD ---
          const { data: tickets, error: tErr } = await supabase
            .from('maintenance_tickets')
            .select('*, reporter:profiles!reported_by(full_name, student_number)')
            .order('created_at', { ascending: false });

          if (tErr) throw tErr;

          const counts = {
            open: tickets.filter((t) => t.status === 'logged').length,
            assigned_to_me: tickets.filter((t) => t.status !== 'resolved' && t.assigned_to === user.id).length,
            in_progress: tickets.filter((t) => t.status === 'in_progress').length,
            completed: tickets.filter((t) => t.status === 'resolved').length
          };

          const unresolved = tickets.filter((t) => t.status !== 'resolved');
          
          // Sort by urgency first (High -> Medium -> Low), then by wait time (oldest first)
          const urgencyWeight = { High: 3, Medium: 2, Low: 1 };
          unresolved.sort((a, b) => {
            if (urgencyWeight[b.urgency] !== urgencyWeight[a.urgency]) {
              return (urgencyWeight[b.urgency] || 0) - (urgencyWeight[a.urgency] || 0);
            }
            return new Date(a.created_at) - new Date(b.created_at);
          });

          // Calculate average resolution time for completed jobs
          const resolved = tickets.filter((t) => t.status === 'resolved');
          let avgHours = 0;
          if (resolved.length > 0) {
            const totalHours = resolved.reduce((acc, t) => {
              const start = new Date(t.created_at);
              const end = new Date(t.updated_at);
              return acc + (end - start) / (1000 * 60 * 60);
            }, 0);
            avgHours = totalHours / resolved.length;
          }

          setData({
            role: 'maintenance',
            counts,
            queue: unresolved,
            average_resolution_hours: avgHours
          });
        }
      } catch (err) {
        setError(err.message);
      }
    };

    fetchDashboard();
  }, [user.id, isMaintenance]);

  if (error) return <Alert type="error">{error}</Alert>;

  if (!data) {
    return (
      <>
        <div className="page-head">
          <h1>Dashboard</h1>
        </div>
        <SkeletonStats />
        <div className="card">
          <SkeletonTable />
        </div>
      </>
    );
  }

  if (data.role === 'student') {
    const beingHandled = data.counts.Assigned + data.counts['In Progress'];
    return (
      <>
        <div className="welcome-banner rise">
          <div>
            <span className="eyebrow">{greeting()}</span>
            <h1>{fullName.split(' ')[0]}</h1>
            <p>
              {user?.user_metadata?.residence_building || 'Residence'}
              {user?.user_metadata?.room_number && <> &middot; Room {user.user_metadata.room_number}</>}
            </p>
          </div>
          <Link className="btn btn-gold btn-pill" to="/requests/new">
            Log a fault
          </Link>
        </div>

        <div className="stat-grid">
          <Stat value={data.counts.total} label="Faults logged" />
          <Stat value={data.counts.Submitted} label="Waiting for a tradesperson" tone="is-open" />
          <Stat value={beingHandled} label="Being attended to" tone="is-progress" />
          <Stat value={data.counts.Completed + data.counts.Closed} label="Completed" tone="is-done" />
        </div>

        {data.latest.length > 0 && (
          <div className="card">
            <div className="card-head">
              <div>
                <h2>Latest updates</h2>
                <p className="sub">What maintenance staff have said about your faults.</p>
              </div>
            </div>
            <ul className="update-feed">
              {data.latest.map((u) => {
                const { status, text } = parseUpdate(u.update_message);
                const who = u.author?.full_name || 'Maintenance staff';
                return (
                  <li key={u.id}>
                    <Link to={`/requests/${u.ticket_id}`}>
                      <span className="feed-top">
                        <strong>{status ? STATUS_HEADLINE[status] || 'Status changed' : `Update from ${who.split(' ')[0]}`}</strong>
                        <span>{timeAgo(u.created_at)}</span>
                      </span>
                      {text && <span className="feed-text">{text}</span>}
                      <span className="feed-meta">{who} &middot; {shortRef(u.ticket_id)}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <div className="card">
          <div className="card-head">
            <div>
              <h2>Recent faults</h2>
              <p className="sub">Your five most recent reports.</p>
            </div>
            <Link className="btn btn-secondary btn-small" to="/requests">
              See all
            </Link>
          </div>

          <RequestTable
            requests={data.recent}
            role="student"
            empty={
              <Empty title="Nothing logged yet">
                <p>
                  When something in your room stops working, log it here and you will be able to
                  follow the repair from start to finish.
                </p>
                <Link className="btn" to="/requests/new">
                  Log your first fault
                </Link>
              </Empty>
            }
          />
        </div>
      </>
    );
  }

  return (
    <>
      <div className="welcome-banner rise">
        <div>
          <span className="eyebrow">{greeting()}, {fullName.split(' ')[0]}</span>
          <h1>Work queue</h1>
          <p>{user?.user_metadata?.trade || 'Facilities'}</p>
        </div>
        <Link className="btn btn-gold btn-pill" to="/my-jobs">
          My jobs
        </Link>
      </div>

      <div className="stat-grid">
        <Stat value={data.counts.open} label="Open faults" tone="is-open" />
        <Stat value={data.counts.assigned_to_me} label="Assigned to me" tone="is-mine" />
        <Stat value={data.counts.in_progress} label="In progress" tone="is-progress" />
        <Stat value={data.counts.completed} label="Completed" tone="is-done" />
      </div>

      <div className="card">
        <div className="card-head">
          <div>
            <h2>Next jobs by priority</h2>
            <p className="sub">Most urgent first, then whoever has waited longest.</p>
          </div>
          <Link className="btn btn-secondary btn-small" to="/requests">
            Full queue
          </Link>
        </div>

        <div className="queue-note">
          Average time to complete a fault so far: {formatHours(data.average_resolution_hours)}.
        </div>

        <RequestTable
          requests={data.queue}
          role="maintenance"
          showScore
          empty={
            <Empty title="Queue is clear">
              <p>Every reported fault has been attended to.</p>
            </Empty>
          }
        />
      </div>
    </>
  );
}