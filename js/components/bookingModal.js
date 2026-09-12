const BookingModal = (() => {
  const peso = new Intl.NumberFormat("en-PH", { maximumFractionDigits: 0 });

  let overlayEl, modalEl, formEl, resultEl;
  let currentProperty = null;

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
          <p class="booking-modal__price"></p>

          <hr class="booking-modal__divider" />

          <form class="booking-form" novalidate>
            <div class="booking-field">
              <label for="booking-name">Full name</label>
              <input type="text" id="booking-name" placeholder="Juan Dela Cruz" required autocomplete="name" />
            </div>

            <div class="booking-field-row">
              <div class="booking-field">
                <label for="booking-guests">Guests</label>
                <input type="number" id="booking-guests" min="1" value="1" required />
              </div>
              <div class="booking-field">
                <label for="booking-checkin">Check-in</label>
                <input type="date" id="booking-checkin" required />
              </div>
              <div class="booking-field">
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
              <div class="booking-summary__row booking-summary__row--total">
                <span>Estimated total</span>
                <span id="booking-total">₱ 0</span>
              </div>
            </div>

            <button type="submit" class="btn btn--primary booking-submit-block">Request to Book</button>
            <p class="booking-form__note">No payment is collected here — this is a booking request only. Demo only, not yet connected to a backend.</p>
          </form>

          <div class="booking-confirmation" hidden>
            <div class="booking-confirmation__icon">✓</div>
            <h3>Booking request sent</h3>
            <p class="booking-confirmation__summary"></p>
            <p class="booking-form__note">Demo only — nothing was saved or charged.</p>
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
      if (e.key === "Escape" && overlayEl.classList.contains("is-open")) close();
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
  }

  function updateSummary() {
    if (!currentProperty) return { nights: 0, total: 0, valid: false };

    const checkin = overlayEl.querySelector("#booking-checkin").value;
    const checkout = overlayEl.querySelector("#booking-checkout").value;
    const nightsLabel = overlayEl.querySelector("#booking-nights-label");
    const rateEl = overlayEl.querySelector("#booking-nights-rate");
    const totalEl = overlayEl.querySelector("#booking-total");
    const errorEl = overlayEl.querySelector("#booking-date-error");

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

    // Listings are priced monthly; prorate to a nightly rate for short stays.
    const nightlyRate = currentProperty.price / 30;
    const total = Math.round(nightlyRate * nights);

    nightsLabel.textContent = `${nights} night${nights === 1 ? "" : "s"}`;
    rateEl.textContent = `₱ ${peso.format(Math.round(nightlyRate))} / night`;
    totalEl.textContent = `₱ ${peso.format(total)}`;

    return { nights, total, valid: datesValid && nights > 0 };
  }

  function handleSubmit(e) {
    e.preventDefault();
    const nameInput = overlayEl.querySelector("#booking-name");
    const name = nameInput.value.trim();
    const guests = overlayEl.querySelector("#booking-guests").value;
    const checkin = overlayEl.querySelector("#booking-checkin").value;
    const checkout = overlayEl.querySelector("#booking-checkout").value;
    const summary = updateSummary();

    if (!name) {
      nameInput.focus();
      return;
    }
    if (!checkin || !checkout || !summary.valid) {
      overlayEl.querySelector("#booking-date-error").classList.add("is-visible");
      return;
    }

    const submitBtn = formEl.querySelector(".booking-submit-block");
    const originalLabel = submitBtn.dataset.originalLabel || submitBtn.textContent;
    submitBtn.dataset.originalLabel = originalLabel;
    submitBtn.disabled = true;
    submitBtn.classList.add("is-loading");
    submitBtn.textContent = "Processing…";

    setTimeout(() => {
      submitBtn.disabled = false;
      submitBtn.classList.remove("is-loading");
      submitBtn.textContent = originalLabel;

      formEl.hidden = true;
      resultEl.hidden = false;
      resultEl.querySelector(".booking-confirmation__summary").textContent =
        `${name} · ${guests} guest${Number(guests) > 1 ? "s" : ""} · ${formatDate(checkin)} → ${formatDate(checkout)} · ₱ ${peso.format(summary.total)} total`;
    }, 1100);

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

    updateSummary();

    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => overlayEl.classList.add("is-open"));
  }

  function close() {
    if (!overlayEl) return;
    overlayEl.classList.remove("is-open");
    document.body.style.overflow = "";
  }

  return { open, close };
})();
