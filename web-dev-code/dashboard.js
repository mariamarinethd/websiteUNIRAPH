// Dashboard logic with Firebase Authentication + Realtime Database integration.
// Replace firebaseConfig below with your project's config object.

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

  // Auth elements
  const authBackdrop = document.getElementById('authBackdrop');
  const authForm = document.getElementById('authForm');
  const authEmail = document.getElementById('authEmail');
  const authPassword = document.getElementById('authPassword');
  const createAccountBtn = document.getElementById('createAccountBtn');
  const anonSignInBtn = document.getElementById('anonSignInBtn');
  const authError = document.getElementById('authError');

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

  // other buttons
  const quickViewProfile = document.getElementById('quickViewProfile');
  const viewVehicleBtn = document.getElementById('viewVehicleBtn');
  const editVehicleBtn = document.getElementById('editVehicleBtn');
  const updateAvailabilityBtn = document.getElementById('updateAvailabilityBtn');
  const locateBtn = document.getElementById('locateBtn');
  const newMessageBtn = document.getElementById('newMessageBtn');
  const refreshStatusBtn = document.getElementById('refreshStatus');
  const statusDetailsBtn = document.getElementById('statusDetails');

  // Firebase instances (will be initialized later)
  let firebaseApp = null;
  let auth = null;
  let db = null;
  let driverRef = null;
  let currentUid = null;
  let driverListener = null;

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
    const el = document.getElementById('year');
    if (el) el.textContent = new Date().getFullYear();
  }

  function loadDriverData(data) {
    if (!data) {
      headerName.textContent = auth && auth.currentUser ? (auth.currentUser.displayName || auth.currentUser.email || 'Driver') : 'Driver';
      headerEmail.textContent = auth && auth.currentUser ? (auth.currentUser.email || '') : '';
      avatarInitials.textContent = initials(headerName.textContent);

      displayName.textContent = '—';
      displayPhone.textContent = '—';
      displayEmail.textContent = auth && auth.currentUser ? (auth.currentUser.email || '—') : '—';

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
      fieldEmail.textContent = auth && auth.currentUser ? (auth.currentUser.email || '—') : '—';
      return;
    }

    headerName.textContent = data.name || (auth && auth.currentUser ? auth.currentUser.displayName || auth.currentUser.email : 'Driver');
    headerEmail.textContent = data.email || (auth && auth.currentUser ? auth.currentUser.email : '');
    avatarInitials.textContent = initials(headerName.textContent);

    displayName.textContent = data.name || '—';
    displayPhone.textContent = data.phone || '—';
    displayEmail.textContent = data.email || (auth && auth.currentUser ? auth.currentUser.email : '—');

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
    fieldEmail.textContent = data.email || (auth && auth.currentUser ? auth.currentUser.email : '—');
  }

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

    auth.onAuthStateChanged(user => {
      if (user) {
        currentUid = user.uid;
        hideAuth();
        attachDriverListener(currentUid);
      } else {
        currentUid = null;
        detachDriverListener();
        showAuth();
        loadDriverData(null);
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

  function updateDriverData(patch) {
    if (!currentUid) {
      alert('Not signed in.');
      return Promise.reject(new Error('Not signed in'));
    }
    const now = new Date().toISOString();
    patch.lastUpdated = now;
    const updates = {};
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

  function deleteDriverSubmission() {
    if (!currentUid) {
      alert('Not signed in.');
      return;
    }
    if (!confirm('Delete your submission? This action cannot be undone.')) return;
    return db.ref('drivers/' + currentUid).remove()
      .then(() => {
        alert('Submission deleted.');
      })
      .catch(err => {
        console.error('Delete failed', err);
        alert('Delete failed. See console for details.');
      });
  }

  function signOut() {
    if (!auth) return;
    auth.signOut().then(() => {
      // Signed out
    }).catch(err => {
      console.error('Sign out error', err);
      alert('Sign out failed. See console for details.');
    });
  }

  function showAuth(message) {
    if (authBackdrop) {
      authBackdrop.setAttribute('aria-hidden', 'false');
      if (message && authError) {
        authError.style.display = 'block';
        authError.textContent = message;
      } else if (authError) {
        authError.style.display = 'none';
      }
    }
    // make dashboard non-interactive (aria-hidden)
    document.getElementById('app').setAttribute('aria-hidden', 'true');
  }

  function hideAuth() {
    if (authBackdrop) {
      authBackdrop.setAttribute('aria-hidden', 'true');
      if (authError) {
        authError.style.display = 'none';
      }
    }
    document.getElementById('app').setAttribute('aria-hidden', 'false');
  }

  function openEditModalFromData(data) {
    modalName.value = data && data.name ? data.name : (auth.currentUser ? (auth.currentUser.displayName || '') : '');
    modalPhone.value = data && data.phone ? data.phone : '';
    modalVehicle.value = data && data.vehicle ? data.vehicle : '';
    modalPlate.value = data && data.plate ? data.plate : '';
    modalNotes.value = data && data.notes ? data.notes : '';
    modalBackdrop.classList.add('show');
    modalBackdrop.setAttribute('aria-hidden', 'false');
    document.getElementById('modalTitle').textContent = 'Edit Profile';
  }

  function openQuickView(data) {
    // reuse modal as quick view (read-only)
    document.getElementById('modalTitle').textContent = 'Profile quick view';
    modalName.value = data && data.name ? data.name : '';
    modalPhone.value = data && data.phone ? data.phone : '';
    modalVehicle.value = data && data.vehicle ? data.vehicle : '';
    modalPlate.value = data && data.plate ? data.plate : '';
    modalNotes.value = data && data.notes ? data.notes : '';
    // disable inputs
    modalName.disabled = modalPhone.disabled = modalVehicle.disabled = modalPlate.disabled = modalNotes.disabled = true;
    document.getElementById('saveModal').style.display = 'none';
    document.getElementById('cancelModal').textContent = 'Close';
    modalBackdrop.classList.add('show');
    modalBackdrop.setAttribute('aria-hidden', 'false');
  }

  function closeModalFn() {
    modalBackdrop.classList.remove('show');
    modalBackdrop.setAttribute('aria-hidden', 'true');
    // enable inputs and restore buttons
    modalName.disabled = modalPhone.disabled = modalVehicle.disabled = modalPlate.disabled = modalNotes.disabled = false;
    document.getElementById('saveModal').style.display = '';
    document.getElementById('cancelModal').textContent = 'Cancel';
  }

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

    // Auth form sign in
    authForm.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const email = authEmail.value.trim();
      const pass = authPassword.value;
      auth.signInWithEmailAndPassword(email, pass)
        .then(() => {
          // signed in; onAuthStateChanged will run
        })
        .catch(err => {
          console.error('Sign in failed', err);
          showAuth(err.message || 'Sign in failed');
        });
    });

    // Create account
    createAccountBtn.addEventListener('click', () => {
      const email = authEmail.value.trim();
      const pass = authPassword.value;
      if (!email || pass.length < 6) {
        showAuth('Provide a valid email and a password with at least 6 characters.');
        return;
      }
      auth.createUserWithEmailAndPassword(email, pass)
        .then(cred => {
          // create an initial driver DB node
          const uid = cred.user.uid;
          const initial = {
            email: email,
            name: cred.user.displayName || '',
            activeSince: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
          };
          return db.ref('drivers/' + uid).set(initial);
        })
        .catch(err => {
          console.error('Create account failed', err);
          showAuth(err.message || 'Account creation failed');
        });
    });

    // Anonymous sign-in for testing (not recommended for production)
    anonSignInBtn.addEventListener('click', () => {
      auth.signInAnonymously().catch(err => {
        console.error('Anonymous sign-in failed', err);
        showAuth(err.message || 'Anonymous sign in failed');
      });
    });

    // Edit profile
    editProfileBtn.addEventListener('click', () => {
      if (driverRef) {
        driverRef.once('value').then(snap => openEditModalFromData(snap.val())).catch(() => openEditModalFromData(null));
      } else {
        openEditModalFromData(null);
      }
    });
    menuEditProfile.addEventListener('click', (e) => {
      editProfileBtn.click();
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
        })
        .catch(() => {
          alert('Failed to save changes. See console for details.');
        });
    });

    // Quick view
    quickViewProfile.addEventListener('click', () => {
      if (driverRef) {
        driverRef.once('value').then(snap => openQuickView(snap.val())).catch(() => openQuickView(null));
      } else {
        openQuickView(null);
      }
    });

    // Vehicle view/edit
    viewVehicleBtn.addEventListener('click', () => {
      if (driverRef) {
        driverRef.once('value').then(snap => {
          const data = snap.val();
          document.getElementById('modalTitle').textContent = 'Vehicle details';
          modalVehicle.value = data && data.vehicle ? data.vehicle : '';
          modalPlate.value = data && data.plate ? data.plate : '';
          modalNotes.value = data && data.notes ? data.notes : '';
          // disable name & phone for this view
          modalName.value = '';
          modalName.disabled = modalPhone.disabled = true;
          document.getElementById('saveModal').style.display = '';
          modalBackdrop.classList.add('show');
          modalBackdrop.setAttribute('aria-hidden', 'false');
        }).catch(()=>alert('Unable to load vehicle info.'));
      } else {
        alert('No vehicle info available.');
      }
    });
    editVehicleBtn.addEventListener('click', () => {
      if (driverRef) {
        driverRef.once('value').then(snap => {
          openEditModalFromData(snap.val());
        }).catch(()=>openEditModalFromData(null));
      } else {
        openEditModalFromData(null);
      }
    });

    // Update availability (prompt for a datetime string or simple input)
    updateAvailabilityBtn.addEventListener('click', () => {
      const val = prompt('Enter next availability (e.g. 2025-12-05 08:00 or "Today 09:00")');
      if (val !== null) {
        updateDriverData({ availability: val }).catch(()=>alert('Failed to update availability.'));
      }
    });

    // Share location (geolocation API)
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
          }).catch(()=> {
            locateBtn.disabled = false;
            locateBtn.textContent = 'Share location';
            alert('Failed to update location.');
          });
        }, err => {
          console.error('Geolocation failed:', err);
          alert('Unable to get location.');
          locateBtn.disabled = false;
          locateBtn.textContent = 'Share location';
        });
      });
    }

    // Messages button (placeholder)
    newMessageBtn.addEventListener('click', () => {
      alert('Messages are not implemented yet. This could open an in-app messaging UI.');
    });

    // Refresh and details
    if (refreshStatusBtn) {
      refreshStatusBtn.addEventListener('click', () => {
        if (driverRef && currentUid) {
          driverRef.once('value').then(snap => loadDriverData(snap.val()));
        }
      });
    }
    if (statusDetailsBtn) {
      statusDetailsBtn.addEventListener('click', () => {
        if (driverRef) {
          driverRef.once('value').then(snap => {
            const data = snap.val() || {};
            alert('Status details:\n' + JSON.stringify(data, null, 2));
          });
        } else {
          alert('No status data available.');
        }
      });
    }

    // Delete & submit & edit-info
    deleteSubmissionBtn.addEventListener('click', ()=>deleteDriverSubmission());
    submitChangesBtn.addEventListener('click', () => {
      const patch = {
        name: fieldName.textContent !== '—' ? fieldName.textContent : '',
        phone: fieldContact.textContent !== '—' ? fieldContact.textContent : '',
        vehicle: fieldVehicle.textContent !== '—' ? fieldVehicle.textContent : '',
        plate: fieldPlate.textContent !== '—' ? fieldPlate.textContent : '',
        location: fieldLocation.textContent !== '—' ? fieldLocation.textContent : '',
        availability: fieldAvailability.textContent !== '—' ? fieldAvailability.textContent : '',
        notes: fieldNotes.textContent !== '—' ? fieldNotes.textContent : ''
      };
      updateDriverData(patch).catch(()=>alert('Submit failed.'));
    });
    editInfoBtn.addEventListener('click', () => {
      if (driverRef) {
        driverRef.once('value').then(snap => openEditModalFromData(snap.val())).catch(()=>openEditModalFromData(null));
      } else {
        openEditModalFromData(null);
      }
    });

    // Logout
    menuLogout.addEventListener('click', signOut);
    sidebarLogout.addEventListener('click', signOut);
  }

  // init on load
  document.addEventListener('DOMContentLoaded', () => {
    setYear();
    setupEvents();
    initFirebase();
  });

  // Expose some functions for debugging
  window.UNIRAPH = {
    updateDriverData,
    deleteDriverSubmission,
    signOut
  };
})();