import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';

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
        style={[styles.tabItem, isDashboard && styles.activeTabItem]}
        onPress={() => router.replace('/driver' as any)}
        activeOpacity={0.7}
      >
        <Text style={[styles.tabIcon, isDashboard && styles.activeTabIcon]}>🏠</Text>
        <Text style={[styles.tabLabel, isDashboard && styles.activeTabLabel]}>Dashboard</Text>
        {isDashboard && <View style={styles.activeIndicator} />}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tabItem, isTrips && styles.activeTabItem]}
        onPress={() => router.replace('/driver/trips' as any)}
        activeOpacity={0.7}
      >
        <Text style={[styles.tabIcon, isTrips && styles.activeTabIcon]}>🚌</Text>
        <Text style={[styles.tabLabel, isTrips && styles.activeTabLabel]}>My Trips</Text>
        {isTrips && <View style={styles.activeIndicator} />}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tabItem, isIncidents && styles.activeTabItem]}
        onPress={() => router.replace('/driver/incidents' as any)}
        activeOpacity={0.7}
      >
        <Text style={[styles.tabIcon, isIncidents && styles.activeTabIcon]}>🚨</Text>
        <Text style={[styles.tabLabel, isIncidents && styles.activeTabLabel]}>Incidents</Text>
        {isIncidents && <View style={styles.activeIndicator} />}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tabItem, isProfile && styles.activeTabItem]}
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
    paddingBottom: 8,
    paddingTop: 8,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    position: 'relative',
  },
  activeTabItem: {
    transform: [{ scale: 1.02 }],
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 2,
    opacity: 0.85,
  },
  activeTabIcon: {
    opacity: 1,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    letterSpacing: 0.2,
  },
  activeTabLabel: {
    color: '#0f766e',
    fontWeight: '800',
  },
  activeIndicator: {
    position: 'absolute',
    top: -8,
    width: 28,
    height: 3,
    backgroundColor: '#0f766e',
    borderRadius: 2,
  },
});
