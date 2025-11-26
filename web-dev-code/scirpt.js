// ================= LOGIN CHECK =================
// Prevent access without login
if (!localStorage.getItem('loggedIn')) {
  window.location.href = 'index.html'; // redirect to login page
}

// Optional: SIGN OUT BUTTON FUNCTIONALITY
const signOutBtns = document.querySelectorAll('.btn-signin, .btn-signup'); // replace with your logout button if you add one
signOutBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    localStorage.removeItem('loggedIn');
    window.location.href = 'index.html';
  });
});

// ================= DOM CONTENT LOADED =================
document.addEventListener("DOMContentLoaded", () => {
  // ================= MOBILE MENU TOGGLE =================
  const mobileMenuBtn = document.getElementById("mobileMenuButton");
  const mobileMenu = document.getElementById("mobileMenu");
  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener("click", () => mobileMenu.classList.toggle("active"));
  }

  // ================= SMOOTH SCROLLING =================
  const links = document.querySelectorAll("nav a, #mobileMenu a");
  links.forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      const sectionId = link.getAttribute("href").substring(1);
      const targetSection = document.getElementById(sectionId);
      if (targetSection) {
        targetSection.scrollIntoView({ behavior: "smooth" });
      }
      if (mobileMenu.classList.contains("active")) mobileMenu.classList.remove("active");
    });
  });

  // ================= RIDE FORM TOGGLE =================
  const findBtn = document.getElementById("findRideBtn");
  const offerBtn = document.getElementById("offerRideBtn");
  const findForm = document.getElementById("findRideForm");
  const offerForm = document.getElementById("offerRideForm");

  if(findBtn && offerBtn && findForm && offerForm){
    findBtn.addEventListener("click", () => {
      findForm.style.display = "block";
      offerForm.style.display = "none";
      findForm.scrollIntoView({ behavior: "smooth" });
    });
    offerBtn.addEventListener("click", () => {
      offerForm.style.display = "block";
      findForm.style.display = "none";
      offerForm.scrollIntoView({ behavior: "smooth" });
    });
  }

  // ================= MODALS =================
  const signInBtns = [document.getElementById("signInBtn"), document.getElementById("signInBtnMobile")];
  const signUpBtns = [document.getElementById("signUpBtn"), document.getElementById("signUpBtnMobile")];
  const signInModal = document.getElementById("signInModal");
  const signUpModal = document.getElementById("signUpModal");

  signInBtns.forEach(btn => {
    if (btn) btn.addEventListener("click", () => (signInModal.style.display = "flex"));
  });
  signUpBtns.forEach(btn => {
    if (btn) btn.addEventListener("click", () => (signUpModal.style.display = "flex"));
  });

  if (signInModal && signUpModal) {
    document.getElementById("closeSignIn").addEventListener("click", () => (signInModal.style.display = "none"));
    document.getElementById("closeSignUp").addEventListener("click", () => (signUpModal.style.display = "none"));
    window.addEventListener("click", e => {
      if (e.target === signInModal) signInModal.style.display = "none";
      if (e.target === signUpModal) signUpModal.style.display = "none";
    });
  }

  // ================= SLIDESHOW =================
  let slideIndex = 0;
  const slides = document.querySelectorAll('.slide');

  function showSlides() {
    slides.forEach(slide => slide.style.display = 'none');
    slideIndex++;
    if(slideIndex > slides.length) slideIndex = 1;
    slides[slideIndex - 1].style.display = 'block';
    setTimeout(showSlides, 3000);
  }

  if(slides.length > 0) showSlides();
});
 