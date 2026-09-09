/**
 * ------------------------------------------------------------------
 * Minimal horizontal-scroll carousel controller. Pass it a track
 * element and optional prev/next buttons; it scrolls by one card's
 * width (plus gap) at a time. No external dependencies.
 * ------------------------------------------------------------------ */

const Carousel = (() => {
  function attach(track, { prevBtn, nextBtn } = {}) {
    if (!track) return;

    function step() {
      const card = track.querySelector(":scope > *");
      if (!card) return track.clientWidth * 0.9;
      const style = getComputedStyle(track);
      const gap = parseFloat(style.columnGap || style.gap || "0");
      return card.getBoundingClientRect().width + gap;
    }

    function scrollByStep(direction) {
      track.scrollBy({ left: direction * step(), behavior: "smooth" });
    }

    prevBtn && prevBtn.addEventListener("click", () => scrollByStep(-1));
    nextBtn && nextBtn.addEventListener("click", () => scrollByStep(1));

    function updateNavState() {
      if (!prevBtn && !nextBtn) return;
      const maxScroll = track.scrollWidth - track.clientWidth - 2;
      if (prevBtn) prevBtn.disabled = track.scrollLeft <= 2;
      if (nextBtn) nextBtn.disabled = track.scrollLeft >= maxScroll;
    }

    track.addEventListener("scroll", updateNavState, { passive: true });
    window.addEventListener("resize", updateNavState);
    // Defer to allow images/cards to lay out first.
    requestAnimationFrame(updateNavState);
  }

  return { attach };
})();
