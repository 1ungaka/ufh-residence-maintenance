/**
 * Contact details, taken from the official UFH Find Us page:
 *   https://www.ufh.ac.za/find-us
 * UFH only publishes one general email address; update these if Residence Life
 * or Properties & Services give you direct ones.
 */
export const UFH_LINKS = {
  about: 'https://www.ufh.ac.za/about-us',
  findUs: 'https://www.ufh.ac.za/find-us'
};

export const GENERAL_EMAIL = 'info@ufh.ac.za';

export const CAMPUS_CONTACTS = [
  {
    id: 'alice',
    name: 'Alice',
    address: ['Ring Road, Dikeni', 'Alice, 5700'],
    phones: ['+27 40 602 2011']
  },
  {
    id: 'bhisho',
    name: 'Bhisho',
    address: ['50 Independence Avenue', 'Bhisho, 5605'],
    phones: ['+27 43 783 5007', '+27 43 783 5017']
  },
  {
    id: 'east-london',
    name: 'East London',
    address: ['50 Church Street, CBD', 'East London, 5200'],
    phones: ['+27 43 704 7000']
  }
];

export const CAMPUSES = CAMPUS_CONTACTS.map((c) => c.name);

// Person or office responsible for personal information under POPIA.
export const INFORMATION_OFFICER_EMAIL = GENERAL_EMAIL;

// Shown at the top of the Terms and Privacy pages.
export const LEGAL_LAST_UPDATED = '23 September 2026';

/** "040 602 2243" -> "tel:0406022243" */
export function telHref(number) {
  return `tel:${number.replace(/[^\d+]/g, '')}`;
}
