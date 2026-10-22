const BookingModal = (() => {
  const peso = new Intl.NumberFormat("en-PH", { maximumFractionDigits: 0 });

  let overlayEl, modalEl, formEl, resultEl;
  let currentProperty = null;
  let termsEl = null;

  // Property ids this user already requested (pending / confirmed).
  const requestedIds = new Set();
  let requestedLoaded = false;

  function buildDom() {
    overlayEl = document.createElement("div");
    overlayEl.className = "modal-overlay";
    overlayEl.innerHTML = `
      <div class="booking-modal" role="dialog" aria-modal="true" aria-labelledby="booking-modal-title">
        <div class="booking-modal__media">
          <img class="booking-modal__image" src="" alt="" />
          <span class="booking-modal__badge"></span>
          <button type="button" class="booking-modal__close" aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M6 6l12 12M18 6 6 18"/></svg>
          </button>
        </div>

        <div class="booking-modal__body">
          <p class="booking-modal__code"></p>
          <h2 class="booking-modal__title" id="booking-modal-title"></h2>
          <p class="booking-modal__location"></p>
          <div class="booking-modal__specs"></div>
          <ul class="booking-modal__amenities"></ul>
          <div class="booking-modal__facilities-wrap" hidden>
            <p class="booking-modal__facilities-title">Amenities &amp; facilities</p>
            <ul class="booking-modal__facilities"></ul>
          </div>
          <p class="booking-modal__price"></p>

          <hr class="booking-modal__divider" />

          <form class="booking-form" novalidate>
            <div class="booking-field">
              <label for="booking-name">Full name</label>
              <input type="text" id="booking-name" placeholder="Juan Dela Cruz" required autocomplete="name" />
            </div>

            <div class="booking-field-row" id="booking-date-row">
              <div class="booking-field">
                <label for="booking-guests">Guests</label>
                <input type="number" id="booking-guests" min="1" value="1" required />
              </div>
              <div class="booking-field">
                <label for="booking-checkin" id="booking-checkin-label">Check-in</label>
                <input type="date" id="booking-checkin" required />
              </div>
              <div class="booking-field" id="booking-checkout-field">
                <label for="booking-checkout">Check-out</label>
                <input type="date" id="booking-checkout" required />
              </div>
            </div>

            <p class="booking-field-error" id="booking-date-error">Check-out must be after check-in.</p>

            <div class="booking-summary">
              <div class="booking-summary__row">
                <span id="booking-nights-label">0 nights</span>
                <span id="booking-nights-rate">₱ 0</span>
              </div>
              <div class="booking-summary__bills" id="booking-bills"></div>
              <div class="booking-summary__row booking-summary__row--total">
                <span id="booking-total-label">Estimated total</span>
                <span id="booking-total">₱ 0</span>
              </div>
              <p class="booking-summary__note" id="booking-bills-note" hidden>
              </p>
            </div>

            <button type="submit" class="btn btn--primary booking-submit-block">Request to Book</button>
            <p class="booking-form__note">Booking request only — payment is not collected here.</p>
          </form>

          <div class="booking-confirmation" hidden>
            <div class="booking-confirmation__icon">✓</div>
            <h3>Booking request sent</h3>
            <p class="booking-confirmation__status">Already requested · waiting for the owner to confirm</p>
            <p class="booking-confirmation__summary"></p>
            <p class="booking-form__note">Booking request saved — payment is not collected here.</p>
            <button type="button" class="btn btn--ghost booking-submit-block booking-confirmation__close">Close</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(overlayEl);

    modalEl = overlayEl.querySelector(".booking-modal");
    formEl = overlayEl.querySelector(".booking-form");
    resultEl = overlayEl.querySelector(".booking-confirmation");

    const checkin = overlayEl.querySelector("#booking-checkin");
    const checkout = overlayEl.querySelector("#booking-checkout");
    const guests = overlayEl.querySelector("#booking-guests");

    overlayEl.querySelector(".booking-modal__close").addEventListener("click", close);
    overlayEl.addEventListener("click", (e) => {
      if (e.target === overlayEl) close();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      if (termsEl && termsEl.classList.contains("is-open")) {
        closeTerms();
      } else if (overlayEl.classList.contains("is-open")) {
        close();
      }
    });

    checkin.addEventListener("change", () => {
      if (checkin.value) {
        const next = new Date(checkin.value);
        next.setDate(next.getDate() + 1);
        checkout.min = next.toISOString().slice(0, 10);
        if (checkout.value && checkout.value <= checkin.value) checkout.value = "";
      }
      updateSummary();
    });

    [checkout, guests].forEach((input) => input.addEventListener("input", updateSummary));

    resultEl.querySelector(".booking-confirmation__close").addEventListener("click", close);
    formEl.addEventListener("submit", handleSubmit);

    buildTermsDom();
  }

  // ---------- Terms & Conditions pop-up ----------

  function buildTermsDom() {
    termsEl = document.createElement("div");
    termsEl.className = "terms-overlay";
    termsEl.innerHTML = `
      <div class="terms-dialog" role="dialog" aria-modal="true" aria-labelledby="terms-title">
        <h3 class="terms-dialog__title" id="terms-title">Terms &amp; Conditions</h3>
        <p class="terms-dialog__intro">Please read these before sending your booking request.</p>

        <div class="terms-dialog__scroll" tabindex="0">
          <ol>
            <li><strong>Booking request only.</strong> Sending a request does not guarantee your stay. The property owner reviews it and may accept or decline.</li>
            <li><strong>No payment here.</strong> Pahuway Space does not collect payment with this request. Payment is arranged with the owner once your request is confirmed.</li>
            <li><strong>Rent and bills.</strong> The amount shown is the rent only. Bills marked "Paid Separately" are not included and depend on actual usage and applicable rates.</li>
            <li><strong>Accurate details.</strong> The name, number of guests and dates you entered must be correct. The owner may decline requests with incorrect details.</li>
            <li><strong>House rules.</strong> You agree to follow the owner's rules for the property (for example on pets, parking, visitors and quiet hours) and to take care of the space and its facilities.</li>
            <li><strong>Changes and cancellation.</strong> Cancellation and refund terms are set by the owner. Contact the owner to change or cancel a request.</li>
            <li><strong>Availability.</strong> Dates are not held until the owner confirms. Another renter's confirmed booking may make the property unavailable.</li>
          </ol>
        </div>

        <label class="terms-check">
          <input type="checkbox" class="terms-check__box" />
          <span>I have read and agree to the Terms &amp; Conditions.</span>
        </label>
        <label class="terms-check">
          <input type="checkbox" class="terms-check__box" />
          <span>I understand this is a booking request and is not confirmed until the owner accepts it.</span>
        </label>
        <label class="terms-check">
          <input type="checkbox" class="terms-check__box" />
          <span>I confirm that my details are correct and I am requesting to book this property.</span>
        </label>

        <div class="terms-dialog__actions">
          <button type="button" class="btn btn--ghost terms-dialog__cancel">Go back</button>
          <button type="button" class="btn btn--primary terms-dialog__confirm" disabled>Confirm request</button>
        </div>
      </div>
    `;
    document.body.appendChild(termsEl);

    const boxes = termsEl.querySelectorAll(".terms-check__box");
    const confirmBtn = termsEl.querySelector(".terms-dialog__confirm");

    boxes.forEach((box) =>
      box.addEventListener("change", () => {
        confirmBtn.disabled = !Array.from(boxes).every((b) => b.checked);
      })
    );

    termsEl.querySelector(".terms-dialog__cancel").addEventListener("click", closeTerms);
    termsEl.addEventListener("click", (e) => {
      if (e.target === termsEl) closeTerms();
    });
    confirmBtn.addEventListener("click", () => {
      if (confirmBtn.disabled) return;
      closeTerms();
      sendBooking();
    });
  }

  function openTerms() {
    termsEl.querySelectorAll(".terms-check__box").forEach((b) => (b.checked = false));
    termsEl.querySelector(".terms-dialog__confirm").disabled = true;
    termsEl.querySelector(".terms-dialog__scroll").scrollTop = 0;
    termsEl.classList.add("is-open");
  }

  function closeTerms() {
    if (termsEl) termsEl.classList.remove("is-open");
  }

  // ---------- "Already requested" state ----------

  async function loadRequestedIds() {
    try {
      const response = await fetch("api/bookings.php");
      const data = await response.json();
      if (!data.success) return;

      data.bookings
        .filter((b) => b.booking_status === "pending" || b.booking_status === "confirmed")
        .forEach((b) => requestedIds.add(String(b.property_id)));

      requestedLoaded = true;
    } catch (error) {
      // Not logged in or offline: the button just stays as "Request to Book".
    }
  }

  function applyRequestedState() {
    if (!formEl || !currentProperty) return;

    const submitBtn = formEl.querySelector(".booking-submit-block");
    const already = requestedIds.has(String(currentProperty.id));

    submitBtn.disabled = already;
    submitBtn.classList.toggle("is-requested", already);
    submitBtn.textContent = already
      ? "Already requested"
      : submitBtn.dataset.originalLabel || "Request to Book";
  }

  function updateSummary() {
    if (!currentProperty) return { nights: 0, total: 0, valid: false };

    const checkin = overlayEl.querySelector("#booking-checkin").value;
    const checkout = overlayEl.querySelector("#booking-checkout").value;
    const nightsLabel = overlayEl.querySelector("#booking-nights-label");
    const rateEl = overlayEl.querySelector("#booking-nights-rate");
    const totalEl = overlayEl.querySelector("#booking-total");
    const errorEl = overlayEl.querySelector("#booking-date-error");

    // Monthly rentals: move-in date only, billed per month, no check-out.
    if (isMonthly(currentProperty)) {
      const monthlyRent = Math.round(currentProperty.price);

      errorEl.classList.remove("is-visible");
      nightsLabel.textContent = "First month's rent";
      rateEl.textContent = `₱ ${peso.format(monthlyRent)} per month`;
      totalEl.textContent = `₱ ${peso.format(monthlyRent)}`;

      return { nights: 0, total: monthlyRent, valid: Boolean(checkin) };
    }

    let nights = 0;
    let datesValid = true;

    if (checkin && checkout) {
      const diffDays = Math.round((new Date(checkout) - new Date(checkin)) / (1000 * 60 * 60 * 24));
      if (diffDays > 0) {
        nights = diffDays;
        errorEl.classList.remove("is-visible");
      } else {
        datesValid = false;
        errorEl.classList.add("is-visible");
      }
    }

    const nightlyRate = currentProperty.price;
    const total = Math.round(nightlyRate * nights);

    nightsLabel.textContent = `${nights} night${nights === 1 ? "" : "s"}`;
    rateEl.textContent = `₱ ${peso.format(Math.round(nightlyRate))} per day`;
    totalEl.textContent = `₱ ${peso.format(total)}`;

    return { nights, total, valid: datesValid && nights > 0 };
  }

async function handleSubmit(e) {

  e.preventDefault();

    try {
    const response = await fetch("api/session.php");
    const data = await response.json();

    if (!data.loggedIn) {
      window.location.href = "login.html";
      return;
    }
  } catch (error) {
    alert("Unable to verify your login. Please try again.");
    return;
  }

  const nameInput = overlayEl.querySelector("#booking-name");
  const guestsInput = overlayEl.querySelector("#booking-guests");
  const checkinInput = overlayEl.querySelector("#booking-checkin");
  const checkoutInput = overlayEl.querySelector("#booking-checkout");

  const monthly = isMonthly(currentProperty);

  const name = nameInput.value.trim();
  const guests = guestsInput.value;
  const checkin = checkinInput.value;
  const checkout = monthly ? "" : checkoutInput.value;
  const summary = updateSummary();

  if (!name) {
    nameInput.focus();
    return;
  }

  if (monthly && !checkin) {
    checkinInput.focus();
    return;
  }

  if (!monthly && (!checkin || !checkout || !summary.valid)) {
    overlayEl.querySelector("#booking-date-error").classList.add("is-visible");
    return;
  }

  openTerms();
}

// Runs after the renter ticks the boxes and confirms in the Terms pop-up.
async function sendBooking() {

  const nameInput = overlayEl.querySelector("#booking-name");
  const guestsInput = overlayEl.querySelector("#booking-guests");
  const checkinInput = overlayEl.querySelector("#booking-checkin");
  const checkoutInput = overlayEl.querySelector("#booking-checkout");

  const monthly = isMonthly(currentProperty);

  const name = nameInput.value.trim();
  const guests = guestsInput.value;
  const checkin = checkinInput.value;
  const checkout = monthly ? "" : checkoutInput.value;

  const submitBtn = formEl.querySelector(".booking-submit-block");
  const originalLabel = submitBtn.dataset.originalLabel || "Request to Book";

  submitBtn.dataset.originalLabel = originalLabel;
  submitBtn.disabled = true;
  submitBtn.classList.add("is-loading");
  submitBtn.textContent = "Processing…";

  const formData = new FormData();

  formData.append("property_id", currentProperty.id);
  formData.append("check_in", checkin);
  if (!monthly) formData.append("check_out", checkout);
  formData.append("guests", guests);

  try {
    const response = await fetch("api/create-booking.php", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || "Failed to create booking.");
    }

    submitBtn.disabled = false;
    submitBtn.classList.remove("is-loading");
    submitBtn.textContent = originalLabel;

    requestedIds.add(String(currentProperty.id));

    formEl.hidden = true;
    resultEl.hidden = false;

    resultEl.querySelector(".booking-confirmation__summary").textContent =
      monthly
        ? `${name} · ${guests} guest${Number(guests) > 1 ? "s" : ""} · Move-in ${formatDate(checkin)} · ₱ ${peso.format(Number(data.total_amount))} first month's rent`
        : `${name} · ${guests} guest${Number(guests) > 1 ? "s" : ""} · ${formatDate(checkin)} → ${formatDate(checkout)} · ₱ ${peso.format(Number(data.total_amount))} total`;

  } catch (error) {
    submitBtn.disabled = false;
    submitBtn.classList.remove("is-loading");
    submitBtn.textContent = originalLabel;

    alert(error.message);
  }
}

  function isMonthly(property) {
    return Boolean(property) && property.priceUnit === "monthly";
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[c]));
  }

  const checkIcon = `<svg class="amenity-icon amenity-icon--yes" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>`;
  const crossIcon = `<svg class="amenity-icon amenity-icon--no" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>`;
  const parkingIcon = `<svg class="amenity-icon amenity-icon--info" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="3"/><path d="M9.5 16.5v-9h3.2a2.7 2.7 0 0 1 0 5.4H9.5"/></svg>`;

  function renderAmenities(property) {
    const items = [];

    if (property.pets) {
      if (property.pets.allowed) {
        const note = property.pets.conditions
          ? ` <span class="amenity-note">(${escapeHtml(property.pets.conditions)})</span>`
          : "";
        items.push(`<li>${checkIcon}<span>Pets allowed${note}</span></li>`);
      } else {
        items.push(`<li>${crossIcon}<span>Pets not allowed</span></li>`);
      }
    }

    if (property.parking && property.parking.nearby) {
      const fee = property.parking.fee ? ` <span class="amenity-note">(${escapeHtml(property.parking.fee)})</span>` : "";
      items.push(`<li>${parkingIcon}<span>Parking nearby${fee}</span></li>`);
    }

    return items.join("");
  }

  const FACILITY_LABELS = {
    aircon: "Air conditioning",
    heating: "Heating (water heating)",
    refrigerator: "Refrigerator",
    microwave: "Microwave",
    washing_machine: "Automatic washing machine",
    tv: "TV",
  };

  function renderFacilities(property) {
    const labels = [];

    const internet = (property.bills && property.bills.internet) || "separate";
    if (internet !== "none") labels.push("Wi-Fi");

    (property.amenities || []).forEach((key) => {
      if (FACILITY_LABELS[key]) labels.push(FACILITY_LABELS[key]);
    });

    return labels
      .map((label) => `<li>${checkIcon}<span>${label}</span></li>`)
      .join("");
  }

  const BILL_LABELS = { electricity: "Electricity", water: "Water", internet: "Internet" };

  const BILL_STATUS = {
    included: { text: "Covered by Rent", cls: "is-included" },
    separate: { text: "Paid Separately", cls: "is-separate" },
    none: { text: "Not available", cls: "is-none" },
  };

  function renderBills(property) {
    const bills = property.bills || {};

    return Object.keys(BILL_LABELS)
      .map((key) => {
        const status = BILL_STATUS[bills[key]] || BILL_STATUS.separate;
        return `
        <div class="booking-summary__bill">
          <span>${BILL_LABELS[key]}</span>
          <span class="${status.cls}">${status.text}</span>
        </div>`;
      })
      .join("");
  }

  function separateBills(property) {
    const bills = property.bills || {};
    return Object.keys(BILL_LABELS)
      .filter((key) => (bills[key] || "separate") === "separate")
      .map((key) => BILL_LABELS[key]);
  }

  function joinNames(names) {
    if (names.length <= 1) return names.join("");
    return names.slice(0, -1).join(", ") + " and " + names[names.length - 1];
  }

  function updateBillsNote(property) {
    const separate = separateBills(property);
    const noteEl = overlayEl.querySelector("#booking-bills-note");
    const totalLabel = overlayEl.querySelector("#booking-total-label");
    const period = isMonthly(property) ? "monthly rent" : "daily rate";

    if (separate.length === 0) {
      totalLabel.textContent = "Estimated total";
      noteEl.hidden = true;
      return;
    }

    totalLabel.textContent = "Total (rent only)";
    noteEl.textContent =
      `${joinNames(separate)} ${separate.length > 1 ? "are" : "is"} not included in the ${period}. ` +
      `Final utility costs may vary depending on usage and applicable rates.`;
    noteEl.hidden = false;
  }

  function formatDate(iso) {
    return new Date(iso).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
  }

  function open(property) {
    if (!overlayEl) buildDom();
    currentProperty = property;

    formEl.hidden = false;
    resultEl.hidden = true;
    formEl.reset();

    const submitBtn = formEl.querySelector(".booking-submit-block");
    submitBtn.disabled = false;
    submitBtn.classList.remove("is-loading");
    submitBtn.textContent = submitBtn.dataset.originalLabel || "Request to Book";

    const monthly = isMonthly(property);
    overlayEl.querySelector("#booking-checkin-label").textContent = monthly ? "Move-in date" : "Check-in";
    overlayEl.querySelector("#booking-checkout-field").hidden = monthly;
    overlayEl.querySelector("#booking-date-row").classList.toggle("booking-field-row--two", monthly);

    const today = new Date().toISOString().slice(0, 10);
    const checkin = overlayEl.querySelector("#booking-checkin");
    const checkout = overlayEl.querySelector("#booking-checkout");
    checkin.min = today;
    checkin.value = "";
    checkout.min = today;
    checkout.value = "";
    overlayEl.querySelector("#booking-guests").value = 1;
    overlayEl.querySelector("#booking-date-error").classList.remove("is-visible");

    overlayEl.querySelector(".booking-modal__image").src = property.image;
    overlayEl.querySelector(".booking-modal__image").alt = property.title;
    overlayEl.querySelector(".booking-modal__badge").textContent = property.badge;
    overlayEl.querySelector(".booking-modal__code").textContent = property.code;
    overlayEl.querySelector(".booking-modal__title").textContent = property.title;
    overlayEl.querySelector(".booking-modal__location").textContent = property.location;
    overlayEl.querySelector(".booking-modal__price").innerHTML =
      `₱ ${peso.format(property.price)} <span>/ ${property.priceUnit}</span>`;

    const specsWrap = overlayEl.querySelector(".booking-modal__specs");
    specsWrap.innerHTML = [
      property.specs.beds ? `<span>${property.specs.beds} Bed${property.specs.beds > 1 ? "s" : ""}</span>` : "",
      property.specs.baths ? `<span>${property.specs.baths} Bath${property.specs.baths > 1 ? "s" : ""}</span>` : "",
      property.specs.area ? `<span>${property.specs.area}</span>` : "",
    ]
      .filter(Boolean)
      .join("");

    overlayEl.querySelector(".booking-modal__amenities").innerHTML = renderAmenities(property);

    const facilitiesHtml = renderFacilities(property);
    overlayEl.querySelector(".booking-modal__facilities").innerHTML = facilitiesHtml;
    overlayEl.querySelector(".booking-modal__facilities-wrap").hidden = !facilitiesHtml;

    overlayEl.querySelector("#booking-bills").innerHTML = renderBills(property);
    updateBillsNote(property);

    updateSummary();

    applyRequestedState();
    if (!requestedLoaded) {
      loadRequestedIds().then(() => {
        if (currentProperty === property && !formEl.hidden) applyRequestedState();
      });
    }

    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => overlayEl.classList.add("is-open"));
  }
  
  function close() {
    if (!overlayEl) return;
    overlayEl.classList.remove("is-open");
    closeTerms();
    document.body.style.overflow = "";
  }

  return { open, close };
})();
