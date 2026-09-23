import { Link } from 'react-router-dom';
import { LEGAL_LAST_UPDATED } from '../utils/siteInfo.js';

export default function Terms() {
  return (
    <article className="info-page legal">
      <header className="page-head">
        <h1>Terms and conditions</h1>
        <p>Last updated {LEGAL_LAST_UPDATED}</p>
      </header>

      <section className="card info-section">
        <h2>1. Agreeing to these terms</h2>
        <p>
          By creating an account or signing in to the Residence Maintenance Portal (&ldquo;the
          portal&rdquo;), you agree to these terms. If you do not agree, do not use the portal and
          report faults to your residence office instead.
        </p>

        <h2>2. Who may use the portal</h2>
        <p>
          The portal is for University of Fort Hare students living in a university residence and
          for maintenance staff authorised by Facilities Management. You must sign in with your own
          university account (your @ufh.ac.za student email, or your @staff.ufh.ac.za staff email)
          and choose the role that matches it.
        </p>

        <h2>3. Your account</h2>
        <ul>
          <li>Keep your password private. You are responsible for requests made from your account.</li>
          <li>Tell the residence office straight away if you think someone else has used your account.</li>
          <li>Keep your details, such as your residence and room number, up to date.</li>
        </ul>

        <h2>4. Logging faults</h2>
        <ul>
          <li>Only report genuine faults, and describe them honestly and accurately.</li>
          <li>Choose an urgency that reflects the real risk. Misusing &ldquo;urgent&rdquo; delays help for others.</li>
          <li>Photos must show the fault only. Do not photograph other people without their permission.</li>
          <li>The portal is not an emergency service. For anything dangerous, contact campus security first.</li>
        </ul>

        <h2>5. Access to your room</h2>
        <p>
          Logging a fault gives authorised maintenance staff permission to enter the room or area
          named in the request to inspect and repair it, in line with residence rules.
        </p>

        <h2>6. Maintenance staff</h2>
        <p>
          Tradespeople must only take jobs they are qualified to do, record accurate progress
          updates, and use information from requests solely to complete the work.
        </p>

        <h2>7. Acceptable use</h2>
        <p>
          Do not submit abusive, false or offensive content, try to access other people&rsquo;s
          accounts or data, or interfere with how the portal works. Misuse may lead to your account
          being suspended and to action under the university&rsquo;s student or staff disciplinary
          codes.
        </p>

        <h2>8. Damage caused by residents</h2>
        <p>
          Where a fault was caused by misuse or negligence, the university may recover repair costs
          in line with residence rules. Reporting damage promptly is always better than leaving it.
        </p>

        <h2>9. Availability</h2>
        <p>
          We aim to keep the portal available but cannot promise it will always be. Response times
          depend on staff availability, parts and the urgency of other requests.
        </p>

        <h2>10. Your personal information</h2>
        <p>
          How we collect and use your information is explained in our{' '}
          <Link to="/privacy">Privacy statement</Link>.
        </p>

        <h2>11. Changes to these terms</h2>
        <p>
          We may update these terms. The date at the top of this page shows when they last changed.
          Continuing to use the portal means you accept the updated terms.
        </p>
      </section>
    </article>
  );
}
