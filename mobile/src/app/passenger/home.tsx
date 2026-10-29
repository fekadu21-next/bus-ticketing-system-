import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ImageBackground,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/context/AuthContext';
import PassengerTabBar from '@/components/PassengerTabBar';
import { POPULAR_CITIES } from '@/constants/cities';
import { apiService } from '@/services/api';
import type { PassengerTrip } from '@/types';

// ── Design Tokens (mirrors web frontend) ─────────────────────────────────────
const ROSE = '#f43f5e';
const ROSE_DARK = '#e11d48';
const ROSE_LIGHT = '#fff1f2';
const ROSE_BORDER = '#fecdd3';
const BLUE = '#2563eb';
const BLUE_DARK = '#1d4ed8';
const BLUE_LIGHT = '#eff6ff';
const BLUE_BORDER = '#bfdbfe';
const SLATE_900 = '#0f172a';
const SLATE_800 = '#1e293b';
const SLATE_700 = '#334155';
const SLATE_600 = '#475569';
const SLATE_500 = '#64748b';
const SLATE_400 = '#94a3b8';
const SLATE_200 = '#e2e8f0';
const SLATE_100 = '#f1f5f9';
const SLATE_50 = '#f8fafc';
const WHITE = '#ffffff';
const AMBER = '#f59e0b';
const EMERALD = '#10b981';

type PeriodOption = 'all' | 'morning' | 'afternoon' | 'evening';

const PERIOD_CONFIG: { id: PeriodOption; label: string; timeRange: string; icon: string }[] = [
  { id: 'all', label: 'All Times', timeRange: '24 Hours', icon: '⏱️' },
  { id: 'morning', label: 'Morning', timeRange: '6:00 AM – 11:59 AM', icon: '🌅' },
  { id: 'afternoon', label: 'Afternoon', timeRange: '12:00 PM – 4:59 PM', icon: '☀️' },
  { id: 'evening', label: 'Evening', timeRange: '5:00 PM – 11:59 PM', icon: '🌙' },
];

const FEATURES = [
  { icon: '🛡️', title: 'Safe & Reliable', desc: 'Trusted operators and secure payments.' },
  { icon: '⚡', title: 'Real-Time Seats', desc: 'See live seat availability instantly.' },
  { icon: '📱', title: 'Instant QR Tickets', desc: 'E-ticket with QR code for easy boarding.' },
  { icon: '🎧', title: '24/7 Support', desc: "We're here to help anytime." },
];

const POPULAR_ROUTES = [
  {
    from: 'Addis Ababa',
    to: 'Bahir Dar',
    distance: '565 km',
    duration: '8h 30m',
    fare: '1,200 ETB',
    popularBus: 'Selam Bus',
    badge: 'Lake Tana',
    icon: '🌊',
  },
  {
    from: 'Addis Ababa',
    to: 'Hawassa',
    distance: '275 km',
    duration: '4h 15m',
    fare: '850 ETB',
    popularBus: 'Abay Bus',
    badge: 'Rift Valley Lake',
    icon: '🌴',
  },
  {
    from: 'Addis Ababa',
    to: 'Gondar',
    distance: '738 km',
    duration: '11h 45m',
    fare: '1,450 ETB',
    popularBus: 'Golden Bus',
    badge: 'Castles',
    icon: '🏰',
  },
  {
    from: 'Addis Ababa',
    to: 'Dire Dawa',
    distance: '450 km',
    duration: '8h 45m',
    fare: '1,300 ETB',
    popularBus: 'Ethio Bus',
    badge: 'Trade Hub',
    icon: '🚂',
  },
  {
    from: 'Addis Ababa',
    to: 'Jimma',
    distance: '346 km',
    duration: '6h 30m',
    fare: '950 ETB',
    popularBus: 'Sky Bus',
    badge: 'Coffee Capital',
    icon: '☕',
  },
  {
    from: 'Addis Ababa',
    to: 'Adama',
    distance: '99 km',
    duration: '1h 30m',
    fare: '350 ETB',
    popularBus: 'Oda Bus',
    badge: 'Expressway',
    icon: '🛣️',
  },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Search Route',
    desc: 'Select departure city, destination and travel date.',
    icon: '🔍',
  },
  {
    step: '02',
    title: 'Choose Bus & Seat',
    desc: 'Compare operators, check amenities and pick your preferred seat on the coach map.',
    icon: '💺',
  },
  {
    step: '03',
    title: 'Pay & Board with QR',
    desc: 'Pay with Telebirr or CBE Birr and get your verified instant digital ticket.',
    icon: '📱',
  },
];

const TESTIMONIALS = [
  {
    id: 1,
    name: 'Abebe Kebede',
    role: 'Passenger',
    avatar: '👨🏽',
    text: '"The booking process is so easy and fast. I love the digital ticket and QR verification!"',
  },
  {
    id: 2,
    name: 'Selam Bus',
    role: 'Operator Partner',
    avatar: '🚌',
    text: '"This platform helps us manage our trips and reach more passengers efficiently."',
  },
  {
    id: 3,
    name: 'Mulu Alemu',
    role: 'Passenger',
    avatar: '👩🏽',
    text: '"Excellent service, reliable and safe. I always book my trips here."',
  },
];

const FAQS = [
  {
    question: 'How do I book a bus ticket?',
    answer: 'Select your origin, destination, and date, then choose a trip, pick a seat on the bus layout, and complete payment.',
  },
  {
    question: 'What payment methods are available?',
    answer: 'We support Telebirr, CBE Birr, cards, Chapa, and other Ethiopian digital payment systems.',
  },
  {
    question: 'Can I change or cancel my booking?',
    answer: 'Yes. You can cancel or change your booking from My Tickets up to 6 hours before scheduled departure.',
  },
  {
    question: 'How do I get my e-ticket?',
    answer: 'Your e-ticket with a secure QR verification code is saved immediately in your app and sent via SMS.',
  },
  {
    question: 'Is the platform safe and secure?',
    answer: 'Yes. All operators are accredited and licensed, and transactions use secure payment encryption.',
  },
];

const PAYMENT_PARTNERS = [
  { name: 'Telebirr', badge: 'Ethio Telecom', color: '#0072ce', icon: '📱' },
  { name: 'CBE Birr', badge: 'Commercial Bank of Ethiopia', color: '#682c8c', icon: '🏦' },
  { name: 'Chapa', badge: 'Online Gateway', color: '#16a34a', icon: '⚡' },
  { name: 'Awash Birr', badge: 'Awash Bank', color: '#d97706', icon: '💳' },
];

interface CompanyItem {
  id: string;
  name: string;
  type: string;
  rating: string;
  fleet: string;
  logo: string;
  badge: string;
  tripCount?: number;
}

function getInitials(name: string): string {
  const words = name.split(' ').filter(Boolean);
  if (words.length === 0) return 'OP';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function formatPrettyDate(iso?: string) {
  if (!iso) return 'Upcoming';
  const d = new Date(iso.includes('T') ? iso : `${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function minutesFromLabel(label?: string): number {
  if (!label) return 0;
  const match = String(label).match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return 0;
  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const period = match[3].toUpperCase();
  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

export default function PassengerHomeScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [origin, setOrigin] = useState('Addis Ababa');
  const [destination, setDestination] = useState('All Destinations');
  const [dateOption, setDateOption] = useState<'today' | 'tomorrow' | 'weekend' | 'all'>('today');
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodOption>('all');
  const [selectedCompany, setSelectedCompany] = useState<string>('All Operators');

  const [trips, setTrips] = useState<PassengerTrip[]>([]);
  const [backendCompanies, setBackendCompanies] = useState<CompanyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [showCityModal, setShowCityModal] = useState(false);
  const [selectingField, setSelectingField] = useState<'origin' | 'destination'>('origin');
  const [citySearchText, setCitySearchText] = useState('');
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const passengerName = user?.firstName || 'Traveler';

  const handleSelectRoute = (fromCity: string, toCity: string) => {
    setOrigin(fromCity);
    setDestination(toCity);
    router.push({
      pathname: '/passenger/trips',
      params: { origin: fromCity, destination: toCity, date: dateOption },
    });
  };

  const fetchBackendData = useCallback(async () => {
    try {
      const [tripsRes, compRes] = await Promise.all([
        apiService.searchPassengerTrips({
          origin: origin === 'All Cities' ? undefined : origin,
          destination: destination === 'All Destinations' ? undefined : destination,
          date: dateOption === 'all' ? undefined : dateOption,
          limit: 100,
        }),
        apiService.getCompanies(),
      ]);

      if (tripsRes.success && tripsRes.data?.trips) {
        setTrips(tripsRes.data.trips);
      }

      if (compRes.success && compRes.data?.companies) {
        const rawCompanies = compRes.data.companies;
        const mapped: CompanyItem[] = [
          {
            id: 'all',
            name: 'All Operators',
            type: 'All Verified Fleets',
            rating: '4.8 ★',
            fleet: '100+ Buses',
            logo: '🌐',
            badge: 'ALL',
            tripCount: tripsRes.data?.trips?.length || 0,
          },
          ...rawCompanies.map((c) => ({
            id: c.id,
            name: c.name,
            type: c.type || 'Private Bus Company',
            rating: '4.7 ★',
            fleet: '30+ Fleet',
            logo: '🚌',
            badge: getInitials(c.name),
            tripCount: c.tripCount,
          })),
        ];
        setBackendCompanies(mapped);
      }
    } catch {
      // Handled gracefully
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [origin, destination, dateOption]);

  useEffect(() => {
    setLoading(true);
    fetchBackendData();
  }, [fetchBackendData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBackendData();
  };

  const handleSwapCities = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  const openCityPicker = (field: 'origin' | 'destination') => {
    setSelectingField(field);
    setCitySearchText('');
    setShowCityModal(true);
  };

  const handleSelectCity = (city: string) => {
    if (selectingField === 'origin') setOrigin(city);
    else setDestination(city);
    setShowCityModal(false);
  };

  const filteredTrips = useMemo(() => {
    return trips
      .filter((t) => {
        if (selectedPeriod !== 'all' && t.period && t.period !== selectedPeriod) return false;
        if (selectedCompany !== 'All Operators') {
          const cleanA = (t.operatorName || '').toLowerCase().replace(/[^a-z0-9]/g, '');
          const cleanB = selectedCompany.toLowerCase().replace(/[^a-z0-9]/g, '');
          if (!cleanA.includes(cleanB) && !cleanB.includes(cleanA)) return false;
        }
        return true;
      })
      .sort((a, b) => minutesFromLabel(a.departureTime) - minutesFromLabel(b.departureTime));
  }, [trips, selectedPeriod, selectedCompany]);

  const filteredCities = useMemo(() => {
    if (!citySearchText.trim()) return POPULAR_CITIES;
    return POPULAR_CITIES.filter((c) => c.toLowerCase().includes(citySearchText.toLowerCase()));
  }, [citySearchText]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ── NAVBAR (matches web) ── */}
      <View style={styles.navbar}>
        <View style={styles.navLeft}>
          <View style={styles.navBrand}>
            <View style={styles.navLogoBox}>
              <Text style={styles.navLogoIcon}>🚌</Text>
            </View>
            <Text style={styles.navBrandText}>
              Bus<Text style={styles.navBrandAccent}>Ticket</Text>
            </Text>
          </View>
        </View>
        <View style={styles.navRight}>
          <TouchableOpacity
            style={styles.navMyTicketsBtn}
            onPress={() => router.push('/passenger/bookings')}
            activeOpacity={0.8}
          >
            <Text style={styles.navMyTicketsText}>🎫 My Tickets</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navAvatar}
            onPress={() => router.push('/passenger/profile')}
            activeOpacity={0.8}
          >
            <Text style={styles.navAvatarText}>{passengerName.charAt(0).toUpperCase()}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[ROSE]} tintColor={ROSE} />
        }
      >
        {/* ── HERO SECTION (matches web ImageCarousel hero) ── */}
        <Animated.View entering={FadeIn.duration(500)}>
          <LinearGradient
            colors={['#0f172a', '#1e1040', '#0f172a']}
            style={styles.heroSection}
          >
            {/* Animated ping badge */}
            <View style={styles.heroPill}>
              <View style={styles.heroPillDot} />
              <Text style={styles.heroPillText}>Fast & Verified Intercity Bus Booking</Text>
            </View>

            <Text style={styles.heroHeadline}>
              Book Bus Tickets{' '}
              <Text style={styles.heroHeadlineAccent}>Easily & Securely</Text>
            </Text>

            <Text style={styles.heroSubtitle}>
              Travel across Ethiopia with premier licensed operators. Instant e-tickets with live QR verification.
            </Text>

            {/* Badge row matching web */}
            <View style={styles.heroBadgeRow}>
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>🛡️ Licensed Operators</Text>
              </View>
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>⚡ Instant QR E-Tickets</Text>
              </View>
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>🎫 Real-time Seat Choice</Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* ── SEARCH CARD (floating over hero, matches web TripSearchBar) ── */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.searchCard}>
          {/* Card header */}
          <View style={styles.searchCardHeader}>
            <View>
              <Text style={styles.searchCardTitle}>Find Your Bus Journey</Text>
              <Text style={styles.searchCardSub}>Book online with real-time seat reservation</Text>
            </View>
            <TouchableOpacity
              style={styles.allFiltersBtn}
              onPress={() => router.push({ pathname: '/passenger/trips', params: { origin, destination, date: dateOption } })}
            >
              <Text style={styles.allFiltersBtnText}>⚡ All Filters</Text>
            </TouchableOpacity>
          </View>

          {/* Route box */}
          <View style={styles.routeBox}>
            <TouchableOpacity style={styles.locationInput} onPress={() => openCityPicker('origin')} activeOpacity={0.7}>
              <Text style={styles.locationLabel}>FROM (DEPARTURE)</Text>
              <View style={styles.locationRow}>
                <Text style={styles.locationPin}>📍</Text>
                <Text style={styles.locationCity} numberOfLines={1}>{origin}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.swapBtn} onPress={handleSwapCities} activeOpacity={0.7}>
              <Text style={styles.swapIcon}>⇅</Text>
            </TouchableOpacity>

            <View style={styles.routeDivider} />

            <TouchableOpacity style={styles.locationInput} onPress={() => openCityPicker('destination')} activeOpacity={0.7}>
              <Text style={styles.locationLabel}>TO (DESTINATION)</Text>
              <View style={styles.locationRow}>
                <Text style={styles.locationPin}>🏁</Text>
                <Text style={styles.locationCity} numberOfLines={1}>{destination}</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Date tabs */}
          <Text style={styles.dateSectionLabel}>WHEN ARE YOU TRAVELING?</Text>
          <View style={styles.dateRow}>
            {([
              { id: 'today', label: 'Today' },
              { id: 'tomorrow', label: 'Tomorrow' },
              { id: 'weekend', label: 'Weekend' },
              { id: 'all', label: 'All Dates' },
            ] as const).map((d) => (
              <TouchableOpacity
                key={d.id}
                style={[styles.dateTab, dateOption === d.id && styles.activeDateTab]}
                onPress={() => setDateOption(d.id)}
              >
                <Text style={[styles.dateTabText, dateOption === d.id && styles.activeDateTabText]}>{d.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Submit Search CTA Button (matching web TripSearchBar) */}
          <TouchableOpacity
            style={styles.searchSubmitBtn}
            onPress={() => router.push({ pathname: '/passenger/trips', params: { origin, destination, date: dateOption } })}
            activeOpacity={0.85}
          >
            <Text style={styles.searchSubmitBtnText}>🔍  Search Bus Trips</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* ── POPULAR OPERATORS (matches web "Popular Operators" section) ── */}
        <Animated.View entering={FadeInDown.delay(150).duration(400)} style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <View>
              <View style={styles.sectionLabelRow}>
                <View style={styles.sectionLabelDot} />
                <Text style={styles.sectionLabelText}>ACCREDITED FLEETS</Text>
              </View>
              <Text style={styles.sectionTitle}>Popular Operators</Text>
              <Text style={styles.sectionSub}>Top rated companies with verified licenses.</Text>
            </View>
            <TouchableOpacity
              style={styles.viewAllBtn}
              onPress={() => router.push('/passenger/trips')}
            >
              <Text style={styles.viewAllBtnText}>View All →</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.operatorsScrollRow}>
            {backendCompanies.length === 0 && loading
              ? Array.from({ length: 3 }).map((_, i) => (
                <View key={i} style={styles.operatorCardSkeleton}>
                  <View style={styles.skeletonImg} />
                  <View style={styles.skeletonLine} />
                  <View style={styles.skeletonLineShort} />
                </View>
              ))
              : backendCompanies.map((company) => {
                const isSelected = selectedCompany === company.name;
                return (
                  <TouchableOpacity
                    key={company.id}
                    style={[styles.operatorCard, isSelected && styles.operatorCardActive]}
                    onPress={() => setSelectedCompany(company.name)}
                    activeOpacity={0.85}
                  >
                    {/* Image area (logo circle) */}
                    <View style={styles.operatorImgArea}>
                      <LinearGradient
                        colors={isSelected ? [ROSE, ROSE_DARK] : ['#334155', '#1e293b']}
                        style={styles.operatorLogoGradient}
                      >
                        <Text style={styles.operatorBadgeLetter}>{company.badge}</Text>
                      </LinearGradient>
                      {/* Verified badge */}
                      <View style={styles.verifiedBadge}>
                        <Text style={styles.verifiedBadgeText}>✓ Verified</Text>
                      </View>
                    </View>

                    {/* Details */}
                    <View style={styles.operatorDetails}>
                      <Text style={[styles.operatorName, isSelected && styles.operatorNameActive]} numberOfLines={1}>
                        {company.name}
                      </Text>
                      <Text style={styles.operatorType} numberOfLines={1}>{company.type}</Text>

                      {/* Rating */}
                      <View style={styles.operatorRatingRow}>
                        <Text style={styles.starIcon}>★</Text>
                        <Text style={styles.operatorRatingText}>4.7</Text>
                        <Text style={styles.operatorReviewsText}>(94 reviews)</Text>
                      </View>

                      {/* Route info */}
                      <View style={styles.operatorRouteBox}>
                        <Text style={styles.operatorRouteText} numberOfLines={1}>
                          {company.tripCount !== undefined ? `${company.tripCount} Scheduled Trips` : company.fleet}
                        </Text>
                      </View>

                      {/* CTA */}
                      <TouchableOpacity
                        style={[styles.operatorCTA, isSelected && styles.operatorCTAActive]}
                        onPress={() => {
                          setSelectedCompany(company.name);
                          router.push('/passenger/trips');
                        }}
                      >
                        <Text style={[styles.operatorCTAText, isSelected && styles.operatorCTATextActive]}>
                          View Trips →
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                );
              })}
          </ScrollView>
        </Animated.View>

        {/* ── POPULAR TRAVEL ROUTES (matches web Popular Routes) ── */}
        <Animated.View entering={FadeInDown.delay(180).duration(400)} style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <View>
              <View style={styles.sectionLabelRow}>
                <View style={styles.sectionLabelDot} />
                <Text style={styles.sectionLabelText}>TOP CORRIDORS</Text>
              </View>
              <Text style={styles.sectionTitle}>Popular Routes</Text>
              <Text style={styles.sectionSub}>Frequently traveled intercity routes in Ethiopia.</Text>
            </View>
            <TouchableOpacity
              style={styles.viewAllBtn}
              onPress={() => router.push('/passenger/trips')}
            >
              <Text style={styles.viewAllBtnText}>All Routes →</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.routesScrollRow}>
            {POPULAR_ROUTES.map((route, rIdx) => (
              <TouchableOpacity
                key={rIdx}
                style={styles.routeCard}
                onPress={() => handleSelectRoute(route.from, route.to)}
                activeOpacity={0.85}
              >
                <View style={styles.routeCardTop}>
                  <Text style={styles.routeIcon}>{route.icon}</Text>
                  <View style={styles.routeBadge}>
                    <Text style={styles.routeBadgeText}>{route.badge}</Text>
                  </View>
                </View>

                <View style={styles.routePathRow}>
                  <Text style={styles.routeFromText}>{route.from}</Text>
                  <Text style={styles.routeArrowText}>➔</Text>
                  <Text style={styles.routeToText}>{route.to}</Text>
                </View>

                <Text style={styles.routeMetaText}>
                  {route.duration} • {route.distance}
                </Text>

                <View style={styles.routeCardDivider} />

                <View style={styles.routeCardBottom}>
                  <View>
                    <Text style={styles.routeFareLabel}>From</Text>
                    <Text style={styles.routeFareText}>{route.fare}</Text>
                  </View>
                  <View style={styles.bookRouteBtn}>
                    <Text style={styles.bookRouteBtnText}>Book →</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>

        {/* ── TIME FILTER (departure time) ── */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.sectionContainer}>
          <View style={styles.sectionLabelRow}>
            <View style={styles.sectionLabelDot} />
            <Text style={styles.sectionLabelText}>DEPARTURE TIME</Text>
          </View>
          <Text style={styles.sectionTitle}>Filter by Time of Day</Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timeScrollRow}>
            {PERIOD_CONFIG.map((p) => {
              const isSelected = selectedPeriod === p.id;
              return (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.timeCard, isSelected && styles.timeCardActive]}
                  onPress={() => setSelectedPeriod(p.id)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.timeCardIcon}>{p.icon}</Text>
                  <Text style={[styles.timeCardLabel, isSelected && styles.timeCardLabelActive]}>{p.label}</Text>
                  <Text style={[styles.timeCardDesc, isSelected && styles.timeCardDescActive]}>{p.timeRange}</Text>
                  {isSelected && (
                    <View style={styles.timeCheckmark}>
                      <Text style={styles.timeCheckmarkText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Animated.View>

        {/* ── AVAILABLE TRIPS (matches web trip list cards) ── */}
        <Animated.View entering={FadeInDown.delay(250).duration(400)} style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <View>
              <View style={styles.sectionLabelRow}>
                <View style={styles.sectionLabelDot} />
                <Text style={styles.sectionLabelText}>LIVE RESULTS</Text>
              </View>
              <Text style={styles.sectionTitle}>Available Trips ({filteredTrips.length})</Text>
              <Text style={styles.sectionSub}>Select a trip to pick your seat & confirm ticket</Text>
            </View>
            <TouchableOpacity
              style={styles.viewAllBtn}
              onPress={() => router.push({ pathname: '/passenger/trips', params: { origin, destination, date: dateOption } })}
            >
              <Text style={styles.viewAllBtnText}>Search →</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.spinnerBox}>
              <ActivityIndicator size="large" color={ROSE} />
              <Text style={styles.spinnerText}>Searching available buses...</Text>
            </View>
          ) : filteredTrips.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>🚌</Text>
              <Text style={styles.emptyTitle}>No trips found</Text>
              <Text style={styles.emptyDesc}>
                Try selecting "All Operators" or changing your filters.
              </Text>
              <TouchableOpacity
                style={styles.resetBtn}
                onPress={() => {
                  setSelectedPeriod('all');
                  setSelectedCompany('All Operators');
                  setDestination('All Destinations');
                }}
              >
                <Text style={styles.resetBtnText}>Show All Buses</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.tripList}>
              {filteredTrips.map((item, index) => (
                <Animated.View key={item.id} entering={FadeInDown.delay(index * 60).duration(300)}>
                  <TouchableOpacity
                    style={styles.tripCard}
                    onPress={() => router.push({ pathname: '/passenger/trip/[id]', params: { id: item.id } })}
                    activeOpacity={0.9}
                  >
                    {/* Best Price Badge */}
                    {item.badge && (
                      <View style={styles.bestPriceBadge}>
                        <Text style={styles.bestPriceText}>⭐ {item.badge}</Text>
                      </View>
                    )}

                    {/* Operator row */}
                    <View style={styles.tripCardHeader}>
                      <View style={styles.operatorRow}>
                        <View style={[styles.avatarCircle, { backgroundColor: item.logoBg || ROSE }]}>
                          <Text style={styles.avatarText}>{item.logoText || 'BT'}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.tripOperatorName} numberOfLines={1}>{item.operatorName}</Text>
                          <Text style={styles.tripOrgType}>{item.orgType || 'Private Bus Company'}</Text>
                        </View>
                      </View>
                      <View style={styles.ratingBadge}>
                        <Text style={styles.ratingStar}>★</Text>
                        <Text style={styles.ratingScore}>{item.rating || 4.7}</Text>
                        <Text style={styles.ratingCount}>({item.reviews || 94})</Text>
                      </View>
                    </View>

                    {/* Date tag */}
                    <View style={styles.dateTagRow}>
                      <View style={styles.dateTag}>
                        <Text style={styles.dateTagText}>📅 {formatPrettyDate(item.departureDate)}</Text>
                      </View>
                    </View>

                    {/* Schedule row */}
                    <View style={styles.scheduleRow}>
                      <View style={styles.timeBlock}>
                        <Text style={styles.timeText}>{item.departureTime}</Text>
                        <Text style={styles.cityText}>{item.origin}</Text>
                      </View>
                      <View style={styles.durationBlock}>
                        <Text style={styles.durationText}>{item.duration || '5h 30m'}</Text>
                        <View style={styles.arrowLine}>
                          <View style={styles.arrowDot} />
                          <View style={styles.arrowBar} />
                          <Text style={styles.arrowHead}>→</Text>
                        </View>
                        <Text style={styles.directText}>Direct Express</Text>
                      </View>
                      <View style={[styles.timeBlock, { alignItems: 'flex-end' }]}>
                        <Text style={styles.timeText}>{item.arrivalTime || '—'}</Text>
                        <Text style={styles.cityText}>{item.destination}</Text>
                      </View>
                    </View>

                    {/* Amenities */}
                    <View style={styles.amenitiesRow}>
                      {(item.amenities || ['AC', 'WiFi', 'Reclining Seats', 'TV']).map((am, i) => (
                        <View key={i} style={styles.amenityChip}>
                          <Text style={styles.amenityIcon}>
                            {am.includes('AC') ? '❄️' : am.includes('WiFi') ? '📶' : am.includes('Seat') ? '💺' : '📺'}
                          </Text>
                          <Text style={styles.amenityText}>{am}</Text>
                        </View>
                      ))}
                    </View>

                    <View style={styles.cardDivider} />

                    {/* Footer: price + CTA */}
                    <View style={styles.cardFooter}>
                      <View>
                        <View style={styles.priceRow}>
                          <Text style={styles.priceAmount}>{item.price} ETB</Text>
                          <Text style={styles.perPerson}>per person</Text>
                        </View>
                        <Text style={styles.seatsText}>{item.availableSeats} seats available</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.selectSeatBtn}
                        onPress={() => router.push({ pathname: '/passenger/trip/[id]', params: { id: item.id } })}
                      >
                        <Text style={styles.selectSeatBtnText}>💺 Select Seat →</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
          )}
        </Animated.View>

        {/* ── FEATURE HIGHLIGHTS (matches web feature grid) ── */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.featuresSection}>
          <View style={styles.sectionLabelRow}>
            <View style={styles.sectionLabelDot} />
            <Text style={styles.sectionLabelText}>WHY CHOOSE US</Text>
          </View>
          <Text style={styles.sectionTitle}>Why Book With BusTicket</Text>
          <View style={styles.featuresGrid}>
            {FEATURES.map((feat, idx) => (
              <View key={idx} style={styles.featureCard}>
                <View style={styles.featureIconBox}>
                  <Text style={styles.featureIcon}>{feat.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.featureTitle}>{feat.title}</Text>
                  <Text style={styles.featureDesc}>{feat.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* ── HOW IT WORKS (matches web 3-step guide) ── */}
        <Animated.View entering={FadeInDown.delay(320).duration(400)} style={styles.sectionContainer}>
          <View style={styles.sectionLabelRow}>
            <View style={styles.sectionLabelDot} />
            <Text style={styles.sectionLabelText}>SIMPLE & FAST</Text>
          </View>
          <Text style={styles.sectionTitle}>How It Works</Text>
          <Text style={styles.sectionSub}>Book and board your intercity bus in 3 easy steps.</Text>

          <View style={styles.howItWorksGrid}>
            {HOW_IT_WORKS.map((step) => (
              <View key={step.step} style={styles.howStepCard}>
                <View style={styles.stepHeader}>
                  <View style={styles.stepIconBox}>
                    <Text style={styles.stepIconText}>{step.icon}</Text>
                  </View>
                  <Text style={styles.stepNumberBadge}>{step.step}</Text>
                </View>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepDesc}>{step.desc}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* ── TESTIMONIALS (matches web customer reviews) ── */}
        <Animated.View entering={FadeInDown.delay(340).duration(400)} style={styles.sectionContainer}>
          <View style={styles.sectionLabelRow}>
            <View style={styles.sectionLabelDot} />
            <Text style={styles.sectionLabelText}>WHAT OUR RIDERS SAY</Text>
          </View>
          <Text style={styles.sectionTitle}>Trusted by Thousands</Text>
          <Text style={styles.sectionSub}>Real reviews from Ethiopian travelers & partners.</Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.testimonialsScroll}>
            {TESTIMONIALS.map((t) => (
              <View key={t.id} style={styles.testimonialCard}>
                <View style={styles.testimonialHeader}>
                  <View style={styles.testAvatar}>
                    <Text style={styles.testAvatarText}>{t.avatar}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.testName}>{t.name}</Text>
                    <Text style={styles.testRole}>{t.role}</Text>
                  </View>
                  <Text style={styles.testStars}>★★★★★</Text>
                </View>
                <Text style={styles.testQuote}>{t.text}</Text>
              </View>
            ))}
          </ScrollView>
        </Animated.View>

        {/* ── FAQS (matches web interactive accordion) ── */}
        <Animated.View entering={FadeInDown.delay(360).duration(400)} style={styles.sectionContainer}>
          <View style={styles.sectionLabelRow}>
            <View style={styles.sectionLabelDot} />
            <Text style={styles.sectionLabelText}>GOT QUESTIONS?</Text>
          </View>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          <Text style={styles.sectionSub}>Everything you need to know about booking with us.</Text>

          <View style={styles.faqList}>
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <View key={idx} style={[styles.faqCard, isOpen && styles.faqCardOpen]}>
                  <TouchableOpacity
                    style={styles.faqQuestionRow}
                    onPress={() => setOpenFaq(isOpen ? null : idx)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.faqQuestionText, isOpen && styles.faqQuestionTextOpen]}>
                      {faq.question}
                    </Text>
                    <Text style={[styles.faqToggleIcon, isOpen && styles.faqToggleIconOpen]}>
                      {isOpen ? '▲' : '▼'}
                    </Text>
                  </TouchableOpacity>
                  {isOpen && (
                    <View style={styles.faqAnswerBox}>
                      <Text style={styles.faqAnswerText}>{faq.answer}</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </Animated.View>

        {/* ── PAYMENT PARTNERS (matches web Ethiopian payment partners) ── */}
        <Animated.View entering={FadeInDown.delay(380).duration(400)} style={styles.paymentSection}>
          <View style={styles.sectionLabelRow}>
            <View style={styles.sectionLabelDot} />
            <Text style={styles.sectionLabelText}>OFFICIAL PARTNERS</Text>
          </View>
          <Text style={styles.sectionTitle}>Supported Payment Methods</Text>
          <Text style={styles.sectionSub}>Seamless checkout with verified Ethiopian payment gateways.</Text>

          <View style={styles.paymentBadgesRow}>
            {PAYMENT_PARTNERS.map((p, idx) => (
              <View key={idx} style={styles.paymentBadgeCard}>
                <Text style={styles.paymentBadgeIcon}>{p.icon}</Text>
                <Text style={styles.paymentBadgeName}>{p.name}</Text>
                <Text style={styles.paymentBadgeSub}>{p.badge}</Text>
              </View>
            ))}
          </View>

          <View style={styles.securityTrustBadge}>
            <Text style={styles.securityTrustIcon}>🔒</Text>
            <Text style={styles.securityTrustText}>
              256-bit SSL Encrypted • National Bank of Ethiopia Compliant
            </Text>
          </View>
        </Animated.View>

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* ── CITY MODAL ── */}
      <Modal visible={showCityModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Select {selectingField === 'origin' ? 'Departure City' : 'Destination'}
              </Text>
              <TouchableOpacity onPress={() => setShowCityModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalSearchBox}>
              <Text style={{ fontSize: 14, marginRight: 8 }}>🔍</Text>
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Search city..."
                value={citySearchText}
                onChangeText={setCitySearchText}
                placeholderTextColor={SLATE_400}
              />
            </View>

            <FlatList
              data={filteredCities}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.cityItem} onPress={() => handleSelectCity(item)}>
                  <Text style={styles.cityPin}>📍</Text>
                  <Text style={styles.cityName}>{item}</Text>
                  {(selectingField === 'origin' ? origin === item : destination === item) && (
                    <Text style={styles.cityCheckmark}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      <PassengerTabBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SLATE_50,
  },

  // ── Navbar ──
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: WHITE,
    borderBottomWidth: 1,
    borderBottomColor: SLATE_100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  navLeft: {
    flex: 1,
  },
  navBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navLogoBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: BLUE,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  navLogoIcon: {
    fontSize: 19,
  },
  navBrandText: {
    fontSize: 18,
    fontWeight: '900',
    color: SLATE_900,
    letterSpacing: -0.5,
  },
  navBrandAccent: {
    color: ROSE,
  },
  navBrandSubtitle: {
    fontSize: 10,
    fontWeight: '600',
    color: SLATE_500,
    marginTop: -2,
  },
  navRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  navMyTicketsBtn: {
    backgroundColor: ROSE_LIGHT,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: ROSE_BORDER,
  },
  navMyTicketsText: {
    fontSize: 12,
    fontWeight: '800',
    color: ROSE,
  },
  navAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: ROSE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navAvatarText: {
    color: WHITE,
    fontSize: 15,
    fontWeight: '900',
  },

  scrollContent: {
    paddingBottom: 16,
  },

  // ── Hero ──
  heroSection: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 60,
    gap: 12,
  },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 50,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    marginBottom: 4,
  },
  heroPillDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: ROSE,
  },
  heroPillText: {
    color: WHITE,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  heroHeadline: {
    fontSize: 26,
    fontWeight: '900',
    color: WHITE,
    lineHeight: 32,
    letterSpacing: -0.5,
  },
  heroHeadlineAccent: {
    color: '#fda4af', // rose-300
  },
  heroSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 20,
    fontWeight: '500',
  },
  heroBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  heroBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  heroBadgeText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 11,
    fontWeight: '600',
  },

  // ── Search Card (floats above hero) ──
  searchCard: {
    marginHorizontal: 16,
    marginTop: -36,
    backgroundColor: WHITE,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: SLATE_200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 0,
  },
  searchCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  searchCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: SLATE_900,
  },
  searchCardSub: {
    fontSize: 11,
    color: SLATE_500,
    marginTop: 2,
  },
  allFiltersBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: ROSE_LIGHT,
    borderWidth: 1,
    borderColor: ROSE_BORDER,
  },
  allFiltersBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: ROSE,
  },
  routeBox: {
    backgroundColor: SLATE_50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: SLATE_200,
    position: 'relative',
    overflow: 'hidden',
  },
  locationInput: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  locationLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: SLATE_500,
    letterSpacing: 0.5,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  locationPin: {
    fontSize: 16,
  },
  locationCity: {
    fontSize: 15,
    fontWeight: '800',
    color: SLATE_900,
    flex: 1,
  },
  swapBtn: {
    position: 'absolute',
    right: 14,
    top: '50%',
    marginTop: -16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: ROSE,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    elevation: 4,
    shadowColor: ROSE,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  swapIcon: {
    color: WHITE,
    fontSize: 16,
    fontWeight: '800',
  },
  routeDivider: {
    height: 1,
    backgroundColor: SLATE_200,
  },
  dateSectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: SLATE_600,
    marginTop: 14,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dateTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: SLATE_100,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: SLATE_200,
  },
  activeDateTab: {
    backgroundColor: ROSE,
    borderColor: ROSE,
  },
  dateTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: SLATE_600,
  },
  activeDateTabText: {
    color: WHITE,
  },
  searchSubmitBtn: {
    marginTop: 14,
    backgroundColor: BLUE,
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
  },
  searchSubmitBtnText: {
    color: WHITE,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2,
  },

  // ── Section layout ──
  sectionContainer: {
    marginTop: 20,
    paddingHorizontal: 16,
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  sectionLabelDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: ROSE,
  },
  sectionLabelText: {
    fontSize: 11,
    fontWeight: '800',
    color: ROSE,
    letterSpacing: 0.8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: SLATE_900,
    letterSpacing: -0.3,
  },
  sectionSub: {
    fontSize: 12,
    color: SLATE_500,
    marginTop: 2,
  },
  viewAllBtn: {
    paddingHorizontal: 2,
    paddingVertical: 4,
  },
  viewAllBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: ROSE,
  },

  // ── Operator Cards (matches web operator grid) ──
  operatorsScrollRow: {
    gap: 14,
    paddingBottom: 4,
    paddingTop: 2,
  },
  operatorCard: {
    width: 180,
    backgroundColor: WHITE,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: SLATE_200,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 4,
  },
  operatorCardActive: {
    borderColor: ROSE_BORDER,
    borderWidth: 1.5,
    shadowColor: ROSE,
    shadowOpacity: 0.12,
  },
  operatorImgArea: {
    height: 110,
    backgroundColor: SLATE_800,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  operatorLogoGradient: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
  },
  operatorBadgeLetter: {
    color: WHITE,
    fontSize: 18,
    fontWeight: '900',
  },
  verifiedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
  },
  verifiedBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: EMERALD,
  },
  operatorDetails: {
    padding: 12,
    gap: 4,
  },
  operatorName: {
    fontSize: 13,
    fontWeight: '800',
    color: SLATE_900,
  },
  operatorNameActive: {
    color: ROSE,
  },
  operatorType: {
    fontSize: 10,
    color: SLATE_500,
  },
  operatorRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  starIcon: {
    color: AMBER,
    fontSize: 13,
  },
  operatorRatingText: {
    fontSize: 12,
    fontWeight: '700',
    color: SLATE_900,
  },
  operatorReviewsText: {
    fontSize: 11,
    color: SLATE_400,
  },
  operatorRouteBox: {
    backgroundColor: SLATE_50,
    borderRadius: 8,
    padding: 7,
    borderWidth: 1,
    borderColor: SLATE_100,
    marginTop: 4,
  },
  operatorRouteText: {
    fontSize: 11,
    color: SLATE_700,
    fontWeight: '600',
  },
  operatorCTA: {
    marginTop: 8,
    backgroundColor: SLATE_100,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  operatorCTAActive: {
    backgroundColor: ROSE,
  },
  operatorCTAText: {
    fontSize: 12,
    fontWeight: '700',
    color: SLATE_800,
  },
  operatorCTATextActive: {
    color: WHITE,
  },
  // Skeleton
  operatorCardSkeleton: {
    width: 180,
    backgroundColor: WHITE,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: SLATE_200,
  },
  skeletonImg: {
    height: 110,
    backgroundColor: SLATE_100,
  },
  skeletonLine: {
    height: 14,
    backgroundColor: SLATE_100,
    margin: 12,
    borderRadius: 7,
  },
  skeletonLineShort: {
    height: 10,
    backgroundColor: SLATE_100,
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 5,
    width: '60%',
  },

  // ── Time Cards ──
  timeScrollRow: {
    gap: 12,
    paddingBottom: 4,
  },
  timeCard: {
    width: 140,
    backgroundColor: WHITE,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: SLATE_200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  timeCardActive: {
    borderColor: ROSE,
    backgroundColor: ROSE_LIGHT,
  },
  timeCardIcon: {
    fontSize: 22,
    marginBottom: 6,
  },
  timeCardLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: SLATE_900,
  },
  timeCardLabelActive: {
    color: ROSE,
  },
  timeCardDesc: {
    fontSize: 10,
    color: SLATE_500,
    marginTop: 2,
  },
  timeCardDescActive: {
    color: ROSE,
    fontWeight: '600',
  },
  timeCheckmark: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: ROSE,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeCheckmarkText: {
    color: WHITE,
    fontSize: 11,
    fontWeight: '900',
  },

  // ── Trip Cards ──
  spinnerBox: {
    padding: 32,
    alignItems: 'center',
  },
  spinnerText: {
    fontSize: 12,
    color: SLATE_500,
    marginTop: 10,
  },
  emptyCard: {
    backgroundColor: WHITE,
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: SLATE_200,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: SLATE_900,
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 13,
    color: SLATE_500,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  resetBtn: {
    backgroundColor: ROSE,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  resetBtnText: {
    color: WHITE,
    fontSize: 13,
    fontWeight: '800',
  },
  tripList: {
    gap: 14,
  },
  tripCard: {
    position: 'relative',
    backgroundColor: WHITE,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: SLATE_200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  bestPriceBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    backgroundColor: EMERALD,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    zIndex: 2,
  },
  bestPriceText: {
    color: WHITE,
    fontSize: 10,
    fontWeight: '800',
  },
  tripCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingRight: 60,
  },
  operatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: WHITE,
    fontWeight: '900',
    fontSize: 13,
  },
  tripOperatorName: {
    fontSize: 15,
    fontWeight: '800',
    color: SLATE_900,
  },
  tripOrgType: {
    fontSize: 11,
    color: SLATE_500,
    marginTop: 1,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingStar: {
    color: AMBER,
    fontSize: 13,
  },
  ratingScore: {
    fontSize: 12,
    fontWeight: '700',
    color: SLATE_900,
  },
  ratingCount: {
    fontSize: 11,
    color: SLATE_400,
  },
  dateTagRow: {
    marginBottom: 10,
  },
  dateTag: {
    alignSelf: 'flex-start',
    backgroundColor: ROSE_LIGHT,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: ROSE_BORDER,
  },
  dateTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: ROSE,
  },
  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: SLATE_100,
    marginBottom: 10,
  },
  timeBlock: {
    flex: 1,
  },
  timeText: {
    fontSize: 17,
    fontWeight: '900',
    color: SLATE_900,
  },
  cityText: {
    fontSize: 12,
    color: SLATE_600,
    fontWeight: '600',
    marginTop: 2,
  },
  durationBlock: {
    flex: 1.2,
    alignItems: 'center',
  },
  durationText: {
    fontSize: 11,
    fontWeight: '700',
    color: SLATE_500,
    marginBottom: 4,
  },
  arrowLine: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '80%',
  },
  arrowDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: ROSE,
  },
  arrowBar: {
    flex: 1,
    height: 1.5,
    backgroundColor: SLATE_200,
  },
  arrowHead: {
    fontSize: 12,
    color: ROSE,
    fontWeight: '800',
    marginLeft: 2,
  },
  directText: {
    fontSize: 9,
    color: EMERALD,
    fontWeight: '700',
    marginTop: 3,
  },
  amenitiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  amenityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: SLATE_50,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: SLATE_200,
  },
  amenityIcon: {
    fontSize: 11,
  },
  amenityText: {
    fontSize: 10,
    color: SLATE_600,
    fontWeight: '600',
  },
  cardDivider: {
    height: 1,
    backgroundColor: SLATE_100,
    marginBottom: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  priceAmount: {
    fontSize: 18,
    fontWeight: '900',
    color: ROSE,
  },
  perPerson: {
    fontSize: 11,
    color: SLATE_500,
  },
  seatsText: {
    fontSize: 11,
    fontWeight: '700',
    color: EMERALD,
    marginTop: 2,
  },
  selectSeatBtn: {
    backgroundColor: ROSE,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    shadowColor: ROSE,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  selectSeatBtnText: {
    color: WHITE,
    fontSize: 12,
    fontWeight: '800',
  },

  // ── Features Section ──
  featuresSection: {
    marginTop: 20,
    marginHorizontal: 16,
    backgroundColor: WHITE,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: SLATE_200,
    gap: 12,
  },
  featuresGrid: {
    gap: 10,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    backgroundColor: SLATE_50,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: SLATE_100,
  },
  featureIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: ROSE_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  featureIcon: {
    fontSize: 22,
  },
  featureTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: SLATE_900,
  },
  featureDesc: {
    fontSize: 11,
    color: SLATE_500,
    marginTop: 2,
    lineHeight: 16,
  },

  // ── City Modal ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.55)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: WHITE,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: SLATE_100,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: SLATE_900,
  },
  modalClose: {
    fontSize: 18,
    fontWeight: '700',
    color: SLATE_500,
  },
  modalSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SLATE_50,
    marginHorizontal: 16,
    marginVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: SLATE_200,
  },
  modalSearchInput: {
    flex: 1,
    height: 42,
    fontSize: 14,
    color: SLATE_900,
  },
  cityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: SLATE_50,
  },
  cityPin: {
    fontSize: 16,
    marginRight: 10,
  },
  cityName: {
    fontSize: 14,
    fontWeight: '600',
    color: SLATE_900,
    flex: 1,
  },
  cityCheckmark: {
    fontSize: 16,
    fontWeight: '800',
    color: ROSE,
  },

  // ── Routes Row ──
  routesScrollRow: {
    gap: 12,
    paddingBottom: 4,
  },
  routeCard: {
    width: 200,
    backgroundColor: WHITE,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: SLATE_200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  routeCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  routeIcon: {
    fontSize: 22,
  },
  routeBadge: {
    backgroundColor: ROSE_LIGHT,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: ROSE_BORDER,
  },
  routeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: ROSE,
  },
  routePathRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  routeFromText: {
    fontSize: 13,
    fontWeight: '800',
    color: SLATE_900,
  },
  routeArrowText: {
    fontSize: 12,
    color: ROSE,
    fontWeight: '800',
  },
  routeToText: {
    fontSize: 13,
    fontWeight: '800',
    color: SLATE_900,
  },
  routeMetaText: {
    fontSize: 11,
    color: SLATE_500,
    fontWeight: '500',
    marginBottom: 10,
  },
  routeCardDivider: {
    height: 1,
    backgroundColor: SLATE_100,
    marginBottom: 10,
  },
  routeCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  routeFareLabel: {
    fontSize: 10,
    color: SLATE_400,
    fontWeight: '700',
  },
  routeFareText: {
    fontSize: 15,
    fontWeight: '900',
    color: SLATE_900,
  },
  bookRouteBtn: {
    backgroundColor: BLUE,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  bookRouteBtnText: {
    color: WHITE,
    fontSize: 11,
    fontWeight: '800',
  },

  // ── How It Works ──
  howItWorksGrid: {
    gap: 12,
    marginTop: 4,
  },
  howStepCard: {
    backgroundColor: WHITE,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: SLATE_200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  stepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  stepIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: BLUE_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepIconText: {
    fontSize: 20,
  },
  stepNumberBadge: {
    fontSize: 18,
    fontWeight: '900',
    color: SLATE_400,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: SLATE_900,
    marginBottom: 4,
  },
  stepDesc: {
    fontSize: 12,
    color: SLATE_600,
    lineHeight: 18,
  },

  // ── Testimonials ──
  testimonialsScroll: {
    gap: 12,
    paddingBottom: 4,
  },
  testimonialCard: {
    width: 250,
    backgroundColor: WHITE,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: SLATE_200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  testimonialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  testAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: ROSE_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  testAvatarText: {
    fontSize: 18,
  },
  testName: {
    fontSize: 13,
    fontWeight: '800',
    color: SLATE_900,
  },
  testRole: {
    fontSize: 10,
    color: SLATE_500,
  },
  testStars: {
    fontSize: 11,
    color: AMBER,
  },
  testQuote: {
    fontSize: 12,
    color: SLATE_600,
    lineHeight: 18,
    fontStyle: 'italic',
  },

  // ── FAQs ──
  faqList: {
    gap: 10,
    marginTop: 4,
  },
  faqCard: {
    backgroundColor: WHITE,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: SLATE_200,
    overflow: 'hidden',
  },
  faqCardOpen: {
    borderColor: ROSE_BORDER,
    backgroundColor: '#fffbfa',
  },
  faqQuestionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  faqQuestionText: {
    fontSize: 13,
    fontWeight: '700',
    color: SLATE_800,
    flex: 1,
    paddingRight: 8,
  },
  faqQuestionTextOpen: {
    color: ROSE,
    fontWeight: '800',
  },
  faqToggleIcon: {
    fontSize: 10,
    color: SLATE_400,
  },
  faqToggleIconOpen: {
    color: ROSE,
  },
  faqAnswerBox: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: '#ffe4e6',
    paddingTop: 10,
  },
  faqAnswerText: {
    fontSize: 12,
    color: SLATE_600,
    lineHeight: 18,
  },

  // ── Payment Partners ──
  paymentSection: {
    marginTop: 24,
    marginHorizontal: 16,
    backgroundColor: WHITE,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: SLATE_200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  paymentBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
    marginBottom: 16,
  },
  paymentBadgeCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: SLATE_50,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: SLATE_200,
  },
  paymentBadgeIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  paymentBadgeName: {
    fontSize: 13,
    fontWeight: '800',
    color: SLATE_900,
  },
  paymentBadgeSub: {
    fontSize: 10,
    color: SLATE_500,
    marginTop: 2,
  },
  securityTrustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#f0fdf4',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  securityTrustIcon: {
    fontSize: 14,
  },
  securityTrustText: {
    fontSize: 11,
    color: '#166534',
    fontWeight: '700',
    textAlign: 'center',
  },
});
