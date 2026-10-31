import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';

// Web-matching rose/pink color palette
const ROSE = '#2563eb';
const ROSE_DARK = '#1d4ed8';

export default function PassengerTabBar() {
  const router = useRouter();
  const pathname = usePathname();

  const isHome = pathname.includes('/passenger/home') || pathname === '/passenger';
  const isTrips = pathname.includes('/passenger/trips') || pathname.includes('/passenger/trip/');
  const isBookings = pathname.includes('/passenger/bookings') || pathname.includes('/passenger/ticket');
  const isProfile = pathname.includes('/passenger/profile');

  return (
    <View style={styles.tabBar}>
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => router.replace('/passenger/home')}
        activeOpacity={0.7}
      >
        <Text style={[styles.tabIcon, isHome && styles.activeTabIcon]}>🏠</Text>
        <Text style={[styles.tabLabel, isHome && styles.activeTabLabel]}>Home</Text>
        {isHome && <View style={styles.activeIndicator} />}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => router.replace('/passenger/trips')}
        activeOpacity={0.7}
      >
        <Text style={[styles.tabIcon, isTrips && styles.activeTabIcon]}>🔍</Text>
        <Text style={[styles.tabLabel, isTrips && styles.activeTabLabel]}>Find Bus</Text>
        {isTrips && <View style={styles.activeIndicator} />}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.centerItem}
        onPress={() => router.replace('/passenger/bookings')}
        activeOpacity={0.85}
      >
        <View style={[styles.centerCircle, isBookings && styles.activeCenterCircle]}>
          <Text style={styles.centerIcon}>🎫</Text>
        </View>
        <Text style={[styles.centerLabel, isBookings && styles.activeCenterLabel]}>My Tickets</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => router.replace('/passenger/profile')}
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
    borderTopColor: '#f1f5f9',
    paddingBottom: 16,
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
    position: 'relative',
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 2,
    opacity: 0.5,
  },
  activeTabIcon: {
    opacity: 1,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
  },
  activeTabLabel: {
    color: ROSE,
    fontWeight: '800',
  },
  activeIndicator: {
    position: 'absolute',
    top: -8,
    width: 28,
    height: 3,
    borderRadius: 2,
    backgroundColor: ROSE,
  },
  centerItem: {
    flex: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -18,
  },
  centerCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: ROSE,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: ROSE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  activeCenterCircle: {
    backgroundColor: ROSE_DARK,
  },
  centerIcon: {
    fontSize: 22,
  },
  centerLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: ROSE,
    marginTop: 4,
  },
  activeCenterLabel: {
    color: ROSE_DARK,
    fontWeight: '800',
  },
});
