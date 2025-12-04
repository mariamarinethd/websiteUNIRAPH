// Dashboard logic with Firebase Authentication + Realtime Database integration.
// Replace firebaseConfig below with your project's config object.
// This script expects the DOM elements present in dashboard.html to exist.

(function () {
  // ------- Firebase config: REPLACE with your project's details -------
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
  // -------------------------------------------------------------------

  // DOM references
  const yearEl = document.getElementById('year');
  const avatarInitials = document.getElementById('avatarInitials');
  const headerName = document.getElementById('headerName');
  const headerEmail = document.getElementById('headerEmail');
  const displayName = document.getElementById('displayName');
  const displayPhone = document.getElementById('displayPhone');
  const displayEmail = document.getElementById('displayEmail');

  const vehicleType = document.getElementById('vehicleType');
  const plateNumber = document.getElementById('plateNumber');
  const notesPreview = document.getElementById('notesPreview');

  const nextAvailable = document.getElementById('nextAvailable');
  const currentLocation = document.getElementById('currentLocation');

  const profileCompletion = document.getElementById('profileCompletion');
  const lastUpdated = document.getElementById('lastUpdated');
  const activeSince = document.getElementById('activeSince');

  // Fields
  const fieldName = document.getElementById('fieldName');
  const fieldContact = document.getElementById('fieldContact');
  const fieldVehicle = document.getElementById('fieldVehicle');
  const fieldPlate = document.getElementById('fieldPlate');
  const fieldLocation = document.getElementById('fieldLocation');
  const fieldAvailability = document.getElementById('fieldAvailability');
  const fieldNotes = document.getElementById('fieldNotes');
  const fieldEmail = document.getElementById('fieldEmail');

  // Modal refs & actions
  const modalBackdrop = document.getElementById('modalBackdrop');
  const profileBtn = document.getElementById('profileBtn');
  const profileMenu = document.getElementById('profileMenu');
  const profileDropdown = document.getElementById('profileDropdown');
  const editProfileBtn = document.getElementById('editProfileBtn');
  const menuEditProfile = document.getElementById('menuEditProfile');
  const closeModal = document.getElementById('closeModal');
  const cancelModal = document.getElementById('cancelModal');
  const modalForm = document.getElementById('modalForm');

  // modal inputs
  const modalName = document.getElementById('modalName');
  const modalPhone = document.getElementById('modalPhone');
  const modalVehicle = document.getElementById('modalVehicle');
  const modalPlate = document.getElementById('modalPlate');
  const modalNotes = document.getElementById('modalNotes');

  // actions
  const deleteSubmissionBtn = document.getElementById('deleteSubmissionBtn');
  const submitChangesBtn = document.getElementById('submitChangesBtn');
  const editInfoBtn = document.getElementById('editInfoBtn');
  const menuLogout = document.getElementById('menuLogout');
  const sidebarLogout = document.getElementById('sidebarLogout');

  // Firebase instances (will be initialized later)
  let firebaseApp = null;
  let auth = null;
  let db = null;
  let driverRef = null;
  let currentUid = null;
  let driverListener = null;

  // Simple UI helpers
  function initials(name) {
    return (name || 'D').split(' ').map(n => n[0] || '').slice(0, 2).join('').toUpperCase();
  }
  function formatDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d)) return iso;
    return d.toLocaleString();
  }

  function setYear() {
    yearEl.textContent = new Date().getFullYear();
  }

  // Set UI from driver object
  function loadDriverData(data) {
    if (!data) {
      // empty state
      headerName.textContent = 'Driver';
      headerEmail.textContent = '';
      avatarInitials.textContent = initials('D');

      displayName.textContent = '—';
      displayPhone.textContent = '—';
      displayEmail.textContent = '—';

      vehicleType.textContent = '—';
      plateNumber.textContent = '—';
      notesPreview.textContent = '—';

      nextAvailable.textContent = '—';
      currentLocation.textContent = '—';

      profileCompletion.textContent = '0%';
      lastUpdated.textContent = '—';
      activeSince.textContent = '—';

      fieldName.textContent = '—';
      fieldContact.textContent = '—';
      fieldVehicle.textContent = '—';
      fieldPlate.textContent = '—';
      fieldLocation.textContent = '—';
      fieldAvailability.textContent = '—';
      fieldNotes.textContent = '—';
      fieldEmail.textContent = '—';
      return;
    }

    headerName.textContent = data.name || 'Driver';
    headerEmail.textContent = data.email || '';
    avatarInitials.textContent = initials(data.name || 'D');

    displayName.textContent = data.name || '—';
    displayPhone.textContent = data.phone || '—';
    displayEmail.textContent = data.email || '—';

    vehicleType.textContent = data.vehicle || '—';
    plateNumber.textContent = data.plate || '—';
    notesPreview.textContent = (data.notes && data.notes.length > 60) ? data.notes.slice(0, 60) + '…' : (data.notes || '—');

    nextAvailable.textContent = data.availability || '—';
    currentLocation.textContent = data.location || '—';

    activeSince.textContent = data.activeSince || '—';
    lastUpdated.textContent = formatDate(data.lastUpdated) || '—';

    const keys = ['name', 'phone', 'email', 'vehicle', 'plate', 'location', 'availability'];
    const filled = keys.reduce((c, k) => c + (!!data[k]), 0);
    profileCompletion.textContent = Math.round((filled / keys.length) * 100) + '%';

    fieldName.textContent = data.name || '—';
    fieldContact.textContent = data.phone || '—';
    fieldVehicle.textContent = data.vehicle || '—';
    fieldPlate.textContent = data.plate || '—';
    fieldLocation.textContent = data.location || '—';
    fieldAvailability.textContent = data.availability || '—';
    fieldNotes.textContent = data.notes || '—';
    fieldEmail.textContent = data.email || '—';
  }

  // Initialize Firebase and set auth listener
  function initFirebase() {
    try {
      firebaseApp = firebase.initializeApp(firebaseConfig);
      auth = firebase.auth();
      db = firebase.database();
    } catch (err) {
      console.error('Firebase init error:', err);
      alert('Firebase initialization failed. Check console for details and ensure firebaseConfig is set.');
      return;
    }

    // Monitor auth state
    auth.onAuthStateChanged(user => {
      if (user) {
        currentUid = user.uid;
        // Listen to realtime driver data at /drivers/{uid}
        attachDriverListener(currentUid);
      } else {
        currentUid = null;
        detachDriverListener();
        loadDriverData(null);
        // For demo, you can choose to sign in anonymously or redirect to login.
        // auth.signInAnonymously();
      }
    });
  }

  function attachDriverListener(uid) {
    if (!db) return;
    detachDriverListener();
    driverRef = db.ref('drivers/' + uid);
    driverListener = driverRef.on('value', snapshot => {
      const data = snapshot.exists() ? snapshot.val() : null;
      loadDriverData(data);
    }, err => {
      console.error('Driver data listener error:', err);
    });
  }

  function detachDriverListener() {
    if (driverRef && driverListener) {
      driverRef.off('value', driverListener);
    }
    driverRef = null;
    driverListener = null;
  }

  // Update driver data (partial)
  function updateDriverData(patch) {
    if (!currentUid) {
      alert('Not signed in.');
      return;
    }
    const now = new Date().toISOString();
    patch.lastUpdated = now;
    const updates = {};
    // Only update allowed fields to avoid overwrite
    const allowed = ['name', 'phone', 'vehicle', 'plate', 'location', 'availability', 'notes', 'lastUpdated', 'activeSince', 'email'];
    for (const k of Object.keys(patch)) {
      if (allowed.includes(k)) updates[k] = patch[k];
    }
    return db.ref('drivers/' + currentUid).update(updates)
      .then(() => {
        console.log('Driver updated', updates);
      })
      .catch(err => {
        console.error('Update failed', err);
        throw err;
      });
  }

  // Delete submission (remove node)
  function deleteDriverSubmission() {
    if (!currentUid) {
      alert('Not signed in.');
      return;
    }
    if (!confirm('Delete your submission? This action cannot be undone.')) return;
    return db.ref('drivers/' + currentUid).remove()
      .then(() => {
        alert('Submission deleted.');
        // After deletion, UI will update via realtime listener to null
      })
      .catch(err => {
        console.error('Delete failed', err);
        alert('Delete failed. See console for details.');
      });
  }

  // Sign out
  function signOut() {
    if (!auth) return;
    auth.signOut().then(() => {
      // Signed out
      alert('Signed out.');
      // optionally redirect to login page:
      // window.location.href = '/';
    }).catch(err => {
      console.error('Sign out error', err);
      alert('Sign out failed. See console for details.');
    });
  }

  // UI event wiring
  function setupEvents() {
    profileBtn.addEventListener('click', (e) => {
      profileMenu.classList.toggle('show');
      const expanded = profileBtn.getAttribute('aria-expanded') === 'true';
      profileBtn.setAttribute('aria-expanded', (!expanded).toString());
    });

    document.addEventListener('click', (ev) => {
      if (!profileDropdown.contains(ev.target)) {
        profileMenu.classList.remove('show');
        profileBtn.setAttribute('aria-expanded', 'false');
      }
    });

    function openEditModalFromData(data) {
      modalName.value = data && data.name ? data.name : '';
      modalPhone.value = data && data.phone ? data.phone : '';
      modalVehicle.value = data && data.vehicle ? data.vehicle : '';
      modalPlate.value = data && data.plate ? data.plate : '';
      modalNotes.value = data && data.notes ? data.notes : '';
      modalBackdrop.classList.add('show');
      modalBackdrop.setAttribute('aria-hidden', 'false');
      document.getElementById('modalTitle').textContent = 'Edit Profile';
    }

    editProfileBtn.addEventListener('click', () => {
      // get latest snapshot once
      if (driverRef) {
        driverRef.once('value').then(snap => openEditModalFromData(snap.val())).catch(()=>openEditModalFromData(null));
      } else {
        openEditModalFromData(null);
      }
    });

    menuEditProfile.addEventListener('click', () => {
      if (driverRef) {
        driverRef.once('value').then(snap => openEditModalFromData(snap.val())).catch(()=>openEditModalFromData(null));
      } else {
        openEditModalFromData(null);
      }
    });

    closeModal.addEventListener('click', closeModalFn);
    cancelModal.addEventListener('click', closeModalFn);
    modalBackdrop.addEventListener('click', (ev) => {
      if (ev.target === modalBackdrop) closeModalFn();
    });

    modalForm.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const updated = {
        name: modalName.value.trim(),
        phone: modalPhone.value.trim(),
        vehicle: modalVehicle.value.trim(),
        plate: modalPlate.value.trim(),
        notes: modalNotes.value.trim()
      };
      updateDriverData(updated)
        .then(() => {
          closeModalFn();
          // success feedback
          // NOTE: realtime listener will update the UI when DB write completes.
        })
        .catch(() => {
          alert('Failed to save changes. See console for details.');
        });
    });

    deleteSubmissionBtn.addEventListener('click', () => {
      deleteDriverSubmission();
    });

    submitChangesBtn.addEventListener('click', () => {
      // For this example we simply pull data from fields and push as an update.
      const patch = {
        name: fieldName.textContent !== '—' ? fieldName.textContent : '',
        phone: fieldContact.textContent !== '—' ? fieldContact.textContent : '',
        vehicle: fieldVehicle.textContent !== '—' ? fieldVehicle.textContent : '',
        plate: fieldPlate.textContent !== '—' ? fieldPlate.textContent : '',
        location: fieldLocation.textContent !== '—' ? fieldLocation.textContent : '',
        availability: fieldAvailability.textContent !== '—' ? fieldAvailability.textContent : '',
        notes: fieldNotes.textContent !== '—' ? fieldNotes.textContent : ''
      };
      updateDriverData(patch).catch(()=>{ alert('Submit failed.'); });
    });

    editInfoBtn.addEventListener('click', () => {
      if (driverRef) {
        driverRef.once('value').then(snap => openEditModalFromData(snap.val())).catch(()=>openEditModalFromData(null));
      } else {
        openEditModalFromData(null);
      }
    });

    menuLogout.addEventListener('click', signOut);
    sidebarLogout.addEventListener('click', signOut);

    // Example action: share location using Geolocation API and save to DB
    const locateBtn = document.getElementById('locateBtn');
    if (locateBtn) {
      locateBtn.addEventListener('click', () => {
        if (!navigator.geolocation) {
          alert('Geolocation not supported');
          return;
        }
        locateBtn.disabled = true;
        locateBtn.textContent = 'Sharing…';
        navigator.geolocation.getCurrentPosition(pos => {
          const coords = `${pos.coords.latitude.toFixed(5)},${pos.coords.longitude.toFixed(5)}`;
          updateDriverData({ location: coords }).then(() => {
            locateBtn.disabled = false;
            locateBtn.textContent = 'Share location';
          });
        }, err => {
          console.error('Geolocation failed:', err);
          alert('Unable to get location.');
          locateBtn.disabled = false;
          locateBtn.textContent = 'Share location';
        });
      });
    }

    // Refresh status
    const refreshStatus = document.getElementById('refreshStatus');
    if (refreshStatus) {
      refreshStatus.addEventListener('click', () => {
        if (driverRef && currentUid) {
          driverRef.once('value').then(snap => loadDriverData(snap.val()));
        }
      });
    }
  }

  function closeModalFn() {
    modalBackdrop.classList.remove('show');
    modalBackdrop.setAttribute('aria-hidden', 'true');
  }

  // Initialize app on DOMContentLoaded
  document.addEventListener('DOMContentLoaded', () => {
    setYear();
    setupEvents();
    initFirebase();

    // Optional: if you want to sign in anonymously during development,
    // uncomment the following lines (only for dev/testing, not production).
    // firebase.auth().signInAnonymously().catch(err => console.error('Anon sign-in failed', err));
  });

  // Expose small API on window for debugging in dev only (optional)
  window.UNIRAPH = {
    updateDriverData,
    deleteDriverSubmission,
    signOut
  };
})();