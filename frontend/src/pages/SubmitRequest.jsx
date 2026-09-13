/** The form a student uses to log a maintenance problem. */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Alert } from '../components/Ui.jsx';
import { RESIDENCES } from '../utils/residences.js';

export default function SubmitRequest() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    category_id: '',
    // Pull default values from the Supabase user metadata we set during registration
    residence: user?.user_metadata?.residence_building || RESIDENCES[0],
    room: user?.user_metadata?.room_number || '',
    urgency: 'Medium',
    description: ''
  });
  
  const [photo, setPhoto] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Fetch categories from a Supabase table (assuming you migrated your old API references to a table)
  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase.from('categories').select('*');
      if (error) {
        setError(error.message);
      } else if (data) {
        setCategories(data);
        if (data.length > 0) {
          setForm((current) => ({ ...current, category_id: String(data[0].id) }));
        }
      }
    };
    fetchCategories();
  }, []);

  const update = (field) => (event) => setForm({ ...form, [field]: event.target.value });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setBusy(true);

    try {
      let photoUrl = null;

      // 1. If a photo was selected, upload it to Supabase Storage first
      if (photo) {
        const fileExt = photo.name.split('.').pop();
        // Generate a unique filename to prevent overwriting
        const fileName = `${user.id}-${Math.random()}.${fileExt}`;
        const filePath = `fault-photos/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('maintenance-files')
          .upload(filePath, photo);

        if (uploadError) throw uploadError;

        // Retrieve the public URL for the newly uploaded image
        const { data: publicUrlData } = supabase.storage
          .from('maintenance-files')
          .getPublicUrl(filePath);

        photoUrl = publicUrlData.publicUrl;
      }

      // 2. Insert the new ticket into the database
      const { data, error: insertError } = await supabase
        .from('maintenance_tickets')
        .insert([
          {
            reported_by: user.id,
            category_id: form.category_id,
            residence_building: form.residence,
            room_number: form.room,
            urgency: form.urgency,
            description: form.description,
            photo_url: photoUrl
          }
        ])
        .select() // Tells Supabase to return the newly created row
        .single();

      if (insertError) throw insertError;

      // 3. Redirect to the detail page using the returned ticket ID
      navigate(`/requests/${data.id}`, {
        state: { flash: 'Fault logged. You can follow its progress here.' }
      });
      
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <>
      <div className="page-head">
        <h1>Log a fault</h1>
        <p>Describe the problem so the right tradesperson arrives with the right tools.</p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit}>
          {error && <Alert type="error">{error}</Alert>}

          <div className="field">
            <label htmlFor="category">What kind of fault is it?</label>
            <select id="category" value={form.category_id} onChange={update('category_id')} required>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="field">
              <label htmlFor="residence">Residence</label>
              <select id="residence" value={form.residence} onChange={update('residence')}>
                {RESIDENCES.map((residence) => (
                  <option key={residence}>{residence}</option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="room">Room number</label>
              <input id="room" value={form.room} onChange={update('room')} required />
            </div>
          </div>

          <div className="field">
            <label htmlFor="urgency">How urgent is it?</label>
            <select id="urgency" value={form.urgency} onChange={update('urgency')}>
              <option value="High">High - unsafe or unusable right now</option>
              <option value="Medium">Medium - a real problem but I can manage</option>
              <option value="Low">Low - can wait for the next visit</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="description">Describe the fault</label>
            <textarea
              id="description"
              value={form.description}
              onChange={update('description')}
              placeholder="The light in my room is no longer working. I have tried a new bulb."
              required
            />
            <p className="hint">At least 10 characters. Include anything a worker should know.</p>
          </div>

          <div className="field">
            <label htmlFor="photo">Add a photo (optional)</label>
            <input
              id="photo"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => setPhoto(event.target.files[0] || null)}
            />
            <p className="hint">JPG, PNG or WebP, up to 2 MB.</p>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-gold" disabled={busy}>
              {busy ? 'Sending...' : 'Log the fault'}
            </button>
            <button type="button" className="btn-secondary" onClick={() => navigate('/requests')}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </>
  );
}