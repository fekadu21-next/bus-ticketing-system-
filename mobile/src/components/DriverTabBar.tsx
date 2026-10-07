import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

export default function DriverTabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Do you want to log out of the Driver App?', [
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

  const isDashboard = pathname === '/dashboard' || pathname === '/';
  const isTrips = pathname.startsWith('/trips');
  const isProfile = pathname === '/profile';

  return (
    <View style={styles.tabBar}>
      <TouchableOpacity
        style={[styles.tabItem, isDashboard && styles.activeTabItem]}
        onPress={() => router.replace('/dashboard')}
        activeOpacity={0.7}
      >
        <Text style={styles.tabIcon}>🏠</Text>
        <Text style={[styles.tabLabel, isDashboard && styles.activeTabLabel]}>Dashboard</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tabItem, isTrips && styles.activeTabItem]}
        onPress={() => router.replace('/trips')}
        activeOpacity={0.7}
      >
        <Text style={styles.tabIcon}>🚌</Text>
        <Text style={[styles.tabLabel, isTrips && styles.activeTabLabel]}>My Trips</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tabItem, isProfile && styles.activeTabItem]}
        onPress={() => router.replace('/profile')}
        activeOpacity={0.7}
      >
        <Text style={styles.tabIcon}>👤</Text>
        <Text style={[styles.tabLabel, isProfile && styles.activeTabLabel]}>Profile</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.tabItem}
        onPress={handleLogout}
        activeOpacity={0.7}
      >
        <Text style={styles.tabIcon}>🚪</Text>
        <Text style={styles.logoutTabLabel}>Sign Out</Text>
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
    paddingBottom: 10,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  activeTabItem: {
    transform: [{ scale: 1.05 }],
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  activeTabLabel: {
    color: '#0f766e',
    fontWeight: '800',
  },
  logoutTabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ef4444',
  },
});
