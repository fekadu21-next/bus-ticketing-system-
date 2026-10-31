import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { apiService } from '@/services/api';
import type { PassengerTrip } from '@/types';
import PassengerTabBar from '@/components/PassengerTabBar';
import { POPULAR_CITIES } from '@/constants/cities';

type PeriodFilter = 'morning' | 'afternoon' | 'evening';
type SortOption = 'departure' | 'price-low' | 'price-high' | 'seats';
type MinSeatsOption = 'all' | '1' | '5' | '10' | '20';

const TIME_FILTERS: { id: PeriodFilter; label: string; desc: string }[] = [
  { id: 'morning', label: 'Morning', desc: '6:00 AM - 11:59 AM' },
  { id: 'afternoon', label: 'Afternoon', desc: '12:00 PM - 4:59 PM' },
  { id: 'evening', label: 'Evening', desc: '5:00 PM - 11:59 PM' },
];

const SORT_OPTIONS: { id: SortOption; label: string }[] = [
  { id: 'departure', label: 'Departure Time' },
  { id: 'price-low', label: 'Price: Low to High' },
  { id: 'price-high', label: 'Price: High to Low' },
  { id: 'seats', label: 'Most Seats Available' },
];

const SEAT_OPTIONS: { id: MinSeatsOption; label: string }[] = [
  { id: 'all', label: 'All Seats' },
  { id: '1', label: '1+ Seat Available' },
  { id: '5', label: '5+ Seats Available' },
  { id: '10', label: '10+ Seats Available' },
  { id: '20', label: '20+ Seats Available' },
];

const PRICE_PRESETS = [800, 1000, 1200, 1500, 2000];

function formatPrettyDate(iso?: string) {
  if (!iso) return 'Upcoming Dates';
  const d = new Date(iso.includes('T') ? iso : `${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
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

export default function PassengerTripsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ origin?: string; destination?: string; date?: string; operator?: string }>();

  const [origin, setOrigin] = useState(params.origin ? String(params.origin) : 'Addis Ababa');
  const [destination, setDestination] = useState(params.destination ? String(params.destination) : 'All Destinations');
  const [dateParam, setDateParam] = useState(params.date ? String(params.date) : 'all');

  const [trips, setTrips] = useState<PassengerTrip[]>([]);
  const [companies, setCompanies] = useState<Array<{ id: string; name: string; type: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters State
  const [periods, setPeriods] = useState<PeriodFilter[]>([]);
  const [priceRange, setPriceRange] = useState<number>(2000);
  const [operatorSearch, setOperatorSearch] = useState('');
  const [selectedOperators, setSelectedOperators] = useState<string[]>(
    params.operator ? [String(params.operator)] : []
  );
  const [orgTypes, setOrgTypes] = useState<string[]>([]);
  const [minSeats, setMinSeats] = useState<MinSeatsOption>('all');
  const [sortBy, setSortBy] = useState<SortOption>('departure');

  // Modals
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [editSearchModalVisible, setEditSearchModalVisible] = useState(false);
  const [selectingCityField, setSelectingCityField] = useState<'origin' | 'destination'>('origin');

  // Load Trips and Companies
  const fetchData = useCallback(async () => {
    try {
      const [tripsRes, compRes] = await Promise.all([
        apiService.searchPassengerTrips({
          origin: origin === 'All Cities' ? undefined : origin,
          destination: destination === 'All Destinations' ? undefined : destination,
          date: dateParam === 'all' ? undefined : dateParam,
          limit: 100,
        }),
        apiService.getCompanies(),
      ]);

      if (tripsRes.success && tripsRes.data?.trips) {
        setTrips(tripsRes.data.trips);
      }
      if (compRes.success && compRes.data?.companies) {
        setCompanies(compRes.data.companies);
      }
    } catch {
      // Graceful fallback
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [origin, destination, dateParam]);

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Toggle Filters
  const togglePeriod = (p: PeriodFilter) => {
    setPeriods((prev) => (prev.includes(p) ? prev.filter((item) => item !== p) : [...prev, p]));
  };

  const toggleOperator = (opName: string) => {
    setSelectedOperators((prev) =>
      prev.includes(opName) ? prev.filter((item) => item !== opName) : [...prev, opName]
    );
  };

  const toggleOrgType = (type: string) => {
    setOrgTypes((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]));
  };

  const clearAllFilters = () => {
    setPeriods([]);
    setPriceRange(2000);
    setOperatorSearch('');
    setSelectedOperators([]);
    setOrgTypes([]);
    setMinSeats('all');
    setSortBy('departure');
  };

  // Operator Options with real counts
  const operatorOptions = useMemo(() => {
    const defaultOperators = [
      'Abay Bus Transport Association',
      'Blue Nile Transport Assoc',
      'Ethio Bus Transport Co',
      'Golden Express Bus',
      'Rift Valley Express',
      'Selam Bus Line',
    ];

    const opNames = Array.from(
      new Set([
        ...defaultOperators,
        ...companies.map((c) => c.name),
        ...trips.map((t) => t.operatorName),
      ])
    ).filter(Boolean);

    const counts: Record<string, number> = {};
    trips.forEach((t) => {
      const op = t.operatorName || 'Others';
      counts[op] = (counts[op] || 0) + 1;
    });

    const named = opNames
      .map((name) => ({
        name,
        count: counts[name] || 0,
      }))
      .filter((op) => {
        if (!operatorSearch.trim()) return true;
        return op.name.toLowerCase().includes(operatorSearch.toLowerCase());
      });

    const othersCount = trips.filter(
      (t) => !named.some((op) => op.name === t.operatorName)
    ).length;

    return { named, others: othersCount };
  }, [companies, trips, operatorSearch]);

  // Organization counts
  const orgCounts = useMemo(() => {
    return {
      private: trips.filter((t) => t.orgType === 'Private Bus Company').length,
      association: trips.filter((t) => t.orgType === 'Transport Association').length,
    };
  }, [trips]);

  // Filtered & Sorted Trips
  const filteredTrips = useMemo(() => {
    let result = trips.filter((t) => {
      const matchesPeriod = periods.length === 0 || (t.period && periods.includes(t.period));
      const matchesPrice = t.price <= priceRange;
      const matchesOperator =
        selectedOperators.length === 0 ||
        selectedOperators.some((selected) => {
          if (selected === 'Others') {
            return !operatorOptions.named.map((n) => n.name).includes(t.operatorName);
          }
          return t.operatorName.toLowerCase().includes(selected.toLowerCase());
        });
      const matchesOrg = orgTypes.length === 0 || (t.orgType && orgTypes.includes(t.orgType));

      let matchesSeats = true;
      if (minSeats === '1') matchesSeats = t.availableSeats >= 1;
      else if (minSeats === '5') matchesSeats = t.availableSeats >= 5;
      else if (minSeats === '10') matchesSeats = t.availableSeats >= 10;
      else if (minSeats === '20') matchesSeats = t.availableSeats >= 20;

      return matchesPeriod && matchesPrice && matchesOperator && matchesOrg && matchesSeats;
    });

    if (sortBy === 'price-low') {
      result = [...result].sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      result = [...result].sort((a, b) => b.price - a.price);
    } else if (sortBy === 'seats') {
      result = [...result].sort((a, b) => b.availableSeats - a.availableSeats);
    } else {
      result = [...result].sort(
        (a, b) => minutesFromLabel(a.departureTime) - minutesFromLabel(b.departureTime)
      );
    }

    return result;
  }, [trips, periods, priceRange, selectedOperators, orgTypes, minSeats, sortBy, operatorOptions]);

  // Active filters count
  const activeFiltersCount =
    periods.length +
    selectedOperators.length +
    orgTypes.length +
    (minSeats !== 'all' ? 1 : 0) +
    (priceRange < 2000 ? 1 : 0);

  // Render individual trip card matching web aesthetic
  const renderTripCard = ({ item, index }: { item: PassengerTrip; index: number }) => {
    return (
      <Animated.View entering={FadeInDown.delay(index * 60).duration(280)}>
        <TouchableOpacity
          style={styles.tripCard}
          onPress={() =>
            router.push({
              pathname: '/passenger/trip/[id]',
              params: { id: item.id },
            })
          }
          activeOpacity={0.9}
        >
          {/* Best Price Badge */}
          {item.badge && (
            <View style={styles.bestPriceBadge}>
              <Text style={styles.bestPriceText}>⭐ {item.badge}</Text>
            </View>
          )}

          {/* Operator Header */}
          <View style={styles.cardHeader}>
            <View style={styles.operatorRow}>
              <View style={[styles.avatarCircle, { backgroundColor: item.logoBg || '#2563eb' }]}>
                <Text style={styles.avatarText}>{item.logoText || 'SB'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.operatorName} numberOfLines={1}>
                  {item.operatorName}
                </Text>
                <Text style={styles.orgTypeText}>
                  {item.orgType || 'Private Bus Company'}
                </Text>
              </View>
            </View>

            {/* Rating */}
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingStar}>★</Text>
              <Text style={styles.ratingScore}>{item.rating || 4.6}</Text>
              <Text style={styles.ratingCount}>({item.reviews || 94})</Text>
            </View>
          </View>

          {/* Departure Date Tag */}
          <View style={styles.dateTagRow}>
            <View style={styles.dateTag}>
              <Text style={styles.dateTagText}>
                📅 {formatPrettyDate(item.departureDate)}
              </Text>
            </View>
          </View>

          {/* Schedule Row */}
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
              <Text style={styles.directExpressText}>Direct Express</Text>
            </View>

            <View style={[styles.timeBlock, { alignItems: 'flex-end' }]}>
              <Text style={styles.timeText}>{item.arrivalTime || '03:01 AM'}</Text>
              <Text style={styles.cityText}>{item.destination}</Text>
            </View>
          </View>

          {/* Amenities Chips */}
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

          {/* Divider */}
          <View style={styles.cardDivider} />

          {/* Card Footer: Price & View Details */}
          <View style={styles.cardFooter}>
            <View>
              <View style={styles.priceRow}>
                <Text style={styles.priceAmount}>{item.price} ETB</Text>
                <Text style={styles.perPersonText}>per person</Text>
              </View>
              <Text style={styles.seatsAvailableText}>
                {item.availableSeats} seats available
              </Text>
            </View>

            <View style={styles.viewDetailsBtn}>
              <Text style={styles.viewDetailsText}>View Details →</Text>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Route & Search Header Bar */}
      <View style={styles.topHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.headerInfoArea}
          onPress={() => setEditSearchModalVisible(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.headerRouteTitle} numberOfLines={1}>
            {origin} → {destination}
          </Text>
          <Text style={styles.headerSubTitle}>
            Tap to change route or date • {formatPrettyDate(dateParam === 'all' ? undefined : dateParam)}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.editSearchBtn}
          onPress={() => setEditSearchModalVisible(true)}
        >
          <Text style={styles.editSearchBtnText}>Edit</Text>
        </TouchableOpacity>
      </View>

      {/* Control Bar: Sort & Filter buttons */}
      <View style={styles.controlBar}>
        {/* Filter Trigger Button */}
        <TouchableOpacity
          style={[styles.filterTriggerBtn, activeFiltersCount > 0 && styles.activeFilterTriggerBtn]}
          onPress={() => setFilterModalVisible(true)}
          activeOpacity={0.8}
        >
          <Text style={[styles.filterTriggerText, activeFiltersCount > 0 && styles.activeFilterTriggerText]}>
            ⚡ Filters {activeFiltersCount > 0 ? `(${activeFiltersCount})` : ''}
          </Text>
        </TouchableOpacity>

        {/* Sort Trigger Button */}
        <TouchableOpacity
          style={styles.sortTriggerBtn}
          onPress={() => setSortModalVisible(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.sortTriggerLabel}>Sort by:</Text>
          <Text style={styles.sortTriggerValue}>
            {SORT_OPTIONS.find((s) => s.id === sortBy)?.label} ▼
          </Text>
        </TouchableOpacity>
      </View>

      {/* Results Count Banner */}
      <View style={styles.resultsBanner}>
        <View>
          <Text style={styles.resultsCountTitle}>{filteredTrips.length} Trips Found</Text>
          <Text style={styles.resultsCountSub}>
            From {origin} to {destination} on {formatPrettyDate(dateParam === 'all' ? undefined : dateParam)}
          </Text>
        </View>

        {activeFiltersCount > 0 && (
          <TouchableOpacity onPress={clearAllFilters} style={styles.clearFiltersInlineBtn}>
            <Text style={styles.clearFiltersInlineText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Quick Time Period Chips */}
      <View style={styles.quickChipsBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickChipsContent}>
          {TIME_FILTERS.map((tf) => {
            const isSelected = periods.includes(tf.id);
            return (
              <TouchableOpacity
                key={tf.id}
                style={[styles.quickChip, isSelected && styles.activeQuickChip]}
                onPress={() => togglePeriod(tf.id)}
              >
                <Text style={[styles.quickChipText, isSelected && styles.activeQuickChipText]}>
                  {tf.label} ({tf.desc.split(' - ')[0]})
                </Text>
              </TouchableOpacity>
            );
          })}

          {priceRange < 2000 && (
            <TouchableOpacity
              style={[styles.quickChip, styles.activeQuickChip]}
              onPress={() => setPriceRange(2000)}
            >
              <Text style={[styles.quickChipText, styles.activeQuickChipText]}>
                Max {priceRange} ETB ✕
              </Text>
            </TouchableOpacity>
          )}

          {selectedOperators.map((op) => (
            <TouchableOpacity
              key={op}
              style={[styles.quickChip, styles.activeQuickChip]}
              onPress={() => toggleOperator(op)}
            >
              <Text style={[styles.quickChipText, styles.activeQuickChipText]}>
                {op} ✕
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Main Trip List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Searching available buses & fares...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredTrips}
          keyExtractor={(item) => item.id}
          renderItem={renderTripCard}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2563eb']} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🚌</Text>
              <Text style={styles.emptyTitle}>No Bus Trips Found</Text>
              <Text style={styles.emptySub}>
                We couldn't find any trips matching your current filters. Try resetting your filters or selecting a different date.
              </Text>
              <TouchableOpacity style={styles.resetFiltersBtn} onPress={clearAllFilters}>
                <Text style={styles.resetFiltersBtnText}>Reset All Filters</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* ================= FILTER MODAL ================= */}
      <Modal visible={filterModalVisible} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filters</Text>
              <View style={styles.modalHeaderActions}>
                <TouchableOpacity onPress={clearAllFilters} style={{ marginRight: 14 }}>
                  <Text style={styles.modalClearText}>Clear All</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                  <Text style={styles.modalCloseIcon}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
              {/* 1. Departure Time Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Departure Time</Text>
                <View style={styles.optionsList}>
                  {TIME_FILTERS.map((item) => {
                    const checked = periods.includes(item.id);
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={styles.filterOptionRow}
                        onPress={() => togglePeriod(item.id)}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.checkboxBox, checked && styles.checkboxBoxActive]}>
                          {checked && <Text style={styles.checkmarkText}>✓</Text>}
                        </View>
                        <View style={{ flex: 1, marginLeft: 10 }}>
                          <Text style={styles.optionLabel}>{item.label} ({item.desc})</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* 2. Price Range Filter */}
              <View style={styles.filterSection}>
                <View style={styles.filterSectionHeader}>
                  <Text style={styles.filterSectionTitle}>Price Range</Text>
                  <Text style={styles.filterSelectedValue}>Up to {priceRange} ETB</Text>
                </View>
                <View style={styles.pricePresetsRow}>
                  {PRICE_PRESETS.map((p) => {
                    const isSelected = priceRange === p;
                    return (
                      <TouchableOpacity
                        key={p}
                        style={[styles.pricePresetBtn, isSelected && styles.activePricePresetBtn]}
                        onPress={() => setPriceRange(p)}
                      >
                        <Text style={[styles.pricePresetText, isSelected && styles.activePricePresetText]}>
                          ETB {p}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <View style={styles.priceRangeLabels}>
                  <Text style={styles.priceSubText}>ETB 600</Text>
                  <Text style={styles.priceSubText}>ETB 2,000</Text>
                </View>
              </View>

              {/* 3. Operator Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Operator</Text>
                <View style={styles.operatorSearchBox}>
                  <Text style={styles.searchIconText}>🔍</Text>
                  <TextInput
                    style={styles.operatorSearchInput}
                    placeholder="Search operators..."
                    value={operatorSearch}
                    onChangeText={setOperatorSearch}
                    placeholderTextColor="#94a3b8"
                  />
                  {operatorSearch.length > 0 && (
                    <TouchableOpacity onPress={() => setOperatorSearch('')}>
                      <Text style={{ color: '#94a3b8', fontSize: 14 }}>✕</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.optionsList}>
                  {operatorOptions.named.map((op) => {
                    const checked = selectedOperators.includes(op.name);
                    return (
                      <TouchableOpacity
                        key={op.name}
                        style={styles.filterOptionRow}
                        onPress={() => toggleOperator(op.name)}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.checkboxBox, checked && styles.checkboxBoxActive]}>
                          {checked && <Text style={styles.checkmarkText}>✓</Text>}
                        </View>
                        <Text style={[styles.optionLabel, { flex: 1, marginLeft: 10 }]}>
                          {op.name}
                        </Text>
                        <Text style={styles.optionCountText}>({op.count})</Text>
                      </TouchableOpacity>
                    );
                  })}

                  <TouchableOpacity
                    style={styles.filterOptionRow}
                    onPress={() => toggleOperator('Others')}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.checkboxBox, selectedOperators.includes('Others') && styles.checkboxBoxActive]}>
                      {selectedOperators.includes('Others') && <Text style={styles.checkmarkText}>✓</Text>}
                    </View>
                    <Text style={[styles.optionLabel, { flex: 1, marginLeft: 10 }]}>Others</Text>
                    <Text style={styles.optionCountText}>({operatorOptions.others})</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* 4. Organization Type Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Organization Type</Text>
                <View style={styles.optionsList}>
                  <TouchableOpacity
                    style={styles.filterOptionRow}
                    onPress={() => toggleOrgType('Private Bus Company')}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.checkboxBox, orgTypes.includes('Private Bus Company') && styles.checkboxBoxActive]}>
                      {orgTypes.includes('Private Bus Company') && <Text style={styles.checkmarkText}>✓</Text>}
                    </View>
                    <Text style={[styles.optionLabel, { flex: 1, marginLeft: 10 }]}>Private Bus Company</Text>
                    <Text style={styles.optionCountText}>({orgCounts.private})</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.filterOptionRow}
                    onPress={() => toggleOrgType('Transport Association')}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.checkboxBox, orgTypes.includes('Transport Association') && styles.checkboxBoxActive]}>
                      {orgTypes.includes('Transport Association') && <Text style={styles.checkmarkText}>✓</Text>}
                    </View>
                    <Text style={[styles.optionLabel, { flex: 1, marginLeft: 10 }]}>Transport Association</Text>
                    <Text style={styles.optionCountText}>({orgCounts.association})</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* 5. Available Seats Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Available Seats</Text>
                <View style={styles.seatsOptionsWrap}>
                  {SEAT_OPTIONS.map((opt) => {
                    const isSelected = minSeats === opt.id;
                    return (
                      <TouchableOpacity
                        key={opt.id}
                        style={[styles.seatOptionBtn, isSelected && styles.activeSeatOptionBtn]}
                        onPress={() => setMinSeats(opt.id)}
                      >
                        <Text style={[styles.seatOptionText, isSelected && styles.activeSeatOptionText]}>
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </ScrollView>

            {/* Modal Bottom CTA */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.applyFiltersBtn}
                onPress={() => setFilterModalVisible(false)}
              >
                <Text style={styles.applyFiltersBtnText}>
                  Show {filteredTrips.length} Results
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ================= SORT MODAL ================= */}
      <Modal visible={sortModalVisible} animationType="fade" transparent>
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setSortModalVisible(false)}
        >
          <View style={styles.sortModalBox}>
            <Text style={styles.sortModalTitle}>Sort Trips By</Text>
            {SORT_OPTIONS.map((opt) => {
              const isSelected = sortBy === opt.id;
              return (
                <TouchableOpacity
                  key={opt.id}
                  style={[styles.sortItemRow, isSelected && styles.activeSortItemRow]}
                  onPress={() => {
                    setSortBy(opt.id);
                    setSortModalVisible(false);
                  }}
                >
                  <Text style={[styles.sortItemText, isSelected && styles.activeSortItemText]}>
                    {opt.label}
                  </Text>
                  {isSelected && <Text style={styles.sortCheckmark}>✓</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ================= EDIT SEARCH MODAL ================= */}
      <Modal visible={editSearchModalVisible} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Select {selectingCityField === 'origin' ? 'Departure City' : 'Destination'}
              </Text>
              <TouchableOpacity onPress={() => setEditSearchModalVisible(false)}>
                <Text style={styles.modalCloseIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.cityTabSelector}>
              <TouchableOpacity
                style={[styles.cityTabBtn, selectingCityField === 'origin' && styles.activeCityTabBtn]}
                onPress={() => setSelectingCityField('origin')}
              >
                <Text style={[styles.cityTabBtnText, selectingCityField === 'origin' && styles.activeCityTabBtnText]}>
                  From: {origin}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.cityTabBtn, selectingCityField === 'destination' && styles.activeCityTabBtn]}
                onPress={() => setSelectingCityField('destination')}
              >
                <Text style={[styles.cityTabBtnText, selectingCityField === 'destination' && styles.activeCityTabBtnText]}>
                  To: {destination}
                </Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={POPULAR_CITIES}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.cityRowItem}
                  onPress={() => {
                    if (selectingCityField === 'origin') {
                      setOrigin(item);
                      setSelectingCityField('destination');
                    } else {
                      setDestination(item);
                      setEditSearchModalVisible(false);
                    }
                  }}
                >
                  <Text style={styles.cityPinIcon}>📍</Text>
                  <Text style={styles.cityItemName}>{item}</Text>
                  {(selectingCityField === 'origin' ? origin === item : destination === item) && (
                    <Text style={styles.citySelectedCheck}>✓</Text>
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
    backgroundColor: '#f8fafc',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  backIcon: {
    fontSize: 18,
    color: '#0f172a',
    fontWeight: '800',
  },
  headerInfoArea: {
    flex: 1,
  },
  headerRouteTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  headerSubTitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  editSearchBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  editSearchBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803d',
  },
  controlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  filterTriggerBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  activeFilterTriggerBtn: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  filterTriggerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  activeFilterTriggerText: {
    color: '#ffffff',
  },
  sortTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sortTriggerLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  sortTriggerValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  resultsBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#f8fafc',
  },
  resultsCountTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0f172a',
  },
  resultsCountSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  clearFiltersInlineBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  clearFiltersInlineText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284c7',
  },
  quickChipsBar: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  quickChipsContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  quickChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  activeQuickChip: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  quickChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  activeQuickChipText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 24,
  },
  tripCard: {
    position: 'relative',
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  bestPriceBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    backgroundColor: '#22c55e',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    zIndex: 2,
  },
  bestPriceText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingRight: 60, // Space for badge
  },
  operatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 12,
  },
  operatorName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  orgTypeText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingStar: {
    color: '#f59e0b',
    fontSize: 13,
  },
  ratingScore: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  ratingCount: {
    fontSize: 11,
    color: '#94a3b8',
  },
  dateTagRow: {
    marginBottom: 10,
  },
  dateTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  dateTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563eb',
  },
  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 10,
  },
  timeBlock: {
    flex: 1,
  },
  timeText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  cityText: {
    fontSize: 12,
    color: '#475569',
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
    color: '#64748b',
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
    backgroundColor: '#2563eb',
  },
  arrowBar: {
    flex: 1,
    height: 1.5,
    backgroundColor: '#cbd5e1',
  },
  arrowHead: {
    fontSize: 12,
    color: '#2563eb',
    fontWeight: '800',
    marginLeft: 2,
  },
  directExpressText: {
    fontSize: 9,
    color: '#10b981',
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
    backgroundColor: '#f8fafc',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  amenityIcon: {
    fontSize: 11,
  },
  amenityText: {
    fontSize: 10,
    color: '#475569',
    fontWeight: '600',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
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
    color: '#2563eb',
  },
  perPersonText: {
    fontSize: 11,
    color: '#64748b',
  },
  seatsAvailableText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16a34a',
    marginTop: 2,
  },
  viewDetailsBtn: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
  },
  viewDetailsText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 12,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
  },
  emptyIcon: {
    fontSize: 44,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  resetFiltersBtn: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  resetFiltersBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 13,
  },

  // Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
  },
  modalHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalClearText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0284c7',
  },
  modalCloseIcon: {
    fontSize: 18,
    fontWeight: '700',
    color: '#64748b',
  },
  modalScroll: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  filterSection: {
    marginBottom: 22,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  filterSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  filterSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 10,
  },
  filterSelectedValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563eb',
  },
  optionsList: {
    gap: 12,
  },
  filterOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  checkboxBoxActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  checkmarkText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
  },
  optionLabel: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '500',
  },
  optionCountText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
  pricePresetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  pricePresetBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  activePricePresetBtn: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  pricePresetText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  activePricePresetText: {
    color: '#ffffff',
  },
  priceRangeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  priceSubText: {
    fontSize: 11,
    color: '#94a3b8',
  },
  operatorSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 12,
  },
  searchIconText: {
    fontSize: 13,
    marginRight: 6,
  },
  operatorSearchInput: {
    flex: 1,
    height: 38,
    fontSize: 13,
    color: '#0f172a',
  },
  seatsOptionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  seatOptionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  activeSeatOptionBtn: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  seatOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  activeSeatOptionText: {
    color: '#ffffff',
    fontWeight: '800',
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  applyFiltersBtn: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  applyFiltersBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },

  // Sort Modal Box
  sortModalBox: {
    backgroundColor: '#ffffff',
    marginHorizontal: 30,
    marginBottom: 'auto',
    marginTop: 'auto',
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  sortModalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sortItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  activeSortItemRow: {
    backgroundColor: '#f0fdf4',
  },
  sortItemText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '600',
  },
  activeSortItemText: {
    color: '#15803d',
    fontWeight: '800',
  },
  sortCheckmark: {
    color: '#15803d',
    fontWeight: '900',
    fontSize: 14,
  },

  // City Picker Modal in Trips
  cityTabSelector: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 10,
    backgroundColor: '#f8fafc',
  },
  cityTabBtn: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  activeCityTabBtn: {
    borderColor: '#2563eb',
    backgroundColor: '#f0fdfa',
  },
  cityTabBtnText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '700',
  },
  activeCityTabBtnText: {
    color: '#2563eb',
  },
  cityRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  cityPinIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  cityItemName: {
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '600',
    flex: 1,
  },
  citySelectedCheck: {
    color: '#2563eb',
    fontWeight: '900',
    fontSize: 16,
  },
});
