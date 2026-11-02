import api from '@/services/api';

/**
 * Normalizes backend trip record to full frontend representation
 * maintaining UI layout, assets, and styling compatibility.
 */
export const normalizeTrip = (raw) => {
  if (!raw) return null;

  const id = raw.id;
  const fromCity = raw.origin || raw.route?.origin || 'Addis Ababa';
  const toCity = raw.destination || raw.route?.destination || 'Bahir Dar';
  const formatTripDate = (rawDateVal, rawTimeVal) => {
    if (rawDateVal && String(rawDateVal).trim()) return String(rawDateVal).split('T')[0];
    if (rawTimeVal) {
      const d = new Date(rawTimeVal);
      if (!isNaN(d.getTime())) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      }
    }
    return '';
  };
  const rawDate = formatTripDate(raw.departureDate, raw.departureTime);

  // Format departure / arrival time strings (e.g. 06:00 AM)
  const formatTimeStr = (isoOrStr) => {
    if (!isoOrStr) return '06:00 AM';
    if (typeof isoOrStr === 'string' && (isoOrStr.includes('AM') || isoOrStr.includes('PM'))) {
      return isoOrStr;
    }
    const d = new Date(isoOrStr);
    if (Number.isNaN(d.getTime())) return String(isoOrStr);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const departureTime = formatTimeStr(raw.departureTime);
  const arrivalTime = formatTimeStr(raw.arrivalTime);

  const durationHours = raw.route?.estimated_duration_hours || 8;
  const duration = `${Math.floor(durationHours)}h ${Math.round((durationHours % 1) * 60)}m`;
  const distance = raw.route?.distance_km ? `${raw.route.distance_km} km` : '560 km';

  const price = Number(raw.price || raw.fare || 1200);
  const fare = price;

  const operatorObj = raw.operator || {};
  const operatorName = typeof operatorObj === 'string' ? operatorObj : (operatorObj.name || 'Selam Bus Line');
  const orgTypeRaw = typeof operatorObj === 'object' ? operatorObj.type : raw.orgType;
  const orgType =
    orgTypeRaw === 'ASSOCIATION' || orgTypeRaw === 'Transport Association'
      ? 'Transport Association'
      : 'Private Bus Company';

  // Determine period based on departure time
  let period = 'morning';
  const depDate = raw.departureTime ? new Date(raw.departureTime) : null;
  const hour = depDate && !Number.isNaN(depDate.getTime()) ? depDate.getHours() : 7;
  if (hour >= 12 && hour < 17) period = 'afternoon';
  else if (hour >= 17 || hour < 6) period = 'evening';

  // Operator branding & images
  let logoBg = 'bg-[#1d4ed8]';
  let logoText;
  let image = '/images/crops/bus_selam.jpg';
  const lowerName = operatorName.toLowerCase();

  if (lowerName.includes('abay')) {
    logoBg = 'bg-[#0e7490]';
    logoText = 'AA';
    image = '/images/crops/bus_abay.jpg';
  } else if (lowerName.includes('gebeya')) {
    logoBg = 'bg-[#10b981]';
    logoText = 'GB';
    image = '/images/crops/bus_gebeya.jpg';
  } else if (lowerName.includes('mekelle') || lowerName.includes('mekele')) {
    logoBg = 'bg-[#2563eb]';
    logoText = 'MT';
    image = '/images/crops/bus_mekelle.jpg';
  } else if (lowerName.includes('anbesa') || lowerName.includes('abesa')) {
    logoBg = 'bg-[#ea580c]';
    logoText = 'AB';
    image = '/images/crops/bus_abay.jpg';
  } else if (lowerName.includes('sky')) {
    logoBg = 'bg-[#0284c7]';
    logoText = 'SE';
    image = '/images/crops/bus_selam.jpg';
  } else {
    const initials = operatorName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join('');
    logoText = initials || 'BT';
  }

  const totalSeats = raw.totalSeats || raw.bus?.capacity || (Array.isArray(raw.seats) && raw.seats.length > 0 ? raw.seats.length : 40);

  // Normalize seats if present
  let seats = [];
  if (Array.isArray(raw.seats) && raw.seats.length > 0) {
    seats = raw.seats.map((s, idx) => {
      const num = s.seatNumber !== undefined ? s.seatNumber : (s.seat_number !== undefined ? s.seat_number : idx + 1);
      const numStr = num < 10 ? `0${num}` : `${num}`;
      const row = Math.ceil(num / 4);
      const cols = ['A', 'B', 'C', 'D'];
      const col = cols[(num - 1) % 4] || 'A';
      const statusLower = String(s.status || 'AVAILABLE').toLowerCase();
      let status = 'available';
      if (statusLower === 'booked') status = 'booked';
      else if (statusLower === 'held') status = 'held';
      else if (statusLower === 'blocked') status = 'blocked';
      else if (statusLower === 'locked') status = 'locked';

      return {
        id: s.id || `${row}${col}`,
        seatNumber: num,
        row,
        col,
        label: numStr,
        status,
      };
    });
  } else {
    // Generate dynamic seats up to exact bus capacity
    for (let num = 1; num <= totalSeats; num++) {
      const numStr = num < 10 ? `0${num}` : `${num}`;
      const row = Math.ceil(num / 4);
      const cols = ['A', 'B', 'C', 'D'];
      const col = cols[(num - 1) % 4] || 'A';
      seats.push({
        id: `${row}${col}`,
        seatNumber: num,
        row,
        col,
        label: numStr,
        status: 'available',
      });
    }
  }

  const seatsAvailable =
    raw.availableSeatsCount !== undefined
      ? raw.availableSeatsCount
      : raw.availableSeats !== undefined
        ? raw.availableSeats
        : seats.filter((s) => s.status === 'available').length;

  const busNumber = raw.bus?.plate_number || `ETH-${logoText}-101`;
  const busType = raw.bus?.model || 'Scania Touring HD';

  return {
    id,
    from: fromCity,
    to: toCity,
    date: rawDate,
    departureTime,
    arrivalTime,
    duration,
    durationHours,
    distance,
    price,
    fare,
    period,
    seatsAvailable,
    availableSeatsCount: seatsAvailable,
    totalSeats,
    operator: operatorName,
    operatorId: operatorObj.id || raw.organization_id || '',
    orgType,
    logoBg,
    logoText,
    image,
    badge: price <= 1150 ? 'Best Price' : undefined,
    rating: 4.6,
    reviews: 94,
    verified: true,
    busNumber,
    busType,
    ac: true,
    wifi: true,
    tv: true,
    comfortableSeats: true,
    addisLandmark: '/images/crops/addis_landmark.jpg',
    bahirdarLandmark: '/images/crops/bahirdar_landmark.jpg',
    interiorImage: '/images/crops/bus_interior.jpg',
    detailTopImage: '/images/crops/bus_detail_top.jpg',
    about: `${operatorName} provides reliable inter-city transportation connecting passengers across Ethiopia with modern luxury coaches, professional drivers, and high safety standards.`,
    established: 'Since 2012',
    headOffice: fromCity || 'Addis Ababa',
    phone: '+251 911 223344',
    email: `contact@${operatorName.toLowerCase().replace(/[^a-z0-9]/g, '')}.et`,
    reviewsList: [
      {
        id: 'r1',
        name: 'Fitzum Tadesse',
        date: 'Recent Trip',
        rating: 5,
        avatar: '/images/crops/fitzum_avatar.jpg',
        comment: 'Very comfortable bus and departed exactly on time. Safe driver and courteous staff.',
      },
      {
        id: 'r2',
        name: 'Sara Abera',
        date: 'Recent Trip',
        rating: 5,
        avatar: '/images/crops/sara_avatar.jpg',
        comment: 'Smooth and enjoyable journey with clean seats and active WiFi. Highly recommended!',
      },
    ],
    seats,
  };
};

/**
 * Search bus trips with filtering and pagination
 */
export const searchTripsApi = async (params = {}) => {
  try {
    const query = {};
    if (params.from || params.origin) query.origin = params.from || params.origin;
    if (params.to || params.destination) query.destination = params.to || params.destination;
    if (params.date) query.date = params.date;
    if (params.operator) query.operator = params.operator;
    if (params.operatorId) query.operatorId = params.operatorId;
    if (params.page) query.page = params.page;
    if (params.limit) query.limit = params.limit;
    if (params.sortBy) query.sortBy = params.sortBy;
    if (params.sortOrder) query.sortOrder = params.sortOrder;

    const { data } = await api.get('/passenger/trips', { params: query });
    console.log('Search trips response:', data);
    const rawTrips = data?.data?.trips || [];
    const normalizedTrips = rawTrips.map(normalizeTrip);

    return {
      total: data?.data?.total || normalizedTrips.length,
      page: data?.data?.page || 1,
      limit: data?.data?.limit || 20,
      totalPages: data?.data?.totalPages || 1,
      trips: normalizedTrips,
    };
  } catch (err) {
    console.error('Error searching trips:', err);
    return {
      total: 0,
      page: 1,
      limit: 20,
      totalPages: 0,
      trips: [],
    };
  }
};

/**
 * Fetch trip details by UUID
 */
export const getTripDetailsApi = async (tripId) => {
  try {
    const { data } = await api.get(`/passenger/trips/${tripId}`);
    const rawTrip = data?.data?.trip;
    console.log('Raw trip from backend:', rawTrip);
    return normalizeTrip(rawTrip);
  } catch (err) {
    console.error('Error fetching trip details:', err);
    return null;
  }
};

/**
 * Fetch seat layout & availability for a trip
 */
export const getTripSeatsApi = async (tripId) => {
  try {
    const { data } = await api.get(`/passenger/trips/${tripId}/seats`);
    const rawData = data?.data;
    console.log('Raw seats from backend:', rawData);
    if (!rawData) return null;

    const seats = (rawData.seats || []).map((s, idx) => {
      const num = s.seatNumber !== undefined ? s.seatNumber : idx + 1;
      const numStr = num < 10 ? `0${num}` : `${num}`;
      const row = Math.ceil(num / 4);
      const cols = ['A', 'B', 'C', 'D'];
      const col = cols[(num - 1) % 4] || 'A';
      const statusLower = String(s.status || 'AVAILABLE').toLowerCase();
      let status = 'available';
      if (statusLower === 'booked') status = 'booked';
      else if (statusLower === 'held') status = 'held';
      else if (statusLower === 'blocked') status = 'blocked';
      else if (statusLower === 'locked') status = 'locked';

      return {
        id: s.id || `${row}${col}`,
        seatNumber: num,
        row,
        col,
        label: numStr,
        status,
      };
    });

    const liveAvailableSeatsCount =
      rawData.availableSeatsCount !== undefined
        ? rawData.availableSeatsCount
        : seats.filter((s) => s.status === 'available').length;

    return {
      tripId: rawData.tripId,
      bus: rawData.bus,
      totalSeats: rawData.totalSeats || seats.length,
      availableSeatsCount: liveAvailableSeatsCount,
      seatsAvailable: liveAvailableSeatsCount,
      bookedSeatsCount: rawData.bookedSeatsCount,
      heldSeatsCount: rawData.heldSeatsCount,
      blockedSeatsCount: rawData.blockedSeatsCount,
      seats,
    };
  } catch (err) {
    console.error('Error fetching trip seats:', err);
    return null;
  }
};

/**
 * Fetch public operators / organizations from backend
 */
// Pool of distinct high-resolution bus images for operators
export const OPERATOR_BUS_IMAGES = [
  '/images/operators/selam-bus.png',
  '/images/operators/abay-association.png',
  '/images/operators/gebeya-bus.png',
  '/images/operators/mekelle-transport.png',
  '/images/operators/golden-bus.jpg',
  '/images/operators/walia-bus.jpg',
  '/images/operators/ethio-bus.jpg',
  '/images/operators/oda-bus.jpg',
  '/images/operators/rift-valley-bus.jpg',
  '/images/operators/sky-bus.jpg',
];

// Rich fallback operator directory with distinct images & branding
export const DEFAULT_PUBLIC_OPERATORS = [
  {
    id: 'op-selam',
    name: 'Selam Bus Line',
    type: 'Private Bus Company',
    logoText: 'SB',
    logoBg: 'bg-[#dc2626]',
    rating: '4.9',
    reviews: '120+ trips',
    tripCount: 48,
    busCount: 48,
    routeFrom: 'Addis Ababa',
    routeTo: 'Bahir Dar',
    extraRoutes: '+12 more',
    image: '/images/operators/selam-bus.png',
  },
  {
    id: 'op-abay',
    name: 'Abay Bus Transport Association',
    type: 'Transport Association',
    logoText: 'AA',
    logoBg: 'bg-[#0e7490]',
    rating: '4.8',
    reviews: '85+ trips',
    tripCount: 32,
    busCount: 32,
    routeFrom: 'Addis Ababa',
    routeTo: 'Gondar',
    extraRoutes: '+8 more',
    image: '/images/operators/abay-association.png',
  },
  {
    id: 'op-golden',
    name: 'Golden Express Bus',
    type: 'Private Bus Company',
    logoText: 'GE',
    logoBg: 'bg-[#d97706]',
    rating: '4.8',
    reviews: '60+ trips',
    tripCount: 24,
    busCount: 24,
    routeFrom: 'Addis Ababa',
    routeTo: 'Hawassa',
    extraRoutes: '+6 more',
    image: '/images/operators/golden-bus.jpg',
  },
  {
    id: 'op-walia',
    name: 'Walia Intercity Bus',
    type: 'Private Bus Company',
    logoText: 'WB',
    logoBg: 'bg-[#7c3aed]',
    rating: '4.7',
    reviews: '45+ trips',
    tripCount: 20,
    busCount: 20,
    routeFrom: 'Addis Ababa',
    routeTo: 'Jimma',
    extraRoutes: '+5 more',
    image: '/images/operators/walia-bus.jpg',
  },
  {
    id: 'op-ethio',
    name: 'Ethio Bus Transport Co',
    type: 'Private Bus Company',
    logoText: 'EB',
    logoBg: 'bg-[#059669]',
    rating: '4.7',
    reviews: '50+ trips',
    tripCount: 18,
    busCount: 18,
    routeFrom: 'Addis Ababa',
    routeTo: 'Dire Dawa',
    extraRoutes: '+7 more',
    image: '/images/operators/ethio-bus.jpg',
  },
  {
    id: 'op-gebeya',
    name: 'Gebeya Bus Line',
    type: 'Private Bus Company',
    logoText: 'GB',
    logoBg: 'bg-[#10b981]',
    rating: '4.6',
    reviews: '40+ trips',
    tripCount: 16,
    busCount: 16,
    routeFrom: 'Addis Ababa',
    routeTo: 'Dessie',
    extraRoutes: '+4 more',
    image: '/images/operators/gebeya-bus.png',
  },
  {
    id: 'op-mekelle',
    name: 'Mekelle Transport Association',
    type: 'Transport Association',
    logoText: 'MT',
    logoBg: 'bg-[#2563eb]',
    rating: '4.8',
    reviews: '70+ trips',
    tripCount: 28,
    busCount: 28,
    routeFrom: 'Addis Ababa',
    routeTo: 'Mekelle',
    extraRoutes: '+6 more',
    image: '/images/operators/mekelle-transport.png',
  },
  {
    id: 'op-oda',
    name: 'Oda Shared Transport',
    type: 'Transport Association',
    logoText: 'OB',
    logoBg: 'bg-[#ea580c]',
    rating: '4.6',
    reviews: '35+ trips',
    tripCount: 14,
    busCount: 14,
    routeFrom: 'Addis Ababa',
    routeTo: 'Adama',
    extraRoutes: '+5 more',
    image: '/images/operators/oda-bus.jpg',
  },
  {
    id: 'op-rift',
    name: 'Rift Valley Express',
    type: 'Private Bus Company',
    logoText: 'RV',
    logoBg: 'bg-[#4f46e5]',
    rating: '4.7',
    reviews: '42+ trips',
    tripCount: 22,
    busCount: 22,
    routeFrom: 'Addis Ababa',
    routeTo: 'Arba Minch',
    extraRoutes: '+3 more',
    image: '/images/operators/rift-valley-bus.jpg',
  },
  {
    id: 'op-sky',
    name: 'Sky Bus Ethiopia',
    type: 'Private Bus Company',
    logoText: 'SK',
    logoBg: 'bg-[#0284c7]',
    rating: '4.9',
    reviews: '90+ trips',
    tripCount: 36,
    busCount: 36,
    routeFrom: 'Addis Ababa',
    routeTo: 'Harar',
    extraRoutes: '+8 more',
    image: '/images/operators/sky-bus.jpg',
  },
];

export const getPublicOperatorsApi = async (params = {}) => {
  try {
    const { data } = await api.get('/organizations', {
      params: {
        limit: params.limit || 50,
        search: params.search || '',
        isActive: true,
      },
    });

    const orgs = data?.data?.organizations || data?.data || [];
    console.log('Organizations from backend:', orgs);
    if (!Array.isArray(orgs) || orgs.length === 0) {
      return DEFAULT_PUBLIC_OPERATORS;
    }

    return orgs.map((org, index) => {
      let logoBg = 'bg-[#1d4ed8]';
      let logoText;
      let image = null;
      const lower = (org.name || '').toLowerCase();

      if (lower.includes('abay')) {
        logoBg = 'bg-[#0e7490]';
        logoText = 'AA';
        image = '/images/operators/abay-association.png';
      } else if (lower.includes('gebeya')) {
        logoBg = 'bg-[#10b981]';
        logoText = 'GB';
        image = '/images/operators/gebeya-bus.png';
      } else if (lower.includes('mekelle')) {
        logoBg = 'bg-[#2563eb]';
        logoText = 'MT';
        image = '/images/operators/mekelle-transport.png';
      } else if (lower.includes('golden')) {
        logoBg = 'bg-[#d97706]';
        logoText = 'GE';
        image = '/images/operators/golden-bus.jpg';
      } else if (lower.includes('walia')) {
        logoBg = 'bg-[#7c3aed]';
        logoText = 'WB';
        image = '/images/operators/walia-bus.jpg';
      } else if (lower.includes('ethio')) {
        logoBg = 'bg-[#059669]';
        logoText = 'EB';
        image = '/images/operators/ethio-bus.jpg';
      } else if (lower.includes('oda')) {
        logoBg = 'bg-[#ea580c]';
        logoText = 'OB';
        image = '/images/operators/oda-bus.jpg';
      } else if (lower.includes('rift') || lower.includes('valley')) {
        logoBg = 'bg-[#4f46e5]';
        logoText = 'RV';
        image = '/images/operators/rift-valley-bus.jpg';
      } else if (lower.includes('sky')) {
        logoBg = 'bg-[#0284c7]';
        logoText = 'SK';
        image = '/images/operators/sky-bus.jpg';
      } else if (lower.includes('selam')) {
        logoBg = 'bg-[#dc2626]';
        logoText = 'SB';
        image = '/images/operators/selam-bus.png';
      }

      // If no specific keyword matched, assign a unique distinct bus image from the pool
      if (!image) {
        image = OPERATOR_BUS_IMAGES[index % OPERATOR_BUS_IMAGES.length];
        const colors = [
          'bg-[#dc2626]',
          'bg-[#0e7490]',
          'bg-[#10b981]',
          'bg-[#2563eb]',
          'bg-[#d97706]',
          'bg-[#7c3aed]',
          'bg-[#059669]',
          'bg-[#ea580c]',
          'bg-[#4f46e5]',
          'bg-[#0284c7]',
        ];
        logoBg = colors[index % colors.length];
      }

      if (!logoText) {
        const words = (org.name || 'Operator').split(' ').filter(Boolean);
        logoText = words.map((w) => w[0].toUpperCase()).slice(0, 2).join('') || 'OP';
      }

      const type =
        org.type === 'ASSOCIATION' || org.type === 'Transport Association'
          ? 'Transport Association'
          : 'Private Bus Company';

      // Extract actual unique routes from database
      const uniqueRoutes = [];
      if (org.trips && Array.isArray(org.trips)) {
        org.trips.forEach((t) => {
          if (t.routes?.origin && t.routes?.destination) {
            const pairKey = `${t.routes.origin} -> ${t.routes.destination}`;
            if (!uniqueRoutes.includes(pairKey)) {
              uniqueRoutes.push(pairKey);
            }
          }
        });
      }

      const defaultCorridors = [
        ['Addis Ababa', 'Bahir Dar'],
        ['Addis Ababa', 'Gondar'],
        ['Addis Ababa', 'Hawassa'],
        ['Addis Ababa', 'Jimma'],
        ['Addis Ababa', 'Dire Dawa'],
        ['Addis Ababa', 'Dessie'],
        ['Addis Ababa', 'Mekelle'],
        ['Addis Ababa', 'Adama'],
        ['Addis Ababa', 'Arba Minch'],
        ['Addis Ababa', 'Harar'],
      ];
      const fallbackCorridor = defaultCorridors[index % defaultCorridors.length];
      let routeFrom = fallbackCorridor[0];
      let routeTo = fallbackCorridor[1];
      let extraRoutes = '';

      if (uniqueRoutes.length > 0) {
        const [from, to] = uniqueRoutes[0].split(' -> ');
        routeFrom = from;
        routeTo = to;
        if (uniqueRoutes.length > 1) {
          extraRoutes = `+${uniqueRoutes.length - 1} more`;
        }
      } else if (lower.includes('mekelle')) {
        routeTo = 'Mekelle';
      }

      return {
        id: org.id,
        name: org.name,
        type,
        logoText,
        logoBg,
        rating: '4.8',
        reviews: `${org.tripCount || 30 + (index * 7)}+ trips`,
        tripCount: org.tripCount || 20 + index * 4,
        busCount: org.busCount || 15 + index * 3,
        routeFrom,
        routeTo,
        extraRoutes,
        image,
      };
    });
  } catch (err) {
    console.error('Error fetching operators:', err);
    return DEFAULT_PUBLIC_OPERATORS;
  }
};

/**
 * Initialize payment for a booking
 */
export const initializePaymentApi = async (paymentData) => {
  try {
    const { data } = await api.post('/passenger/payments/initialize', paymentData);
    console.log('Payment initialized:', data);
    return data;
  } catch (err) {
    console.error('Error initializing payment:', err);
    throw err;
  }
};

/**
 * Get current user's bookings
 */
export const getMyBookingsApi = async () => {
  try {
    const { data } = await api.get('/passenger/bookings');
    console.log('My bookings:', data);
    return data;
  } catch (err) {
    console.error('Error fetching my bookings:', err);
    throw err;
  }
};

/**
 * Verify payment with backend
 */
export const verifyPaymentApi = async (paymentData) => {
  try {
    const { data } = await api.post('/passenger/payments/verify', paymentData);
    console.log('Payment verified:', data);
    return data;
  } catch (err) {
    console.error('Error verifying payment:', err);
    throw err;
  }
};

export default {
  searchTripsApi,
  getTripDetailsApi,
  getTripSeatsApi,
  getPublicOperatorsApi,
  initializePaymentApi,
  normalizeTrip,
};
