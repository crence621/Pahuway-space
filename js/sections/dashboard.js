const DashboardSection = (() => {
  function getFavoriteIds() {
    return new Set(JSON.parse(localStorage.getItem("pahuway:favorites") || "[]"));
  }

  function saveFavoriteIds(ids) {
    localStorage.setItem("pahuway:favorites", JSON.stringify([...ids]));
  }

async function renderProfile() {
  try {
    const response = await fetch("api/session.php");

    const data = await response.json();

    if (!data.loggedIn) {
      window.location.href = "login.html";
      return;
    }

    const name = data.user.full_name;
    const email = data.user.email;

    const nameEl = document.getElementById("dashboard-user-name");
    const emailEl = document.getElementById("dashboard-user-email");
    const avatarEl = document.getElementById("dashboard-user-avatar");

    if (nameEl) {
      nameEl.textContent = name;
    }

    if (emailEl) {
      emailEl.textContent = email;
    }

    if (avatarEl) {
      avatarEl.textContent = name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
    }

  } catch (error) {
    console.error("Session check failed:", error);
    window.location.href = "login.html";
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

  async function init() {
    await renderProfile();
    renderFavorites();
    loadBookings();
  }

  return { init };

  async function loadBookings() {
  const list = document.getElementById("dashboard-bookings-list");
  const empty = document.getElementById("dashboard-bookings-empty");
  const count = document.getElementById("dashboard-bookings-count");

  if (!list) return;

  try {
    const response = await fetch("api/bookings.php");
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || "Failed to load bookings.");
    }

    count.textContent = data.bookings.length;

    if (data.bookings.length === 0) {
      list.innerHTML = "";
      empty.hidden = false;
      return;
    }

    empty.hidden = true;

    list.innerHTML = data.bookings.map((booking) => {
      const status = booking.booking_status.charAt(0).toUpperCase() +
        booking.booking_status.slice(1);

      return `
        <article class="dashboard-booking-card">
          <div class="dashboard-booking-card__image">
            <img src="${booking.image}" alt="${booking.title}">
          </div>

          <div class="dashboard-booking-card__content">
            <span class="dashboard-booking-card__code">${booking.property_code}</span>
            <h3>${booking.title}</h3>
            <p>${booking.location}</p>

            <div class="dashboard-booking-card__details">
              <span>${formatBookingDate(booking.check_in)} → ${formatBookingDate(booking.check_out)}</span>
              <span>${booking.guests} guest${booking.guests > 1 ? "s" : ""}</span>
              <span>${booking.nights} night${booking.nights > 1 ? "s" : ""}</span>
            </div>
          </div>

          <div class="dashboard-booking-card__side">
            <span class="dashboard-booking-card__status status-${booking.booking_status}">
              ${status}
            </span>
            <strong>₱ ${Number(booking.total_amount).toLocaleString("en-PH")}</strong>
          </div>
        </article>
      `;
    }).join("");

  } catch (error) {
    list.innerHTML = `<p>Unable to load your bookings.</p>`;
    console.error(error);
  }
}

function formatBookingDate(date) {
  return new Date(date + "T00:00:00").toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

})();
