document.addEventListener("DOMContentLoaded", () => {
  // ================= MOBILE MENU TOGGLE =================
  const mobileMenuBtn = document.getElementById("mobileMenuButton");
  const mobileMenu = document.getElementById("mobileMenu");
  mobileMenuBtn.addEventListener("click", () => mobileMenu.classList.toggle("active"));

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
  const findInput = document.getElementById("find");
  const offerInput = document.getElementById("offer");
  const findForm = document.getElementById("findRideForm");
  const offerForm = document.getElementById("offerRideForm");

  if (findInput && offerInput && findForm && offerForm) {
    findInput.addEventListener("change", () => {
      findForm.style.display = "block";
      offerForm.style.display = "none";
    });
    offerInput.addEventListener("change", () => {
      findForm.style.display = "none";
      offerForm.style.display = "block";
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

  // ================= 3-LINE DROPDOWN MENU =================
  const dropdowns = document.querySelectorAll(".dropdown");

  dropdowns.forEach(dropdown => {
    const toggle = dropdown.querySelector(".menu-toggle");
    if (toggle) {
      toggle.addEventListener("click", e => {
        e.preventDefault();
        e.stopPropagation();
        dropdown.classList.toggle("active");
      });
    }
  });

  // Close dropdown if clicked outside
  document.addEventListener("click", e => {
    dropdowns.forEach(dropdown => {
      if (!dropdown.contains(e.target)) {
        dropdown.classList.remove("active");
      }
    });
  });

  // ================= LIKE BUTTON FUNCTIONALITY =================
  const likeButtons = document.querySelectorAll('.like-btn');

  likeButtons.forEach((btn, index) => {
    const countSpan = btn.querySelector('.like-count');

    // Load saved likes from localStorage
    const saved = localStorage.getItem('like-' + index);
    if (saved) {
      countSpan.textContent = saved;
      if (parseInt(saved) > 0) btn.classList.add('liked');
    }

    // Handle like toggle
    btn.addEventListener('click', () => {
      let count = parseInt(countSpan.textContent);
      if (btn.classList.contains('liked')) {
        btn.classList.remove('liked');
        count--;
      } else {
        btn.classList.add('liked');
        count++;
      }
      countSpan.textContent = count;
      localStorage.setItem('like-' + index, count);
    });
  });

});
