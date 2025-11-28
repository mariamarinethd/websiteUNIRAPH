// find-auth.js
// Reads available drivers from Firebase Realtime Database and renders them into #driverList.
// Adds client-side filters: search (name/plate/notes), vehicle type, location substring,
// and availability datetime range. Phone numbers are masked by default and revealed on-demand.

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

// Initialize app if not already
if (!firebase.apps || !firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

(function () {
  const listEl = document.getElementById('driverList');

  const searchInput = document.getElementById('searchInput');
  const vehicleFilter = document.getElementById('vehicleFilter');
  const locationFilter = document.getElementById('locationFilter');
  const clearFiltersBtn = document.getElementById('clearFilters');
  const availabilityFromInput = document.getElementById('availabilityFrom');
  const availabilityToInput = document.getElementById('availabilityTo');

  let driversEntries = []; // stored as [{id, name, contact, ...}, ...] from DB snapshot

  function escapeHtml(s) {
    if (s === null || s === undefined) return '';
    return String(s).replace(/[&<>"']/g, ch => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"
    })[ch]);
  }

  function normalizePhone(phone) {
    if (!phone) return '';
    const cleaned = phone.replace(/[^\d+]/g, '');
    if (/^0[9]\d{9}$/.test(cleaned)) {
      return '+63' + cleaned.slice(1);
    }
    return cleaned;
  }

  function maskPhone(phone) {
    // phone assumed to be normalized (+63... or digits). Show small prefix and suffix, mask middle.
    if (!phone) return '';
    // Keep leading '+' if present
    const lead = phone.startsWith('+') ? '+' : '';
    const digits = phone.replace(/\D/g, '');
    // show first 3 digits and last 3
    const start = digits.slice(0, 3);
    const end = digits.slice(-3);
    const middleLen = Math.max(0, digits.length - start.length - end.length);
    const middle = middleLen > 0 ? '•'.repeat(Math.min(middleLen, 6)) : '';
    // format nicely
    return `${lead}${start}${middle}${end}`;
  }

  function parseDateTimeLocal(s) {
    if (!s) return null;
    // datetime-local has no timezone; constructing Date(s) treats it as local
    const d = new Date(s);
    if (isNaN(d.getTime())) return null;
    return d;
  }

  function filterDrivers(entries, {search, vehicle, location, availabilityFrom, availabilityTo}) {
    const q = (search || '').trim().toLowerCase();
    const v = (vehicle || '').trim().toLowerCase();
    const loc = (location || '').trim().toLowerCase();

    const fromDate = parseDateTimeLocal(availabilityFrom);
    const toDate = parseDateTimeLocal(availabilityTo);

    return entries.filter(d => {
      // vehicle exact match if selected
      if (v && String(d.vehicle || '').toLowerCase() !== v) return false;

      // location substring match (look in location and notes)
      if (loc) {
        const foundLoc =
          String(d.location || '').toLowerCase().includes(loc) ||
          String(d.notes || '').toLowerCase().includes(loc);
        if (!foundLoc) return false;
      }

      // availability range check
      if ((fromDate || toDate) && d.availability) {
        const drvDate = parseDateTimeLocal(d.availability);
        if (!drvDate) return false;
        if (fromDate && drvDate < fromDate) return false;
        if (toDate && drvDate > toDate) return false;
      } else if ((fromDate || toDate) && !d.availability) {
        // if filtering by availability but driver has no availability, exclude
        return false;
      }

      // text search across name, plate, notes, contact, vehicle, location
      if (q) {
        const hay = [
          d.name, d.plate, d.notes, d.contact, d.vehicle, d.location
        ].map(x => String(x || '').toLowerCase()).join(' ');
        return hay.includes(q);
      }
      return true;
    });
  }

  function renderDrivers(entries) {
    listEl.innerHTML = '';
    if (!entries || entries.length === 0) {
      listEl.innerHTML = '<div class="no-results">No drivers match your filters.</div>';
      return;
    }

    entries.forEach(driver => {
      const card = document.createElement('div');
      card.className = 'driver-card';

      const phoneNormalized = normalizePhone(driver.contact);
      const phoneMasked = maskPhone(phoneNormalized);
      const telHref = phoneNormalized ? `tel:${encodeURIComponent(phoneNormalized)}` : '#';
      const smsHref = phoneNormalized ? `sms:${encodeURIComponent(phoneNormalized)}` : '#';
      const waNumber = phoneNormalized ? phoneNormalized.replace(/[^\d]/g,'') : '';

      const availability = driver.availability || '';

      // contact block: masked phone + Show contact button + hidden links
      const contactHtml = phoneNormalized ? `
        <div class="contact-block">
          <span class="masked-phone">${escapeHtml(phoneMasked)}</span>
          <button class="btn btn-ghost show-contact" data-phone="${encodeURIComponent(phoneNormalized)}">Show contact</button>
          <div class="contact-links hidden" data-phone="${encodeURIComponent(phoneNormalized)}">
            <a class="action-link" href="${telHref}"><i class="fas fa-phone"></i> Call</a>
            <a class="action-link" href="${smsHref}"><i class="fas fa-comment"></i> Text</a>
            ${waNumber ? `<a class="action-link" href="https://wa.me/${encodeURIComponent(waNumber)}" target="_blank" rel="noreferrer">WhatsApp</a>` : ''}
          </div>
        </div>
      ` : `<div class="small">Contact not provided</div>`;

      card.innerHTML = `
        <h4>${escapeHtml(driver.name || 'Unnamed')} | ${escapeHtml(driver.vehicle || '')} | ${escapeHtml(driver.plate || '')}</h4>
        <div class="small">Location: ${escapeHtml(driver.location || 'Not specified')}</div>
        <div class="muted">Availability: ${escapeHtml(availability)}</div>
        <p style="margin-top:0.5rem;">Notes: ${escapeHtml(driver.notes) || 'None'}</p>
        ${contactHtml}
      `;

      listEl.appendChild(card);
    });
  }

  function applyFiltersAndRender() {
    const filtered = filterDrivers(driversEntries, {
      search: searchInput.value,
      vehicle: vehicleFilter.value,
      location: locationFilter.value,
      availabilityFrom: availabilityFromInput.value,
      availabilityTo: availabilityToInput.value
    });
    renderDrivers(filtered);
  }

  function showLoading() {
    listEl.innerHTML = '<p>Loading drivers...</p>';
  }

  function showError(msg) {
    listEl.innerHTML = `<p style="color:#b91c1c">Error loading drivers: ${escapeHtml(msg)}</p>
      <p class="small">If you see 'permission_denied' configure your Realtime Database rules to allow public read on /drivers.</p>`;
  }

  // Realtime listener
  function attachRealtimeListener() {
    showLoading();
    const driversRef = db.ref('drivers');
    driversRef.on('value', snapshot => {
      try {
        const val = snapshot.val();
        if (!val) {
          driversEntries = [];
          applyFiltersAndRender();
          return;
        }
        // Convert to array and sort by createdAt descending (newest first)
        const arr = Object.entries(val).map(([id, d]) => ({ id, ...d }));
        arr.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        driversEntries = arr;
        applyFiltersAndRender();
      } catch (err) {
        console.error('render error', err);
        showError(err.message || 'Unknown error');
      }
    }, error => {
      console.error('database read error', error);
      showError(error.message || 'Failed to read drivers');
    });
  }

  // Wire up filter UI events (instant filtering)
  searchInput.addEventListener('input', () => applyFiltersAndRender());
  vehicleFilter.addEventListener('change', () => applyFiltersAndRender());
  locationFilter.addEventListener('input', () => applyFiltersAndRender());
  availabilityFromInput.addEventListener('change', () => applyFiltersAndRender());
  availabilityToInput.addEventListener('change', () => applyFiltersAndRender());
  clearFiltersBtn.addEventListener('click', () => {
    searchInput.value = '';
    vehicleFilter.value = '';
    locationFilter.value = '';
    availabilityFromInput.value = '';
    availabilityToInput.value = '';
    applyFiltersAndRender();
  });

  // Delegate click for "Show contact" buttons: reveal hidden contact links and unmask phone
  document.addEventListener('click', function (e) {
    const target = e.target;
    if (target && target.matches('.show-contact')) {
      const encoded = target.getAttribute('data-phone') || '';
      const phone = decodeURIComponent(encoded);
      // find nearest card and reveal contact links
      const card = target.closest('.driver-card');
      if (!card) return;
      const maskedSpan = card.querySelector('.masked-phone');
      const linksDiv = card.querySelector('.contact-links');
      if (maskedSpan) maskedSpan.textContent = phone;
      if (linksDiv) linksDiv.classList.remove('hidden');
      // hide the show button after reveal
      target.classList.add('hidden');
      target.setAttribute('aria-hidden', 'true');
    }
  });

  // Start realtime listener
  attachRealtimeListener();
})();