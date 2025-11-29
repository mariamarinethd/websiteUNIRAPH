// driversite-auth.js — corrected to match your HTML ids and to use Supabase as a backup.
// IMPORTANT: Replace SUPABASE_ANON_KEY in the HTML (window.SUPABASE_ANON_KEY) with your public anon key.
// Do NOT put a service_role key on the client.

(function () {
  // Firebase config (keep as you already have)
  const firebaseConfig = {
    apiKey: "AIzaSyB0nMt84ndd6F_exO4Zluj_mEzoGxtPoxs",
    authDomain: "project-uniraph.firebaseapp.com",
    databaseURL: "https://project-uniraph-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "project-uniraph",
    storageBucket: "project-uniraph.firebasestorage.app",
    messagingSenderId: "389986440818",
    appId: "1:389986440818:web:78f89fbae96b81bb9654eb",
    measurementId: "G-2DLEQ25649"
  };

  if (!firebase.apps || !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  const db = firebase.database();
  const auth = firebase.auth();

  // Supabase init (uses window vars set in HTML)
  if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) {
    console.warn('Supabase URL or anon key not set on window. Supabase backup will be disabled.');
  }
  const supabaseClient = (window.supabase && window.SUPABASE_URL && window.SUPABASE_ANON_KEY)
    ? window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY)
    : null;

  const form = document.getElementById('driverForm');
  const displayDiv = document.getElementById('driverInfoDisplay');

  function showMessage(html) {
    if (!displayDiv) {
      alert(html.replace(/<[^>]+>/g, '')); // fallback
      return;
    }
    displayDiv.style.display = 'block';
    displayDiv.innerHTML = html;
  }

  function escapeHtml(str) {
    if (!str && str !== 0) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  async function ensureFreshAuthToken(user) {
    try {
      if (!user) return;
      await user.getIdToken(true);
    } catch (err) {
      console.warn('Failed to refresh token', err);
    }
  }

  if (!form) {
    console.warn('driversite-auth: #driverForm not found');
    return;
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    // Read the IDs from your HTML (driverName, driverContact, driverVehicle, driverPlate, driverLocation, driverAvailability, driverNotes)
    const name = document.getElementById('driverName')?.value.trim() || '';
    const contact = document.getElementById('driverContact')?.value.trim() || '';
    const vehicle = document.getElementById('driverVehicle')?.value || '';
    const plate = document.getElementById('driverPlate')?.value.trim() || '';
    const location = document.getElementById('driverLocation')?.value.trim() || '';
    const availabilityRaw = document.getElementById('driverAvailability')?.value || '';
    const notes = document.getElementById('driverNotes')?.value.trim() || '';
    const ownerEmail = (document.getElementById('ownerEmail')?.value || '').trim().toLowerCase();
    const ownerPassword = document.getElementById('ownerPassword')?.value || '';

    if (!name || !contact || !plate || !location || !availabilityRaw || !ownerEmail || !ownerPassword) {
      showMessage('<p>Please fill all required fields.</p>');
      return;
    }

    // Convert datetime-local to ISO (UTC)
    let availability = null;
    try {
      if (availabilityRaw) availability = new Date(availabilityRaw).toISOString();
    } catch (err) {
      availability = availabilityRaw;
    }

    try {
      // Sign in or create user using Firebase (mirrors your original flow)
      let userCredential;
      try {
        userCredential = await auth.signInWithEmailAndPassword(ownerEmail, ownerPassword);
      } catch (signInErr) {
        if (signInErr.code === 'auth/user-not-found') {
          userCredential = await auth.createUserWithEmailAndPassword(ownerEmail, ownerPassword);
          // Optionally set displayName
          await userCredential.user.updateProfile({ displayName: name || ownerEmail }).catch(()=>{});
        } else if (signInErr.code === 'auth/wrong-password') {
          showMessage('<p>An account with that email exists but the password is incorrect.</p>');
          return;
        } else {
          console.error('signIn error', signInErr);
          showMessage(`<p>Authentication error: ${escapeHtml(signInErr.message || 'Unknown error')}</p>`);
          return;
        }
      }

      const user = auth.currentUser || (userCredential && userCredential.user);
      if (!user) {
        showMessage('<p>Unable to obtain authenticated user.</p>');
        return;
      }

      await ensureFreshAuthToken(user);

      const driverObj = {
        ownerUid: user.uid,
        ownerEmail,
        name,
        contact,
        vehicle,
        plate,
        location,
        availability,
        notes,
        approved: false,
        createdAt: Date.now()
      };

      // Write to Firebase
      const newDriverRef = db.ref('drivers').push();
      await newDriverRef.set(driverObj);

      // Add reference under /users/{uid}/drivers/
      await db.ref(`users/${user.uid}/drivers/${newDriverRef.key}`).set({
        driverId: newDriverRef.key,
        createdAt: Date.now()
      });

      console.log('Firebase write OK');

      // Try inserting a backup copy into Supabase (if configured)
      if (supabaseClient) {
        try {
          const supPayload = {
            firebase_id: newDriverRef.key,
            owner_uid: user.uid,
            owner_email: ownerEmail,
            name,
            contact,
            vehicle,
            plate,
            location,
            availability,
            notes,
            created_at: new Date().toISOString()
          };

          // Insert into table named "drivers" — ensure this table exists in Supabase (see SQL file)
          const { data, error } = await supabaseClient.from('drivers').insert([supPayload]);

          if (error) {
            console.error('Supabase insert failed:', error);
          } else {
            console.log('Supabase insert OK:', data);
          }
        } catch (supErr) {
          console.error('Supabase internal error:', supErr);
        }
      }

      showMessage(`
        <h3>Your Driver Info Saved</h3>
        <p>${escapeHtml(name)} | ${escapeHtml(vehicle)} | ${escapeHtml(plate)}</p>
        <p>Contact: ${escapeHtml(contact)}</p>
        <p>Location: ${escapeHtml(location)}</p>
        <p>Available: ${escapeHtml(availability || 'N/A')}</p>
        <p>Notes: ${escapeHtml(notes) || 'None'}</p>
      `);

      setTimeout(function () {
        window.location.href = 'find.html';
      }, 300);

    } catch (err) {
      console.error('driversite-auth error', err);
      if (err && err.code === 'PERMISSION_DENIED') {
        showMessage('<p>Failed to save driver: permission denied. Please ensure you are signed in and database rules allow this write.</p>');
      } else if (err && String(err).toLowerCase().includes('permission_denied')) {
        showMessage('<p>Failed to save driver: permission denied by database rules. See console for details.</p>');
      } else {
        showMessage(`<p>Failed to save driver: ${escapeHtml(err.message || String(err) || 'Unknown error')}</p>`);
      }
    }
  });
})();