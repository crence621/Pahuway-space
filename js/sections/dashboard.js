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
        onToggleFavorite: async (id, isFav) => {
          const formData = new FormData();
          formData.append("property_id", id);
          formData.append("action", isFav ? "add" : "remove");

          try {
            const response = await fetch("api/favorites.php", {
              method: "POST",
              body: formData
            });

            const data = await response.json();

            if (!data.success) {
              alert(data.message);
              return;
            }

            if (!isFav) {
              card.remove();
              if (countEl) countEl.textContent = String(grid.children.length);

              if (!grid.children.length && emptyState) {
                emptyState.hidden = false;
              }
            }
          } catch (error) {
            console.error("Favorite update error:", error);
            alert("Unable to update favorite.");
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
    loadOwnerBookings();
    loadOwnerProperties();
  }

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

async function loadOwnerBookings() {
  const list = document.getElementById("dashboard-owner-bookings-list");
  const empty = document.getElementById("dashboard-owner-bookings-empty");
  const count = document.getElementById("owner-bookings-count");

  if (!list) return;

  try {
    const response = await fetch("api/owner-bookings.php");
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || "Failed to load booking requests.");
    }

    count.textContent = data.bookings.length;

    if (data.bookings.length === 0) {
      list.innerHTML = "";
      empty.hidden = false;
      return;
    }

    empty.hidden = true;

    list.innerHTML = data.bookings.map((booking) => {
      const status =
        booking.booking_status.charAt(0).toUpperCase() +
        booking.booking_status.slice(1);

      return `
        <article class="dashboard-owner-booking-card">
          <div class="dashboard-owner-booking-card__image">
            <img src="${booking.image}" alt="${booking.title}">
          </div>

          <div class="dashboard-owner-booking-card__content">
            <span class="dashboard-owner-booking-card__code">
              ${booking.property_code}
            </span>

            <h3>${booking.title}</h3>
            <p>${booking.location}</p>

            <div class="dashboard-owner-booking-card__guest">
              <strong>Guest</strong>
              <span>${booking.guest_name}</span>
              <span>${booking.guest_email}</span>
            </div>

            <div class="dashboard-owner-booking-card__details">
              <span>${formatBookingDate(booking.check_in)} → ${formatBookingDate(booking.check_out)}</span>
              <span>${booking.guests} guest${booking.guests > 1 ? "s" : ""}</span>
              <span>${booking.nights} night${booking.nights > 1 ? "s" : ""}</span>
            </div>
          </div>

          <div class="dashboard-owner-booking-card__side">
            <span class="dashboard-owner-booking-card__status status-${booking.booking_status}">
              ${status}
            </span>

            <strong>₱ ${Number(booking.total_amount).toLocaleString("en-PH")}</strong>

            ${
              booking.booking_status === "pending"
                ? `
                  <div class="dashboard-owner-booking-card__actions">
                    <button type="button" onclick="updateOwnerBookingStatus(${booking.booking_id}, 'confirmed')">Confirm</button>
                    <button type="button" onclick="updateOwnerBookingStatus(${booking.booking_id}, 'cancelled')">Cancel</button>
                  </div>
                `
                : ""
            }
          </div>
        </article>
      `;
    }).join("");

  } catch (error) {
    list.innerHTML = `<p>Unable to load booking requests.</p>`;
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

window.updateOwnerBookingStatus = async function(bookingId, status) {
  console.log("UPDATE CLICKED", bookingId, status);

  const formData = new FormData();
  formData.append("booking_id", bookingId);
  formData.append("status", status);

  try {
    const response = await fetch("api/update-booking-status.php", {
      method: "POST",
      body: formData
    });

    console.log("RESPONSE STATUS:", response.status);

    const text = await response.text();
    console.log("RESPONSE:", text);

    const data = JSON.parse(text);

    if (!data.success) {
      alert(data.message);
      return;
    }

    alert("Booking updated!");
    loadOwnerBookings();
    loadBookings();

  } catch (error) {
    console.error("UPDATE ERROR:", error);
    alert("Unable to update booking.");
  }
}

async function loadOwnerProperties() {
  const list = document.getElementById("dashboard-owner-properties-list");
  const empty = document.getElementById("dashboard-owner-properties-empty");
  const count = document.getElementById("owner-properties-count");

  if (!list) return;

  try {
    const response = await fetch("api/owner-properties.php");
    const data = await response.json();

    if (!data.success) throw new Error(data.message);

    count.textContent = data.properties.length;

    if (data.properties.length === 0) {
      list.innerHTML = "";
      empty.hidden = false;
      return;
    }

    empty.hidden = true;

    list.innerHTML = data.properties.map(property => `
      <article class="dashboard-owner-property-card">
        <div class="dashboard-owner-property-card__image">
          <img src="${
            property.image.startsWith("assets/")
              ? property.image
              : `assets/images/${property.image}`
          }" alt="${property.title}">
        </div>

        <div>
          <span>${property.property_code}</span>
          <h3>${property.title}</h3>
          <p>${property.location}</p>
          <strong>₱ ${Number(property.price).toLocaleString("en-PH")}</strong>
        </div>

        <div class="dashboard-owner-property-card__actions">
          <span class="dashboard-owner-property-card__status status-${property.status}">
            ${property.status}
          </span>

          <button type="button"
            onclick="updatePropertyStatus(${property.property_id}, '${property.status === "available" ? "rented" : "available"}')">
            Mark as ${property.status === "available" ? "Rented" : "Available"}
          </button>
        </div>
      </article>
    `).join("");

  } catch (error) {
    list.innerHTML = `<p>Unable to load your properties.</p>`;
    console.error(error);
  }
}

window.updatePropertyStatus = async function(propertyId, status) {
  const formData = new FormData();
  formData.append("property_id", propertyId);
  formData.append("status", status);

  try {
    const response = await fetch("api/update-property-status.php", {
      method: "POST",
      body: formData
    });

    const data = await response.json();

    if (!data.success) {
      alert(data.message);
      return;
    }

    loadOwnerProperties();
  } catch (error) {
    console.error(error);
    alert("Unable to update property.");
  }
};

return { init };

})();
