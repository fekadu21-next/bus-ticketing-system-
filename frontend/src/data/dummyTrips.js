export const CITIES = [
  'Addis Ababa',
  'Bahir Dar',
  'Hawassa',
  'Gondar',
  'Mekelle',
  'Dire Dawa',
  'Jimma',
  'Adama',
  'Arba Minch',
];

export const OPERATORS = [
  { id: 'selam', name: 'Selam Bus', type: 'Private Bus Company', count: 5, logoBg: 'bg-[#1d4ed8]', logoText: 'SB' },
  { id: 'abay', name: 'Abay Association', type: 'Transport Association', count: 3, logoBg: 'bg-[#0e7490]', logoText: 'AA' },
  { id: 'gebeya', name: 'Gebeya Bus', type: 'Private Bus Company', count: 2, logoBg: 'bg-[#10b981]', logoText: 'GB' },
  { id: 'mekelle', name: 'Mekelle Transport', type: 'Transport Association', count: 2, logoBg: 'bg-[#2563eb]', logoText: 'MT' },
];

const LANDMARKS = {
  addisLandmark: '/images/crops/addis_landmark.jpg',
  bahirdarLandmark: '/images/crops/bahirdar_landmark.jpg',
  interiorImage: '/images/crops/bus_interior.jpg',
  detailTopImage: '/images/crops/bus_detail_top.jpg',
};

const OPERATOR_META = {
  selam: {
    operatorId: 'selam',
    operator: 'Selam Bus',
    orgType: 'Private Bus Company',
    logoBg: 'bg-[#1d4ed8]',
    logoText: 'SB',
    verified: true,
    image: '/images/crops/bus_selam.jpg',
    about:
      'Selam Bus Share Company is one of the pioneer long-distance public transport operators in Ethiopia, serving passengers with modern luxury buses, professional drivers, and top-tier safety standards.',
    established: 'Since 2010',
    headOffice: 'Addis Ababa',
    phone: '+251 911 222344',
    email: 'info@selambus.com',
    busPrefix: 'SB',
  },
  abay: {
    operatorId: 'abay',
    operator: 'Abay Association',
    orgType: 'Transport Association',
    logoBg: 'bg-[#0e7490]',
    logoText: 'AA',
    verified: true,
    image: '/images/crops/bus_abay.jpg',
    about:
      'Abay Association connects major Ethiopian regional capitals with well-maintained coaches, scheduled departures, and verified safety inspections.',
    established: 'Since 2012',
    headOffice: 'Bahir Dar',
    phone: '+251 918 776655',
    email: 'contact@abaytransport.org',
    busPrefix: 'AA',
  },
  gebeya: {
    operatorId: 'gebeya',
    operator: 'Gebeya Bus',
    orgType: 'Private Bus Company',
    logoBg: 'bg-[#10b981]',
    logoText: 'GB',
    verified: true,
    image: '/images/crops/bus_gebeya.jpg',
    about:
      'Gebeya Bus offers high quality inter-city bus service with onboard entertainment systems, charging ports, and spacious reclining seats.',
    established: 'Since 2015',
    headOffice: 'Addis Ababa',
    phone: '+251 911 889900',
    email: 'info@gebeyabus.et',
    busPrefix: 'GB',
  },
  mekelle: {
    operatorId: 'mekelle',
    operator: 'Mekelle Transport',
    orgType: 'Transport Association',
    logoBg: 'bg-[#2563eb]',
    logoText: 'MT',
    verified: false,
    image: '/images/crops/bus_mekelle.jpg',
    about:
      'Mekelle Transport Association provides regular inter-city travel services with comfortable seating and affordable fare prices across Ethiopia.',
    established: 'Since 2011',
    headOffice: 'Mekelle',
    phone: '+251 914 334455',
    email: 'info@mekelletransport.et',
    busPrefix: 'MT',
  },
  sheger: {
    operatorId: 'sheger',
    operator: 'Sheger Bus',
    orgType: 'Private Bus Company',
    logoBg: 'bg-[#3b82f6]',
    logoText: 'SB',
    verified: true,
    image: '/images/crops/bus_sheger.jpg',
    about:
      'Sheger Bus Company operates express mid-day bus journeys equipped with clean amenities, climate control, and friendly staff.',
    established: 'Since 2018',
    headOffice: 'Addis Ababa',
    phone: '+251 911 332211',
    email: 'info@shegerbus.com',
    busPrefix: 'SH',
  },
  sky: {
    operatorId: 'sky',
    operator: 'Sky Express',
    orgType: 'Private Bus Company',
    logoBg: 'bg-[#0284c7]',
    logoText: 'SE',
    verified: true,
    image: '/images/crops/bus_selam.jpg',
    about: 'Sky Express runs comfortable overnight coaches with extra luggage space and onboard WiFi.',
    established: 'Since 2019',
    headOffice: 'Addis Ababa',
    phone: '+251 911 445566',
    email: 'hello@skyexpress.et',
    busPrefix: 'SE',
  },
};

export const makeSeats = (bookedSet) => {
  const cols = ['A', 'B', 'C', 'D'];
  const seats = [];
  let seatNum = 1;
  for (let row = 1; row <= 10; row += 1) {
    cols.forEach((col) => {
      const id = `${row}${col}`;
      const numStr = seatNum < 10 ? `0${seatNum}` : `${seatNum}`;
      seats.push({
        id,
        row,
        col,
        label: numStr,
        status: bookedSet.has(id) || bookedSet.has(numStr) ? 'booked' : 'available',
      });
      seatNum += 1;
    });
  }
  return seats;
};

const DEFAULT_REVIEWS = [
  {
    id: 'r1',
    name: 'Fitzum Tadesse',
    date: 'Oct 5, 2024',
    rating: 5,
    avatar: '/images/crops/fitzum_avatar.jpg',
    comment: 'Very comfortable bus and on time. Drivers were safe. The staff was also very helpful.',
  },
  {
    id: 'r2',
    name: 'Sara Abera',
    date: 'Sep 26, 2024',
    rating: 5,
    avatar: '/images/crops/sara_avatar.jpg',
    comment: 'Best travel experience! Highly recommended.',
  },
];

const createTrip = (id, operatorKey, overrides) => {
  const operator = OPERATOR_META[operatorKey];
  return {
    id,
    from: 'Addis Ababa',
    to: 'Bahir Dar',
    date: '2024-10-10',
    duration: '8h 0m',
    durationHours: 8,
    distance: '450 km',
    totalSeats: 45,
    busType: 'Standard',
    ac: true,
    wifi: true,
    tv: false,
    comfortableSeats: true,
    rating: 4.6,
    reviews: 80,
    ...LANDMARKS,
    ...operator,
    reviewsList: DEFAULT_REVIEWS,
    seats: makeSeats(new Set(['01', '02', '05', '06', '11', '12'])),
    ...overrides,
    operator: overrides.operator || operator.operator,
    orgType: overrides.orgType || operator.orgType,
  };
};

export const DUMMY_TRIPS = [
  createTrip('selam-1', 'selam', {
    badge: 'Best Price',
    rating: 4.6,
    reviews: 124,
    departureTime: '06:00 AM',
    arrivalTime: '02:00 PM',
    period: 'morning',
    seatsAvailable: 20,
    price: 1200,
    busNumber: 'SB-001',
    tv: true,
    seats: makeSeats(new Set(['01', '02', '05', '06', '11', '12', '15', '16', '21', '22', '25', '26', '31', '32', '35', '36', '41', '42', '45'])),
  }),
  createTrip('abay-1', 'abay', {
    rating: 4.4,
    reviews: 86,
    departureTime: '07:30 AM',
    arrivalTime: '03:30 PM',
    period: 'morning',
    seatsAvailable: 35,
    price: 1150,
    busNumber: 'AA-204',
  }),
  createTrip('gebeya-1', 'gebeya', {
    rating: 4.5,
    reviews: 64,
    departureTime: '06:00 AM',
    arrivalTime: '02:00 PM',
    period: 'morning',
    seatsAvailable: 22,
    price: 1250,
    busNumber: 'GB-108',
    tv: true,
  }),
  createTrip('mekelle-1', 'mekelle', {
    rating: 4.3,
    reviews: 52,
    departureTime: '10:00 AM',
    arrivalTime: '06:00 PM',
    period: 'morning',
    seatsAvailable: 28,
    price: 1100,
    busNumber: 'MT-550',
  }),
  createTrip('sheger-1', 'sheger', {
    rating: 4.1,
    reviews: 40,
    departureTime: '12:00 PM',
    arrivalTime: '08:00 PM',
    period: 'afternoon',
    seatsAvailable: 18,
    price: 1300,
    busNumber: 'SH-909',
  }),
  createTrip('selam-2', 'selam', {
    rating: 4.6,
    reviews: 124,
    departureTime: '08:30 AM',
    arrivalTime: '04:30 PM',
    period: 'morning',
    seatsAvailable: 16,
    price: 1200,
    busNumber: 'SB-014',
    tv: true,
  }),
  createTrip('selam-3', 'selam', {
    rating: 4.7,
    reviews: 124,
    departureTime: '01:00 PM',
    arrivalTime: '09:00 PM',
    period: 'afternoon',
    seatsAvailable: 24,
    price: 1250,
    busNumber: 'SB-022',
    tv: true,
  }),
  createTrip('selam-4', 'selam', {
    rating: 4.5,
    reviews: 124,
    departureTime: '06:30 PM',
    arrivalTime: '02:30 AM',
    period: 'evening',
    seatsAvailable: 30,
    price: 1350,
    busNumber: 'SB-030',
    tv: true,
  }),
  createTrip('selam-5', 'selam', {
    rating: 4.6,
    reviews: 124,
    departureTime: '09:15 AM',
    arrivalTime: '05:15 PM',
    period: 'morning',
    seatsAvailable: 12,
    price: 1180,
    busNumber: 'SB-041',
    tv: true,
  }),
  createTrip('abay-2', 'abay', {
    rating: 4.4,
    reviews: 86,
    departureTime: '02:00 PM',
    arrivalTime: '10:00 PM',
    period: 'afternoon',
    seatsAvailable: 27,
    price: 1120,
    busNumber: 'AA-218',
  }),
  createTrip('abay-3', 'abay', {
    rating: 4.3,
    reviews: 86,
    departureTime: '07:00 PM',
    arrivalTime: '03:00 AM',
    period: 'evening',
    seatsAvailable: 33,
    price: 1180,
    busNumber: 'AA-230',
  }),
  createTrip('gebeya-2', 'gebeya', {
    rating: 4.5,
    reviews: 64,
    departureTime: '07:45 PM',
    arrivalTime: '03:45 AM',
    period: 'evening',
    seatsAvailable: 19,
    price: 1280,
    busNumber: 'GB-119',
    tv: true,
  }),
];

export const getTripById = (id) => DUMMY_TRIPS.find((trip) => trip.id === id);

export const formatEtb = (amount) => `${Number(amount).toLocaleString('en-US')} ETB`;

export const formatPrettyDate = (iso) => {
  if (!iso) return '';
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export const getTripAmenities = (trip) => {
  const amenities = [];
  if (trip.ac) amenities.push({ id: 'ac', label: 'AC' });
  if (trip.wifi) amenities.push({ id: 'wifi', label: 'WiFi' });
  if (trip.comfortableSeats) amenities.push({ id: 'seats', label: 'Reclining Seats' });
  if (trip.tv) amenities.push({ id: 'tv', label: 'TV' });
  return amenities;
};
