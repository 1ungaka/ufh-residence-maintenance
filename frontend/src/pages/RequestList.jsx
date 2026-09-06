/**
 * Request list.
 * Students see only their own requests; maintenance staff see the shared work
 * queue with filters for category, status and urgency.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Alert, Empty, SkeletonTable } from '../components/Ui.jsx';
import RequestTable from '../components/RequestTable.jsx';

export default function RequestList({ onlyMine = false }) {
  const { user } = useAuth();
  const isMaintenance = user.role === 'maintenance';

  const [requests, setRequests] = useState(null);
  const [reference, setReference] = useState({ categories: [], statuses: [], urgencies: [] });
  const [filters, setFilters] = useState({ status: '', urgency: '', category_id: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    api.reference().then(setReference).catch(() => {});
  }, []);

  useEffect(() => {
    setRequests(null);
    const params = { ...filters };
    if (isMaintenance) params.scope = onlyMine ? 'mine' : 'open';
    api
      .listRequests(params)
      .then((data) => setRequests(data.requests))
      .catch((err) => setError(err.message));
  }, [filters, isMaintenance, onlyMine]);

  const update = (field) => (event) => setFilters({ ...filters, [field]: event.target.value });
  const clear = () => setFilters({ status: '', urgency: '', category_id: '' });

  const title = !isMaintenance ? 'My requests' : onlyMine ? 'My jobs' : 'Work queue';

  return (
    <>
      <div className="page-head">
        <h1>{title}</h1>
        <p>
          {isMaintenance
            ? onlyMine
              ? 'Faults you have taken responsibility for.'
              : 'Every fault still needing attention, highest priority first.'
            : 'Every fault you have logged, newest first.'}
        </p>
      </div>

      <div className="card">
        <div className="filters">
          <div className="field">
            <label htmlFor="f-category">Category</label>
            <select id="f-category" value={filters.category_id} onChange={update('category_id')}>
              <option value="">All categories</option>
              {reference.categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="f-status">Status</label>
            <select id="f-status" value={filters.status} onChange={update('status')}>
              <option value="">All statuses</option>
              {reference.statuses.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="f-urgency">Urgency</label>
            <select id="f-urgency" value={filters.urgency} onChange={update('urgency')}>
              <option value="">All urgencies</option>
              {reference.urgencies.map((urgency) => (
                <option key={urgency}>{urgency}</option>
              ))}
            </select>
          </div>

          <button type="button" className="btn-secondary" onClick={clear}>
            Clear
          </button>

          {!isMaintenance && (
            <Link className="btn btn-gold" to="/requests/new">
              Log a fault
            </Link>
          )}
        </div>

        <Alert type="error">{error}</Alert>

        {requests === null ? (
          <SkeletonTable rows={5} />
        ) : (
          <RequestTable
            requests={requests}
            role={user.role}
            showScore={isMaintenance && !filters.status}
            empty={
              isMaintenance ? (
                <Empty title="Nothing here">
                  <p>No faults match these filters.</p>
                </Empty>
              ) : (
                <Empty title="No faults logged">
                  <p>Anything you report will appear here with its current status.</p>
                  <Link className="btn" to="/requests/new">
                    Log a fault
                  </Link>
                </Empty>
              )
            }
          />
        )}
      </div>
    </>
  );
}
