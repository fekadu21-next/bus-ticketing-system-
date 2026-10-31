import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Theme } from '@/constants/theme';

export default function LandingPage() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#071833', '#0b2447', '#172554']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {/* Logo Badge */}
          <View style={styles.logoBadgeContainer}>
            <View style={styles.logoIconWrap}>
              <Text style={styles.logoIcon}>🚌</Text>
            </View>
            <View style={styles.verifiedTag}>
              <Text style={styles.verifiedText}>Fast & Verified</Text>
            </View>
          </View>

          {/* Brand Titles */}
          <Text style={styles.title}>{Theme.brand.name}</Text>
          <Text style={styles.tagline}>{Theme.brand.tagline}</Text>
          <Text style={styles.taglineAm}>{Theme.brand.taglineAm}</Text>
          <Text style={styles.description}>{Theme.brand.description}</Text>

          {/* Highlights */}
          <View style={styles.badgeRow}>
            <View style={styles.pillBadge}>
              <Text style={styles.pillText}>🛡️ Licensed Fleets</Text>
            </View>
            <View style={styles.pillBadge}>
              <Text style={styles.pillText}>⚡ Instant QR</Text>
            </View>
            <View style={styles.pillBadge}>
              <Text style={styles.pillText}>💳 Digital Pay</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttons}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.push('/login')}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryButtonText}>Sign In</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => router.push('/register')}
              activeOpacity={0.85}
            >
              <Text style={styles.secondaryButtonText}>Create Account</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.guestButton}
              onPress={() => router.push('/passenger/home')}
              activeOpacity={0.7}
            >
              <Text style={styles.guestButtonText}>Browse Buses as Guest →</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.footerText}>Secure Booking Powered by BusTicket Ethiopia</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#071833',
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  logoBadgeContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: 'rgba(37, 99, 235, 0.25)',
    borderWidth: 1.5,
    borderColor: 'rgba(191, 219, 254, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
  },
  logoIcon: {
    fontSize: 48,
  },
  verifiedTag: {
    marginTop: -10,
    backgroundColor: '#2563eb',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: Theme.radius.full,
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  verifiedText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 34,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  tagline: {
    fontSize: 18,
    fontWeight: '700',
    color: '#93c5fd',
    marginBottom: 2,
  },
  taglineAm: {
    fontSize: 15,
    fontWeight: '600',
    color: '#bfdbfe',
    marginBottom: 8,
  },
  description: {
    fontSize: 13,
    color: '#cbd5e1',
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 18,
    marginBottom: 24,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 36,
  },
  pillBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Theme.radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  pillText: {
    fontSize: 11,
    color: '#f8fafc',
    fontWeight: '600',
  },
  buttons: {
    width: '100%',
    gap: 12,
    marginBottom: 28,
  },
  primaryButton: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: 15,
    borderRadius: Theme.radius.md,
    alignItems: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 15,
    borderRadius: Theme.radius.md,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  guestButton: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  guestButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#bfdbfe',
  },
  footerText: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'center',
  },
});
