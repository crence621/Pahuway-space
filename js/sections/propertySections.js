/**
 * propertySections.js
 * ------------------------------------------------------------------
 * Wires up "Properties Near You", "Featured New Properties", and
 * "Recently Rented Properties" — each is data + card component +
 * carousel, just pointed at a different data.js getter and container.
 * ------------------------------------------------------------------ */

const PropertySections = (() => {
  const favorites = new Set(JSON.parse(localStorage.getItem("pahuway:favorites") || "[]"));

  function persistFavorites() {
    localStorage.setItem("pahuway:favorites", JSON.stringify([...favorites]));
  }

  function onToggleFavorite(id, isFav) {
    isFav ? favorites.add(id) : favorites.delete(id);
    persistFavorites();
  }

  async function mount({ trackSelector, prevSelector, nextSelector, fetchData }) {
    const track = document.querySelector(trackSelector);
    if (!track) return;

    track.innerHTML = `<p class="visually-hidden">Loading properties…</p>`;

    try {
      const properties = await fetchData();
      track.innerHTML = "";
      properties.forEach((property) => {
        const card = PropertyCard.render(property, {
          favorited: favorites.has(property.id),
          onToggleFavorite,
        });
        track.appendChild(card);
      });

      Carousel.attach(track, {
        prevBtn: prevSelector ? document.querySelector(prevSelector) : null,
        nextBtn: nextSelector ? document.querySelector(nextSelector) : null,
      });
    } catch (err) {
      track.innerHTML = `<p class="carousel__error">Couldn't load listings right now. Please try again later.</p>`;
      console.error("[PropertySections] failed to load:", err);
    }
  }

  function init() {
    mount({
      trackSelector: "#near-you-track",
      prevSelector: "#near-you-prev",
      nextSelector: "#near-you-next",
      fetchData: PahuwaySpaceData.getPropertiesNearYou,
    });

    mount({
      trackSelector: "#featured-new-track",
      prevSelector: "#featured-new-prev",
      nextSelector: "#featured-new-next",
      fetchData: PahuwaySpaceData.getFeaturedNewProperties,
    });

    mount({
      trackSelector: "#recently-rented-track",
      prevSelector: "#recently-rented-prev",
      nextSelector: "#recently-rented-next",
      fetchData: PahuwaySpaceData.getRecentlyRentedProperties,
    });
  }

  return { init };
})();
