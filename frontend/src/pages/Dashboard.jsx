/** Dashboard. The Supabase queries return different shapes per role, so one page serves both. */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Alert, Empty, SkeletonStats, SkeletonTable, Stat } from '../components/Ui.jsx';
import RequestTable from '../components/RequestTable.jsx';
import { formatHours } from '../utils/format.js';

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const fullName = user?.user_metadata?.full_name || 'Student';
  const role = user?.user_metadata?.role || 'student';
  const isMaintenance = ['maintenance', 'tradesperson', 'facilities_admin'].includes(role);

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

          setData({
            role: 'student',
            counts,
            recent: tickets.slice(0, 5)
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
        <div className="page-head page-head-row">
          <div>
            <h1>Good day, {fullName.split(' ')[0]}</h1>
            <p>
              {user?.user_metadata?.residence_building || 'Residence'}, room {user?.user_metadata?.room_number}
            </p>
          </div>
          <Link className="btn btn-gold" to="/requests/new">
            Log a fault
          </Link>
        </div>

        <div className="stat-grid">
          <Stat value={data.counts.total} label="Faults logged" />
          <Stat value={data.counts.Submitted} label="Waiting for a tradesperson" tone="is-open" />
          <Stat value={beingHandled} label="Being attended to" tone="is-progress" />
          <Stat value={data.counts.Completed + data.counts.Closed} label="Completed" tone="is-done" />
        </div>

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
      <div className="page-head page-head-row">
        <div>
          <h1>Work queue</h1>
          <p>
            {user?.user_metadata?.trade || 'Facilities'} &middot; {fullName}
          </p>
        </div>
        <Link className="btn btn-secondary btn-small" to="/my-jobs">
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