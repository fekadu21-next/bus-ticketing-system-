import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useRouter, usePathname } from 'expo-router';

const ACTIVE_TEAL = '#0d9488';

export default function VerifierTabBar() {
  const router = useRouter();
  const pathname = usePathname();

  const isDashboard = pathname.includes('/verifier/dashboard') || pathname === '/verifier';
  const isScan = pathname.includes('/verifier/scan');
  const isHistory = pathname.includes('/verifier/history') || pathname.includes('/verifier/recent');
  const isProfile = pathname.includes('/verifier/profile');

  return (
    <View style={styles.tabBar}>
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => router.replace('/verifier/dashboard')}
        activeOpacity={0.7}
      >
        <Text style={[styles.tabIcon, isDashboard && styles.activeTabIcon]}>🏠</Text>
        <Text style={[styles.tabLabel, isDashboard && styles.activeTabLabel]}>Home</Text>
        {isDashboard && <View style={styles.activeIndicator} />}
      </TouchableOpacity>

      {/* Prominent Center Scan Button */}
      <TouchableOpacity
        style={styles.centerScanItem}
        onPress={() => router.push('/verifier/scan')}
        activeOpacity={0.88}
      >
        <View style={[styles.scanCircle, isScan && styles.activeScanCircle]}>
          <Text style={styles.scanCircleIcon}>📷</Text>
        </View>
        <Text style={[styles.scanLabel, isScan && styles.activeScanLabel]}>SCAN</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => router.replace('/verifier/history')}
        activeOpacity={0.7}
      >
        <Text style={[styles.tabIcon, isHistory && styles.activeTabIcon]}>📋</Text>
        <Text style={[styles.tabLabel, isHistory && styles.activeTabLabel]}>Recent</Text>
        {isHistory && <View style={styles.activeIndicator} />}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => router.replace('/verifier/profile')}
        activeOpacity={0.7}
      >
        <Text style={[styles.tabIcon, isProfile && styles.activeTabIcon]}>👤</Text>
        <Text style={[styles.tabLabel, isProfile && styles.activeTabLabel]}>Profile</Text>
        {isProfile && <View style={styles.activeIndicator} />}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingBottom: Platform.OS === 'ios' ? 16 : 10,
    paddingTop: 8,
    alignItems: 'center',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingVertical: 2,
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 2,
    opacity: 0.65,
  },
  activeTabIcon: {
    opacity: 1,
    transform: [{ scale: 1.08 }],
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    letterSpacing: 0.2,
  },
  activeTabLabel: {
    color: ACTIVE_TEAL,
    fontWeight: '800',
  },
  activeIndicator: {
    position: 'absolute',
    top: -8,
    width: 28,
    height: 3,
    backgroundColor: ACTIVE_TEAL,
    borderRadius: 2,
  },
  centerScanItem: {
    flex: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -20,
  },
  scanCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: ACTIVE_TEAL,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: ACTIVE_TEAL,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  activeScanCircle: {
    backgroundColor: '#0f766e',
    transform: [{ scale: 1.05 }],
  },
  scanCircleIcon: {
    fontSize: 22,
  },
  scanLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: ACTIVE_TEAL,
    marginTop: 3,
    letterSpacing: 0.6,
  },
  activeScanLabel: {
    color: '#0f766e',
  },
});
