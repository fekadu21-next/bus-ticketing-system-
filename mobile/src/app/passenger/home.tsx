import React, { useState, useEffect, useCallback } from 'react';
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/context/AuthContext';
import PassengerTabBar from '@/components/PassengerTabBar';
import { POPULAR_CITIES } from '@/constants/cities';
import { apiService } from '@/services/api';

const { width } = Dimensions.get('window');
const GRID_GAP = 12;
const CARD_WIDTH = (width - 32 - GRID_GAP) / 2;

// Brand Color Palette
const PRIMARY = '#2563eb';
const PRIMARY_DARK = '#1d4ed8';
const PRIMARY_LIGHT = '#eff6ff';
const GREEN = '#059669';
const GREEN_DARK = '#047857';
const SLATE_900 = '#0f172a';
const SLATE_800 = '#1e293b';
const SLATE_700 = '#334155';
const SLATE_600 = '#475569';
const SLATE_400 = '#94a3b8';
const SLATE_100 = '#f1f5f9';
const SLATE_50 = '#f8fafc';
const WHITE = '#ffffff';

// Operator bus images corresponding to web assets
const OPERATOR_IMAGES: Record<string, any> = {
  selam: require('@/assets/images/operators/selam-bus.png'),
  abay: require('@/assets/images/operators/abay-association.png'),
  gebeya: require('@/assets/images/operators/gebeya-bus.png'),
  mekelle: require('@/assets/images/operators/mekelle-transport.png'),
};

function getOperatorImage(name?: string) {
  if (!name) return OPERATOR_IMAGES.selam;
  const lower = name.toLowerCase();
  if (lower.includes('abay')) return OPERATOR_IMAGES.abay;
  if (lower.includes('gebeya')) return OPERATOR_IMAGES.gebeya;
  if (lower.includes('mekelle')) return OPERATOR_IMAGES.mekelle;
  if (lower.includes('sky')) return OPERATOR_IMAGES.selam;
  if (lower.includes('golden')) return OPERATOR_IMAGES.gebeya;
  if (lower.includes('ethio')) return OPERATOR_IMAGES.abay;
  if (lower.includes('walia')) return OPERATOR_IMAGES.mekelle;
  return OPERATOR_IMAGES.selam;
}

interface OperatorCard {
  id: string;
  name: string;
  type: string;
  rating: string;
  badge: string;
  fleet: string;
  routesCount: number;
}

const DEFAULT_OPERATORS: OperatorCard[] = [
  {
    id: 'op-1',
    name: 'Selam Bus',
    type: 'Luxury Coach',
    rating: '4.9 ★',
    badge: 'VIP',
    fleet: '45+ Luxury Fleet',
    routesCount: 18,
  },
  {
    id: 'op-2',
    name: 'Abay Bus',
    type: 'Executive Express',
    rating: '4.8 ★',
    badge: 'Top Choice',
    fleet: '35+ Modern Coaches',
    routesCount: 14,
  },
  {
    id: 'op-3',
    name: 'Gebeya Bus',
    type: 'Intercity Direct',
    rating: '4.8 ★',
    badge: 'Popular',
    fleet: '26+ Verified Buses',
    routesCount: 12,
  },
  {
    id: 'op-4',
    name: 'Mekelle Transport',
    type: 'Regional Express',
    rating: '4.7 ★',
    badge: 'Verified',
    fleet: '22+ Modern Coaches',
    routesCount: 10,
  },
  {
    id: 'op-5',
    name: 'Sky Bus',
    type: 'Air-Conditioned VIP',
    rating: '4.9 ★',
    badge: 'VIP Express',
    fleet: '30+ Luxury Coaches',
    routesCount: 15,
  },
  {
    id: 'op-6',
    name: 'Golden Bus',
    type: 'Intercity Direct',
    rating: '4.7 ★',
    badge: 'Accredited',
    fleet: '20+ Express Fleet',
    routesCount: 8,
  },
];

const WHY_CHOOSE_US = [
  {
    id: '1',
    icon: '🛡️',
    title: 'Safe & Reliable',
    desc: 'Trusted operators and secure payments.',
    bg: '#eff6ff',
    border: '#bfdbfe',
  },
  {
    id: '2',
    icon: '⚡',
    title: 'Real-Time Availability',
    desc: 'See live seat availability and choose your best option.',
    bg: '#fef3c7',
    border: '#fde68a',
  },
  {
    id: '3',
    icon: '📱',
    title: 'Book Anywhere',
    desc: 'Use our website or mobile app for a seamless experience.',
    bg: '#f0fdf4',
    border: '#bbf7d0',
  },
  {
    id: '4',
    icon: '🎧',
    title: '24/7 Support',
    desc: "We're here to help, anytime, anywhere.",
    bg: '#faf5ff',
    border: '#e9d5ff',
  },
];

function formatDateForInput(date: Date): string {
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

export default function PassengerHomeScreen() {
  const router = useRouter();
  const { user } = useAuth();

  // Search state
  const [origin, setOrigin] = useState('Addis Ababa');
  const [destination, setDestination] = useState('Bahir Dar');
  const [departureDate, setDepartureDate] = useState(() => formatDateForInput(new Date()));

  // Operators state loaded from DB
  const [operators, setOperators] = useState<OperatorCard[]>(DEFAULT_OPERATORS);
  const [refreshing, setRefreshing] = useState(false);

  // City Picker Modal state
  const [cityModalVisible, setCityModalVisible] = useState(false);
  const [selectingField, setSelectingField] = useState<'origin' | 'destination'>('origin');
  const [citySearchText, setCitySearchText] = useState('');

  // Date Modal state
  const [dateModalVisible, setDateModalVisible] = useState(false);

  // Fetch all operators from backend database
  const loadData = useCallback(async () => {
    try {
      const res = await apiService.getCompanies();
      if (res.success && Array.isArray(res.data?.companies) && res.data.companies.length > 0) {
        const mapped: OperatorCard[] = res.data.companies.map((c, i) => {
          const fleetCount = c.busCount ? `${c.busCount}+ Fleet` : `${Math.floor(20 + (i % 5) * 5)}+ Modern Fleet`;
          const rating = (4.7 + ((i * 7) % 3) * 0.1).toFixed(1) + ' ★';
          const badges = ['VIP', 'Top Choice', 'Verified', 'Accredited', 'Popular'];
          return {
            id: c.id,
            name: c.name,
            type: c.type || 'Private Bus Company',
            rating,
            badge: badges[i % badges.length],
            fleet: fleetCount,
            routesCount: c.tripCount || 10 + i * 2,
          };
        });
        setOperators(mapped);
      }
    } catch {
      // Keep defaults
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    void loadData();
  };

  const handleSwapCities = () => {
    if (destination === 'Select destination') {
      return;
    }
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  const openCityPicker = (field: 'origin' | 'destination') => {
    setSelectingField(field);
    setCitySearchText('');
    setCityModalVisible(true);
  };

  const handleSelectCity = (city: string) => {
    if (selectingField === 'origin') {
      setOrigin(city);
    } else {
      setDestination(city);
    }
    setCityModalVisible(false);
  };

  const handleSearchTrips = () => {
    router.push({
      pathname: '/passenger/trips',
      params: {
        origin,
        destination: destination === 'Select destination' ? '' : destination,
        date: departureDate,
      },
    });
  };

  const handleOperatorClick = (operatorName: string) => {
    router.push({
      pathname: '/passenger/trips',
      params: {
        operator: operatorName,
        origin,
      },
    });
  };

  const filteredCities = POPULAR_CITIES.filter((c) =>
    c.toLowerCase().includes(citySearchText.trim().toLowerCase())
  );

  const passengerGreeting = user?.firstName
    ? `Welcome, ${user.firstName}`
    : 'Welcome, Traveler';

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* ── Top Navigation Bar ────────────────────────────── */}
      <View style={styles.navBar}>
        <View style={styles.brandRow}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoIcon}>🚌</Text>
          </View>
          <View>
            <Text style={styles.brandTitle}>BusTicket</Text>
            <Text style={styles.brandGreeting}>{passengerGreeting}</Text>
          </View>
        </View>

        <View style={styles.navActions}>
          <TouchableOpacity
            style={styles.myTicketsPill}
            onPress={() => router.push('/passenger/bookings')}
            activeOpacity={0.8}
          >
            <Text style={styles.myTicketsPillText}>🎫 My Tickets</Text>
          </TouchableOpacity>

          {user ? (
            <TouchableOpacity
              style={styles.avatarPill}
              onPress={() => router.push('/passenger/profile')}
              activeOpacity={0.8}
            >
              <Text style={styles.avatarLetter}>
                {(user.firstName || 'P').charAt(0).toUpperCase()}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.signInBtn}
              onPress={() => router.push('/login')}
              activeOpacity={0.8}
            >
              <Text style={styles.signInText}>Sign In</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[GREEN]} tintColor={GREEN} />
        }
      >
        {/* ── 1. Tall Hero Image with Centered Search Controls (Image visible above & below) ──── */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.heroFullWidthContainer}>
          <ImageBackground
            source={require('@/assets/images/hero-bus.jpg')}
            style={styles.heroImage}
            resizeMode="cover"
          >
            <LinearGradient
              colors={['rgba(15, 23, 42, 0.25)', 'rgba(15, 23, 42, 0.55)']}
              style={styles.heroGradientOverlay}
            >
              {/* Above: Single-line text banner with visible hero image surrounding */}
              <View style={styles.heroTopWrap}>
                <View style={styles.heroSingleLineWrap}>
                  <View style={styles.pingDot} />
                  <Text style={styles.heroSingleLineText} numberOfLines={1}>
                    
                  </Text>
                </View>
              </View>

              {/* Centered Search Controls: Transparent inside showing hero image, circled on 4 sides by white line, black text, and white circular dropdown */}
              <View style={styles.centerSearchWrap}>
                {/* ── 1. FROM Selector Row ── */}
                <TouchableOpacity
                  style={styles.searchRowPill}
                  onPress={() => openCityPicker('origin')}
                  activeOpacity={0.85}
                >
                  <View style={styles.pinIconWrap}>
                    <Text style={styles.fieldPinIcon}>📍</Text>
                  </View>
                  <View style={styles.selectorTextWrap}>
                    <Text style={styles.fieldLabelBlack}>FROM</Text>
                    <Text style={styles.fieldValueTextBlack} numberOfLines={1}>
                      {origin}
                    </Text>
                  </View>
                  <View style={styles.whiteCircleDropdown}>
                    <Text style={styles.dropdownChevronBlack}>▼</Text>
                  </View>
                </TouchableOpacity>

                {/* Floating Swap Button in between */}
                <View style={styles.swapBtnCenterWrap}>
                  <TouchableOpacity
                    style={styles.swapBtnCircle}
                    onPress={handleSwapCities}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.swapIcon}>⇅</Text>
                  </TouchableOpacity>
                </View>

                {/* ── 2. TO Selector Row ── */}
                <TouchableOpacity
                  style={[
                    styles.searchRowPill,
                    destination === 'Select destination' && styles.selectorFieldPlaceholder,
                  ]}
                  onPress={() => openCityPicker('destination')}
                  activeOpacity={0.85}
                >
                  <View style={styles.pinIconWrap}>
                    <Text style={styles.fieldPinIcon}>🏁</Text>
                  </View>
                  <View style={styles.selectorTextWrap}>
                    <Text style={styles.fieldLabelBlack}>TO</Text>
                    <Text
                      style={[
                        styles.fieldValueTextBlack,
                        destination === 'Select destination' && styles.fieldPlaceholderText,
                      ]}
                      numberOfLines={1}
                    >
                      {destination}
                    </Text>
                  </View>
                  <View style={styles.whiteCircleDropdown}>
                    <Text style={styles.dropdownChevronBlack}>▼</Text>
                  </View>
                </TouchableOpacity>

                {/* ── 3. DEPARTURE DATE Selector Row ── */}
                <TouchableOpacity
                  style={[styles.searchRowPill, { marginTop: 8 }]}
                  onPress={() => setDateModalVisible(true)}
                  activeOpacity={0.85}
                >
                  <View style={styles.pinIconWrap}>
                    <Text style={styles.fieldPinIcon}>📅</Text>
                  </View>
                  <View style={styles.selectorTextWrap}>
                    <Text style={styles.fieldLabelBlack}>DEPARTURE DATE</Text>
                    <Text style={styles.fieldValueTextBlack}>{departureDate}</Text>
                  </View>
                  <View style={styles.whiteCircleDropdown}>
                    <Text style={styles.dropdownChevronBlack}>▼</Text>
                  </View>
                </TouchableOpacity>

                {/* ── 4. Primary Search Button with Green Background ── */}
                <TouchableOpacity
                  style={styles.searchSubmitBtn}
                  onPress={handleSearchTrips}
                  activeOpacity={0.88}
                >
                  <LinearGradient
                    colors={[PRIMARY, PRIMARY_DARK]}
                    style={styles.searchSubmitGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Text style={styles.searchSubmitText}>Search Bus Trips →</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              {/* Below: Spacer displaying the lower section of the hero bus image */}
              <View style={styles.heroBottomSpacer} />
            </LinearGradient>
          </ImageBackground>
        </Animated.View>

        {/* ── 2. All Popular Operators in Database (2-Column Grid) ─────────── */}
        <Animated.View entering={FadeInDown.duration(400).delay(150)} style={styles.sectionWrap}>
          <View style={styles.sectionHeader}>
            <View>
              <View style={styles.tagBadge}>
                <Text style={styles.tagBadgeText}>ACCREDITED FLEETS IN DB</Text>
              </View>
              <Text style={styles.sectionTitle}>Popular Operators</Text>
              <Text style={styles.sectionSub}>
                All licensed bus companies and transport associations in Ethiopia.
              </Text>
            </View>
          </View>

          {/* Two-Column Grid Without Horizontal Scroll */}
          <View style={styles.twoColumnGrid}>
            {operators.map((op) => (
              <View key={op.id} style={styles.operatorGridItem}>
                {/* Operator Bus Image (matching Web App) */}
                <View style={styles.opImageWrap}>
                  <Image
                    source={getOperatorImage(op.name)}
                    style={styles.opBusImage}
                    resizeMode="cover"
                  />
                  {/* Badge overlay on image */}
                  <View style={styles.opBadgePill}>
                    <Text style={styles.opBadgeText}>{op.badge}</Text>
                  </View>
                  {/* Rating overlay on image */}
                  <View style={styles.opRatingPill}>
                    <Text style={styles.opRatingText}>{op.rating}</Text>
                  </View>
                </View>

                {/* Operator Content */}
                <View style={styles.opContent}>
                  <Text style={styles.opName} numberOfLines={1}>
                    {op.name}
                  </Text>
                  <Text style={styles.opType} numberOfLines={1}>
                    {op.type}
                  </Text>
                  <Text style={styles.opFleet} numberOfLines={1}>
                    🚌 {op.fleet}
                  </Text>

                  <TouchableOpacity
                    style={styles.seeTripsBtn}
                    onPress={() => handleOperatorClick(op.name)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.seeTripsText}>See Trips →</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* ── 3. Why Choose Us / Features (2-Column Grid) ──── */}
        <Animated.View entering={FadeInDown.duration(400).delay(220)} style={styles.sectionWrap}>
          <View style={styles.sectionHeader}>
            <View>
              <View style={styles.tagBadgeEmerald}>
                <Text style={styles.tagBadgeTextEmerald}>CONFIDENCE & SAFETY</Text>
              </View>
              <Text style={styles.sectionTitle}>Why Choose Us</Text>
              <Text style={styles.sectionSub}>
                Modern intercity travel experience designed for Ethiopian passengers.
              </Text>
            </View>
          </View>

          {/* Two-Column Feature Grid */}
          <View style={styles.twoColumnGrid}>
            {WHY_CHOOSE_US.map((feat) => (
              <View
                key={feat.id}
                style={[
                  styles.featureGridItem,
                  { backgroundColor: feat.bg, borderColor: feat.border },
                ]}
              >
                <Text style={styles.featureIcon}>{feat.icon}</Text>
                <Text style={styles.featureTitle}>{feat.title}</Text>
                <Text style={styles.featureDesc}>{feat.desc}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Space at the bottom for TabBar */}
        <View style={{ height: 90 }} />
      </ScrollView>

      {/* ── City Selector Modal ─────────────────────────────── */}
      <Modal visible={cityModalVisible} animationType="slide" transparent>
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Select {selectingField === 'origin' ? 'Departure City' : 'Destination'}
              </Text>
              <TouchableOpacity
                onPress={() => setCityModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.citySearchInput}
              placeholder="Search city (e.g. Addis Ababa, Bahir Dar)..."
              placeholderTextColor={SLATE_400}
              value={citySearchText}
              onChangeText={setCitySearchText}
              autoFocus
            />

            <ScrollView style={styles.cityList} keyboardShouldPersistTaps="handled">
              {filteredCities.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={styles.cityItem}
                  onPress={() => handleSelectCity(c)}
                >
                  <Text style={styles.cityItemIcon}>📍</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cityItemName}>{c}</Text>
                  </View>
                  <Text style={styles.cityItemArrow}>→</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>

      {/* ── Date Picker Modal ───────────────────────────────── */}
      <Modal visible={dateModalVisible} animationType="fade" transparent>
        <View style={styles.dateModalOverlay}>
          <View style={styles.dateModalCard}>
            <Text style={styles.modalTitle}>Select Departure Date</Text>
            <Text style={styles.dateModalSub}>Choose a scheduled travel date:</Text>

            <View style={styles.dateOptionsList}>
              {[0, 1, 2, 3, 4, 5, 6].map((offset) => {
                const target = new Date();
                target.setDate(target.getDate() + offset);
                const str = formatDateForInput(target);
                const dayName = target.toLocaleDateString('en-US', { weekday: 'short' });
                const isSelected = departureDate === str;

                return (
                  <TouchableOpacity
                    key={offset}
                    style={[styles.dateOptionRow, isSelected && styles.dateOptionRowSelected]}
                    onPress={() => {
                      setDepartureDate(str);
                      setDateModalVisible(false);
                    }}
                  >
                    <Text style={[styles.dateOptionText, isSelected && styles.dateOptionTextSelected]}>
                      {dayName}, {str} {offset === 0 ? '(Today)' : offset === 1 ? '(Tomorrow)' : ''}
                    </Text>
                    {isSelected && <Text style={styles.dateOptionCheck}>✓</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={styles.dateModalCancelBtn}
              onPress={() => setDateModalVisible(false)}
            >
              <Text style={styles.dateModalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Bottom Tab Bar */}
      <PassengerTabBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: WHITE,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoIcon: {
    fontSize: 20,
  },
  brandTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: SLATE_900,
    letterSpacing: -0.3,
  },
  brandGreeting: {
    fontSize: 12,
    color: SLATE_600,
    fontWeight: '500',
  },
  navActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  myTicketsPill: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  myTicketsPillText: {
    color: '#2563eb',
    fontSize: 12,
    fontWeight: '700',
  },
  signInBtn: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  signInText: {
    color: WHITE,
    fontSize: 12,
    fontWeight: '700',
  },
  avatarPill: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    color: WHITE,
    fontWeight: '800',
    fontSize: 14,
  },

  scrollContent: {
    paddingBottom: 20,
  },

  // 1. Tall Hero Image Container (Height 380, image visible above and below search)
  heroFullWidthContainer: {
    width: '100%',
    height: 380,
    position: 'relative',
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroGradientOverlay: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
  },

  // Top Area: Single-Line Status Banner with visible hero image above search
  heroTopWrap: {
    alignItems: 'center',
  },
  heroSingleLineWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  pingDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#10b981',
  },
  heroSingleLineText: {
    color: WHITE,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
    textAlign: 'center',
  },

  // Centered Search Controls (Four sides outlined by thin white line, hero image visible inside, black text, white circle dropdown)
  centerSearchWrap: {
    width: '100%',
    alignSelf: 'center',
  },

  // Each Selector Row: Four sides circled by thin white line, inside is hero image bg, bold black text
  searchRowPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.22)', // hero image background visible inside!
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1.5,
    borderColor: '#ffffff', // four sides circled by small white line!
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  pinIconWrap: {
    marginRight: 10,
  },
  fieldPinIcon: {
    fontSize: 16,
  },
  selectorTextWrap: {
    flex: 1,
  },
  fieldLabelBlack: {
    fontSize: 9,
    fontWeight: '900',
    color: '#000000', // Black text
    letterSpacing: 0.6,
  },
  fieldValueTextBlack: {
    fontSize: 14,
    fontWeight: '900',
    color: '#000000', // Black text
    marginTop: 1,
  },
  selectorFieldPlaceholder: {
    backgroundColor: 'rgba(255, 228, 230, 0.35)',
  },
  fieldPlaceholderText: {
    color: '#000000',
    fontWeight: '700',
  },

  // Dedicated White Circle Dropdown Icon Button
  whiteCircleDropdown: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: WHITE,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  dropdownChevronBlack: {
    fontSize: 10,
    color: '#000000',
    fontWeight: '900',
  },

  // Swap Button Center
  swapBtnCenterWrap: {
    alignItems: 'center',
    marginVertical: -8,
    zIndex: 10,
  },
  swapBtnCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: WHITE,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  swapIcon: {
    fontSize: 14,
    fontWeight: '900',
    color: GREEN,
  },

  // Primary Action Button (Green Background)
  searchSubmitBtn: {
    marginTop: 12,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: GREEN,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  searchSubmitGradient: {
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchSubmitText: {
    color: WHITE,
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.4,
  },

  // Lower Hero Spacer to display the lower area of the hero image
  heroBottomSpacer: {
    height: 14,
  },

  // 2. Section Wrapping
  sectionWrap: {
    marginHorizontal: 16,
    marginTop: 20,
  },
  sectionHeader: {
    marginBottom: 10,
  },
  tagBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 4,
  },
  tagBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: PRIMARY,
    letterSpacing: 0.5,
  },
  tagBadgeEmerald: {
    alignSelf: 'flex-start',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 4,
  },
  tagBadgeTextEmerald: {
    fontSize: 9,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.5,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: SLATE_900,
    letterSpacing: -0.3,
  },
  sectionSub: {
    fontSize: 11,
    color: SLATE_600,
    marginTop: 1,
    lineHeight: 15,
  },

  // Two Column Grid
  twoColumnGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
  },

  // Operator Card with Bus Image (matching Web App)
  operatorGridItem: {
    width: CARD_WIDTH,
    backgroundColor: WHITE,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  opImageWrap: {
    width: '100%',
    height: 94,
    backgroundColor: '#f1f5f9',
    position: 'relative',
  },
  opBusImage: {
    width: '100%',
    height: '100%',
  },
  opBadgePill: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  opBadgeText: {
    color: WHITE,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  opRatingPill: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#f59e0b',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  opRatingText: {
    color: SLATE_900,
    fontSize: 9,
    fontWeight: '900',
  },
  opContent: {
    padding: 10,
  },
  opName: {
    fontSize: 13,
    fontWeight: '800',
    color: SLATE_900,
  },
  opType: {
    fontSize: 10,
    color: GREEN,
    fontWeight: '600',
    marginTop: 2,
  },
  opFleet: {
    fontSize: 10,
    color: SLATE_600,
    marginTop: 2,
  },
  seeTripsBtn: {
    marginTop: 8,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seeTripsText: {
    fontSize: 10,
    fontWeight: '800',
    color: GREEN,
  },

  // Why Choose Us Feature Cards (2-Column Grid)
  featureGridItem: {
    width: CARD_WIDTH,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
  },
  featureIcon: {
    fontSize: 22,
    marginBottom: 6,
  },
  featureTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: SLATE_900,
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 10,
    color: SLATE_600,
    lineHeight: 14,
  },

  // City Picker Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: WHITE,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: SLATE_900,
  },
  modalCloseBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: SLATE_100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 14,
    color: SLATE_600,
    fontWeight: '700',
  },
  citySearchInput: {
    backgroundColor: SLATE_50,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: SLATE_900,
    marginBottom: 12,
  },
  cityList: {
    maxHeight: 320,
  },
  cityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    gap: 10,
  },
  cityItemIcon: {
    fontSize: 14,
  },
  cityItemName: {
    fontSize: 13,
    fontWeight: '700',
    color: SLATE_900,
  },
  cityItemArrow: {
    fontSize: 13,
    color: SLATE_400,
  },

  // Date Modal
  dateModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dateModalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: WHITE,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  dateModalSub: {
    fontSize: 12,
    color: SLATE_600,
    marginTop: 2,
    marginBottom: 12,
  },
  dateOptionsList: {
    gap: 6,
    marginBottom: 14,
  },
  dateOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: SLATE_50,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  dateOptionRowSelected: {
    backgroundColor: '#eff6ff',
    borderColor: '#fca5a5',
  },
  dateOptionText: {
    fontSize: 13,
    color: SLATE_900,
    fontWeight: '600',
  },
  dateOptionTextSelected: {
    color: PRIMARY,
    fontWeight: '800',
  },
  dateOptionCheck: {
    fontSize: 14,
    color: PRIMARY,
    fontWeight: '900',
  },
  dateModalCancelBtn: {
    paddingVertical: 11,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: SLATE_100,
  },
  dateModalCancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: SLATE_600,
  },
});
