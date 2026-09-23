import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

serve(async (req) => {
  try {
    const payload = await req.json();
    const { type, record, old_record } = payload;

    // We need the student's email. In a production app, you'd query the auth.users 
    // table here using record.reported_by, but we'll assume we fetch it or it's passed.
    // For the demo, we will use a hardcoded test email or fetch it via Supabase client.
    
    let subject = '';
    let htmlContent = '';

    // SCENARIO 1: New Fault Logged (INSERT)
    if (type === 'INSERT') {
      subject = `Maintenance Request Received: Room ${record.room_number}`;
      htmlContent = `
        <h2>We got it!</h2>
        <p>Your maintenance request for <strong>${record.description}</strong> has been logged.</p>
        <p>The ${record.residence_building} team leader has been notified and will assign a tradesperson shortly.</p>
      `;
    } 
    // SCENARIO 2: Tradesperson Accepts Job (UPDATE)
    else if (type === 'UPDATE' && record.status === 'in_progress' && old_record.status === 'open') {
      subject = `Update: Tradesperson Assigned to Room ${record.room_number}`;
      htmlContent = `
        <h2>Help is on the way!</h2>
        <p>Your request for <strong>${record.description}</strong> has been accepted by the maintenance team.</p>
        <p>A tradesperson has been dispatched to your room.</p>
      `;
    } else {
      return new Response("No email required for this event.", { status: 200 });
    }

    // Send the email via Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Maintenance Team <onboarding@resend.dev>',
        to: ['student@ufh.ac.za'], // Replace with actual student email lookup
        subject: subject,
        html: htmlContent
      })
    });

    const data = await res.json();
    return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});