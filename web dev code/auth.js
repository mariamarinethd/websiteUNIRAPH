// auth.js
document.addEventListener("DOMContentLoaded", () => {

  const loginBox = document.getElementById("loginBox");
  const signupBox = document.getElementById("signupBox");

  const loginEmail = document.getElementById("loginEmail");
  const loginPassword = document.getElementById("loginPassword");
  const loginBtn = document.getElementById("loginBtn");

  const signupName = document.getElementById("signupName");
  const signupEmail = document.getElementById("signupEmail");
  const signupPassword = document.getElementById("signupPassword");
  const signupBtn = document.getElementById("signupBtn");

  // Show Sign Up form
  window.showSignUp = () => {
    loginBox.style.display = "none";
    signupBox.style.display = "block";
  };

  // Show Sign In form
  window.showSignIn = () => {
    signupBox.style.display = "none";
    loginBox.style.display = "block";
  };

  // Helper to get users from localStorage
  const getUsers = () => {
    const users = localStorage.getItem("users");
    return users ? JSON.parse(users) : [];
  };

  // Helper to save users to localStorage
  const saveUsers = (users) => {
    localStorage.setItem("users", JSON.stringify(users));
  };

  // Signup logic
  signupBtn.addEventListener("click", () => {
    const name = signupName.value.trim();
    const email = signupEmail.value.trim();
    const password = signupPassword.value.trim();

    if (!name || !email || !password) {
      alert("Please fill in all fields.");
      return;
    }

    const users = getUsers();
    if (users.some(user => user.email === email)) {
      alert("Email already registered. Please log in.");
      return;
    }

    users.push({ name, email, password });
    saveUsers(users);

    alert("Account created successfully! You can now log in.");
    showSignIn();
  });

  // Login logic
  loginBtn.addEventListener("click", () => {
    const email = loginEmail.value.trim();
    const password = loginPassword.value.trim();

    if (!email || !password) {
      alert("Please enter both email and password.");
      return;
    }

    const users = getUsers();
    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
      localStorage.setItem("loggedIn", "true");
      localStorage.setItem("currentUser", JSON.stringify(user)); // optional
      window.location.href = "unira.html"; // redirect to main page
    } else {
      alert("Invalid email or password.");
    }
  });

  // Auto redirect if already logged in
  if (localStorage.getItem("loggedIn") === "true") {
    window.location.href = "unira.html";
  }

});
