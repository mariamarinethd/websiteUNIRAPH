// Node script to migrate plaintext users from Realtime Database to Firebase Auth
// Requires: npm install firebase-admin firebase@9.23.0
// Usage: set GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccountKey.json and run node migrate-users-to-auth.js

const admin = require('firebase-admin');
const firebase = require('firebase');

// Initialize admin (service account)
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  databaseURL: "https://project-uniraph-default-rtdb.asia-southeast1.firebasedatabase.app"
});

// Optional: also initialize client SDK if needed to read DB rules; not necessary here
// Read users from Realtime DB location where you stored credentials
const db = admin.database();
const usersRef = db.ref('sign-in-form'); // adjust path if different

async function migrate() {
  const snapshot = await usersRef.once('value');
  const data = snapshot.val();
  if (!data) {
    console.log("No users found at sign-in-form");
    return;
  }

  const entries = Object.entries(data);
  console.log(`Found ${entries.length} entries.`);

  for (const [key, value] of entries) {
    const email = value.email;
    const password = value.password;
    if (!email || !password) {
      console.log(`Skipping ${key}: no email/password`);
      continue;
    }
    try {
      // Create Auth user
      const userRecord = await admin.auth().createUser({
        email: email,
        password: password,
      });
      console.log(`Created auth user ${email} -> uid ${userRecord.uid}`);

      // Optionally delete the plaintext DB entry (dangerous; ensure backup)
      // await usersRef.child(key).remove();
      // console.log(`Removed DB entry ${key}`);
    } catch (err) {
      console.error(`Error creating ${email}:`, err.message || err);
      // handle already-exists, invalid-password, etc.
    }
  }
}

migrate().then(() => console.log("Migration complete")).catch((err) => console.error(err));