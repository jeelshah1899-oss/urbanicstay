const listings = Array.isArray(window.URBANIC_LISTINGS) ? window.URBANIC_LISTINGS : [];
const compareSelection = new Set();
const COMPARE_LIMIT = 3;
let compareNotice = "";
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function listingMeta(listing) {
  if (!listing || !listing.details) return [];
  return [
    listing.details.guests,
    listing.details.bedrooms,
    listing.details.beds,
    listing.details.bathrooms
  ].filter(Boolean);
}

function listingHref(listing) {
  return `listing.html?slug=${encodeURIComponent(listing.slug)}`;
}

function formatRating(listing) {
  const trust = listing?.trust;
  if (!trust) return "No rating yet";
  if (trust.isNew || !trust.reviewCount) return "New listing";
  if (typeof trust.rating === "number") {
    return `★ ${trust.rating.toFixed(trust.rating % 1 === 0 ? 1 : 2)} · ${trust.reviewCount} reviews`;
  }
  return `${trust.reviewCount} reviews`;
}

function trustPillsMarkup(listing, className = "listing-trust") {
  const trust = listing?.trust || {};
  const ratingLabel = formatRating(listing);
  const responseLabel = trust.responseTime || "Response time on Airbnb";

  return `
    <div class="${className}">
      <span class="trust-pill">${escapeHtml(ratingLabel)}</span>
      <span class="trust-pill">${escapeHtml(responseLabel)}</span>
    </div>
  `;
}

function renderFooterListingLinks() {
  const containers = document.querySelectorAll("#footerListingLinks");
  if (!containers.length || !listings.length) return;

  const links = listings
    .map(listing => `<li><a href="${listingHref(listing)}">${escapeHtml(listing.title)}</a></li>`)
    .join("");

  containers.forEach(container => {
    container.innerHTML = links;
  });
}

function updateListingCounts() {
  const countNodes = document.querySelectorAll("[data-listing-count]");
  if (!countNodes.length) return;
  countNodes.forEach(node => {
    node.textContent = String(listings.length);
  });
}

function populatePropertyField(defaultTitle) {
  const propertyField = document.getElementById("propertyField");
  if (!propertyField || !listings.length) return;

  if (propertyField.tagName === "SELECT") {
    const existingFirstOption = propertyField.querySelector("option");
    const firstOptionMarkup = existingFirstOption
      ? existingFirstOption.outerHTML
      : '<option value="">Not sure yet — show me all</option>';

    const optionMarkup = listings
      .map(listing => `<option value="${escapeHtml(listing.title)}">${escapeHtml(listing.title)}</option>`)
      .join("");

    propertyField.innerHTML = `${firstOptionMarkup}${optionMarkup}`;
    if (defaultTitle) {
      propertyField.value = defaultTitle;
    }
    return;
  }

  if (defaultTitle) {
    propertyField.value = defaultTitle;
    propertyField.dataset.defaultValue = defaultTitle;
  }
}

function setCompareButtonStates() {
  document.querySelectorAll("[data-compare-slug]").forEach(button => {
    const slug = button.getAttribute("data-compare-slug");
    const active = compareSelection.has(slug);
    button.setAttribute("aria-pressed", String(active));
    button.textContent = active ? "Selected" : "Compare";
    button.classList.toggle("is-active", active);
  });
}

function renderComparePanel() {
  const panel = document.getElementById("comparePanel");
  const grid = document.getElementById("compareGrid");
  const helper = document.getElementById("compareHelperText");
  const clearButton = document.getElementById("compareClearButton");
  if (!panel || !grid || !helper) return;

  const selectedListings = listings.filter(listing => compareSelection.has(listing.slug));
  panel.hidden = selectedListings.length === 0;

  if (!selectedListings.length) {
    grid.innerHTML = "";
    helper.textContent = "Compare up to 3 listings to evaluate space, comfort, and commute convenience.";
    return;
  }

  if (clearButton) {
    clearButton.onclick = () => {
      compareSelection.clear();
      compareNotice = "";
      setCompareButtonStates();
      renderComparePanel();
    };
  }

  if (selectedListings.length < 2) {
    helper.textContent = "Select at least 2 listings for a meaningful side-by-side comparison.";
  } else {
    helper.textContent = `Comparing ${selectedListings.length} listings by guest capacity, bed/bath setup, and trust signals.`;
  }

  if (compareNotice) {
    helper.textContent = compareNotice;
  }

  grid.innerHTML = selectedListings.map(listing => {
    const trust = listing?.trust || {};
    const beds = listing?.details?.beds || "Not listed";
    const guests = listing?.details?.guests || listing?.policies?.maxGuests || "Not listed";
    const baths = listing?.details?.bathrooms || "Not listed";

    return `
      <article class="compare-card">
        <h4>${escapeHtml(listing.title)}</h4>
        ${trustPillsMarkup(listing, "compare-trust")}
        <ul class="compare-metrics">
          <li><span>Guests</span><strong>${escapeHtml(guests)}</strong></li>
          <li><span>Beds</span><strong>${escapeHtml(beds)}</strong></li>
          <li><span>Bathrooms</span><strong>${escapeHtml(baths)}</strong></li>
        </ul>
        <a class="button button-ghost" href="${listingHref(listing)}">Open Details</a>
      </article>
    `;
  }).join("");
}

function toggleCompare(slug) {
  if (!slug) return;

  if (compareSelection.has(slug)) {
    compareSelection.delete(slug);
    compareNotice = "";
  } else if (compareSelection.size >= COMPARE_LIMIT) {
    compareNotice = "You can compare up to 3 listings at a time.";
  } else {
    compareSelection.add(slug);
    compareNotice = "";
  }

  setCompareButtonStates();
  renderComparePanel();
}

function bindCompareButtons() {
  document.querySelectorAll("[data-compare-slug]").forEach(button => {
    if (button.dataset.compareBound === "true") return;
    button.dataset.compareBound = "true";
    button.addEventListener("click", () => {
      toggleCompare(button.getAttribute("data-compare-slug"));
    });
  });
  setCompareButtonStates();
}

function renderHomeListings() {
  const grid = document.getElementById("listingGrid");
  const featured = document.getElementById("featuredListing");
  if (!grid || !listings.length) return;

  const featuredListing = listings.find(listing => listing.featured) || listings[0];
  const featuredMeta = listingMeta(featuredListing).map(item => `<span>${escapeHtml(item)}</span>`).join("");

  if (featured) {
    featured.innerHTML = `
      <div class="listing-featured-media">
        <img src="${escapeHtml(featuredListing.images[0].url)}" alt="${escapeHtml(featuredListing.title)} cover image" loading="eager" decoding="async" fetchpriority="high">
      </div>
      <div class="listing-featured-copy">
        <span class="listing-area">${escapeHtml(featuredListing.locationLabel)}</span>
        <h2>${escapeHtml(featuredListing.title)}</h2>
        <p>${escapeHtml(featuredListing.description)}</p>
        ${trustPillsMarkup(featuredListing)}
        <div class="listing-meta">${featuredMeta}</div>
        <div class="listing-actions">
          <a href="${listingHref(featuredListing)}" class="button button-solid">View Details</a>
          <a href="${escapeHtml(featuredListing.airbnbUrl)}" class="button button-ghost" target="_blank" rel="noopener noreferrer">View on Airbnb</a>
          <button type="button" class="button button-ghost compare-toggle" data-compare-slug="${escapeHtml(featuredListing.slug)}" aria-pressed="false">Compare</button>
        </div>
      </div>
    `;
  }

  grid.innerHTML = listings.map(listing => {
    const chips = listingMeta(listing).map(item => `<span>${escapeHtml(item)}</span>`).join("");

    return `
      <article class="listing-card fade-up">
        <div class="listing-media">
          <img src="${escapeHtml(listing.images[0].url)}" alt="${escapeHtml(listing.title)} cover image" loading="lazy" decoding="async">
        </div>
        <div class="listing-copy">
          <span class="listing-area">${escapeHtml(listing.locationLabel)}</span>
          <h3>${escapeHtml(listing.title)}</h3>
          <p>${escapeHtml(listing.description)}</p>
          ${trustPillsMarkup(listing)}
          <div class="listing-meta">${chips}</div>
          <div class="listing-actions">
            <a href="${listingHref(listing)}" class="button button-ghost">View Details</a>
            <a href="${escapeHtml(listing.airbnbUrl)}" class="button button-ghost" target="_blank" rel="noopener noreferrer">Open Airbnb</a>
            <button type="button" class="button button-ghost compare-toggle" data-compare-slug="${escapeHtml(listing.slug)}" aria-pressed="false">Compare</button>
          </div>
        </div>
      </article>
    `;
  }).join("");

  bindCompareButtons();
  renderComparePanel();
  populatePropertyField();
}

function setImage(el, image, fallbackTitle, options = {}) {
  if (!el || !image) return;
  el.src = image.url;
  el.alt = image.label || `${fallbackTitle} image`;
  if (options.loading) el.loading = options.loading;
  if (options.decoding) el.decoding = options.decoding;
  if (options.fetchPriority) el.fetchPriority = options.fetchPriority;
}

function buildFaqItems(listing) {
  const policies = listing?.policies || {};
  const safetyLine = Array.isArray(policies.safety) ? policies.safety.join("; ") : "Safety details available in Airbnb listing section.";
  const checkInAndGuestLine = `${policies.checkIn || "Check-in timing is shown on Airbnb."} ${policies.maxGuests || ""}`.trim();

  return [
    {
      question: "What are check-in timings and guest limits?",
      answer: checkInAndGuestLine
    },
    {
      question: "Can you help with family essentials?",
      answer: "Family amenities vary by listing. Share your needs (for example crib, high chair, or extra bedding), and we’ll help confirm availability with the host before booking."
    },
    {
      question: "Is this stay suitable for remote work?",
      answer: "Workspace setup and Wi-Fi performance can differ by home. We can help you confirm desk-friendly areas and connectivity expectations with the host."
    },
    {
      question: "What safety information is available?",
      answer: `${safetyLine}. Please review the latest Airbnb safety section before booking.`
    },
    {
      question: "How does cancellation work?",
      answer: policies.cancellation || "Cancellation policy is controlled by the host on Airbnb and shown before payment."
    },
    {
      question: "How do booking and payment work?",
      answer: "Use the availability mini-form or direct Airbnb button on this page. Final availability, payment, and booking confirmation are completed securely on Airbnb."
    }
  ];
}

function bindAvailabilityForm(listing) {
  const form = document.getElementById("availabilityMiniForm");
  const checkIn = document.getElementById("availCheckIn");
  const checkOut = document.getElementById("availCheckOut");
  const guests = document.getElementById("availGuests");
  if (!form) return;

  const today = new Date().toISOString().split("T")[0];
  if (checkIn) checkIn.min = today;
  if (checkOut) checkOut.min = today;

  if (checkIn && checkOut) {
    checkIn.addEventListener("change", () => {
      if (checkIn.value) {
        checkOut.min = checkIn.value;
        if (checkOut.value && checkOut.value < checkIn.value) {
          checkOut.value = "";
        }
      }
    });
  }

  if (guests && listing?.details?.guests) {
    const numberMatch = listing.details.guests.match(/[0-9]+/);
    if (numberMatch) {
      guests.value = numberMatch[0];
    }
  }

  form.addEventListener("submit", event => {
    event.preventDefault();
    const targetUrl = new URL(listing.airbnbUrl);
    if (checkIn?.value) targetUrl.searchParams.set("check_in", checkIn.value);
    if (checkOut?.value) targetUrl.searchParams.set("check_out", checkOut.value);
    if (guests?.value) targetUrl.searchParams.set("adults", guests.value);
    window.open(targetUrl.toString(), "_blank", "noopener,noreferrer");
  });
}

function renderListingPage() {
  const body = document.body;
  if (!body || body.dataset.page !== "listing" || !listings.length) return;

  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");
  const listing = listings.find(item => item.slug === slug) || listings[0];
  const meta = listingMeta(listing);
  const chipsMarkup = meta.map(item => `<span>${escapeHtml(item)}</span>`).join("");

  const titleEl = document.getElementById("listingTitle");
  const breadcrumbTitleEl = document.getElementById("breadcrumbTitle");
  const locationLabelEl = document.getElementById("listingLocationLabel");
  const listingDescriptionEl = document.getElementById("listingDescription");
  const detailDescriptionEl = document.getElementById("detailDescription");
  const detailSubcopyEl = document.getElementById("detailSubcopy");
  const listingMetaEl = document.getElementById("listingMeta");
  const listingTrustSignalsEl = document.getElementById("listingTrustSignals");
  const listingHighlightsEl = document.getElementById("listingHighlights");
  const quickSnapshotGridEl = document.getElementById("quickSnapshotGrid");
  const sidebarLinksEl = document.getElementById("sidebarLinks");
  const galleryEl = document.getElementById("listingGallery");
  const ctaHeadingEl = document.getElementById("listingCtaHeading");
  const primaryAirbnbLink = document.getElementById("primaryAirbnbLink");
  const ctaAirbnbLink = document.getElementById("ctaAirbnbLink");
  const heroPanel = document.getElementById("listingHeroPanel");
  const heroImageMain = document.getElementById("heroImageMain");
  const heroImageOne = document.getElementById("heroImageOne");
  const heroImageTwo = document.getElementById("heroImageTwo");
  const locationContextGrid = document.getElementById("locationContextGrid");
  const hotspotList = document.getElementById("hotspotList");
  const faqAccordion = document.getElementById("faqAccordion");

  document.title = `${listing.title} — Urbanic Stay`;
  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription) {
    metaDescription.setAttribute("content", `${listing.description} Includes transparent trust signals, commute context, and direct Airbnb booking links.`);
  }

  if (titleEl) titleEl.textContent = listing.title;
  if (breadcrumbTitleEl) breadcrumbTitleEl.textContent = listing.title;
  if (locationLabelEl) locationLabelEl.textContent = listing.locationLabel;
  if (listingDescriptionEl) listingDescriptionEl.textContent = listing.description;
  if (detailDescriptionEl) {
    detailDescriptionEl.textContent = `${listing.title} is a ${listing.propertyType.toLowerCase()} in Mumbai with transparent guest details, trust signals, and direct booking visibility.`;
  }
  if (detailSubcopyEl) {
    detailSubcopyEl.textContent = "Traveling with family, working remotely, or coordinating a group? Share your priorities and we’ll help you confirm listing fit before you book.";
  }
  if (listingMetaEl) listingMetaEl.innerHTML = chipsMarkup;
  if (listingTrustSignalsEl) listingTrustSignalsEl.innerHTML = trustPillsMarkup(listing, "listing-trust-inline");

  if (listingHighlightsEl) {
    const highlightItems = listing.highlights?.length
      ? listing.highlights
      : [`Property type: ${listing.propertyType}`, ...meta];
    listingHighlightsEl.innerHTML = highlightItems.map(item => `<li>${escapeHtml(item)}</li>`).join("");
  }

  if (quickSnapshotGridEl) {
    quickSnapshotGridEl.innerHTML = `
      <div class="mini-card">
        <span class="detail-label">Property Type</span>
        <strong>${escapeHtml(listing.propertyType)}</strong>
      </div>
      <div class="mini-card">
        <span class="detail-label">Listing ID</span>
        <strong>${escapeHtml(listing.id)}</strong>
      </div>
      <div class="mini-card">
        <span class="detail-label">Guest Capacity</span>
        <strong>${escapeHtml(listing.policies?.maxGuests || listing.details?.guests || "See Airbnb")}</strong>
      </div>
      <div class="mini-card">
        <span class="detail-label">Host Response</span>
        <strong>${escapeHtml(listing.trust?.responseTime || "See Airbnb")}</strong>
      </div>
    `;
  }

  if (locationContextGrid) {
    const context = listing.locationContext || {};
    locationContextGrid.innerHTML = `
      <div class="mini-card">
        <span class="detail-label">Airport</span>
        <strong>${escapeHtml(context.airport || "Distance available on Airbnb")}</strong>
      </div>
      <div class="mini-card">
        <span class="detail-label">Metro</span>
        <strong>${escapeHtml(context.metro || "Transit details on request")}</strong>
      </div>
      <div class="mini-card">
        <span class="detail-label">Business Hub</span>
        <strong>${escapeHtml(context.businessHub || "Business district access available")}</strong>
      </div>
    `;
  }

  if (hotspotList) {
    const hotspots = Array.isArray(listing.hotspots) ? listing.hotspots : [];
    hotspotList.innerHTML = hotspots.map(item => `<li>${escapeHtml(item)}</li>`).join("");
  }

  if (sidebarLinksEl) {
    sidebarLinksEl.innerHTML = `
      <li><a href="${escapeHtml(listing.airbnbUrl)}" target="_blank" rel="noopener noreferrer">Open Airbnb listing</a></li>
      <li><a href="${escapeHtml(listing.photoTourUrl)}" target="_blank" rel="noopener noreferrer">Open Airbnb photo tour</a></li>
      <li><a href="index.html#listings">Back to listing collection</a></li>
    `;
  }

  if (galleryEl) {
    galleryEl.innerHTML = listing.images.map(image => `
      <div class="gallery-card">
        <img src="${escapeHtml(image.url)}" alt="${escapeHtml(image.label)}" loading="lazy" decoding="async">
        <span>${escapeHtml(image.label)}</span>
      </div>
    `).join("");
  }

  if (faqAccordion) {
    const faqs = buildFaqItems(listing);
    faqAccordion.innerHTML = faqs.map((faq, index) => `
      <details class="faq-item" ${index === 0 ? "open" : ""}>
        <summary>${escapeHtml(faq.question)}</summary>
        <p>${escapeHtml(faq.answer)}</p>
      </details>
    `).join("");
  }

  if (ctaHeadingEl) ctaHeadingEl.textContent = `Interested in ${listing.title}?`;
  if (primaryAirbnbLink) primaryAirbnbLink.href = listing.airbnbUrl;
  if (ctaAirbnbLink) ctaAirbnbLink.href = listing.airbnbUrl;

  if (heroPanel && listing.images[0]) {
    heroPanel.style.backgroundImage = `linear-gradient(130deg, rgba(18,26,13,0.92), rgba(18,26,13,0.68)), url('${listing.images[0].url}')`;
  }
  setImage(heroImageMain, listing.images[0], listing.title, { loading: "eager", decoding: "async", fetchPriority: "high" });
  setImage(heroImageOne, listing.images[1] || listing.images[0], listing.title, { loading: "lazy", decoding: "async", fetchPriority: "low" });
  setImage(heroImageTwo, listing.images[2] || listing.images[0], listing.title, { loading: "lazy", decoding: "async", fetchPriority: "low" });

  document.querySelectorAll("[data-listing-enquire]").forEach(button => {
    button.setAttribute("data-enquire", listing.title);
  });

  bindAvailabilityForm(listing);
  populatePropertyField(listing.title);
}

// Preloader handling (optional)
const preloader = document.getElementById("preloader");
const pageShell = document.querySelector(".page-shell");

function hidePreloader() {
  if (preloader) {
    preloader.classList.add("is-hidden");
    preloader.setAttribute("aria-hidden", "true");
  }
  if (pageShell) {
    pageShell.classList.add("is-revealed");
  }
}

if (preloader) {
  const minLoadTime = 2400;
  const startTime = Date.now();

  window.addEventListener("load", () => {
    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, minLoadTime - elapsed);
    setTimeout(hidePreloader, remaining);
  });

  window.addEventListener("pageshow", event => {
    if (event.persisted) hidePreloader();
  });

  setTimeout(hidePreloader, 4500);
} else if (pageShell) {
  pageShell.classList.add("is-revealed");
}

// Header scroll effect
const header = document.querySelector(".site-header");
if (header) {
  let isScrollTicking = false;
  const updateHeaderState = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 40);
    isScrollTicking = false;
  };

  window.addEventListener("scroll", () => {
    if (isScrollTicking) return;
    isScrollTicking = true;
    window.requestAnimationFrame(updateHeaderState);
  }, { passive: true });

  updateHeaderState();
}

// Mobile nav toggle
const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector(".site-nav-links");
const NAV_COLLAPSE_WIDTH = 980;
function setMobileNavState(isOpen) {
  if (!navToggle || !navLinks) return;
  navToggle.setAttribute("aria-expanded", String(isOpen));
  navLinks.classList.toggle("is-open", isOpen);
  navLinks.setAttribute("aria-hidden", String(!isOpen));
  document.body.classList.toggle("nav-open", isOpen);
}

function closeMobileNav() {
  if (!navToggle || !navLinks) return;
  setMobileNavState(false);
}
if (navToggle && navLinks) {
  setMobileNavState(false);
  navToggle.addEventListener("click", () => {
    const isOpen = navToggle.getAttribute("aria-expanded") === "true";
    setMobileNavState(!isOpen);
  });

  navLinks.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", closeMobileNav);
  });

  document.addEventListener("click", event => {
    if (!navLinks.classList.contains("is-open")) return;
    const target = event.target instanceof Element ? event.target : null;
    if (!target || target.closest(".site-nav")) return;
    closeMobileNav();
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > NAV_COLLAPSE_WIDTH) {
      closeMobileNav();
    }
  });

  window.addEventListener("orientationchange", closeMobileNav);
}

// Enquiry modal
const modal = document.getElementById("enquiryModal");
const modalClose = document.getElementById("modalClose");
const modalBackdrop = document.querySelector(".modal-backdrop");
const enquiryForm = document.getElementById("enquiryForm");
const formSuccess = document.getElementById("formSuccess");
const propertyField = document.getElementById("propertyField");
const WHATSAPP_SUBMIT_ENDPOINT = "/api/whatsapp-enquiry";
const defaultFormStatusMessage = formSuccess ? formSuccess.textContent.trim() : "";
const MODAL_FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
let modalPreviouslyFocusedElement = null;

function setFormStatus(message, isError = false) {
  if (!formSuccess) return;
  formSuccess.hidden = false;
  formSuccess.classList.toggle("is-error", isError);
  formSuccess.textContent = message || defaultFormStatusMessage;
}

function resetFormStatus() {
  if (!formSuccess) return;
  formSuccess.hidden = true;
  formSuccess.classList.remove("is-error");
  if (defaultFormStatusMessage) {
    formSuccess.textContent = defaultFormStatusMessage;
  }
}

function getModalFocusableElements() {
  if (!modal) return [];
  return Array.from(modal.querySelectorAll(MODAL_FOCUSABLE_SELECTOR)).filter(element => {
    if (!(element instanceof HTMLElement)) return false;
    if (element.hasAttribute("hidden")) return false;
    if (element.getAttribute("aria-hidden") === "true") return false;
    return true;
  });
}

function openModal(propertyName) {
  if (!modal) return;
  closeMobileNav();
  resetFormStatus();

  if (propertyField && propertyName) {
    if (propertyField.tagName === "SELECT") {
      const matchingOption = Array.from(propertyField.options).find(option => option.value === propertyName);
      if (matchingOption) propertyField.value = propertyName;
    } else {
      propertyField.value = propertyName;
    }
  }
  modalPreviouslyFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;

  modal.hidden = false;
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");

  const [firstFocusable] = getModalFocusableElements();
  if (firstFocusable && typeof firstFocusable.focus === "function") {
    firstFocusable.focus({ preventScroll: true });
  }
}

function closeModal() {
  if (!modal) return;
  modal.hidden = true;
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");

  if (enquiryForm) enquiryForm.reset();
  resetFormStatus();
  if (propertyField && propertyField.tagName !== "SELECT" && propertyField.dataset.defaultValue) {
    propertyField.value = propertyField.dataset.defaultValue;
  }

  if (modalPreviouslyFocusedElement && typeof modalPreviouslyFocusedElement.focus === "function") {
    modalPreviouslyFocusedElement.focus({ preventScroll: true });
  }
  modalPreviouslyFocusedElement = null;
}

if (modalClose) modalClose.addEventListener("click", closeModal);
if (modalBackdrop) modalBackdrop.addEventListener("click", closeModal);

document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    if (modal && !modal.hidden) {
      closeModal();
      return;
    }
    closeMobileNav();
    return;
  }

  if (event.key === "Tab" && modal && !modal.hidden) {
    const focusableElements = getModalFocusableElements();
    if (!focusableElements.length) return;

    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];
    const activeElement = document.activeElement;

    if (event.shiftKey && activeElement === firstFocusable) {
      event.preventDefault();
      lastFocusable.focus();
    } else if (!event.shiftKey && activeElement === lastFocusable) {
      event.preventDefault();
      firstFocusable.focus();
    }
  }
});

document.addEventListener("click", event => {
  const target = event.target instanceof Element ? event.target : null;
  if (!target) return;
  const button = target.closest("[data-enquire]");
  if (!button) return;
  event.preventDefault();
  openModal(button.dataset.enquire || "");
});

if (enquiryForm) {
  enquiryForm.addEventListener("submit", async event => {
    event.preventDefault();
    const submitButton = enquiryForm.querySelector('button[type="submit"]');
    const originalSubmitLabel = submitButton ? submitButton.textContent : "Send Enquiry";
    resetFormStatus();

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Sending...";
    }

    const formData = new FormData(enquiryForm);
    const payload = {
      name: String(formData.get("name") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      phone: String(formData.get("phone") || "").trim(),
      guests: String(formData.get("guests") || "").trim(),
      property: String(formData.get("property") || "").trim(),
      dates: String(formData.get("dates") || "").trim(),
      message: String(formData.get("message") || "").trim(),
      sourcePage: document.body?.dataset?.page || "unknown",
      submittedAt: new Date().toISOString()
    };

    try {
      const response = await fetch(WHATSAPP_SUBMIT_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.ok) {
        throw new Error(result?.error || "Unable to send enquiry to WhatsApp.");
      }

      enquiryForm.reset();
      if (propertyField && propertyField.tagName !== "SELECT" && propertyField.dataset.defaultValue) {
        propertyField.value = propertyField.dataset.defaultValue;
      }
      setFormStatus("✓ Thank you! We received your enquiry on WhatsApp and will be in touch shortly.");
    } catch (error) {
      setFormStatus("We couldn't send your enquiry right now. Please try again in a moment.", true);
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = originalSubmitLabel || "Send Enquiry";
      }
    }
  });
}

// Smooth scrolling for hash links
const hashScrollBehavior = prefersReducedMotion ? "auto" : "smooth";
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener("click", event => {
    const hash = anchor.getAttribute("href");
    if (!hash || hash.length < 2) return;
    const target = document.querySelector(hash);
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: hashScrollBehavior, block: "start" });
  });
});

function initializeFadeUp() {
  const fadeElements = document.querySelectorAll(".fade-up");
  if (!fadeElements.length) return;

  // Fallback for mobile or when IntersectionObserver is unsupported
  const isMobile = window.innerWidth <= 980;
  if (!("IntersectionObserver" in window) || isMobile) {
    // Immediately reveal all fade-up elements on mobile for reliability
    fadeElements.forEach(element => element.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.1, rootMargin: "50px" });

  fadeElements.forEach(element => observer.observe(element));

  // Fallback: ensure elements become visible after timeout (in case observer fails)
  setTimeout(() => {
    fadeElements.forEach(element => {
      if (!element.classList.contains("is-visible")) {
        element.classList.add("is-visible");
      }
    });
  }, 2000);
}

// Initialize content and fade animations
function initializeContent() {
  updateListingCounts();
  renderFooterListingLinks();
  renderHomeListings();
  renderListingPage();
  
  // Small delay to ensure DOM is painted before observing
  requestAnimationFrame(() => {
    initializeFadeUp();
  });
}

// Run initialization when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeContent);
} else {
  initializeContent();
}
