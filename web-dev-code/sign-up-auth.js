// Sign-up client script — creates Firebase Auth users and stores profile (full name) in Realtime DB
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

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

document.getElementById("signUpForm").addEventListener("submit", async function(e) {
  e.preventDefault();

  const fullName = document.getElementById("fullName").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const confirmPassword = document.getElementById("confirmPassword").value;

  // Basic validation
  if (!fullName) return alert("Please enter your full name.");
  if (!email) return alert("Please enter your email.");
  if (!password || password.length < 6) return alert("Password must be at least 6 characters.");
  if (password !== confirmPassword) return alert("Passwords do not match.");

  try {
    // Create the Firebase Auth user
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;

    // Update the Auth profile displayName (keeps full name in Firebase Authentication profile)
    await user.updateProfile({ displayName: fullName });

    // Save non-sensitive profile data in Realtime Database under /users/{uid}
    // DO NOT store the password.
    await db.ref('users/' + user.uid).set({
      fullName: fullName,
      email: email,
      createdAt: Date.now()
    });

    alert("Account created successfully! You can now sign in.");
    // Redirect to sign-in page (or to dashboard if you prefer to auto-login)
    window.location.href = "sign-incom.html";

  } catch (error) {
    console.error("createUserWithEmailAndPassword error:", error.code, error.message);
    if (error.code === 'auth/email-already-in-use') {
      alert("That email is already in use. Please sign in instead.");
    } else if (error.code === 'auth/invalid-email') {
      alert("Invalid email address.");
    } else if (error.code === 'auth/weak-password') {
      alert("Weak password. Choose a stronger password.");
    } else {
      alert(error.message || "Failed to create account. See console for details.");
    }
  }
});