// Initialize Firebase (same config as you had)
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

// Use Firebase Auth (compat)
const auth = firebase.auth();

// Optional: If you still need the database for other data, keep a reference.
// But DO NOT store plaintext passwords in the DB.
var signinformDB = firebase.database().ref("sign-in-form"); // keep only if you need non-sensitive records

document.getElementById("signInForm").addEventListener("submit", submitForm);

function submitForm(e) {
  e.preventDefault();

  const email = getElementVal("email");
  const password = getElementVal("password");

  // Use Firebase Authentication to sign in
  auth.signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      // Signed in successfully
      // userCredential.user contains user info
      alert("Sign-in successful!");
      // Redirect to protected/dashboard page
      window.location.href = "dashboard.html"; // change to your protected page
    })
    .catch((error) => {
      // Handle errors and show friendly messages
      const errorCode = error.code;
      const errorMessage = error.message;

      if (errorCode === 'auth/user-not-found') {
        alert("No account found with that email. Please sign up first.");
      } else if (errorCode === 'auth/wrong-password') {
        alert("Incorrect password. Please try again.");
      } else if (errorCode === 'auth/invalid-email') {
        alert("Invalid email address.");
      } else {
        alert(errorMessage);
      }
      console.error("Sign-in error", errorCode, errorMessage);
    });

  // DON'T save password to the realtime DB. If you want an audit/log, store non-sensitive info only.
  // Example of safe logging (optional):
  // saveSignInAttempt(email, !!password);
}

// Optional helper if you want to log non-sensitive sign-in attempts (do NOT store passwords)
function saveSignInAttempt(email, hadPassword) {
  try {
    const newEntry = signinformDB.push();
    newEntry.set({
      email: email,
      timestamp: Date.now(),
      hadPassword: hadPassword
    });
  } catch (err) {
    console.warn("Could not write sign-in attempt:", err);
  }
}

const getElementVal = (id) => {
  return document.getElementById(id).value;
};

// Optional: keep the user signed-in state and redirect if already authenticated
auth.onAuthStateChanged((user) => {
  if (user) {
    // User is signed in; optionally redirect away from sign-in page
    // window.location.href = "dashboard.html";
    console.log("User already signed in:", user.email);
  } else {
    console.log("No user signed in");
  }
});