import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useRouter, usePathname } from 'expo-router';

const ACTIVE_TEAL = '#0d9488';

export default function DriverTabBar() {
  const router = useRouter();
  const pathname = usePathname();

  const isDashboard = pathname === '/driver' || pathname === '/dashboard' || pathname === '/';
  const isTrips = pathname.startsWith('/driver/trips') || pathname.startsWith('/trips');
  const isIncidents = pathname.startsWith('/driver/incidents');
  const isProfile = pathname.startsWith('/driver/profile') || pathname === '/profile';

  return (
    <View style={styles.tabBar}>
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => router.replace('/driver' as any)}
        activeOpacity={0.7}
      >
        <Text style={[styles.tabIcon, isDashboard && styles.activeTabIcon]}>🏠</Text>
        <Text style={[styles.tabLabel, isDashboard && styles.activeTabLabel]}>Home</Text>
        {isDashboard && <View style={styles.activeIndicator} />}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => router.replace('/driver/trips' as any)}
        activeOpacity={0.7}
      >
        <Text style={[styles.tabIcon, isTrips && styles.activeTabIcon]}>🚌</Text>
        <Text style={[styles.tabLabel, isTrips && styles.activeTabLabel]}>Runs</Text>
        {isTrips && <View style={styles.activeIndicator} />}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => router.replace('/driver/incidents' as any)}
        activeOpacity={0.7}
      >
        <Text style={[styles.tabIcon, isIncidents && styles.activeTabIcon]}>🚨</Text>
        <Text style={[styles.tabLabel, isIncidents && styles.activeTabLabel]}>Incidents</Text>
        {isIncidents && <View style={styles.activeIndicator} />}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => router.replace('/driver/profile' as any)}
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
    paddingVertical: 2,
    position: 'relative',
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
});
