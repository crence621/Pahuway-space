/**
 * content.js
 * ------------------------------------------------------------------
 * Renders the "About Pahuway Space" copy and FAQ cards from data.js.
 * ------------------------------------------------------------------ */

const ContentSections = (() => {
  async function initAbout() {
    const el = document.querySelector("#about-content");
    if (!el) return;
    const about = await PahuwaySpaceData.getAboutContent();

    el.querySelector(".about__col--find h3").textContent = about.findSpaces.title;
    el.querySelector(".about__col--find p").textContent = about.findSpaces.body;
    el.querySelector(".about__col--why h3").textContent = about.whyChoose.title;
    el.querySelector(".about__col--why p").textContent = about.whyChoose.body;
  }

  async function initFaq() {
    const grid = document.querySelector("#faq-grid");
    if (!grid) return;
    const faqs = await PahuwaySpaceData.getFaqs();

    grid.innerHTML = "";
    faqs.forEach((faq) => {
      const card = document.createElement("div");
      card.className = "faq-card";
      card.innerHTML = `<h4>${faq.question}</h4><p>${faq.answer}</p>`;
      grid.appendChild(card);
    });
  }

  async function initHeroStats() {
    const el = document.querySelector("#hero-stats");
    if (!el) return;
    const stats = await PahuwaySpaceData.getHeroStats();
    el.innerHTML = stats
      .map((s) => `<div class="hero__stat"><strong>${s.value}</strong><span>${s.label}</span></div>`)
      .join("");
  }

  function init() {
    initAbout();
    initFaq();
    initHeroStats();
  }

  return { init };
})();
