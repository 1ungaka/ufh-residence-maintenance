/** Table of maintenance requests, shared by the student and staff screens. */
import { Link } from 'react-router-dom';
import { StatusBadge, UrgencyLabel, Empty } from './Ui.jsx';
import { formatDate, timeAgo } from '../utils/format.js';

export default function RequestTable({ requests, role, empty, showScore = false }) {
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
          {requests.map((request) => (
            <tr key={request.id}>
              <td className="ref">#{request.id}</td>
              <td>{request.category}</td>
              <td>
                {isStaff ? (
                  <>
                    {request.residence}
                    <span className="room-cell">Room {request.room}</span>
                  </>
                ) : (
                  request.room
                )}
              </td>
              <td><UrgencyLabel urgency={request.urgency} /></td>
              <td><StatusBadge status={request.status} /></td>
              {showScore && (
                <td>
                  <span className="score" title="Urgency plus waiting time">
                    {request.priority_score}
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
          ))}
        </tbody>
      </table>
    </div>
  );
}

export { Empty };
