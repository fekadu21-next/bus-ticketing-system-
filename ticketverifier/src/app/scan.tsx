import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { apiService } from '@/services/api';

export default function ScanTicketScreen() {
  const router = useRouter();
  const [manualToken, setManualToken] = useState('');
  const [flashOn, setFlashOn] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [showManual, setShowManual] = useState(false);

  const handleVerifyToken = async (tokenToVerify: string) => {
    const cleanToken = tokenToVerify.trim();
    if (!cleanToken) return;

    setVerifying(true);
    try {
      const res = await apiService.verifyTicket(cleanToken);
      if (res.success && res.data?.result) {
        // Navigate to result screen with verification data encoded in JSON
        router.push({
          pathname: '/result',
          params: { resultData: JSON.stringify(res.data.result) },
        });
      }
    } finally {
      setVerifying(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan Passenger Ticket</Text>
        <TouchableOpacity style={styles.flashButton} onPress={() => setFlashOn(!flashOn)}>
          <Text style={styles.flashIcon}>{flashOn ? '🔦 ON' : '💡 OFF'}</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* CAMERA VIEWFINDER SIMULATION / INTERFACE */}
          <Animated.View entering={FadeIn.duration(400)} style={styles.scannerWrapper}>
            <View style={[styles.cameraBox, flashOn && styles.cameraBoxFlash]}>
              {/* Corner target lines */}
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />

              <View style={styles.targetCenter}>
                <Text style={styles.qrIcon}>▣</Text>
                <Text style={styles.scanningPulse}>
                  {verifying ? 'VERIFYING WITH SERVER...' : 'Scanning for QR Code...'}
                </Text>
              </View>
            </View>
            <Text style={styles.guideText}>Place passenger QR code inside the frame</Text>
          </Animated.View>

          {/* MANUAL TOKEN INPUT OR TOGGLE */}
          <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.section}>
            <TouchableOpacity
              style={styles.toggleManualBtn}
              onPress={() => setShowManual(!showManual)}
              activeOpacity={0.8}
            >
              <Text style={styles.toggleManualText}>
                ⌨️ {showManual ? 'Hide Manual Entry' : 'Enter Ticket Token Manually'}
              </Text>
            </TouchableOpacity>

            {showManual && (
              <View style={styles.manualCard}>
                <Text style={styles.inputLabel}>Enter Ticket / QR Token</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. TKT-000123"
                  placeholderTextColor="#94a3b8"
                  value={manualToken}
                  onChangeText={setManualToken}
                  autoCapitalize="characters"
                />
                <TouchableOpacity
                  style={[styles.verifyManualBtn, verifying && styles.disabledBtn]}
                  onPress={() => handleVerifyToken(manualToken)}
                  disabled={verifying}
                  activeOpacity={0.85}
                >
                  {verifying ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={styles.verifyManualText}>VERIFY TICKET</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>

          {/* QUICK PRESET TEST TOKENS (For fast verification testing) */}
          <Animated.View entering={FadeInDown.duration(400).delay(200)} style={styles.presetSection}>
            <Text style={styles.presetTitle}>⚡ QUICK TEST PRESETS</Text>
            <Text style={styles.presetSub}>Tap any token to simulate live scan outcomes:</Text>

            <View style={styles.presetGrid}>
              <TouchableOpacity
                style={[styles.presetCard, styles.validPreset]}
                onPress={() => handleVerifyToken('TKT-VALID-101')}
                disabled={verifying}
              >
                <Text style={styles.presetBadge}>✓ VALID</Text>
                <Text style={styles.presetToken}>TKT-VALID-101</Text>
                <Text style={styles.presetDesc}>Allow Boarding</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.presetCard, styles.usedPreset]}
                onPress={() => handleVerifyToken('TKT-USED-202')}
                disabled={verifying}
              >
                <Text style={styles.presetBadgeUsed}>⚠ ALREADY USED</Text>
                <Text style={styles.presetToken}>TKT-USED-202</Text>
                <Text style={styles.presetDesc}>Reject Boarding</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.presetCard, styles.invalidPreset]}
                onPress={() => handleVerifyToken('BAD_TOKEN')}
                disabled={verifying}
              >
                <Text style={styles.presetBadgeInvalid}>✕ INVALID</Text>
                <Text style={styles.presetToken}>BAD_TOKEN</Text>
                <Text style={styles.presetDesc}>Reject Boarding</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.presetCard, styles.cancelPreset]}
                onPress={() => handleVerifyToken('TKT-CANCEL-303')}
                disabled={verifying}
              >
                <Text style={styles.presetBadgeCancel}>✕ CANCELLED</Text>
                <Text style={styles.presetToken}>TKT-CANCEL-303</Text>
                <Text style={styles.presetDesc}>Reject Boarding</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.presetCard, styles.wrongPreset]}
                onPress={() => handleVerifyToken('TKT-WRONG-404')}
                disabled={verifying}
              >
                <Text style={styles.presetBadgeWrong}>✕ WRONG TRIP</Text>
                <Text style={styles.presetToken}>TKT-WRONG-404</Text>
                <Text style={styles.presetDesc}>Reject Boarding</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  backButton: {
    padding: 6,
  },
  backButtonText: {
    fontSize: 22,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#ffffff',
  },
  flashButton: {
    backgroundColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  flashIcon: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '700',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  scannerWrapper: {
    alignItems: 'center',
    marginBottom: 20,
  },
  cameraBox: {
    width: 250,
    height: 250,
    backgroundColor: 'rgba(15, 118, 110, 0.15)',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#0f766e',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 12,
  },
  cameraBoxFlash: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderColor: '#38bdf8',
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: '#2dd4bf',
  },
  topLeft: {
    top: -2,
    left: -2,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 10,
  },
  topRight: {
    top: -2,
    right: -2,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 10,
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 10,
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 10,
  },
  targetCenter: {
    alignItems: 'center',
  },
  qrIcon: {
    fontSize: 48,
    color: '#2dd4bf',
    marginBottom: 8,
  },
  scanningPulse: {
    fontSize: 13,
    color: '#99f6e4',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  guideText: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
  },
  toggleManualBtn: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  toggleManualText: {
    color: '#2dd4bf',
    fontSize: 13,
    fontWeight: '700',
  },
  manualCard: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 16,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#cbd5e1',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#475569',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: '#ffffff',
    marginBottom: 12,
  },
  verifyManualBtn: {
    backgroundColor: '#0f766e',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  verifyManualText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  disabledBtn: {
    opacity: 0.6,
  },
  presetSection: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#334155',
  },
  presetTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#94a3b8',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  presetSub: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 14,
  },
  presetGrid: {
    gap: 10,
  },
  presetCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  validPreset: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: '#059669',
  },
  usedPreset: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: '#d97706',
  },
  invalidPreset: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: '#dc2626',
  },
  cancelPreset: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: '#b91c1c',
  },
  wrongPreset: {
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
    borderColor: '#ea580c',
  },
  presetBadge: {
    color: '#10b981',
    fontWeight: '900',
    fontSize: 12,
    width: 90,
  },
  presetBadgeUsed: {
    color: '#f59e0b',
    fontWeight: '900',
    fontSize: 11,
    width: 110,
  },
  presetBadgeInvalid: {
    color: '#ef4444',
    fontWeight: '900',
    fontSize: 12,
    width: 90,
  },
  presetBadgeCancel: {
    color: '#f87171',
    fontWeight: '900',
    fontSize: 11,
    width: 100,
  },
  presetBadgeWrong: {
    color: '#fb923c',
    fontWeight: '900',
    fontSize: 11,
    width: 100,
  },
  presetToken: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  presetDesc: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
  },
});
