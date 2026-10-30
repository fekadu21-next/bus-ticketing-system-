import React, { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuth } from '@/context/AuthContext';
import {
  apiService,
  type DriverProblemReport,
  type DriverTrip,
} from '@/services/api';
import DriverTabBar from '@/components/DriverTabBar';

type FilterTab = 'ALL' | 'REPORTED' | 'IN_REVIEW' | 'RESOLVED';

const PROBLEM_TYPES = [
  { value: 'VEHICLE_PROBLEM', label: '🚗 Vehicle / Mechanical Issue' },
  { value: 'DELAY', label: '⏱️ Heavy Traffic / Terminal Delay' },
  { value: 'ROUTE_PROBLEM', label: '🚧 Road Closure / Route Diversion' },
  { value: 'ACCIDENT', label: '⚠️ Road Collision / Accident' },
  { value: 'PASSENGER_ISSUE', label: '👥 Passenger Medical / Emergency' },
  { value: 'OTHER', label: '📝 Other Operational Issue' },
];

export default function DriverIncidentsScreen() {
  const router = useRouter();
  const { logout } = useAuth();

  const [problems, setProblems] = useState<DriverProblemReport[]>([]);
  const [activeTrip, setActiveTrip] = useState<DriverTrip | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterTab>('ALL');
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedType, setSelectedType] = useState('VEHICLE_PROBLEM');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out of the Driver App?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/landing');
        },
      },
    ]);
  };

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [problemsRes, dashRes] = await Promise.all([
        apiService.getDriverProblems(),
        apiService.getDriverDashboard(),
      ]);

      if (problemsRes.success && problemsRes.data?.reports) {
        setProblems(problemsRes.data.reports);
      } else {
        setError(problemsRes.error || 'Failed to load reported incidents');
      }

      if (dashRes.success && dashRes.data?.activeTrip) {
        setActiveTrip(dashRes.data.activeTrip);
      }
    } catch {
      setError('Network error while loading incident reports');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleOpenModal = () => {
    setDescription('');
    setSelectedType('VEHICLE_PROBLEM');
    setModalVisible(true);
  };

  const handleSubmitProblem = async () => {
    if (description.trim().length < 5) {
      Alert.alert('Required', 'Please describe the incident in detail (at least 5 characters).');
      return;
    }

    setSubmitting(true);
    try {
      // Use active trip if present, otherwise call with activeTrip id or fallback
      const tripId = activeTrip?.id;
      if (!tripId) {
        Alert.alert(
          'No Active Trip',
          'You do not have an active trip currently selected. Incidents must be linked to an assigned trip. Please check your assigned trips.'
        );
        setSubmitting(false);
        return;
      }

      const res = await apiService.reportProblem(tripId, {
        type: selectedType,
        description: description.trim(),
      });

      if (res.success) {
        Alert.alert(
          'Incident Transmitted',
          'Your report has been logged and immediately dispatched to Operations Dispatch.',
          [{ text: 'OK', onPress: () => setModalVisible(false) }]
        );
        fetchData();
      } else {
        Alert.alert('Submission Error', res.error || 'Failed to transmit incident report.');
      }
    } catch {
      Alert.alert('Error', 'Network error transmitting report. Please verify connection.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RESOLVED':
        return { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0', label: 'RESOLVED' };
      case 'IN_REVIEW':
      case 'ACKNOWLEDGED':
        return { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe', label: 'IN REVIEW' };
      default:
        return { bg: '#fffbeb', text: '#b45309', border: '#fde68a', label: 'REPORTED' };
    }
  };

  const filteredProblems = problems.filter((item) => {
    if (filter === 'ALL') return true;
    return item.status === filter;
  });

  const renderItem = ({ item, index }: { item: DriverProblemReport; index: number }) => {
    const status = getStatusColor(item.status);
    const dateFormatted = item.created_at
      ? new Date(item.created_at).toLocaleString(undefined, {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : 'N/A';

    const categoryIcon =
      item.type === 'VEHICLE_PROBLEM'
        ? '🚗'
        : item.type === 'DELAY'
        ? '⏱️'
        : item.type === 'ROUTE_PROBLEM'
        ? '🚧'
        : item.type === 'ACCIDENT'
        ? '⚠️'
        : item.type === 'PASSENGER_ISSUE'
        ? '👥'
        : '📝';

    return (
      <Animated.View entering={FadeInDown.duration(300).delay(index * 40)} style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.typeRow}>
            <Text style={styles.typeIcon}>{categoryIcon}</Text>
            <View>
              <Text style={styles.cardTitle}>{item.type.replace(/_/g, ' ')}</Text>
              <Text style={styles.cardDate}>{dateFormatted}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: status.bg, borderColor: status.border }]}>
            <Text style={[styles.statusText, { color: status.text }]}>{status.label}</Text>
          </View>
        </View>

        {/* Route tag if available */}
        {item.trips?.routes && (
          <View style={styles.routeTag}>
            <Text style={styles.routeTagText}>
              📍 {item.trips.routes.origin || 'Origin'} → {item.trips.routes.destination || 'Destination'}
              {item.trips.buses?.plate_number ? ` • Bus: ${item.trips.buses.plate_number}` : ''}
            </Text>
          </View>
        )}

        {/* Driver Description */}
        <Text style={styles.descriptionText}>{item.description}</Text>

        {/* Dispatch Operations Feedback Note */}
        {item.notes ? (
          <View style={styles.dispatchNoteBox}>
            <View style={styles.dispatchNoteHeader}>
              <Text style={styles.dispatchNoteBadge}>DISPATCH RESPONSE</Text>
            </View>
            <Text style={styles.dispatchNoteText}>{item.notes}</Text>
          </View>
        ) : null}
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Top Header with Sign Out Button in the Top Right */}
      <View style={styles.header}>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>INCIDENT CENTER</Text>
          <Text style={styles.headerSub}>Operational Logs & Delay Reports</Text>
        </View>
        <TouchableOpacity
          style={styles.signOutBtn}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Text style={styles.signOutIcon}>🚪</Text>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* Hero Report Button */}
      <View style={styles.heroActionContainer}>
        <TouchableOpacity
          style={styles.reportNewBtn}
          onPress={handleOpenModal}
          activeOpacity={0.85}
        >
          <Text style={styles.reportNewIcon}>🚨</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.reportNewTitle}>TRANSMIT INCIDENT / DELAY</Text>
            <Text style={styles.reportNewSub}>
              {activeTrip
                ? `Reporting for active: ${activeTrip.origin} → ${activeTrip.destination}`
                : 'Alert Operations Dispatch immediately'}
            </Text>
          </View>
          <Text style={styles.reportNewArrow}>→</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabsContainer}>
        {(['ALL', 'REPORTED', 'IN_REVIEW', 'RESOLVED'] as FilterTab[]).map((tab) => {
          const isActive = filter === tab;
          const label =
            tab === 'ALL'
              ? 'All'
              : tab === 'REPORTED'
              ? 'Pending'
              : tab === 'IN_REVIEW'
              ? 'In Review'
              : 'Resolved';
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, isActive && styles.activeTab]}
              onPress={() => setFilter(tab)}
            >
              <Text style={[styles.tabText, isActive && styles.activeTabText]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#0f766e" />
          <Text style={styles.loadingText}>Fetching reported incidents...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredProblems}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0f766e']} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🛡️</Text>
              <Text style={styles.emptyTitle}>No Incidents Logged</Text>
              <Text style={styles.emptySubtitle}>
                {filter === 'ALL'
                  ? 'All operations normal. If you encounter vehicle trouble, route closure, or road delay, report it above.'
                  : `No incidents found with status '${filter.replace(/_/g, ' ')}'.`}
              </Text>
            </View>
          }
        />
      )}

      {/* Incident Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Report Trip Incident</Text>
                <Text style={styles.modalSub}>Logged directly to Operations Dispatch</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalLabel}>Incident Category:</Text>
              <View style={styles.typeSelector}>
                {PROBLEM_TYPES.map((pt) => {
                  const isSelected = selectedType === pt.value;
                  return (
                    <TouchableOpacity
                      key={pt.value}
                      style={[styles.typeOption, isSelected && styles.typeOptionSelected]}
                      onPress={() => setSelectedType(pt.value)}
                    >
                      <Text
                        style={[
                          styles.typeOptionText,
                          isSelected && styles.typeOptionTextSelected,
                        ]}
                      >
                        {pt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.modalLabel}>Description & Vehicle Status:</Text>
              <TextInput
                style={styles.problemInput}
                placeholder="Detail current location, road hazard, delay duration or mechanical condition..."
                placeholderTextColor="#94a3b8"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                value={description}
                onChangeText={setDescription}
                editable={!submitting}
              />

              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  submitting && styles.submitBtnDisabled,
                ]}
                onPress={handleSubmitProblem}
                disabled={submitting}
                activeOpacity={0.85}
              >
                {submitting ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.submitBtnText}>TRANSMIT REPORT TO DISPATCH</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Driver Bottom Tab Bar */}
      <DriverTabBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: 0.5,
  },
  headerSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  signOutIcon: {
    fontSize: 13,
  },
  signOutText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#dc2626',
  },
  heroActionContainer: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
  },
  reportNewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    gap: 12,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  reportNewIcon: {
    fontSize: 24,
  },
  reportNewTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  reportNewSub: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  reportNewArrow: {
    fontSize: 18,
    fontWeight: '700',
    color: '#38bdf8',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTab: {
    backgroundColor: '#0f766e',
    borderColor: '#0f766e',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  activeTabText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  typeIcon: {
    fontSize: 22,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  cardDate: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 1,
  },
  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  routeTag: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  routeTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  descriptionText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 19,
  },
  dispatchNoteBox: {
    marginTop: 12,
    padding: 10,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#2563eb',
  },
  dispatchNoteHeader: {
    marginBottom: 4,
  },
  dispatchNoteBadge: {
    fontSize: 9,
    fontWeight: '800',
    color: '#2563eb',
    letterSpacing: 0.5,
  },
  dispatchNoteText: {
    fontSize: 12,
    color: '#1e3a8a',
    lineHeight: 17,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  errorIcon: {
    fontSize: 32,
  },
  errorText: {
    fontSize: 13,
    color: '#dc2626',
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#0f766e',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 6,
  },
  retryButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
    gap: 8,
  },
  emptyIcon: {
    fontSize: 44,
    marginBottom: 6,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    paddingBottom: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  modalSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748b',
  },
  modalBody: {
    padding: 20,
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
    marginTop: 4,
    letterSpacing: 0.3,
  },
  typeSelector: {
    gap: 6,
    marginBottom: 14,
  },
  typeOption: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  typeOptionSelected: {
    borderColor: '#0f766e',
    backgroundColor: '#f0fdfa',
  },
  typeOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  typeOptionTextSelected: {
    color: '#0f766e',
    fontWeight: '800',
  },
  problemInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    padding: 12,
    fontSize: 13,
    color: '#0f172a',
    minHeight: 88,
    marginBottom: 16,
  },
  submitBtn: {
    backgroundColor: '#0f766e',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
