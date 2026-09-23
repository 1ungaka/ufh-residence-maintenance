import { Link } from 'react-router-dom';
import { INFORMATION_OFFICER_EMAIL, LEGAL_LAST_UPDATED } from '../utils/siteInfo.js';

export default function Privacy() {
  return (
    <article className="info-page legal">
      <header className="page-head">
        <h1>Privacy statement</h1>
        <p>Last updated {LEGAL_LAST_UPDATED}</p>
      </header>

      <section className="card info-section">
        <p>
          The University of Fort Hare respects your privacy. This statement explains what personal
          information the Residence Maintenance Portal collects, why, and your rights under the
          Protection of Personal Information Act, 2013 (POPIA).
        </p>

        <h2>What we collect</h2>
        <ul>
          <li><strong>Account details:</strong> your name, university email address (@ufh.ac.za for students, @staff.ufh.ac.za for staff), and your role (student or maintenance tradesperson).</li>
          <li><strong>Student details:</strong> student number, residence and room number.</li>
          <li><strong>Staff details:</strong> your staff ID and your trade, for example electrician or plumber.</li>
          <li><strong>Maintenance requests:</strong> the description, category, urgency and location of each fault, any photo you attach, and every status update.</li>
          <li><strong>Technical information:</strong> sign-in records needed to keep your session secure.</li>
        </ul>

        <h2>Why we use it</h2>
        <ul>
          <li>To receive, prioritise, assign and complete maintenance work.</li>
          <li>To let you and the assigned tradesperson follow the progress of a request.</li>
          <li>To plan maintenance and spot recurring problems, using combined figures that do not identify you.</li>
          <li>To keep the portal secure and prevent misuse.</li>
        </ul>
        <p>We do not sell your information or use it for advertising.</p>

        <h2>Who can see it</h2>
        <ul>
          <li>Maintenance staff can see the requests they work on, including the room and your name, so they can do the job.</li>
          <li>Residence and Facilities Management staff can see requests for the residences they manage.</li>
          <li>Other students cannot see your requests.</li>
          <li>
            The portal is hosted by Supabase, our database and sign-in provider, which stores the
            information on our behalf. Photos you attach are stored as files that can be opened by
            anyone who has the direct link, so only photograph the fault itself.
          </li>
        </ul>

        <h2>How long we keep it</h2>
        <p>
          Requests and their history are kept for as long as they are needed for maintenance
          records and planning. Accounts are closed when you leave residence or the university, and
          the information is then deleted or anonymised unless the law requires us to keep it.
        </p>

        <h2>Keeping it safe</h2>
        <p>
          Access to the portal requires a university account and password, information is sent over
          encrypted connections, and each role can only see what it needs.
        </p>

        <h2>Your rights</h2>
        <p>Under POPIA you may:</p>
        <ul>
          <li>ask what personal information we hold about you and request a copy;</li>
          <li>ask us to correct or delete information that is wrong, out of date or no longer needed;</li>
          <li>object to how your information is used; and</li>
          <li>complain to the Information Regulator of South Africa.</li>
        </ul>
        <p>
          You can update most details yourself on your <Link to="/profile">Profile</Link> page. For
          anything else, contact{' '}
          {INFORMATION_OFFICER_EMAIL ? (
            <a href={`mailto:${INFORMATION_OFFICER_EMAIL}`}>{INFORMATION_OFFICER_EMAIL}</a>
          ) : (
            <>the university&rsquo;s information officer (see <Link to="/contact">Contact us</Link>)</>
          )}
          .
        </p>

        <h2>Changes to this statement</h2>
        <p>
          We will update this page if the way we handle personal information changes. The date at
          the top shows when it was last updated.
        </p>
      </section>
    </article>
  );
}
