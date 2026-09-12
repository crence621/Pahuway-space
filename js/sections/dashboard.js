const DashboardSection = (() => {
  function getFavoriteIds() {
    return new Set(JSON.parse(localStorage.getItem("pahuway:favorites") || "[]"));
  }

  function saveFavoriteIds(ids) {
    localStorage.setItem("pahuway:favorites", JSON.stringify([...ids]));
  }

  function renderProfile() {
    const name = localStorage.getItem("pahuway:userName") || "Renter";
    const email = localStorage.getItem("pahuway:userEmail") || "you@pahuwayspace.ph";

    const nameEl = document.getElementById("dashboard-user-name");
    const emailEl = document.getElementById("dashboard-user-email");
    const avatarEl = document.getElementById("dashboard-user-avatar");

    if (nameEl) nameEl.textContent = name;
    if (emailEl) emailEl.textContent = email;
    if (avatarEl) {
      avatarEl.textContent = name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
    }
  }

  async function renderFavorites() {
    const grid = document.getElementById("dashboard-favorites-grid");
    const emptyState = document.getElementById("dashboard-favorites-empty");
    const countEl = document.getElementById("dashboard-favorites-count");
    if (!grid) return;

    const [near, featured, rented] = await Promise.all([
      PahuwaySpaceData.getPropertiesNearYou(),
      PahuwaySpaceData.getFeaturedNewProperties(),
      PahuwaySpaceData.getRecentlyRentedProperties(),
    ]);

    const allProperties = [...near, ...featured, ...rented];
    const favoriteIds = getFavoriteIds();
    const favorited = allProperties.filter((p) => favoriteIds.has(p.id));

    if (countEl) countEl.textContent = String(favorited.length);
    grid.innerHTML = "";

    if (favorited.length === 0) {
      if (emptyState) emptyState.hidden = false;
      return;
    }
    if (emptyState) emptyState.hidden = true;

    favorited.forEach((property) => {
      const card = PropertyCard.render(property, {
        favorited: true,
        onToggleFavorite: (id, isFav) => {
          const ids = getFavoriteIds();
          isFav ? ids.add(id) : ids.delete(id);
          saveFavoriteIds(ids);
          if (!isFav) {
            card.remove();
            if (countEl) countEl.textContent = String(ids.size);
            if (!grid.children.length && emptyState) emptyState.hidden = false;
          }
        },
        onOpenDetails: (p) => {
          if (typeof BookingModal !== "undefined") BookingModal.open(p);
        },
      });
      grid.appendChild(card);
    });
  }

  function init() {
    renderProfile();
    renderFavorites();
  }

  return { init };
})();
