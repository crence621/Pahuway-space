/**
 * ------------------------------------------------------------------
 * Renders "Popular Rental Destinations" tiles. Each tile uses a real
 * photo (`destination.image`) when provided, otherwise falls back to
 * a brand-colored gradient so the section still looks intentional
 * before real photography is added.
 * ------------------------------------------------------------------ */

const DestinationsSection = (() => {
  async function init() {
    const track = document.querySelector("#destinations-track");
    if (!track) return;

    const destinations = await PahuwaySpaceData.getDestinations();
    track.innerHTML = "";

    destinations.forEach((dest) => {
      const tile = document.createElement("a");
      tile.href = `#properties-near-you?city=${encodeURIComponent(dest.id)}`;
      tile.className = "destination-tile";
      if (dest.image) {
        tile.style.setProperty("--tile-gradient", `url(${dest.image})`);
        tile.style.backgroundImage = `url(${dest.image})`;
        tile.style.backgroundSize = "cover";
        tile.style.backgroundPosition = "center";
      } else {
        tile.style.setProperty("--tile-gradient", dest.gradient);
      }
      tile.innerHTML = `
        <span>
          ${dest.name}
          <span class="destination-tile__count">${dest.listingCount} listings</span>
        </span>
      `;
      track.appendChild(tile);
    });

    Carousel.attach(track, {
      prevBtn: document.querySelector("#destinations-prev"),
      nextBtn: document.querySelector("#destinations-next"),
    });
  }

  return { init };
})();
