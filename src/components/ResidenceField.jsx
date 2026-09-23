/**
 * Residence picker used by Register, Profile and Log a fault.
 * `value` is always the residence name itself: one from the list, or whatever
 * the student typed after choosing "Other".
 */
import { useState } from 'react';
import { OTHER_RESIDENCE, RESIDENCES } from '../utils/residences.js';

export default function ResidenceField({ id = 'residence', value, onChange }) {
  // A saved name that isn't in the list (e.g. typed earlier) opens as "Other".
  const [isOther, setIsOther] = useState(Boolean(value) && !RESIDENCES.includes(value));

  const choose = (event) => {
    const choice = event.target.value;
    if (choice === OTHER_RESIDENCE) {
      setIsOther(true);
      onChange('');
    } else {
      setIsOther(false);
      onChange(choice);
    }
  };

  return (
    <div className="field">
      <label htmlFor={id}>Residence</label>
      <select id={id} value={isOther ? OTHER_RESIDENCE : value || ''} onChange={choose} required>
        <option value="" disabled>Choose your residence</option>
        {RESIDENCES.map((residence) => (
          <option key={residence} value={residence}>{residence}</option>
        ))}
        <option value={OTHER_RESIDENCE}>Other (not listed)</option>
      </select>

      {isOther && (
        <input
          id={`${id}-other`}
          className="residence-other"
          aria-label="Residence name"
          placeholder="Type the name of your residence"
          value={value}
          maxLength={60}
          onChange={(event) => onChange(event.target.value)}
          required
          autoFocus
        />
      )}
    </div>
  );
}
