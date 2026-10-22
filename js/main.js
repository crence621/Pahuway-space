/**
 * ------------------------------------------------------------------
 * Entry point. Wires up header/nav interactions and kicks off every
 * section module. 
 * ------------------------------------------------------------------ */

(function bootstrap() {
  document.addEventListener("DOMContentLoaded", () => {
    initMobileNav();
    initSearchForm();
    initListingAccess();
    setFooterYear();

    PropertySections.init();
    DestinationsSection.init();
    ContentSections.init();
  });

    function initListingAccess() {
    const modal = document.querySelector("#listing-access-modal");
    if (!modal) return;

    const closeBtn = document.querySelector("#listing-access-close");
    const backdrop = modal.querySelector(".listing-access-modal__backdrop");
    const triggers = document.querySelectorAll(".listing-access-trigger");

    async function openModal(e) {
      e.preventDefault();

      try {
        const response = await fetch("api/session.php");
        const data = await response.json();

        if (data.loggedIn) {
          window.location.href = "list-property.html";
          return;
        }

        modal.hidden = false;
        document.body.style.overflow = "hidden";
      } catch (error) {
        window.location.href = "login.html";
      }
    }

    function closeModal() {
      modal.hidden = true;
      document.body.style.overflow = "";
    }

    triggers.forEach((trigger) => {
      trigger.addEventListener("click", openModal);
    });

    closeBtn.addEventListener("click", closeModal);
    backdrop.addEventListener("click", closeModal);

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !modal.hidden) {
        closeModal();
      }
    });
  }

  function initMobileNav() {
    const toggle = document.querySelector("#nav-toggle");
    const nav = document.querySelector("#main-nav");
    if (!toggle || !nav) return;

    toggle.addEventListener("click", () => {
      const isOpen = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });

    nav.querySelectorAll("a").forEach((link) =>
      link.addEventListener("click", () => {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      })
    );
  }

  async function initSearchForm() {
    const form = document.querySelector("#search-form");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const location = document.querySelector("#search-location").value.trim().toLowerCase();
      const type = document.querySelector("#search-type").value.trim().toLowerCase();
      const budget = document.querySelector("#search-budget").value;

      const resultsSection = document.querySelector("#search-results");
      const resultsGrid = document.querySelector("#search-results-grid");
      const resultsCount = document.querySelector("#search-results-count");
      const emptyState = document.querySelector("#search-results-empty");

      resultsSection.hidden = false;
      resultsGrid.innerHTML = "<p>Searching...</p>";
      emptyState.hidden = true;

      try {
        const properties = await PahuwaySpaceData.getAllProperties();

        const results = properties.filter((property) => {
          if (property.status !== "available") return false;

          const propertyLocation = property.location.toLowerCase();
          const propertyType = property.badge.toLowerCase();
          const price = Number(property.price);

          if (location && !propertyLocation.includes(location)) {
            return false;
          }

          if (type && propertyType !== type) {
            return false;
          }

          if (budget === "0-10000" && price >= 10000) {
            return false;
          }

          if (budget === "10000-25000" && (price < 10000 || price > 25000)) {
            return false;
          }

          if (budget === "25000-60000" && (price < 25000 || price > 60000)) {
            return false;
          }

          if (budget === "60000+" && price < 60000) {
            return false;
          }

          return true;
        });

        resultsGrid.innerHTML = "";

        if (results.length === 0) {
          resultsCount.textContent = "0 properties found";
          emptyState.hidden = false;
        } else {
          resultsCount.textContent = `${results.length} ${results.length === 1 ? "property" : "properties"} found`;

          const response = await fetch("api/favorites.php");
          const favoriteData = await response.json();
          const favorites = favoriteData.success
            ? new Set(favoriteData.favorites.map(Number))
            : new Set();

          results.forEach((property) => {
            const card = PropertyCard.render(property, {
              favorited: favorites.has(Number(property.id)),
              onToggleFavorite: async (id, isFav) => {
                const formData = new FormData();
                formData.append("property_id", id);
                formData.append("action", isFav ? "add" : "remove");

                const response = await fetch("api/favorites.php", {
                  method: "POST",
                  body: formData
                });

                const data = await response.json();

                if (!data.success) {
                  alert(data.message);
                }
              },
              onOpenDetails: (property) => {
                if (typeof window.onPropertyCardOpen === "function") {
                  window.onPropertyCardOpen(property);
                }
              }
            });

            resultsGrid.appendChild(card);
          });
        }

        resultsSection.scrollIntoView({ behavior: "smooth" });

      } catch (error) {
        console.error("Search failed:", error);
        resultsGrid.innerHTML = "<p>Unable to load search results.</p>";
      }
    });
  }

  function setFooterYear() {
    const el = document.querySelector("#footer-year");
    if (el) el.textContent = new Date().getFullYear();
  }
})();
