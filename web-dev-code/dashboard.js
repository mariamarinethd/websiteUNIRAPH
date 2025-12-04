// Cleaned dashboard.js — removed unused variables/features and simplified logic.
// Keeps core: auth, driver profile at /drivers/{uid}, and submissions at /submissions (uid).

(function () {
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

  // DOM elements used by this page (kept minimal)
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

  const profileCompletion = document.getElementById('profileCompletion');
  const lastUpdated = document.getElementById('lastUpdated');
  const activeSince = document.getElementById('activeSince');

  const fieldName = document.getElementById('fieldName');
  const fieldContact = document.getElementById('fieldContact');
  const fieldVehicle = document.getElementById('fieldVehicle');
  const fieldPlate = document.getElementById('fieldPlate');
  const fieldLocation = document.getElementById('fieldLocation');
  const fieldAvailability = document.getElementById('fieldAvailability');
  const fieldNotes = document.getElementById('fieldNotes');
  const fieldEmail = document.getElementById('fieldEmail');

  // Auth & modal elements
  const authBackdrop = document.getElementById('authBackdrop');
  const authForm = document.getElementById('authForm');
  const authEmail = document.getElementById('authEmail');
  const authPassword = document.getElementById('authPassword');
  const createAccountBtn = document.getElementById('createAccountBtn');
  const authError = document.getElementById('authError');

  const modalBackdrop = document.getElementById('modalBackdrop');
  const profileBtn = document.getElementById('profileBtn');
  const profileMenu = document.getElementById('profileMenu');
  const editProfileBtn = document.getElementById('editProfileBtn');
  const menuEditProfile = document.getElementById('menuEditProfile');
  const closeModal = document.getElementById('closeModal');
  const cancelModal = document.getElementById('cancelModal');
  const modalForm = document.getElementById('modalForm');

  const modalName = document.getElementById('modalName');
  const modalPhone = document.getElementById('modalPhone');
  const modalVehicle = document.getElementById('modalVehicle');
  const modalPlate = document.getElementById('modalPlate');
  const modalNotes = document.getElementById('modalNotes');

  const deleteSubmissionBtn = document.getElementById('deleteSubmissionBtn');
  const submitChangesBtn = document.getElementById('submitChangesBtn');
  const editInfoBtn = document.getElementById('editInfoBtn');
  const menuLogout = document.getElementById('menuLogout');
  const sidebarLogout = document.getElementById('sidebarLogout');

  const refreshStatusBtn = document.getElementById('refreshStatus');
  const statusDetailsBtn = document.getElementById('statusDetails');

  const submissionsListEl = document.getElementById('submissionsList');

  // Firebase handles
  let auth = null;
  let db = null;
  let driverRef = null;
  let currentUid = null;
  let submissionsQuery = null;
  let submissionsListener = null;
  let driverListener = null;

  /* Helpers */
  function initials(name) {
    return (name || 'D').split(' ').map(n => n[0] || '').slice(0, 2).join('').toUpperCase();
  }
  function formatDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    return isNaN(d.getTime()) ? iso : d.toLocaleString();
  }
  function sanitizeText(s) {
    if (s === undefined || s === null) return '—';
    return String(s);
  }
  function setYear() { if (yearEl) yearEl.textContent = new Date().getFullYear(); }

  /* UI update for driver profile */
  function loadDriverData(data) {
    if (!data) {
      headerName.textContent = auth && auth.currentUser ? (auth.currentUser.displayName || auth.currentUser.email || 'Driver') : 'Driver';
      headerEmail.textContent = auth && auth.currentUser ? (auth.currentUser.email || '') : '';
      avatarInitials.textContent = initials(headerName.textContent);

      displayName.textContent = '—';
      displayPhone.textContent = '—';
      displayEmail.textContent = auth && auth.currentUser ? (auth.currentUser.email || '—') : '—';

      vehicleType.textContent = plateNumber.textContent = notesPreview.textContent = '—';
      profileCompletion.textContent = '0%';
      lastUpdated.textContent = activeSince.textContent = '—';

      fieldName.textContent = fieldContact.textContent = fieldVehicle.textContent = '—';
      fieldPlate.textContent = fieldLocation.textContent = fieldAvailability.textContent = fieldNotes.textContent = fieldEmail.textContent = '—';
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
    notesPreview.textContent = (data.notes && data.notes.length > 60) ? data.notes.slice(0,60) + '…' : (data.notes || '—');

    lastUpdated.textContent = formatDate(data.lastUpdated) || '—';
    activeSince.textContent = data.activeSince || '—';

    const keys = ['name','phone','email','vehicle','plate','location','availability'];
    const filled = keys.reduce((c,k) => c + (!!data[k]), 0);
    profileCompletion.textContent = Math.round((filled / keys.length) * 100) + '%';

    fieldName.textContent = data.name || '—';
    fieldContact.textContent = data.phone || data.contact || '—';
    fieldVehicle.textContent = data.vehicle || '—';
    fieldPlate.textContent = data.plate || '—';
    fieldLocation.textContent = data.location || '—';
    fieldAvailability.textContent = data.availability || '—';
    fieldNotes.textContent = data.notes || '—';
    fieldEmail.textContent = data.email || (auth && auth.currentUser ? auth.currentUser.email : '—');
  }

  /* Firebase initialization and auth */
  function initFirebase() {
    try {
      firebase.initializeApp(firebaseConfig);
      auth = firebase.auth();
      db = firebase.database();
    } catch (err) {
      console.error('Firebase init failed', err);
      return;
    }

    auth.onAuthStateChanged(user => {
      console.debug('auth state changed:', user && user.uid);
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

  /* Driver profile listener */
  function attachDriverListener(uid) {
    if (!db) return;
    detachDriverListener();
    driverRef = db.ref('drivers/' + uid);
    driverListener = driverRef.on('value', snap => loadDriverData(snap.exists() ? snap.val() : null),
      err => console.error('driver listener error', err));
  }
  function detachDriverListener() {
    if (driverRef && driverListener) driverRef.off('value', driverListener);
    driverRef = null; driverListener = null;
  }

  /* Submissions listener: straightforward, query by uid */
  function attachSubmissionsListener(uid) {
    if (!db) return;
    detachSubmissionsListener();
    try {
      submissionsQuery = db.ref('submissions').orderByChild('uid').equalTo(uid);
      submissionsListener = submissionsQuery.on('value', snap => renderSubmissionsSnapshot(snap),
        err => {
          console.error('submissions listener error', err);
          submissionsListEl.innerHTML = '<div class="muted">Unable to load submissions.</div>';
        });
    } catch (err) {
      console.error('attachSubmissionsListener error', err);
    }
  }
  function detachSubmissionsListener() {
    if (submissionsQuery && submissionsListener) submissionsQuery.off('value', submissionsListener);
    submissionsQuery = null; submissionsListener = null;
  }

  function renderSubmissionsEmpty() {
    submissionsListEl.innerHTML = '<div class="muted">No submissions yet.</div>';
  }

  function renderSubmissionsSnapshot(snapshot) {
    const val = snapshot.exists() ? snapshot.val() : null;
    submissionsListEl.innerHTML = '';
    if (!val) { renderSubmissionsEmpty(); return; }

    const entries = Object.entries(val).sort((a,b) => (b[1].createdAt || 0) - (a[1].createdAt || 0));
    for (const [id, data] of entries) renderSubmissionCard(id, data);
  }

  function renderSubmissionCard(id, data) {
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
    title.innerHTML = `<strong>${sanitizeText(data.name || data.driverName || 'Submission')}</strong>
      <div style="font-size:12px;color:var(--muted)">${sanitizeText(data.createdAt || data.lastUpdated || '')}</div>`;

    const actions = document.createElement('div');
    actions.style.display = 'flex';
    actions.style.gap = '6px';

    const btnView = document.createElement('button');
    btnView.className = 'btn ghost'; btnView.textContent = 'View';
    btnView.addEventListener('click', () => openSubmissionInModal(id, data, true));

    const btnEdit = document.createElement('button');
    btnEdit.className = 'btn'; btnEdit.textContent = 'Edit';
    btnEdit.addEventListener('click', () => openSubmissionInModal(id, data, false));

    const btnDelete = document.createElement('button');
    btnDelete.className = 'btn ghost'; btnDelete.style.background = '#ef4444'; btnDelete.style.color = 'white';
    btnDelete.textContent = 'Delete';
    btnDelete.addEventListener('click', () => {
      if (!confirm('Delete this submission?')) return;
      db.ref('submissions/' + id).remove().catch(err => { console.error('delete failed', err); alert('Delete failed. See console.'); });
    });

    actions.appendChild(btnView); actions.appendChild(btnEdit); actions.appendChild(btnDelete);
    rowTop.appendChild(title); rowTop.appendChild(actions);

    const body = document.createElement('div');
    body.style.display = 'grid'; body.style.gridTemplateColumns = 'repeat(2,1fr)'; body.style.gap = '8px';
    function mkField(label, val) {
      const f = document.createElement('div');
      f.style.background = 'var(--blue-100)'; f.style.padding = '8px'; f.style.borderRadius = '8px';
      f.innerHTML = `<div style="font-size:12px;color:var(--muted);font-weight:700">${label}</div><div style="font-weight:700;color:#07143a">${sanitizeText(val)}</div>`;
      return f;
    }
    body.appendChild(mkField('Contact', data.phone || data.contact || '—'));
    body.appendChild(mkField('Vehicle', data.vehicle || '—'));
    body.appendChild(mkField('Plate', data.plate || '—'));
    body.appendChild(mkField('Location', data.location || '—'));
    body.appendChild(mkField('Availability', data.availability || '—'));

    const notesWrap = document.createElement('div');
    notesWrap.style.gridColumn = '1 / -1'; notesWrap.style.background = 'var(--blue-100)';
    notesWrap.style.padding = '8px'; notesWrap.style.borderRadius = '8px';
    notesWrap.innerHTML = `<div style="font-size:12px;color:var(--muted);font-weight:700">Notes</div>
      <div style="font-weight:700;color:#07143a;white-space:pre-wrap">${sanitizeText(data.notes || '')}</div>`;
    body.appendChild(notesWrap);

    card.appendChild(rowTop); card.appendChild(body);
    submissionsListEl.appendChild(card);
  }

  /* Modal handling */
  let editingSubmissionId = null;
  function openSubmissionInModal(id, data, readOnly) {
    editingSubmissionId = id || null;
    document.getElementById('modalTitle').textContent = readOnly ? 'View Submission' : (id ? 'Edit Submission' : 'New Submission');

    modalName.value = data && (data.name || data.driverName) ? (data.name || data.driverName) : (auth.currentUser ? (auth.currentUser.displayName || '') : '');
    modalPhone.value = data && (data.phone || data.contact) ? (data.phone || data.contact) : '';
    modalVehicle.value = data && data.vehicle ? data.vehicle : '';
    modalPlate.value = data && data.plate ? data.plate : '';
    modalNotes.value = data && data.notes ? data.notes : '';

    modalName.disabled = modalPhone.disabled = modalVehicle.disabled = modalPlate.disabled = modalNotes.disabled = !!readOnly;
    const saveBtn = document.getElementById('saveModal');
    if (saveBtn) saveBtn.style.display = readOnly ? 'none' : '';
    if (cancelModal) cancelModal.textContent = readOnly ? 'Close' : 'Cancel';

    modalBackdrop.classList.add('show'); modalBackdrop.setAttribute('aria-hidden', 'false');
  }
  function closeModalFn() {
    modalBackdrop.classList.remove('show'); modalBackdrop.setAttribute('aria-hidden', 'true');
    modalName.disabled = modalPhone.disabled = modalVehicle.disabled = modalPlate.disabled = modalNotes.disabled = false;
    const saveBtn = document.getElementById('saveModal'); if (saveBtn) saveBtn.style.display = '';
    if (cancelModal) cancelModal.textContent = 'Cancel';
    editingSubmissionId = null;
  }

  /* Events setup */
  function setupEvents() {
    if (profileBtn) {
      profileBtn.addEventListener('click', () => profileMenu.classList.toggle('show'));
    }
    document.addEventListener('click', ev => {
      if (profileMenu && !profileMenu.contains(ev.target) && profileBtn && !profileBtn.contains(ev.target)) profileMenu.classList.remove('show');
    });

    // Auth form
    if (authForm) {
      authForm.addEventListener('submit', ev => {
        ev.preventDefault();
        const email = authEmail.value.trim(); const pass = authPassword.value;
        auth.signInWithEmailAndPassword(email, pass).catch(err => {
          console.error('Sign in failed', err); showAuth(err.message || 'Sign in failed');
        });
      });
    }

    // Create account (ensures ownerUid is written)
    if (createAccountBtn) {
      createAccountBtn.addEventListener('click', () => {
        const email = authEmail.value.trim(); const pass = authPassword.value;
        if (!email || pass.length < 6) { showAuth('Provide a valid email and a password with at least 6 characters.'); return; }
        auth.createUserWithEmailAndPassword(email, pass).then(cred => {
          const uid = cred.user.uid;
          const initial = {
            email, name: cred.user.displayName || '', activeSince: new Date().toISOString(),
            lastUpdated: new Date().toISOString(), ownerUid: uid
          };
          return db.ref('drivers/' + uid).set(initial);
        }).catch(err => { console.error('Create account failed', err); showAuth(err.message || 'Account creation failed'); });
      });
    }

    if (editProfileBtn) editProfileBtn.addEventListener('click', () => {
      if (driverRef) driverRef.once('value').then(snap => openSubmissionInModal(null, snap.val(), false)).catch(() => openSubmissionInModal(null, null, false));
      else openSubmissionInModal(null, null, false);
    });
    if (menuEditProfile) menuEditProfile.addEventListener('click', () => { if (editProfileBtn) editProfileBtn.click(); });

    if (closeModal) closeModal.addEventListener('click', closeModalFn);
    if (cancelModal) cancelModal.addEventListener('click', closeModalFn);

    if (modalForm) {
      modalForm.addEventListener('submit', ev => {
        ev.preventDefault();
        const updated = {
          name: modalName.value.trim(), phone: modalPhone.value.trim(), vehicle: modalVehicle.value.trim(),
          plate: modalPlate.value.trim(), notes: modalNotes.value.trim(), uid: currentUid,
          lastUpdated: new Date().toISOString()
        };
        if (editingSubmissionId) {
          db.ref('submissions/' + editingSubmissionId).update(updated).then(closeModalFn).catch(err => { console.error('Update submission failed', err); alert('Failed to save submission.'); });
        } else {
          updateDriverData(updated).then(closeModalFn).catch(() => alert('Failed to save changes. See console for details.'));
        }
      });
    }

    if (refreshStatusBtn) refreshStatusBtn.addEventListener('click', () => { if (driverRef && currentUid) driverRef.once('value').then(snap => loadDriverData(snap.val())); });
    if (statusDetailsBtn) statusDetailsBtn.addEventListener('click', () => { if (driverRef) driverRef.once('value').then(snap => alert('Status details:\n' + JSON.stringify(snap.val() || {}, null, 2))); });

    if (deleteSubmissionBtn) deleteSubmissionBtn.addEventListener('click', () => {
      if (!currentUid) { alert('Not signed in.'); return; }
      if (!confirm('Delete your driver profile? This will remove your profile node under /drivers/{uid}')) return;
      db.ref('drivers/' + currentUid).remove().catch(err => { console.error('Delete profile failed', err); alert('Delete failed.'); });
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

    if (editInfoBtn) editInfoBtn.addEventListener('click', () => { if (driverRef) driverRef.once('value').then(snap => openSubmissionInModal(null, snap.val(), false)); else openSubmissionInModal(null, null, false); });

    if (menuLogout) menuLogout.addEventListener('click', signOut);
    if (sidebarLogout) sidebarLogout.addEventListener('click', signOut);
  }

  /* Update driver profile */
  function updateDriverData(patch) {
    if (!currentUid) return Promise.reject(new Error('Not signed in'));
    patch.lastUpdated = new Date().toISOString();
    const allowed = ['name','phone','vehicle','plate','location','availability','notes','lastUpdated','activeSince','email','uid'];
    const updates = {};
    for (const k of Object.keys(patch)) if (allowed.includes(k)) updates[k] = patch[k];
    return db.ref('drivers/' + currentUid).update(updates).then(() => console.debug('driver updated', updates)).catch(err => { console.error('Update failed', err); throw err; });
  }

  function signOut() { if (!auth) return; auth.signOut().catch(err => { console.error('Sign out error', err); alert('Sign out failed. See console.'); }); }

  function showAuth(message) {
    if (authBackdrop) {
      authBackdrop.setAttribute('aria-hidden', 'false');
      if (authError) {
        authError.style.display = message ? 'block' : 'none';
        authError.textContent = message || '';
      }
    }
    const app = document.getElementById('app'); if (app) app.setAttribute('aria-hidden', 'true');
  }

  function hideAuth() {
    if (authBackdrop) { authBackdrop.setAttribute('aria-hidden', 'true'); if (authError) authError.style.display = 'none'; }
    const app = document.getElementById('app'); if (app) app.setAttribute('aria-hidden', 'false');
  }

  /* Init on DOM ready */
  document.addEventListener('DOMContentLoaded', () => {
    setYear();
    setupEvents();
    initFirebase();
    console.debug('dashboard initialized');
  });

  // Export a minimal debug surface
  window.UNIRAPH = { updateDriverData, signOut };
})();