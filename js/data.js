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

  const propertiesNearYou = [
    {
      id: "near-1",
      code: "PS-ASD67FGH89",
      badge: "Townhouse",
      title: "Fully Finished Modern 2BR Townhouse",
      location: "Block 22 Lot 7, Lucia Mencias, Mandaluyong City",
      price: 18000,
      priceUnit: "monthly",
      specs: { beds: 2, baths: 2, area: "50 sqm" },
      image: IMG + "near-you-1.png",
      verified: true,
      status: "available",
      agent: { name: "Juan Dela Cruz", role: "Agent" },
    },
    {
      id: "near-2",
      code: "PS-5GAUP89LM9",
      badge: "Dormitory",
      title: "Room for Rent in Araullo Street Brgy. 2",
      location: "Araullo Street, Shaw Boulevard, Mandaluyong City",
      price: 7000,
      priceUnit: "monthly",
      specs: { beds: 1, baths: 1, area: "20 sqm" },
      image: IMG + "near-you-2.png",
      verified: true,
      status: "available",
      agent: { name: "Jheff Agues", role: "Agent" },
    },
    {
      id: "near-3",
      code: "PS-XFGQ0907PW",
      badge: "Townhouse",
      title: "The Olive Place in Mandaluyong City",
      location: "407 Shaw Blvd. Brgy Addition Hills, Mandaluyong City",
      price: 22000,
      priceUnit: "monthly",
      specs: { beds: 1, baths: 1, area: "Studio · 25 sqm" },
      image: IMG + "near-you-3.png",
      verified: true,
      status: "available",
      agent: { name: "Alex Guzman", role: "Agent" },
    },
  ];

  const featuredNewProperties = [
    {
      id: "new-1",
      code: "PS-111D7UJHA90",
      badge: "Condominium",
      title: "Luxurious 2 BR Studio Unit Condominium for Rent in Azure Suites Paranaque",
      location: "Azure Urban Resorts Residences, Paranaque City",
      price: 25000,
      priceUnit: "monthly",
      specs: { beds: 2, baths: 2, area: "50 sqm" },
      image: IMG + "new-property-1.png",
      verified: true,
      status: "available",
      agent: { name: "Annie Piuka", role: "Agent" },
    },
    {
      id: "new-2",
      code: "PS-JNXXJUE1567",
      badge: "Condominium",
      title: "City View 3 BR Penthouse for Rent in Poblacion, Makati City",
      location: "Pilar Hills, Poblacion, Makati City",
      price: 113000,
      priceUnit: "monthly",
      specs: { beds: 3, baths: 2, area: "112 sqm" },
      image: IMG + "new-property-2.png",
      verified: true,
      status: "available",
      agent: { name: "Joshua Garcia", role: "Agent" },
    },
    {
      id: "new-3",
      code: "PS-567YHSA826",
      badge: "House and Lot",
      title: "1-Storey House and Lot Rental Property in Manila, Philippines",
      location: "San Andres, Manila, Philippines",
      price: 32000,
      priceUnit: "monthly",
      specs: { beds: 2, baths: 1, area: "32 sqm" },
      image: IMG + "new-property-3.png",
      verified: true,
      status: "available",
      agent: { name: "Grace Yu", role: "Agent" },
    },
  ];

  const recentlyRentedProperties = [
    {
      id: "rented-1",
      code: "PS-XX901BJ7781",
      badge: "Dormitory",
      title: "1 Single Bed Shared Dormitory in Intramuros, Manila, Philippines",
      location: "Magallanes St., Intramuros, Manila, Philippines",
      price: 9000,
      priceUnit: "monthly",
      specs: { beds: 1, baths: 1, area: "30 sqm" },
      image: IMG + "recent-property-1.png",
      verified: false,
      status: "rented",
      agent: { name: "Enzo Dee", role: "Agent" },
    },
    {
      id: "rented-2",
      code: "PS-JKLB345AD78",
      badge: "Condominium",
      title: "Airconditioned Dormitory Solo Bedroom in San Isidro, Indang, Cavite",
      location: "118 San Isidro, Indang, Cavite",
      price: 11000,
      priceUnit: "monthly",
      specs: { beds: 1, baths: 1, area: "22 sqm" },
      image: IMG + "recent-property-2.png",
      verified: true,
      status: "rented",
      agent: { name: "Pia Santos", role: "Agent" },
    },
    {
      id: "rented-3",
      code: "PS-JNM23XD567",
      badge: "Condominium",
      title: "1 Bedroom House and Lot Rental Property in Quezon City, Philippines",
      location: "Novaliches, Quezon City, Philippines",
      price: 15000,
      priceUnit: "monthly",
      specs: { beds: 1, baths: 2, area: "47 sqm" },
      image: IMG + "recent-property-3.png",
      verified: true,
      status: "rented",
      agent: { name: "Allya Perez", role: "Agent" },
    },
  ];

  // Placeholder gradient tiles until real destination photography is ready.
  // Swap `image` for a real photo path any time the tile renderer
  // already prefers `image` over `gradient` when both are present.
  const destinations = [
    { id: "manila", name: "Manila", listingCount: 214, image: IMG + "destination-manila.png", gradient: "linear-gradient(160deg,#3a3226,#151210)" },
    { id: "quezon-city", name: "Quezon City", listingCount: 178, image: IMG + "destination-qc.png", gradient: "linear-gradient(160deg,#3a1f2e,#160c14)" },
    { id: "makati", name: "Makati", listingCount: 261, image: IMG + "destination-makati.png", gradient: "linear-gradient(160deg,#1f2b3a,#0c1218)" },
    { id: "cebu-city", name: "Cebu City", listingCount: 132, image: IMG + "destination-cebu.png", gradient: "linear-gradient(160deg,#123a3a,#0a1616)" },
    { id: "iloilo-city", name: "Iloilo City", listingCount: 64, image: IMG + "destination-iloilo.png", gradient: "linear-gradient(160deg,#3a2f12,#161006)" },
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
    getPropertiesNearYou: () => asPromise(propertiesNearYou),
    getFeaturedNewProperties: () => asPromise(featuredNewProperties),
    getRecentlyRentedProperties: () => asPromise(recentlyRentedProperties),
    getDestinations: () => asPromise(destinations),
    getFaqs: () => asPromise(faqs),
    getAboutContent: () => asPromise(about),
    getHeroStats: () => asPromise(heroStats),
  };
})();