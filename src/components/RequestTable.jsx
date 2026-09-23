/** Table of maintenance requests, shared by the student and staff screens. */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabaseClient.js';
import { StatusBadge, UrgencyLabel, Empty } from './Ui.jsx';
import { formatDate, timeAgo } from '../utils/format.js';

// Category names rarely change, so load them once and share between tables.
let categoryCache = null;
function useCategoryNames() {
  const [names, setNames] = useState(categoryCache || {});
  useEffect(() => {
    if (categoryCache) return;
    supabase.from('categories').select('id, name').then(({ data }) => {
      categoryCache = Object.fromEntries((data || []).map((c) => [c.id, c.name]));
      setNames(categoryCache);
    });
  }, []);
  return names;
}

/** Short, readable reference from a UUID, e.g. "#1F3E3B8A". */
export function shortRef(id) {
  return `#${String(id).slice(0, 8).toUpperCase()}`;
}

export default function RequestTable({ requests, role, empty, showScore = false }) {
  const categoryNames = useCategoryNames();
  if (!requests || requests.length === 0) return empty;

  const isStaff = role === 'maintenance';

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Ref</th>
            <th>Fault</th>
            <th>{isStaff ? 'Location' : 'Room'}</th>
            <th>Urgency</th>
            <th>Status</th>
            {showScore && <th>Priority</th>}
            <th>Logged</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {requests.map((request) => {
            // Supabase rows use *_id / *_number columns; the old API used short names.
            const category = request.category || categoryNames[request.category_id] || 'General';
            const residence = request.residence || request.residence_building || '';
            const room = request.room || request.room_number || '-';
            return (
              <tr key={request.id}>
                <td className="ref" title={String(request.id)}>{shortRef(request.id)}</td>
                <td>
                  <span className="fault-cell">{category}</span>
                  {request.description && <span className="room-cell desc-cell">{request.description}</span>}
                </td>
                <td>
                  {isStaff ? (
                    <>
                      {residence}
                      <span className="room-cell">Room {room}</span>
                    </>
                  ) : (
                    room
                  )}
                </td>
                <td><UrgencyLabel urgency={request.urgency} /></td>
                <td><StatusBadge status={request.status} /></td>
                {showScore && (
                  <td>
                    <span className="score" title="Urgency plus waiting time">
                      {request.priority_score ?? '-'}
                    </span>
                  </td>
                )}
                <td>
                  {formatDate(request.created_at)}
                  <span className="room-cell">{timeAgo(request.created_at)}</span>
                </td>
                <td>
                  <Link className="btn btn-secondary btn-small" to={`/requests/${request.id}`}>
                    View
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export { Empty };
