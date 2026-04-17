// Preloader
const preloader = document.getElementById('preloader');
const pageShell = document.querySelector('.page-shell');

function hidePreloader() {
  if (preloader) {
    preloader.classList.add('is-hidden');
    preloader.setAttribute('aria-hidden', 'true');
  }
  if (pageShell) {
    pageShell.classList.add('is-revealed');
  }
}

// Hide preloader after animations complete (or fallback after 4s)
if (preloader) {
  const minLoadTime = 3200; // Minimum time to show preloader
  const startTime = Date.now();
  
  window.addEventListener('load', () => {
    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, minLoadTime - elapsed);
    setTimeout(hidePreloader, remaining);
  });

  // Handle restored pages and cross-browser load edge cases
  window.addEventListener('pageshow', hidePreloader);
  
  // Fallback in case load event doesn't fire
  setTimeout(hidePreloader, 5000);
} else {
  // No preloader, reveal page immediately
  if (pageShell) pageShell.classList.add('is-revealed');
}

// Header scroll effect
const header = document.querySelector('.site-header');
if (header) {
  window.addEventListener('scroll', () => {
    header.classList.toggle('is-scrolled', window.scrollY > 40);
  });
}

// Mobile nav toggle
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.site-nav-links');
if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => {
    const expanded = navToggle.getAttribute('aria-expanded') === 'true';
    navToggle.setAttribute('aria-expanded', String(!expanded));
    navLinks.classList.toggle('is-open', !expanded);
    document.body.classList.toggle('nav-open', !expanded);
  });
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navToggle.setAttribute('aria-expanded', 'false');
      navLinks.classList.remove('is-open');
      document.body.classList.remove('nav-open');
    });
  });
}

// Fade-up reveal on scroll
const fadeEls = document.querySelectorAll('.fade-up');
if (fadeEls.length) {
  if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.15 });
    fadeEls.forEach(el => obs.observe(el));
  } else {
    // Fallback for older mobile browsers
    fadeEls.forEach(el => el.classList.add('is-visible'));
  }
}

// Enquiry modal
const modal = document.getElementById('enquiryModal');
const modalClose = document.getElementById('modalClose');
const modalBackdrop = document.querySelector('.modal-backdrop');
const enquiryForm = document.getElementById('enquiryForm');
const formSuccess = document.getElementById('formSuccess');
const propertyField = document.getElementById('propertyField');

function openModal(propertyName) {
  if (!modal) return;
  if (propertyField && propertyName) {
    propertyField.value = propertyName;
  }
  modal.hidden = false;
  document.body.classList.add('modal-open');
}

function closeModal() {
  if (!modal) return;
  modal.hidden = true;
  document.body.classList.remove('modal-open');
  // Reset form after close
  if (enquiryForm) enquiryForm.reset();
  if (formSuccess) formSuccess.hidden = true;
}

if (modalClose) modalClose.addEventListener('click', closeModal);
if (modalBackdrop) modalBackdrop.addEventListener('click', closeModal);

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && modal && !modal.hidden) closeModal();
});

// Global click handler for enquiry buttons
document.addEventListener('click', e => {
  const btn = e.target.closest('[data-enquire]');
  if (btn) {
    e.preventDefault();
    openModal(btn.dataset.enquire || '');
  }
});

// Enquiry form submission
if (enquiryForm) {
  enquiryForm.addEventListener('submit', e => {
    e.preventDefault();
    const btn = enquiryForm.querySelector('button[type="submit"]');
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Sending...';
    }
    // Simulate submission
    setTimeout(() => {
      enquiryForm.reset();
      if (formSuccess) formSuccess.hidden = false;
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Send Enquiry';
      }
    }, 1200);
  });
}

// Smooth scroll for anchors
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    if (id && id.length > 1) {
      const target = document.querySelector(id);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  });
});
