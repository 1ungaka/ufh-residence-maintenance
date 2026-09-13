/** Dashboard. The API returns a different shape per role, so one page serves both. */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js.backup';
import { useAuth } from '../context/AuthContext.jsx';
import { Alert, Empty, SkeletonStats, SkeletonTable, Stat } from '../components/Ui.jsx';
import RequestTable from '../components/RequestTable.jsx';
import { formatHours } from '../utils/format.js';

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.dashboard().then(setData).catch((err) => setError(err.message));
  }, []);

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
            <h1>Good day, {user.name.split(' ')[0]}</h1>
            <p>
              {user.residence}, room {user.room}
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
            {user.trade} &middot; {user.name}
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
