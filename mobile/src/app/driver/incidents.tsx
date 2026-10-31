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

const TEAL = '#0d9488';
const TEAL_DARK = '#0f766e';
const HEADER_BG = '#11423f';
const STRIP_BG = '#0d3835';

type FilterTab = 'ALL' | 'REPORTED' | 'IN_REVIEW' | 'RESOLVED';

const PROBLEM_TYPES = [
  { value: 'VEHICLE_PROBLEM', label: '🚗 Vehicle Issue' },
  { value: 'DELAY', label: '⏱️ Traffic Delay' },
  { value: 'ROUTE_PROBLEM', label: '🚧 Road Diversion' },
  { value: 'ACCIDENT', label: '⚠️ Collision' },
  { value: 'PASSENGER_ISSUE', label: '👥 Passenger Medical' },
  { value: 'OTHER', label: '📝 Other' },
];

export default function DriverIncidentsScreen() {
  const router = useRouter();
  const { logout } = useAuth();

  const [problems, setProblems] = useState<DriverProblemReport[]>([]);
  const [activeTrip, setActiveTrip] = useState<DriverTrip | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterTab>('ALL');

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedType, setSelectedType] = useState('VEHICLE_PROBLEM');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Sign out of driver session?', [
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
      const [problemsRes, dashRes] = await Promise.all([
        apiService.getDriverProblems(),
        apiService.getDriverDashboard(),
      ]);

      if (problemsRes.success && problemsRes.data?.reports) {
        setProblems(problemsRes.data.reports);
      }
      if (dashRes.success && dashRes.data?.activeTrip) {
        setActiveTrip(dashRes.data.activeTrip);
      }
    } catch (err) {
      console.warn('Driver incidents fetch notice:', err);
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
    if (description.trim().length < 4) {
      Alert.alert('Details Required', 'Please enter a brief description.');
      return;
    }

    setSubmitting(true);
    try {
      const tripId = activeTrip?.id;
      if (!tripId) {
        Alert.alert('No Active Trip', 'Please ensure you have an assigned trip before reporting.');
        setSubmitting(false);
        return;
      }

      const res = await apiService.reportProblem(tripId, {
        type: selectedType,
        description: description.trim(),
      });

      if (res.success) {
        Alert.alert('Report Logged', 'Dispatched to operations fleet center.', [
          { text: 'OK', onPress: () => setModalVisible(false) },
        ]);
        fetchData();
      } else {
        Alert.alert('Notice', res.error || 'Failed to submit report.');
      }
    } catch {
      Alert.alert('Error', 'Network error submitting report.');
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
      : '—';

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
      <Animated.View entering={FadeInDown.duration(300).delay(index * 35)} style={styles.card}>
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

        {item.trips?.routes && (
          <View style={styles.routeTag}>
            <Text style={styles.routeTagText}>
              📍 {item.trips.routes.origin || 'Origin'} → {item.trips.routes.destination || 'Destination'}
              {item.trips.buses?.plate_number ? ` • ${item.trips.buses.plate_number}` : ''}
            </Text>
          </View>
        )}

        <Text style={styles.descriptionText}>{item.description}</Text>

        {item.notes ? (
          <View style={styles.dispatchNoteBox}>
            <Text style={styles.dispatchNoteBadge}>DISPATCH RESPONSE</Text>
            <Text style={styles.dispatchNoteText}>{item.notes}</Text>
          </View>
        ) : null}
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Incident Center</Text>
          <Text style={styles.headerSub}>Fleet Operations Reports</Text>
        </View>
        <TouchableOpacity
          style={styles.headerIconBtn}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Text style={styles.headerIconText}>🚪</Text>
        </TouchableOpacity>
      </View>

      {/* Role Strip */}
      <View style={styles.roleStrip}>
        <View style={styles.roleDot} />
        <Text style={styles.roleText}>DRIVER · INCIDENT DISPATCH</Text>
      </View>

      {/* Report Button Card */}
      <View style={styles.heroActionContainer}>
        <TouchableOpacity
          style={styles.reportNewBtn}
          onPress={handleOpenModal}
          activeOpacity={0.88}
        >
          <Text style={styles.reportNewIcon}>🚨</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.reportNewTitle}>REPORT INCIDENT / DELAY</Text>
            <Text style={styles.reportNewSub}>Log immediate delay or vehicle issue to dispatch</Text>
          </View>
          <Text style={styles.reportNewArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterBar}>
        {(['ALL', 'REPORTED', 'IN_REVIEW', 'RESOLVED'] as FilterTab[]).map((tabKey) => {
          const isSelected = filter === tabKey;
          const label = tabKey === 'IN_REVIEW' ? 'Review' : tabKey.charAt(0) + tabKey.slice(1).toLowerCase();
          return (
            <TouchableOpacity
              key={tabKey}
              style={[styles.filterChip, isSelected && styles.filterChipActive]}
              onPress={() => setFilter(tabKey)}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Incidents List */}
      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={TEAL} />
          <Text style={styles.loadingText}>Loading reports...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredProblems}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[TEAL]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🛡️</Text>
              <Text style={styles.emptyTitle}>No Incidents Found</Text>
              <Text style={styles.emptySub}>
                {filter === 'ALL'
                  ? 'All runs smooth. No issues reported.'
                  : `No incidents in "${filter}" status.`}
              </Text>
            </View>
          }
        />
      )}

      {/* Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Report Delay / Incident</Text>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.fieldLabel}>Category</Text>
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

              <Text style={styles.fieldLabel}>Description</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Detail current location, road hazard, or delay..."
                placeholderTextColor="#94a3b8"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                value={description}
                onChangeText={setDescription}
                editable={!submitting}
              />

              <TouchableOpacity
                style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
                onPress={handleSubmitProblem}
                disabled={submitting}
                activeOpacity={0.85}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitBtnText}>Transmit to Dispatch</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <DriverTabBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: HEADER_BG,
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#ffffff' },
  headerSub: { fontSize: 12, color: '#99f6e4', marginTop: 1 },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconText: { fontSize: 18 },

  roleStrip: {
    backgroundColor: STRIP_BG,
    paddingHorizontal: 20,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  roleDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#2dd4bf' },
  roleText: { fontSize: 10, fontWeight: '800', color: '#99f6e4', letterSpacing: 1.2 },

  heroActionContainer: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6 },
  reportNewBtn: {
    backgroundColor: '#0f766e',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: TEAL_DARK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  reportNewIcon: { fontSize: 24 },
  reportNewTitle: { color: '#ffffff', fontSize: 13, fontWeight: '900', letterSpacing: 0.5 },
  reportNewSub: { color: '#99f6e4', fontSize: 11, marginTop: 1 },
  reportNewArrow: { color: '#99f6e4', fontSize: 20, fontWeight: '900' },

  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterChipActive: {
    backgroundColor: '#f0fdfa',
    borderColor: TEAL,
  },
  filterChipText: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  filterChipTextActive: { color: TEAL_DARK, fontWeight: '800' },

  listContent: { padding: 16, paddingBottom: 90 },

  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  typeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  typeIcon: { fontSize: 18 },
  cardTitle: { fontSize: 13, fontWeight: '800', color: '#0f172a' },
  cardDate: { fontSize: 11, color: '#94a3b8', marginTop: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, borderWidth: 1 },
  statusText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },

  routeTag: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  routeTagText: { fontSize: 11, color: '#475569', fontWeight: '600' },
  descriptionText: { fontSize: 13, color: '#334155', lineHeight: 18 },

  dispatchNoteBox: {
    backgroundColor: '#f0fdfa',
    borderColor: '#99f6e4',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
  },
  dispatchNoteBadge: { fontSize: 9, fontWeight: '800', color: TEAL_DARK, letterSpacing: 0.6, marginBottom: 2 },
  dispatchNoteText: { fontSize: 12, color: '#0f766e' },

  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  loadingText: { marginTop: 10, color: '#64748b', fontSize: 13 },

  emptyContainer: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: { fontSize: 32, marginBottom: 8 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
  emptySub: { fontSize: 12, color: '#64748b', textAlign: 'center' },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  modalTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  modalCloseBtn: { padding: 4 },
  modalCloseText: { fontSize: 16, color: '#64748b', fontWeight: '800' },
  modalBody: { marginBottom: 10 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: '#64748b', marginBottom: 8, textTransform: 'uppercase' },
  typeSelector: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
  typeOption: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  typeOptionSelected: { backgroundColor: '#f0fdfa', borderColor: TEAL },
  typeOptionText: { fontSize: 11, color: '#475569', fontWeight: '600' },
  typeOptionTextSelected: { color: TEAL_DARK, fontWeight: '800' },
  textInput: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    padding: 10,
    fontSize: 13,
    color: '#0f172a',
    height: 80,
    marginBottom: 14,
  },
  submitBtn: {
    backgroundColor: TEAL,
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '800' },
});
