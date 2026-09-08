/**
 * main.js
 * ------------------------------------------------------------------
 * Entry point. Wires up header/nav interactions and kicks off every
 * section module. Section modules are independent — feel free to
 * delete or reorder calls here without touching anything else.
 * ------------------------------------------------------------------ */

(function bootstrap() {
  document.addEventListener("DOMContentLoaded", () => {
    initMobileNav();
    initSearchForm();
    setFooterYear();

    PropertySections.init();
    DestinationsSection.init();
    ContentSections.init();
  });

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

  function initSearchForm() {
    const form = document.querySelector("#search-form");
    if (!form) return;

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const query = Object.fromEntries(formData.entries());

      // TODO: once the backend exists, replace this with a real
      // navigation/fetch to a search-results page, e.g.:
      //   window.location.href = `/search?${new URLSearchParams(query)}`;
      console.log("[search] submitted with:", query);

      document.querySelector("#properties-near-you")?.scrollIntoView({ behavior: "smooth" });
    });
  }

  function setFooterYear() {
    const el = document.querySelector("#footer-year");
    if (el) el.textContent = new Date().getFullYear();
  }
})();
