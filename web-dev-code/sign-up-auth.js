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

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Reference database
var signupformDB = firebase.database().ref("sign-up-form");

document.getElementById("signUpForm").addEventListener("submit", submitForm);

function submitForm(e) {
  e.preventDefault();

  var fullName = getElementVal("fullName");
  var email = getElementVal("email");
  var password = getElementVal("password");
  var confirmPassword = getElementVal("confirmPassword");

  console.log(fullName, email, password, confirmPassword);

  // OPTIONAL: Check password match
  if (password !== confirmPassword) {
    alert("Passwords do not match!");
    return;
  }

  saveToDatabase(fullName, email, password);

  alert("Sign-up successful!");

  document.getElementById("signUpForm").reset();
}

function saveToDatabase(fullName, email, password) {
  var newSignup = signupformDB.push();
  newSignup.set({
    fullName: fullName,
    email: email,
    password: password
  });
}

const getElementVal = (id) => {
  return document.getElementById(id).value;
};

