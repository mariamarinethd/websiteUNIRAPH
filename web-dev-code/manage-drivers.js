// manage-drivers.js
// Allows an authenticated owner to list, edit, and delete their submitted drivers.
// Uses the same Firebase config and compat SDK as other pages.

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
  const authForm = document.getElementById('authForm');
  const signInBtn = document.getElementById('signInBtn');
  const createAccountBtn = document.getElementById('createAccountBtn');
  const signOutBtn = document.getElementById('signOutBtn');
  const authEmail = document.getElementById('authEmail');
  const authPassword = document.getElementById('authPassword');
  const signedOutView = document.getElementById('signedOutView');
  const signedInView = document.getElementById('signedInView');
  const userEmailSpan = document.getElementById('userEmail');
  const driversList = document.getElementById('driversList');
  const driversContainer = document.getElementById('driversContainer');

  function escapeHtml(str) {
    if (!str && str !== 0) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  async function listUserDrivers(uid) {
    driversContainer.innerHTML = '';
    driversList.classList.remove('hidden');
    // Read the user's drivers references
    const refsSnap = await db.ref(`users/${uid}/drivers`).once('value');
    const refs = refsSnap.val();
    if (!refs) {
      driversContainer.innerHTML = '<p class="small">No drivers found for this account.</p>';
      return;
    }

    const entries = Object.entries(refs);
    // For each driverId, fetch the full driver object
    await Promise.all(entries.map(async ([driverId, meta]) => {
      const driverSnap = await db.ref(`drivers/${driverId}`).once('value');
      const driver = driverSnap.val();
      if (!driver) {
        // If the driver record is missing, optionally clean the reference
        // but keep UI simple: show 'missing'
        const row = document.createElement('div');
        row.className = 'driver-row';
        row.innerHTML = `<div class="driver-info"><strong>Missing driver record</strong><div class="small">ID: ${driverId}</div></div>`;
        driversContainer.appendChild(row);
        return;
      }

      const container = document.createElement('div');
      container.className = 'card';
      container.innerHTML = `
        <div class="driver-row">
          <div class="driver-info">
            <div><strong>${escapeHtml(driver.name)}</strong> — ${escapeHtml(driver.vehicle)} | ${escapeHtml(driver.plate)}</div>
            <div class="small">Contact: ${escapeHtml(driver.contact)} • Location: ${escapeHtml(driver.location)} • Available: ${escapeHtml(driver.availability)}</div>
          </div>
          <div>
            <button class="btn edit-btn" data-id="${driverId}">Edit</button>
            <button class="btn btn-danger delete-btn" data-id="${driverId}">Delete</button>
          </div>
        </div>
        <form class="inline-edit hidden" data-id="${driverId}">
          <input name="name" placeholder="Driver name" value="${escapeHtml(driver.name)}" />
          <input name="contact" placeholder="Contact" value="${escapeHtml(driver.contact)}" />
          <select name="vehicle">
            <option ${driver.vehicle === 'Motorcycle' ? 'selected':''}>Motorcycle</option>
            <option ${driver.vehicle === 'Tricycle' ? 'selected':''}>Tricycle</option>
            <option ${driver.vehicle === 'Car' ? 'selected':''}>Car</option>
            <option ${driver.vehicle === 'Van' ? 'selected':''}>Van</option>
            <option ${driver.vehicle === 'Electric Vehicle' ? 'selected':''}>Electric Vehicle</option>
          </select>
          <input name="plate" placeholder="Plate" value="${escapeHtml(driver.plate)}" />
          <input name="location" placeholder="Location" value="${escapeHtml(driver.location)}" />
          <input name="availability" type="datetime-local" value="${escapeHtml(driver.availability)}" />
          <textarea name="notes" placeholder="Notes">${escapeHtml(driver.notes)}</textarea>
          <button class="btn save-btn" data-id="${driverId}">Save</button>
          <button class="btn cancel-btn" data-id="${driverId}" type="button">Cancel</button>
        </form>
      `;
      driversContainer.appendChild(container);
    }));

    // Attach event delegation for edit/save/delete/cancel
    driversContainer.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', (ev) => {
        const id = ev.currentTarget.getAttribute('data-id');
        const form = driversContainer.querySelector(`form.inline-edit[data-id="${id}"]`);
        if (form) form.classList.remove('hidden');
      });
    });

    driversContainer.querySelectorAll('.cancel-btn').forEach(btn => {
      btn.addEventListener('click', (ev) => {
        const id = ev.currentTarget.getAttribute('data-id');
        const form = driversContainer.querySelector(`form.inline-edit[data-id="${id}"]`);
        if (form) form.classList.add('hidden');
      });
    });

    driversContainer.querySelectorAll('.save-btn').forEach(btn => {
      btn.addEventListener('click', async (ev) => {
        ev.preventDefault();
        const id = ev.currentTarget.getAttribute('data-id');
        const form = driversContainer.querySelector(`form.inline-edit[data-id="${id}"]`);
        if (!form) return;

        // Collect fields
        const updated = {
          name: form.querySelector('[name="name"]').value.trim(),
          contact: form.querySelector('[name="contact"]').value.trim(),
          vehicle: form.querySelector('[name="vehicle"]').value,
          plate: form.querySelector('[name="plate"]').value.trim(),
          location: form.querySelector('[name="location"]').value.trim(),
          availability: form.querySelector('[name="availability"]').value,
          notes: form.querySelector('[name="notes"]').value.trim()
        };

        try {
          await db.ref(`drivers/${id}`).update(updated);
          // Refresh list after update
          const currentUser = auth.currentUser;
          if (currentUser) listUserDrivers(currentUser.uid);
        } catch (err) {
          console.error('update error', err);
          alert('Failed to update driver: ' + (err.message || err));
        }
      });
    });

    driversContainer.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', async (ev) => {
        const id = ev.currentTarget.getAttribute('data-id');
        if (!confirm('Delete this driver? This action cannot be undone.')) return;
        try {
          // Remove driver and user's reference
          await db.ref(`drivers/${id}`).remove();
          const currentUser = auth.currentUser;
          if (currentUser) {
            await db.ref(`users/${currentUser.uid}/drivers/${id}`).remove();
          }
          // Refresh list
          if (currentUser) listUserDrivers(currentUser.uid);
        } catch (err) {
          console.error('delete error', err);
          alert('Failed to delete driver: ' + (err.message || err));
        }
      });
    });
  }

  // Sign in and create flows
  signInBtn.addEventListener('click', async () => {
    try {
      await auth.signInWithEmailAndPassword(authEmail.value.trim(), authPassword.value);
    } catch (err) {
      console.error('sign in', err);
      alert(err.message || 'Sign-in failed');
    }
  });

  createAccountBtn.addEventListener('click', async () => {
    try {
      const res = await auth.createUserWithEmailAndPassword(authEmail.value.trim(), authPassword.value);
      // Optionally set displayName to email for now
      await res.user.updateProfile({ displayName: authEmail.value.trim() });
      alert('Account created and signed in');
    } catch (err) {
      console.error('create account', err);
      alert(err.message || 'Account creation failed');
    }
  });

  signOutBtn.addEventListener('click', async () => {
    await auth.signOut();
  });

  // React to auth state changes
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      signedOutView.classList.add('hidden');
      signedInView.classList.remove('hidden');
      userEmailSpan.textContent = user.email;
      // load drivers for this user
      try {
        await listUserDrivers(user.uid);
      } catch (err) {
        console.error('list drivers error', err);
        driversContainer.innerHTML = `<p class="small">Error loading drivers: ${escapeHtml(err.message || err)}</p>`;
        driversList.classList.remove('hidden');
      }
    } else {
      signedOutView.classList.remove('hidden');
      signedInView.classList.add('hidden');
      driversList.classList.add('hidden');
      driversContainer.innerHTML = '';
      userEmailSpan.textContent = '';
    }
  });
})();