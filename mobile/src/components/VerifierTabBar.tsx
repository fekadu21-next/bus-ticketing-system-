import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';

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
      </TouchableOpacity>

      {/* Prominent Center Scan Button */}
      <TouchableOpacity
        style={styles.centerScanItem}
        onPress={() => router.push('/verifier/scan')}
        activeOpacity={0.85}
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
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => router.replace('/verifier/profile')}
        activeOpacity={0.7}
      >
        <Text style={[styles.tabIcon, isProfile && styles.activeTabIcon]}>👤</Text>
        <Text style={[styles.tabLabel, isProfile && styles.activeTabLabel]}>Profile</Text>
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
    paddingBottom: 12,
    paddingTop: 8,
    alignItems: 'center',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 2,
    opacity: 0.7,
  },
  activeTabIcon: {
    opacity: 1,
    transform: [{ scale: 1.1 }],
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  activeTabLabel: {
    color: '#2563eb',
    fontWeight: '800',
  },
  centerScanItem: {
    flex: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -20,
  },
  scanCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  activeScanCircle: {
    backgroundColor: '#1d4ed8',
    transform: [{ scale: 1.05 }],
  },
  scanCircleIcon: {
    fontSize: 24,
  },
  scanLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2563eb',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  activeScanLabel: {
    color: '#1d4ed8',
  },
});
