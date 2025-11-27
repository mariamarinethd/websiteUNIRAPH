// Small UI to list and delete documents from the "public" collection.
// Depends on firebase-init.js exposing: readPublicDocs(collection, limit) and deletePublicDoc(collection, id)
// Include after firebase-init.js: <script type="module" src="./firebase-init.js"></script> <script src="./fs-ui.js" defer></script>

(function () {
  // Minimal styles injected so you don't need to edit CSS files
  const style = document.createElement('style');
  style.textContent = `
  #fsManageBtn {
    position: fixed; right: 16px; bottom: 16px; z-index: 9999;
    background:#2563eb; color:white; border:none; padding:10px 12px; border-radius:8px; cursor:pointer;
    box-shadow: 0 6px 18px rgba(0,0,0,0.15);
  }
  #fsModal { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: none; align-items: center; justify-content:center; z-index:10000; }
  #fsModal .panel { background: white; width: 90%; max-width: 720px; max-height: 80%; overflow:auto; border-radius:8px; padding:12px; }
  #fsModal .doc { border-bottom: 1px solid #eee; padding:8px 0; display:flex; justify-content:space-between; align-items:center; gap:8px; }
  #fsModal .doc pre { margin:0; font-size:0.9rem; max-width:70%; white-space:pre-wrap; word-break:break-word; }
  #fsModal .close { float:right; background:transparent; border:none; font-size:1.25rem; cursor:pointer; }
  .fs-delete-btn { background:#ef4444; color:white; border:none; padding:6px 8px; border-radius:6px; cursor:pointer; }
  `;
  document.head.appendChild(style);

  // Create floating button
  const btn = document.createElement('button');
  btn.id = 'fsManageBtn';
  btn.innerText = 'Manage Public Posts';
  document.body.appendChild(btn);

  // Create modal
  const modal = document.createElement('div');
  modal.id = 'fsModal';
  modal.innerHTML = `<div class="panel"><button class="close" title="Close">&times;</button><h3>Public collection</h3><div id="fsList">Loading...</div></div>`;
  document.body.appendChild(modal);

  const closeBtn = modal.querySelector('.close');
  const listEl = modal.querySelector('#fsList');

  function showModal() { modal.style.display = 'flex'; loadList(); }
  function hideModal() { modal.style.display = 'none'; }

  btn.addEventListener('click', showModal);
  closeBtn.addEventListener('click', hideModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) hideModal(); });

  // Load and render docs
  async function loadList() {
    listEl.innerHTML = 'Loading...';
    try {
      if (!window.readPublicDocs) {
        listEl.innerHTML = '<div style="color: #b00;">Firebase helpers are not initialized yet.</div>';
        return;
      }
      const docs = await window.readPublicDocs('public', 200);
      if (!docs.length) {
        listEl.innerHTML = '<div>No documents found.</div>';
        return;
      }
      listEl.innerHTML = '';
      docs.forEach(d => {
        const row = document.createElement('div');
        row.className = 'doc';
        const pre = document.createElement('pre');
        pre.textContent = JSON.stringify(d, ['id','text','host','createdAt','email'], 2);
        const controls = document.createElement('div');

        const delBtn = document.createElement('button');
        delBtn.className = 'fs-delete-btn';
        delBtn.innerText = 'Delete';
        delBtn.addEventListener('click', async () => {
          if (!confirm('Delete this document?')) return;
          try {
            // Ensure user is signed in (deletePublicDoc checks auth.currentUser too)
            await window.deletePublicDoc('public', d.id);
            // refresh list
            loadList();
          } catch (err) {
            alert('Delete failed: ' + (err && err.message ? err.message : err));
            console.error(err);
          }
        });

        controls.appendChild(delBtn);
        row.appendChild(pre);
        row.appendChild(controls);
        listEl.appendChild(row);
      });
    } catch (err) {
      listEl.innerHTML = '<div style="color: #b00;">Error loading documents: ' + (err && err.message ? err.message : err) + '</div>';
      console.error(err);
    }
  }
})();