/**
 * Request list.
 * Students see only their own requests; maintenance staff see the shared work
 * queue with filters for category, status and urgency.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Alert, Empty, SkeletonTable } from '../components/Ui.jsx';
import RequestTable from '../components/RequestTable.jsx';

export default function RequestList({ onlyMine = false }) {
  const { user } = useAuth();
  
  // Check against the user_metadata object where Supabase stores the custom fields
  const isMaintenance = ['maintenance', 'tradesperson', 'facilities_admin'].includes(user?.user_metadata?.role);

  const [requests, setRequests] = useState(null);
  const [reference, setReference] = useState({ categories: [], statuses: [], urgencies: [] });
  const [filters, setFilters] = useState({ status: '', urgency: '', category_id: '' });
  const [error, setError] = useState('');

  // 1. Fetch Reference Data for Dropdowns
  useEffect(() => {
    const fetchReferences = async () => {
      try {
        // Fetch dynamic categories from the database
        const { data: categories } = await supabase.from('categories').select('*');
        
        // Status and Urgency are fixed ENUMs/Text in the DB schema, so we provide them here
        setReference({
          categories: categories || [],
          statuses: ['logged', 'assigned', 'in_progress', 'resolved'], 
          urgencies: ['High', 'Medium', 'Low']
        });
      } catch (err) {
        console.error("Failed to load reference data", err);
      }
    };
    fetchReferences();
  }, []);

  // 2. Fetch and Filter Requests
  useEffect(() => {
    const fetchRequests = async () => {
      setRequests(null);
      setError('');

      // Initialize the query builder
      let query = supabase
        .from('maintenance_tickets')
        .select(`*, reporter:profiles!reported_by(full_name, student_number)`)
        .order('created_at', { ascending: false });

      // Apply dropdown filters if they are selected
      if (filters.category_id) {
        query = query.eq('category_id', filters.category_id);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.urgency) {
        query = query.eq('urgency', filters.urgency);
      }

      // Apply scope logic for maintenance staff
      if (isMaintenance && onlyMine) {
        query = query.eq('assigned_to', user.id);
      }

      // Execute the query
      const { data, error: fetchError } = await query;

      if (fetchError) {
        setError(fetchError.message);
        setRequests([]);
      } else {
        setRequests(data);
      }
    };

    fetchRequests();
  }, [filters, isMaintenance, onlyMine, user?.id]);

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
                <option key={status} value={status}>
                  {/* Format the enum value for the UI (e.g., 'in_progress' -> 'In Progress') */}
                  {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="f-urgency">Urgency</label>
            <select id="f-urgency" value={filters.urgency} onChange={update('urgency')}>
              <option value="">All urgencies</option>
              {reference.urgencies.map((urgency) => (
                <option key={urgency} value={urgency}>{urgency}</option>
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
            role={user?.user_metadata?.role || 'student'}
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