// UI glue for the Offer Ride form and realtime "Available Drivers" list.
// Include after firebase-init.js in index.html:
// <script src="./firebase-config.js"></script>
// <script type="module" src="./firebase-init.js"></script>
// <script src="./drivers-ui.js" defer></script>

(function () {
  // Wait until firebase helpers are available
  function whenFirebaseReady(cb) {
    if (window.createDriver && window.onDriversChanged && window.signInWithEmail) {
      cb();
      return;
    }
    let attempts = 0;
    const iv = setInterval(() => {
      attempts++;
      if (window.createDriver && window.onDriversChanged) {
        clearInterval(iv);
        cb();
      } else if (attempts > 50) {
        clearInterval(iv);
        console.warn('Firebase helpers not available (drivers-ui).');
      }
    }, 100);
  }

  // Add a visible "Available Drivers" panel to the page (keeps the original design)
  function ensureDriversPanel() {
    if (document.getElementById('availableDrivers')) return;
    const container = document.createElement('section');
    container.id = 'availableDrivers';
    container.style.padding = '2rem 1.5rem';
    container.innerHTML = `<h2>Available Drivers</h2><div id="driversList">Loading...</div>`;
    // Insert after the hero section if present, otherwise append to main
    const hero = document.querySelector('.hero');
    if (hero && hero.parentNode) hero.parentNode.insertBefore(container, hero.nextSibling);
    else document.querySelector('main')?.prepend(container);
  }

  // Render drivers docs into the driversList element.
  function renderDrivers(docs) {
    const list = document.getElementById('driversList');
    if (!list) return;
    if (!docs || docs.length === 0) {
      list.innerHTML = '<div>No available drivers yet.</div>';
      return;
    }
    list.innerHTML = '';
    docs.forEach(d => {
      const item = document.createElement('div');
      item.className = 'driver-item';
      item.style.borderBottom = '1px solid #eee';
      item.style.padding = '8px 0';
      const when = d.createdAt && d.createdAt.toDate ? d.createdAt.toDate() : d.createdAt;
      const whenStr = when ? (typeof when === 'object' ? when.toString() : when) : '';
      item.innerHTML = `
        <div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start;">
          <div style="max-width:75%;">
            <strong>${d.ownerEmail ? d.ownerEmail : 'Driver'}</strong>
            <div style="font-size:0.95rem;margin-top:6px;">
              <div><strong>From:</strong> ${d.startingLocation || d.start || '—'}</div>
              <div><strong>To:</strong> ${d.destination || d.dest || '—'}</div>
              <div><strong>Date/Time:</strong> ${d.dateTime || '—'}</div>
              <div><strong>Vehicle:</strong> ${d.vehicleType || '—'} • <strong>Seats:</strong> ${d.seats || '—'} • <strong>Price:</strong> ${d.price || '—'}</div>
              <div style="margin-top:6px; font-size:0.9rem;">${d.notes ? d.notes : ''}</div>
              <div style="margin-top:6px; font-size:0.8rem; color:#666;">${whenStr}</div>
            </div>
          </div>
          <div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end;">
            ${window.currentUser && window.currentUser.uid === d.ownerUid ? '<button class="delete-offer" data-id="' + d.id + '">Delete</button>' : ''}
          </div>
        </div>
      `;
      list.appendChild(item);
    });
    // Wire delete buttons
    list.querySelectorAll('.delete-offer').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = btn.getAttribute('data-id');
        if (!id) return;
        if (!confirm('Delete this offer?')) return;
        try {
          await window.deletePublicDoc('drivers', id);
          // onDriversChanged will refresh UI automatically
        } catch (err) {
          alert('Delete failed: ' + (err && err.message ? err.message : err));
        }
      });
    });
  }

  // Wire the Offer Ride form to createDriver
  function wireOfferForm() {
    const form = document.querySelector('#offerRideForm form');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      // Gather form values by order used in the existing HTML
      // (Starting Location, Destination, Date & Time, Vehicle Type, Seats, Price, Notes)
      const elements = form.elements;
      const startingLocation = elements[0]?.value || '';
      const destination = elements[1]?.value || '';
      const dateTime = elements[2]?.value || '';
      const vehicleType = elements[3]?.value || '';
      const seats = elements[4]?.value || '';
      const price = elements[5]?.value || '';
      const notes = elements[6]?.value || '';
      if (!startingLocation || !destination || !dateTime) {
        return alert('Please fill in starting location, destination and date/time.');
      }
      try {
        if (!window.currentUser) {
          alert('You must be signed in to offer a ride. Please sign up or sign in first.');
          // Optionally open the sign-in modal if present:
          const signInModal = document.getElementById('signInModal');
          if (signInModal) signInModal.style.display = 'block';
          return;
        }
        const id = await window.createDriver('drivers', {
          start: startingLocation,
          destination,
          dateTime,
          vehicleType,
          seats,
          price,
          notes
        });
        alert('Ride posted. ID: ' + id);
        form.reset();
      } catch (err) {
        alert('Failed to post ride: ' + (err && err.message ? err.message : err));
        console.error(err);
      }
    });
  }

  // Initialize UI: create panel, wire form, start realtime listener
  whenFirebaseReady(() => {
    ensureDriversPanel();
    wireOfferForm();

    // Start realtime listener on 'drivers' collection
    const unsub = window.onDriversChanged('drivers', (err, docs) => {
      if (err) {
        document.getElementById('driversList').innerHTML = '<div style="color:#b00;">Error loading drivers</div>';
        console.error(err);
        return;
      }
      renderDrivers(docs);
    });

    // Optional: cleanup when unloading page
    window.addEventListener('beforeunload', () => {
      try { unsub && unsub(); } catch (e) {}
    });
  });
})();