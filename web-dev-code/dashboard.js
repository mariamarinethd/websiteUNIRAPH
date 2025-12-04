// Dashboard logic with Firebase Authentication + Realtime Database integration.
// Replace firebaseConfig below with your project's config object.

(function () {
  console.log('dashboard.js loaded');

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

  // other buttons (some removed from HTML — guard usage)
  const quickViewProfile = document.getElementById('quickViewProfile');
  const viewVehicleBtn = document.getElementById('viewVehicleBtn');
  const editVehicleBtn = document.getElementById('editVehicleBtn');
  const locateBtn = document.getElementById('locateBtn');
  const newMessageBtn = document.getElementById('newMessageBtn'); // may be null
  const refreshStatusBtn = document.getElementById('refreshStatus');
  const statusDetailsBtn = document.getElementById('statusDetails');

  // Submissions UI
  const submissionsListEl = document.getElementById('submissionsList');

  // Firebase instances (will be initialized later)
  let firebaseApp = null;
  let auth = null;
  let db = null;
  let driverRef = null;
  let currentUid = null;
  let driverListener = null;

  // Submissions refs/listener
  let submissionsQuery = null;
  let submissionsListener = null;

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
        attachSubmissionsListener(currentUid);
      } else {
        currentUid = null;
        detachDriverListener();
        detachSubmissionsListener();
        showAuth();
        loadDriverData(null);
        renderSubmissionsEmpty();
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

  // SUBMISSIONS: listen to /submissions where child 'uid' equals currentUid
  function attachSubmissionsListener(uid) {
    if (!db) return;
    detachSubmissionsListener();
    try {
      submissionsQuery = db.ref('submissions').orderByChild('uid').equalTo(uid);
      submissionsListener = submissionsQuery.on('value', snapshot => {
        renderSubmissionsSnapshot(snapshot);
      }, err => {
        console.error('Submissions listener error:', err);
        submissionsListEl.innerHTML = '<div class="muted">Unable to load submissions.</div>';
      });
    } catch (err) {
      console.error('attachSubmissionsListener error', err);
    }
  }

  function detachSubmissionsListener() {
    if (submissionsQuery && submissionsListener) {
      submissionsQuery.off('value', submissionsListener);
    }
    submissionsQuery = null;
    submissionsListener = null;
  }

  function renderSubmissionsEmpty() {
    submissionsListEl.innerHTML = '<div class="muted">No submissions yet.</div>';
  }

  function sanitizeText(s) {
    if (s === undefined || s === null) return '—';
    return String(s);
  }

  function renderSubmissionsSnapshot(snapshot) {
    const val = snapshot.exists() ? snapshot.val() : null;
    submissionsListEl.innerHTML = '';
    if (!val) {
      renderSubmissionsEmpty();
      return;
    }

    // snapshot.val() is an object keyed by submission id
    const entries = Object.entries(val);
    entries.sort((a, b) => {
      const ta = a[1].createdAt || a[1].lastUpdated || '';
      const tb = b[1].createdAt || b[1].lastUpdated || '';
      return (tb > ta) ? 1 : -1;
    });

    for (const [id, data] of entries) {
      const card = document.createElement('div');
      card.className = 'card';
      card.style.padding = '12px';
      card.style.display = 'flex';
      card.style.flexDirection = 'column';
      card.style.gap = '8px';

      const rowTop = document.createElement('div');
      rowTop.style.display = 'flex';
      rowTop.style.justifyContent = 'space-between';
      rowTop.style.alignItems = 'center';

      const title = document.createElement('div');
      title.innerHTML = `<strong>${sanitizeText(data.name || data.driverName || 'Submission')}</strong><div style="font-size:12px;color:var(--muted)">${sanitizeText(data.createdAt || data.lastUpdated || '')}</div>`;

      const actions = document.createElement('div');
      actions.style.display = 'flex';
      actions.style.gap = '6px';

      const btnView = document.createElement('button');
      btnView.className = 'btn ghost';
      btnView.textContent = 'View';
      btnView.addEventListener('click', () => {
        openSubmissionInModal(id, data, /*readOnly*/ true);
      });

      const btnEdit = document.createElement('button');
      btnEdit.className = 'btn';
      btnEdit.textContent = 'Edit';
      btnEdit.addEventListener('click', () => {
        openSubmissionInModal(id, data, /*readOnly*/ false);
      });

      const btnDelete = document.createElement('button');
      btnDelete.className = 'btn ghost';
      btnDelete.style.background = '#ef4444';
      btnDelete.style.color = 'white';
      btnDelete.textContent = 'Delete';
      btnDelete.addEventListener('click', () => {
        if (!confirm('Delete this submission?')) return;
        db.ref('submissions/' + id).remove().catch(err => {
          console.error('Delete submission failed', err);
          alert('Delete failed. See console.');
        });
      });

      actions.appendChild(btnView);
      actions.appendChild(btnEdit);
      actions.appendChild(btnDelete);

      rowTop.appendChild(title);
      rowTop.appendChild(actions);

      // body details
      const body = document.createElement('div');
      body.style.display = 'grid';
      body.style.gridTemplateColumns = 'repeat(2,1fr)';
      body.style.gap = '8px';

      function mkField(label, val) {
        const f = document.createElement('div');
        f.style.background = 'var(--blue-100)';
        f.style.padding = '8px';
        f.style.borderRadius = '8px';
        f.innerHTML = `<div style="font-size:12px;color:var(--muted);font-weight:700">${label}</div><div style="font-weight:700;color:#07143a">${sanitizeText(val)}</div>`;
        return f;
      }

      body.appendChild(mkField('Contact', data.phone || data.contact || '—'));
      body.appendChild(mkField('Vehicle', data.vehicle || '—'));
      body.appendChild(mkField('Plate', data.plate || '—'));
      body.appendChild(mkField('Location', data.location || '—'));
      body.appendChild(mkField('Availability', data.availability || '—'));
      // Notes span full width
      const notesWrap = document.createElement('div');
      notesWrap.style.gridColumn = '1 / -1';
      notesWrap.style.background = 'var(--blue-100)';
      notesWrap.style.padding = '8px';
      notesWrap.style.borderRadius = '8px';
      notesWrap.innerHTML = `<div style="font-size:12px;color:var(--muted);font-weight:700">Notes</div><div style="font-weight:700;color:#07143a;white-space:pre-wrap">${sanitizeText(data.notes || '')}</div>`;
      body.appendChild(notesWrap);

      card.appendChild(rowTop);
      card.appendChild(body);

      submissionsListEl.appendChild(card);
    }
  }

  // Open submission in modal. If readOnly true, disable inputs.
  let editingSubmissionId = null;
  function openSubmissionInModal(id, data, readOnly) {
    editingSubmissionId = id || null;
    document.getElementById('modalTitle').textContent = readOnly ? 'View Submission' : (id ? 'Edit Submission' : 'New Submission');

    // populate modal fields — reuse modalName/modalPhone/...
    modalName.value = data && (data.name || data.driverName) ? (data.name || data.driverName) : (auth.currentUser ? (auth.currentUser.displayName || '') : '');
    modalPhone.value = data && (data.phone || data.contact) ? (data.phone || data.contact) : '';
    modalVehicle.value = data && data.vehicle ? data.vehicle : '';
    modalPlate.value = data && data.plate ? data.plate : '';
    modalNotes.value = data && data.notes ? data.notes : '';

    // set read-only state if needed
    modalName.disabled = modalPhone.disabled = modalVehicle.disabled = modalPlate.disabled = modalNotes.disabled = !!readOnly;
    document.getElementById('saveModal').style.display = readOnly ? 'none' : '';
    document.getElementById('cancelModal').textContent = readOnly ? 'Close' : 'Cancel';

    modalBackdrop.classList.add('show');
    modalBackdrop.setAttribute('aria-hidden', 'false');
  }

  function closeModalFn() {
    modalBackdrop.classList.remove('show');
    modalBackdrop.setAttribute('aria-hidden', 'true');
    modalName.disabled = modalPhone.disabled = modalVehicle.disabled = modalPlate.disabled = modalNotes.disabled = false;
    document.getElementById('saveModal').style.display = '';
    document.getElementById('cancelModal').textContent = 'Cancel';
    editingSubmissionId = null;
  }

  function setupEvents() {
    if (profileBtn) {
      profileBtn.addEventListener('click', (e) => {
        profileMenu.classList.toggle('show');
        const expanded = profileBtn.getAttribute('aria-expanded') === 'true';
        profileBtn.setAttribute('aria-expanded', (!expanded).toString());
      });
    }

    document.addEventListener('click', (ev) => {
      if (profileDropdown && !profileDropdown.contains(ev.target)) {
        if (profileMenu) profileMenu.classList.remove('show');
        if (profileBtn) profileBtn.setAttribute('aria-expanded', 'false');
      }
    });

    // Auth form sign in
    if (authForm) {
      authForm.addEventListener('submit', (ev) => {
        ev.preventDefault();
        const email = authEmail.value.trim();
        const pass = authPassword.value;
        auth.signInWithEmailAndPassword(email, pass)
          .then(() => {
            // onAuthStateChanged will handle UI change
          })
          .catch(err => {
            console.error('Sign in failed', err);
            showAuth(err.message || 'Sign in failed');
          });
      });
    }

    // Create account
    if (createAccountBtn) {
      createAccountBtn.addEventListener('click', () => {
        const email = authEmail.value.trim();
        const pass = authPassword.value;
        if (!email || pass.length < 6) {
          showAuth('Provide a valid email and a password with at least 6 characters.');
          return;
        }
        auth.createUserWithEmailAndPassword(email, pass)
          .then(cred => {
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
    }

    // Anonymous sign-in
    if (anonSignInBtn) {
      anonSignInBtn.addEventListener('click', () => {
        auth.signInAnonymously().catch(err => {
          console.error('Anonymous sign-in failed', err);
          showAuth(err.message || 'Anonymous sign in failed');
        });
      });
    }

    // Edit profile
    if (editProfileBtn) {
      editProfileBtn.addEventListener('click', () => {
        if (driverRef) {
          driverRef.once('value').then(snap => openSubmissionInModal(null, snap.val(), false)).catch(() => openSubmissionInModal(null, null, false));
        } else {
          openSubmissionInModal(null, null, false);
        }
      });
    }
    if (menuEditProfile) {
      menuEditProfile.addEventListener('click', (e) => {
        if (editProfileBtn) editProfileBtn.click();
      });
    }

    if (closeModal) closeModal.addEventListener('click', closeModalFn);
    if (cancelModal) cancelModal.addEventListener('click', closeModalFn);
    if (modalBackdrop) modalBackdrop.addEventListener('click', (ev) => {
      if (ev.target === modalBackdrop) closeModalFn();
    });

    if (modalForm) {
      modalForm.addEventListener('submit', (ev) => {
        ev.preventDefault();
        const updated = {
          name: modalName.value.trim(),
          phone: modalPhone.value.trim(),
          vehicle: modalVehicle.value.trim(),
          plate: modalPlate.value.trim(),
          notes: modalNotes.value.trim(),
          uid: currentUid,
          lastUpdated: new Date().toISOString()
        };

        // If editingSubmissionId, update that submission, otherwise update driver's profile
        if (editingSubmissionId) {
          db.ref('submissions/' + editingSubmissionId).update(updated).then(() => {
            closeModalFn();
          }).catch(err => {
            console.error('Update submission failed', err);
            alert('Failed to save submission.');
          });
        } else {
          // update driver profile also (keeps previous behavior)
          updateDriverData(updated).then(() => {
            closeModalFn();
          }).catch(() => {
            alert('Failed to save changes. See console for details.');
          });
        }
      });
    }

    // Quick view (guard if element exists)
    if (quickViewProfile) {
      quickViewProfile.addEventListener('click', () => {
        if (driverRef) {
          driverRef.once('value').then(snap => openSubmissionInModal(null, snap.val(), true)).catch(() => openSubmissionInModal(null, null, true));
        } else {
          openSubmissionInModal(null, null, true);
        }
      });
    }

    // Vehicle view/edit
    if (viewVehicleBtn) {
      viewVehicleBtn.addEventListener('click', () => {
        if (driverRef) {
          driverRef.once('value').then(snap => {
            const data = snap.val();
            openSubmissionInModal(null, data, true);
          }).catch(()=>alert('Unable to load vehicle info.'));
        } else {
          alert('No vehicle info available.');
        }
      });
    }
    if (editVehicleBtn) {
      editVehicleBtn.addEventListener('click', () => {
        if (driverRef) {
          driverRef.once('value').then(snap => openSubmissionInModal(null, snap.val(), false)).catch(()=>openSubmissionInModal(null, null, false));
        } else {
          openSubmissionInModal(null, null, false);
        }
      });
    }

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

    // Messages button (removed) — guard
    if (newMessageBtn) {
      newMessageBtn.addEventListener('click', () => {
        alert('Messages are not implemented yet.');
      });
    }

    // Refresh and details
    if (refreshStatusBtn) {
      refreshStatusBtn.addEventListener('click', () => {
        if (driverRef && currentUid) {
          driverRef.once('value').then(snap => loadDriverData(snap.val()));
          // refresh submissions too
          if (submissionsQuery) submissionsQuery.once('value').then(snap => renderSubmissionsSnapshot(snap));
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
    if (deleteSubmissionBtn) deleteSubmissionBtn.addEventListener('click', ()=> {
      // delete driver's profile node
      if (!currentUid) { alert('Not signed in.'); return; }
      if (!confirm('Delete your driver profile? This will remove your profile node under /drivers/{uid}')) return;
      db.ref('drivers/' + currentUid).remove().catch(err => {
        console.error('Delete profile failed', err);
        alert('Delete failed.');
      });
    });

    if (submitChangesBtn) submitChangesBtn.addEventListener('click', () => {
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

    if (editInfoBtn) editInfoBtn.addEventListener('click', () => {
      if (driverRef) {
        driverRef.once('value').then(snap => openSubmissionInModal(null, snap.val(), false)).catch(()=>openSubmissionInModal(null, null, false));
      } else {
        openSubmissionInModal(null, null, false);
      }
    });

    // Logout
    if (menuLogout) menuLogout.addEventListener('click', signOut);
    if (sidebarLogout) sidebarLogout.addEventListener('click', signOut);
  }

  function updateDriverData(patch) {
    if (!currentUid) {
      alert('Not signed in.');
      return Promise.reject(new Error('Not signed in'));
    }
    const now = new Date().toISOString();
    patch.lastUpdated = now;
    const updates = {};
    const allowed = ['name', 'phone', 'vehicle', 'plate', 'location', 'availability', 'notes', 'lastUpdated', 'activeSince', 'email', 'uid'];
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

  // Initialize app on DOMContentLoaded
  document.addEventListener('DOMContentLoaded', () => {
    setYear();
    setupEvents();
    initFirebase();
  });

  // Expose some functions for debugging
  window.UNIRAPH = {
    updateDriverData,
    signOut
  };
})();