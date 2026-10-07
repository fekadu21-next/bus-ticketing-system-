import { DriverTrip, AuthUser } from '@/services/api';

export const MOCK_DRIVER_USER: AuthUser = {
  id: 'mock-driver-uuid-001',
  firstName: 'Abebe',
  lastName: 'Kebede',
  email: 'driver@example.com',
  phone: '+251 911 234 567',
  roles: ['DRIVER'],
  isEmailVerified: true,
};

export const INITIAL_MOCK_TRIPS: DriverTrip[] = [
  {
    id: 'trip-001',
    origin: 'Addis Ababa',
    destination: 'Bahir Dar',
    route: 'Addis Ababa → Bahir Dar',
    distanceKm: 565,
    estimatedDurationHours: 8.5,
    departureTime: new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString(), // 2 hours from now
    arrivalTime: new Date(Date.now() + 1000 * 60 * 60 * 10).toISOString(),
    status: 'PUBLISHED',
    fare: 1000,
    bus: {
      id: 'bus-001',
      plateNumber: 'ET-1234',
      model: 'Toyota Coaster Deluxe',
      capacity: 49,
    },
    totalSeats: 49,
    bookedSeats: 45,
    availableSeats: 4,
    seatsCount: 49,
    bookingsCount: 45,
  },
  {
    id: 'trip-002',
    origin: 'Bahir Dar',
    destination: 'Addis Ababa',
    route: 'Bahir Dar → Addis Ababa',
    distanceKm: 565,
    estimatedDurationHours: 8.5,
    departureTime: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(), // Tomorrow
    arrivalTime: new Date(Date.now() + 1000 * 60 * 60 * 32).toISOString(),
    status: 'PUBLISHED',
    fare: 1000,
    bus: {
      id: 'bus-001',
      plateNumber: 'ET-1234',
      model: 'Toyota Coaster Deluxe',
      capacity: 49,
    },
    totalSeats: 49,
    bookedSeats: 38,
    availableSeats: 11,
    seatsCount: 49,
    bookingsCount: 38,
  },
  {
    id: 'trip-003',
    origin: 'Addis Ababa',
    destination: 'Hawassa',
    route: 'Addis Ababa → Hawassa',
    distanceKm: 275,
    estimatedDurationHours: 4.5,
    departureTime: new Date(Date.now() - 1000 * 60 * 60 * 28).toISOString(), // Yesterday
    arrivalTime: new Date(Date.now() - 1000 * 60 * 60 * 23).toISOString(),
    status: 'COMPLETED',
    fare: 650,
    bus: {
      id: 'bus-002',
      plateNumber: 'ET-5678',
      model: 'Yutong Coach Master',
      capacity: 52,
    },
    totalSeats: 52,
    bookedSeats: 52,
    availableSeats: 0,
    seatsCount: 52,
    bookingsCount: 52,
  },
  {
    id: 'trip-004',
    origin: 'Addis Ababa',
    destination: 'Gondar',
    route: 'Addis Ababa → Gondar',
    distanceKm: 738,
    estimatedDurationHours: 11.0,
    departureTime: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString(),
    status: 'PUBLISHED',
    fare: 1400,
    bus: {
      id: 'bus-003',
      plateNumber: 'ET-9012',
      model: 'Scania Touring HD',
      capacity: 55,
    },
    totalSeats: 55,
    bookedSeats: 40,
    availableSeats: 15,
    seatsCount: 55,
    bookingsCount: 40,
  },
];

// In-memory mock store that supports real-time state changes during session
let mockTripsStore = [...INITIAL_MOCK_TRIPS];

export const getMockTrips = (status?: string): DriverTrip[] => {
  if (!status || status === 'ALL') {
    return [...mockTripsStore];
  }
  return mockTripsStore.filter((t) => t.status === status);
};

export const getMockTripById = (id: string): DriverTrip | undefined => {
  return mockTripsStore.find((t) => t.id === id);
};

export const startMockTrip = (id: string): DriverTrip => {
  const index = mockTripsStore.findIndex((t) => t.id === id);
  if (index !== -1) {
    mockTripsStore[index] = {
      ...mockTripsStore[index],
      status: 'IN_PROGRESS',
    };
    return mockTripsStore[index];
  }
  throw new Error('Trip not found');
};

export const completeMockTrip = (id: string): DriverTrip => {
  const index = mockTripsStore.findIndex((t) => t.id === id);
  if (index !== -1) {
    mockTripsStore[index] = {
      ...mockTripsStore[index],
      status: 'COMPLETED',
      arrivalTime: new Date().toISOString(),
    };
    return mockTripsStore[index];
  }
  throw new Error('Trip not found');
};

export const resetMockTrips = () => {
  mockTripsStore = [...INITIAL_MOCK_TRIPS];
};
