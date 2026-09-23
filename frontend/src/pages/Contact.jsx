import { CAMPUS_CONTACTS, GENERAL_EMAIL, UFH_LINKS, telHref } from '../utils/siteInfo.js';

function Phone({ number }) {
  return <a href={telHref(number)}>{number}</a>;
}

export default function Contact() {
  return (
    <article className="info-page">
      <header className="page-head">
        <h1>Contact us</h1>
        <p>Where to find us, and who to ask.</p>
      </header>

      <div className="contact-grid">
        {CAMPUS_CONTACTS.map((campus) => (
          <section key={campus.id} className="card contact-card">
            <h3>{campus.name} campus</h3>
            <address>
              {campus.address.map((line) => <span key={line}>{line}</span>)}
            </address>
            <dl>
              <div className="contact-detail">
                <dt>Switchboard</dt>
                <dd>
                  {campus.phones.map((n) => <span key={n}><Phone number={n} /></span>)}
                </dd>
              </div>
            </dl>
          </section>
        ))}
      </div>

      <section className="card info-section general-enquiries">
        <div>
          <h2>General enquiries</h2>
          <p>
            For residence administration, ask the switchboard for Residence Life or Properties
            &amp; Services, or email the university.
          </p>
        </div>
        <div className="general-actions">
          <a className="btn" href={`mailto:${GENERAL_EMAIL}`}>{GENERAL_EMAIL}</a>
          <a className="btn btn-secondary" href={UFH_LINKS.findUs} target="_blank" rel="noopener noreferrer">
            Directions on ufh.ac.za ↗
          </a>
        </div>
      </section>
    </article>
  );
}
