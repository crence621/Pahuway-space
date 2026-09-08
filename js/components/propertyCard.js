/**
 * propertyCard.js
 * ------------------------------------------------------------------
 * Builds a single property card DOM node from a Property object
 * (see the typedef in data.js). Used by every property carousel so
 * the card markup only lives in one place.
 * ------------------------------------------------------------------ */

const PropertyCard = (() => {
  const peso = new Intl.NumberFormat("en-PH", { maximumFractionDigits: 0 });

  const icons = {
    tag: `<svg viewBox="0 0 24 24"><path d="M20.59 13.41 11 3.83 3.83 11l9.58 9.59a2 2 0 0 0 2.83 0l4.35-4.35a2 2 0 0 0 0-2.83Z"/><circle cx="7.5" cy="7.5" r="1.2" fill="currentColor" stroke="none"/></svg>`,
    pin: `<svg viewBox="0 0 24 24"><path d="M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12Z"/><circle cx="12" cy="9" r="2.4"/></svg>`,
    verified: `<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="m12 1 2.6 1.9 3.2-.3 1 3 2.9 1.4-.7 3.2 1.8 2.8-2.5 2 .1 3.2-3.1.7-1.7 2.8L12 21l-3.1.7-1.7-2.8-3.1-.7.1-3.2-2.5-2 1.8-2.8-.7-3.2 2.9-1.4 1-3 3.2.3Z"/><path d="m9.2 12.4 1.9 1.9 3.7-3.9" stroke="#0e0e10" stroke-width="1.6" fill="none"/></svg>`,
    bed: `<svg viewBox="0 0 24 24"><path d="M2 18v-6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2"/><path d="M2 18v2M22 20v-4a2 2 0 0 0-2-2h-8"/><path d="M22 18v2M2 12V7a2 2 0 0 1 2-2"/></svg>`,
    bath: `<svg viewBox="0 0 24 24"><path d="M4 12h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4Z"/><path d="M7 12V6a2 2 0 0 1 3.6-1.2M4 19v1M18 19v1"/></svg>`,
    area: `<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>`,
    heart: `<svg viewBox="0 0 24 24"><path d="M20.8 8.6c0 4.9-8.8 10-8.8 10s-8.8-5.1-8.8-10a4.9 4.9 0 0 1 8.8-3 4.9 4.9 0 0 1 8.8 3Z"/></svg>`,
    share: `<svg viewBox="0 0 24 24"><circle cx="18" cy="5" r="2.4"/><circle cx="6" cy="12" r="2.4"/><circle cx="18" cy="19" r="2.4"/><path d="m8.1 10.7 7.8-4.4M8.1 13.3l7.8 4.4"/></svg>`,
    mail: `<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>`,
    chat: `<svg viewBox="0 0 24 24"><path d="M21 12a8 8 0 1 1-3.3-6.5L21 4l-1 3.6A7.9 7.9 0 0 1 21 12Z"/></svg>`,
  };

  function initials(name) {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }

  /**
   * @param {import('../data.js').Property} property
   * @param {{ favorited?: boolean, onToggleFavorite?: (id:string)=>void }} [opts]
   */
  function render(property, opts = {}) {
    const el = document.createElement("article");
    el.className = "property-card" + (property.status === "rented" ? " property-card--rented" : "");
    el.dataset.propertyId = property.id;

    const isFav = !!opts.favorited;

    el.innerHTML = `
      <div class="property-card__media">
        <img src="${property.image}" alt="${escapeAttr(property.title)}" loading="lazy" />
        <span class="property-card__badge">${escapeHtml(property.badge)}</span>
        <button class="property-card__fav" type="button" aria-pressed="${isFav}" aria-label="Save ${escapeAttr(
      property.title
    )} to favorites">
          ${icons.heart}
        </button>
        ${
          property.status === "rented"
            ? `<div class="property-card__status"><span>Rented</span></div>`
            : ""
        }
      </div>
      <div class="property-card__body">
        <div class="property-card__code">${icons.tag}<span>${escapeHtml(property.code)}</span></div>
        <h3 class="property-card__title">
          <span>${escapeHtml(property.title)}</span>
          ${property.verified ? `<span class="verified" title="Verified listing">${icons.verified}</span>` : ""}
        </h3>
        <p class="property-card__location">${icons.pin}<span>${escapeHtml(property.location)}</span></p>
        <p class="property-card__price">₱ ${peso.format(property.price)}<span> / ${property.priceUnit}</span></p>
        <div class="property-card__specs">
          ${property.specs.beds ? `<span>${icons.bed} ${property.specs.beds} Bed${property.specs.beds > 1 ? "s" : ""}</span>` : ""}
          ${property.specs.baths ? `<span>${icons.bath} ${property.specs.baths} Bath${property.specs.baths > 1 ? "s" : ""}</span>` : ""}
          ${property.specs.area ? `<span>${icons.area} ${escapeHtml(property.specs.area)}</span>` : ""}
        </div>
        <div class="property-card__footer">
          <div class="property-card__agent">
            <div class="property-card__agent-avatar">${initials(property.agent.name)}</div>
            <div>
              <div class="property-card__agent-name">${escapeHtml(property.agent.name)}</div>
              <div class="property-card__agent-role">${escapeHtml(property.agent.role)} · Updated recently</div>
            </div>
          </div>
          <div class="property-card__share">
            <button type="button" aria-label="Share">${icons.share}</button>
            <button type="button" aria-label="Email agent">${icons.mail}</button>
            <button type="button" aria-label="Message agent">${icons.chat}</button>
          </div>
        </div>
      </div>
    `;

    const favBtn = el.querySelector(".property-card__fav");
    favBtn.addEventListener("click", () => {
      const next = favBtn.getAttribute("aria-pressed") !== "true";
      favBtn.setAttribute("aria-pressed", String(next));
      if (typeof opts.onToggleFavorite === "function") {
        opts.onToggleFavorite(property.id, next);
      }
    });

    return el;
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

  function escapeAttr(str) {
    return escapeHtml(str);
  }

  return { render };
})();
