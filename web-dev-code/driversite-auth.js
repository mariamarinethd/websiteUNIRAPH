// driversite-auth.js (updated to avoid PERMISSION_DENIED)
// Ensures the client is fully authenticated and writes driver records with ownerUid matching request.auth.uid.
// Uses a short token refresh before writing to avoid timing issues right after account creation.

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
const auth = firebase.auth();
const db = firebase.database();

(function () {
  if (window.__driversiteFirebaseAttached) return;
  window.__driversiteFirebaseAttached = true;

  const driverForm = document.getElementById('driverForm');
  const displayDiv = document.getElementById('driverInfoDisplay');

  if (!driverForm) {
    console.warn('driversite-auth: #driverForm not found');
    return;
  }

  function showMessage(html) {
    if (!displayDiv) return;
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
    // Force refresh ID token so Realtime Database rules evaluate with current auth state.
    try {
      if (!user) return;
      await user.getIdToken(true);
    } catch (err) {
      // Non-fatal: log and continue — caller will catch permission errors on write
      console.warn('Failed to refresh token', err);
    }
  }

  driverForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    const name = document.getElementById('driverName')?.value.trim() || '';
    const contact = document.getElementById('driverContact')?.value.trim() || '';
    const vehicle = document.getElementById('driverVehicle')?.value || '';
    const plate = document.getElementById('driverPlate')?.value.trim() || '';
    const location = document.getElementById('driverLocation')?.value.trim() || '';
    const availability = document.getElementById('driverAvailability')?.value || '';
    const notes = document.getElementById('driverNotes')?.value.trim() || '';
    const ownerEmail = (document.getElementById('ownerEmail')?.value || '').trim().toLowerCase();
    const ownerPassword = document.getElementById('ownerPassword')?.value || '';

    if (!name || !contact || !plate || !location || !availability || !ownerEmail || !ownerPassword) {
      showMessage('<p>Please fill all required fields.</p>');
      return;
    }

    try {
      // Try to sign in first (existing users)
      let userCredential;
      try {
        userCredential = await auth.signInWithEmailAndPassword(ownerEmail, ownerPassword);
      } catch (signInErr) {
        if (signInErr.code === 'auth/user-not-found') {
          // Create new account and use the returned user
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

      // At this point userCredential should be present and user signed in
      const user = auth.currentUser || (userCredential && userCredential.user);
      if (!user) {
        showMessage('<p>Unable to obtain authenticated user.</p>');
        return;
      }

      // Ensure the client's auth token is fresh so DB rules see the correct auth.uid
      await ensureFreshAuthToken(user);

      // Build driver object with ownerUid set to auth.uid to satisfy DB security rules
      const driver = {
        name,
        contact,
        vehicle,
        plate,
        location,
        availability,
        notes: notes || '',
        ownerEmail,
        ownerUid: user.uid,
        createdAt: Date.now()
      };

      // Push under /drivers and ensure the write includes ownerUid == auth.uid (rules enforce this)
      const driversRef = db.ref('drivers');
      const newDriverRef = driversRef.push();
      await newDriverRef.set(driver);

      // Also write a compact reference under /users/{uid}/drivers/{driverId}
      await db.ref(`users/${user.uid}/drivers/${newDriverRef.key}`).set({
        driverId: newDriverRef.key,
        createdAt: Date.now()
      });

      showMessage(`
        <h3>Your Driver Info Saved</h3>
        <p>${escapeHtml(name)} | ${escapeHtml(vehicle)} | ${escapeHtml(plate)}</p>
        <p>Contact: ${escapeHtml(contact)}</p>
        <p>Location: ${escapeHtml(location)}</p>
        <p>Available: ${escapeHtml(availability)}</p>
        <p>Notes: ${escapeHtml(notes) || 'None'}</p>
      `);

      setTimeout(function () {
        window.location.href = 'find.html';
      }, 300);

    } catch (err) {
      console.error('driversite-auth error', err);
      // Improve error feedback for permission issues
      if (err && err.code === 'PERMISSION_DENIED') {
        showMessage('<p>Failed to save driver: permission denied. Please ensure you are signed in and database rules allow this write.</p>');
      } else if (err && String(err).toLowerCase().includes('permission_denied')) {
        showMessage('<p>Failed to save driver: permission denied by database rules. See console for details.</p>');
      } else if (err.code === 'auth/weak-password') {
        showMessage('<p>Weak password. Choose a stronger password (min 6 chars).</p>');
      } else {
        showMessage(`<p>Failed to save driver: ${escapeHtml(err.message || String(err) || 'Unknown error')}</p>`);
      }
    }
  });
})();