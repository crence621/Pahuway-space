/**
 * ------------------------------------------------------------------
 * HOW TO CONNECT A REAL BACKEND LATER:
 * Every function below already returns a Promise, so the rest of the
 * web doesn't know or care whether the data comes from a local array
 * or a network call. To go live, replace the body of each function
 * with a fetch() to your API and keep the same return shape, e.g.:
 *
 *   async function getPropertiesNearYou() {
 *     const res = await fetch('/api/properties?section=near-you');
 *     return res.json();
 *   }
 *
 * Nothing in render.js, sections/*.js, or main.js needs to change.
 * ------------------------------------------------------------------ */

const PahuwaySpaceData = (() => {
  const IMG = "assets/images/";

  async function getPropertiesFromAPI() {
    const response = await fetch("api/properties.php");

    if (!response.ok) {
      throw new Error("Failed to fetch properties.");
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.message || "Failed to load properties.");
    }

    return data.properties.map((property) => ({
      id: String(property.property_id),
      code: property.property_code,
      badge: property.property_type,
      title: property.title,
      location: property.location,
      price: Number(property.price),
      priceUnit: property.price_unit,
      specs: {
        beds: Number(property.bedrooms),
        baths: Number(property.bathrooms),
        area: property.area,
      },
      image: property.image,
      verified: Boolean(property.verified),
      status: property.status,
      agent: {
        name: property.owner_name || "Pahuway Space",
        role: "Property Owner",
      },
    }));
  }

  /** @typedef {Object} Property
   *  @property {string} id
   *  @property {string} code
   *  @property {string} badge
   *  @property {string} title
   *  @property {string} location
   *  @property {number} price
   *  @property {string} priceUnit
   *  @property {{beds?:number, baths?:number, area?:string}} specs
   *  @property {string} image
   *  @property {boolean} verified
   *  @property {"available"|"rented"} status
   *  @property {{name:string, role:string}} agent
   */

  // Placeholder gradient tiles until real destination photography is ready.
  // Swap `image` for a real photo path any time the tile renderer
  // already prefers `image` over `gradient` when both are present.
  const destinations = [
    { id: "manila", name: "Manila", listingCount: 214, image: IMG + "destination-manila.png", gradient: "linear-gradient(160deg,#3a3226,#151210)" },
    { id: "quezon-city", name: "Quezon City", listingCount: 178, image: IMG + "destination-qc.png", gradient: "linear-gradient(160deg,#3a1f2e,#160c14)" },
    { id: "makati", name: "Makati", listingCount: 261, image: IMG + "destination-makati.png", gradient: "linear-gradient(160deg,#1f2b3a,#0c1218)" },
    { id: "cebu-city", name: "Cebu City", listingCount: 132, image: IMG + "destination-cebu.png", gradient: "linear-gradient(160deg,#123a3a,#0a1616)" },
    { id: "iloilo-city", name: "Iloilo City", listingCount: 64, image: IMG + "destination-iloilo.png", gradient: "linear-gradient(160deg,#3a2f12,#161006)" },

    // dagdag tong 3
    { id: "bohol-city", name: "Bohol City", listingCount: 97, image: IMG + "INSERTIMAGE.png", gradient: "linear-gradient(160deg,#2a3a1f,#101609)" },
    { id: "baguio-city", name: "Baguio City", listingCount: 85, image: IMG + "INSERTIMAGE.png", gradient: "linear-gradient(160deg,#232b3a,#0b0e14)" },
    { id: "tagaytay-city", name: "Tagaytay City", listingCount: 58, image: IMG + "INSERTIMAGE.png", gradient: "linear-gradient(160deg,#3a2a3a,#160c16)" },
  ];

  const faqs = [
    {
      id: "faq-1",
      question: "How does booking and check-in work on Pahuway Space?",
      answer:
        "Once you pick your ideal sanctuary, submit a reservation request directly through the listing page. After your host confirms, you'll receive full arrival details, keyless access codes, and directions — ensuring a smooth, hassle-free check-in.",
    },
    {
      id: "faq-2",
      question: "What is the cancellation and refund policy?",
      answer:
        "Cancellation terms are set by individual hosts and clearly displayed on every listing prior to booking. You can easily manage or adjust your reservation directly from your user dashboard.",
    },
    {
      id: "faq-3",
      question: "What kinds of spaces can I find on Pahuway Space?",
      answer:
        "Pahuway Space offers a diverse range of serene accommodations across the Philippines, including cozy mountain cabins, beachside villas, peaceful condo units, private rooms, and dedicated day-use study or work sanctuaries.",
    },
  ];

  const about = {
    kicker: "About Pahuway Space",
    heading: "Best Rental Platform in the Market",
    findSpaces: {
      title: "Find Spaces Made for Rest Across the Philippines",
      body:
        "Pahuway Space is a premier sanctuary marketplace helping travelers, remote workers, and staycationers find peaceful retreats, cozy cabins, boutique stays, and restful spaces nationwide. Whether you're a student taking a well-deserved break, a professional seeking a quiet workcation, an OFW coming home to relax, or a traveler exploring tranquil spots in the Philippines, Pahuway Space makes it effortless to discover verified rest locations and connect directly with host managers. Browse curated spaces across major regions, including Metro Manila, Tagaytay, Baguio, Cebu, Davao, and Siargao.",
    },
    whyChoose: {
      title: "Why People Choose Pahuway Space",
      body:
        "Booking a peaceful getaway should be simple, transparent, and completely stress-free. Listings on Pahuway Space include a verified badge, giving you complete confidence that retreat details and host standards have been reviewed. Built-in messaging lets you chat directly with hosts, clarify check-in details, and request special setups without leaving the platform.",
    },
  };

  const heroStats = [
    { value: "1,200+", label: "Active listings" },
    { value: "35", label: "Cities covered" },
    { value: "4.8 / 5", label: "Average host rating" },
  ];

  // --- Public async API (backend-ready shape) -----------------------------

  const asPromise = (data) => Promise.resolve(data);

  return {
  getPropertiesNearYou: async () => {
    const properties = await getPropertiesFromAPI();

    return properties
      .filter((property) => property.status === "available")
      .slice(0, 6);
  },

  getFeaturedNewProperties: async () => {
    const properties = await getPropertiesFromAPI();

    return properties
      .filter((property) => property.status === "available")
      .slice(6);
  },

  getRecentlyRentedProperties: async () => {
    const properties = await getPropertiesFromAPI();

    return properties
      .filter((property) => property.status === "rented");
  },

  getDestinations: () => asPromise(destinations),
  getFaqs: () => asPromise(faqs),
  getAboutContent: () => asPromise(about),
  getHeroStats: () => asPromise(heroStats),
};
})();
