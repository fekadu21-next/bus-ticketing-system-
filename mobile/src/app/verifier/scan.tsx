import React, { useState, useEffect, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Vibration,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown, useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence } from 'react-native-reanimated';
import { apiService } from '@/services/api';

// Try to import camera - gracefully degrade if not installed
let CameraView: any = null;
let useCameraPermissions: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const cam = require('expo-camera');
  CameraView = cam.CameraView;
  useCameraPermissions = cam.useCameraPermissions;
} catch {
  // expo-camera not available, manual mode only
}

export default function ScanTicketScreen() {
  const router = useRouter();
  const [manualToken, setManualToken] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [cameraMode, setCameraMode] = useState(false);
  const [torch, setTorch] = useState(false);

  // Camera permissions (only if expo-camera is available)
  const [permission, requestPermission] = useCameraPermissions
    ? useCameraPermissions()
    : [null, async () => {}];

  // Scanning line animation
  const scanLineY = useSharedValue(0);
  const scanLineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanLineY.value }],
  }));

  useEffect(() => {
    if (cameraMode) {
      scanLineY.value = withRepeat(
        withSequence(
          withTiming(220, { duration: 1800 }),
          withTiming(0, { duration: 1800 })
        ),
        -1,
        false
      );
    }
  }, [cameraMode, scanLineY]);

  const handleVerifyToken = async (tokenToVerify: string) => {
    const cleanToken = tokenToVerify.trim();
    if (!cleanToken) return;
    if (verifying) return;

    setVerifying(true);
    Vibration.vibrate(50);

    try {
      const res = await apiService.verifyTicket(cleanToken);
      if (res.success && res.data?.result) {
        router.push({
          pathname: '/verifier/result',
          params: { resultData: JSON.stringify(res.data.result) },
        });
      } else {
        Alert.alert('Verification Error', res.error || 'Could not verify ticket. Please try again.');
      }
    } catch {
      Alert.alert('Network Error', 'Unable to reach verification server. Check your connection.');
    } finally {
      setVerifying(false);
      setScanned(false);
    }
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned || verifying) return;
    setScanned(true);
    Vibration.vibrate([0, 100, 50, 100]);
    void handleVerifyToken(data);
  };

  const enableCamera = async () => {
    if (!CameraView) {
      Alert.alert(
        'Camera Not Available',
        'Camera module is not installed. Please use manual token entry.',
        [{ text: 'OK', onPress: () => setShowManual(true) }]
      );
      return;
    }

    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert(
          'Camera Permission Required',
          'To scan QR codes, please allow camera access in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Use Manual Entry', onPress: () => setShowManual(true) },
          ]
        );
        return;
      }
    }

    setCameraMode(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan Passenger Ticket</Text>
        {cameraMode ? (
          <TouchableOpacity
            style={[styles.torchButton, torch && styles.torchButtonActive]}
            onPress={() => setTorch(!torch)}
          >
            <Text style={styles.torchIcon}>{torch ? '🔦' : '💡'}</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.torchButton} />
        )}
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

          {/* CAMERA SCANNER OR VIEWFINDER */}
          <Animated.View entering={FadeIn.duration(400)} style={styles.scannerWrapper}>
            {cameraMode && CameraView ? (
              <View style={styles.cameraContainer}>
                <CameraView
                  style={styles.camera}
                  facing="back"
                  barcodeScannerSettings={{ barcodeTypes: ['qr', 'pdf417'] }}
                  onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                  enableTorch={torch}
                >
                  {/* Corner brackets overlay */}
                  <View style={styles.overlay}>
                    <View style={styles.topRow}>
                      <View style={styles.corner} />
                      <View style={styles.cornerRight} />
                    </View>
                    <View style={styles.middleRow}>
                      {/* Scanning line animation */}
                      <Animated.View style={[styles.scanLine, scanLineStyle]} />
                    </View>
                    <View style={styles.bottomRow}>
                      <View style={styles.cornerBL} />
                      <View style={styles.cornerBR} />
                    </View>
                  </View>
                </CameraView>

                <View style={styles.cameraFooter}>
                  {verifying ? (
                    <View style={styles.verifyingBanner}>
                      <ActivityIndicator color="#ffffff" size="small" />
                      <Text style={styles.verifyingText}>VERIFYING WITH SERVER...</Text>
                    </View>
                  ) : (
                    <Text style={styles.cameraGuide}>
                      {scanned ? '✓ QR Scanned — Processing...' : 'Point camera at passenger QR code'}
                    </Text>
                  )}
                  <TouchableOpacity
                    style={styles.exitCameraBtn}
                    onPress={() => { setCameraMode(false); setScanned(false); }}
                  >
                    <Text style={styles.exitCameraText}>✕ Close Camera</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              /* Simulated viewfinder when camera not active */
              <View>
                <TouchableOpacity
                  style={styles.activateCameraBtn}
                  onPress={enableCamera}
                  activeOpacity={0.88}
                >
                  <View style={styles.cameraBoxFrame}>
                    <View style={[styles.corner, { top: -2, left: -2 }]} />
                    <View style={[styles.cornerRight, { top: -2, right: -2 }]} />
                    <View style={[styles.cornerBL, { bottom: -2, left: -2 }]} />
                    <View style={[styles.cornerBR, { bottom: -2, right: -2 }]} />
                    <View style={styles.cameraBoxInner}>
                      <Text style={styles.cameraIconLarge}>📷</Text>
                      <Text style={styles.tapToScanText}>TAP TO OPEN CAMERA</Text>
                      <Text style={styles.tapToScanSub}>Scan passenger QR ticket</Text>
                    </View>
                  </View>
                </TouchableOpacity>
                <Text style={styles.guideText}>Point camera at QR code on passenger's ticket or phone screen</Text>
              </View>
            )}
          </Animated.View>

          {/* MANUAL TOKEN INPUT */}
          <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.section}>
            <TouchableOpacity
              style={styles.toggleManualBtn}
              onPress={() => setShowManual(!showManual)}
              activeOpacity={0.8}
            >
              <Text style={styles.toggleManualText}>
                ⌨️ {showManual ? 'Hide Manual Entry' : 'Enter Ticket Token Manually'}
              </Text>
              <Text style={styles.toggleChevron}>{showManual ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            {showManual && (
              <View style={styles.manualCard}>
                <Text style={styles.inputLabel}>Enter Ticket Number / QR Token</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. TKT-000123 or paste QR token"
                  placeholderTextColor="#94a3b8"
                  value={manualToken}
                  onChangeText={setManualToken}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={() => void handleVerifyToken(manualToken)}
                />
                <TouchableOpacity
                  style={[styles.verifyManualBtn, (verifying || !manualToken.trim()) && styles.disabledBtn]}
                  onPress={() => void handleVerifyToken(manualToken)}
                  disabled={verifying || !manualToken.trim()}
                  activeOpacity={0.85}
                >
                  {verifying ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={styles.verifyManualText}>✓ VERIFY TICKET</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>

          {/* VERIFICATION STATUS LEGEND */}
          <Animated.View entering={FadeInDown.duration(400).delay(200)} style={styles.legendCard}>
            <Text style={styles.legendTitle}>VERIFICATION OUTCOMES</Text>
            <View style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
              <Text style={styles.legendText}><Text style={styles.legendBold}>VALID</Text> — Allow boarding</Text>
            </View>
            <View style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]} />
              <Text style={styles.legendText}><Text style={styles.legendBold}>ALREADY USED</Text> — Reject boarding</Text>
            </View>
            <View style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} />
              <Text style={styles.legendText}><Text style={styles.legendBold}>INVALID</Text> — Unknown / forged QR</Text>
            </View>
            <View style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: '#dc2626' }]} />
              <Text style={styles.legendText}><Text style={styles.legendBold}>CANCELLED</Text> — Ticket was refunded</Text>
            </View>
            <View style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: '#ea580c' }]} />
              <Text style={styles.legendText}><Text style={styles.legendBold}>WRONG TRIP</Text> — Different route</Text>
            </View>
          </Animated.View>

          {/* QUICK TEST BUTTONS (for development/demo use) */}
          <Animated.View entering={FadeInDown.duration(400).delay(300)} style={styles.devSection}>
            <Text style={styles.devSectionTitle}>🧪 QUICK VERIFICATION TEST</Text>
            <Text style={styles.devSectionSub}>Test different scan outcomes against live backend:</Text>

            <View style={styles.testGrid}>
              {[
                { label: '✓ VALID', token: 'QR_VALID_TKT_001', color: '#059669', bg: 'rgba(16,185,129,0.1)', border: '#059669' },
                { label: '⚠ ALREADY USED', token: 'QR_USED_TKT_002', color: '#d97706', bg: 'rgba(245,158,11,0.1)', border: '#d97706' },
                { label: '✕ CANCELLED', token: 'QR_CANCELLED_TKT_003', color: '#b91c1c', bg: 'rgba(239,68,68,0.1)', border: '#b91c1c' },
                { label: '✕ WRONG TRIP', token: 'QR_WRONG_TRIP_SKY_001', color: '#ea580c', bg: 'rgba(249,115,22,0.1)', border: '#ea580c' },
                { label: '✕ INVALID', token: 'FORGED_TOKEN_999', color: '#dc2626', bg: 'rgba(239,68,68,0.1)', border: '#ef4444' },
              ].map((item) => (
                <TouchableOpacity
                  key={item.token}
                  style={[styles.testBtn, { backgroundColor: item.bg, borderColor: item.border }]}
                  onPress={() => void handleVerifyToken(item.token)}
                  disabled={verifying}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.testBtnLabel, { color: item.color }]}>{item.label}</Text>
                  <Text style={styles.testBtnToken}>{item.token.slice(0, 16)}</Text>
                </TouchableOpacity>
              ))}
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
    width: 40,
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
    flex: 1,
    textAlign: 'center',
  },
  torchButton: {
    width: 40,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  torchButtonActive: {
    backgroundColor: '#2563eb',
  },
  torchIcon: {
    fontSize: 16,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  scannerWrapper: {
    alignItems: 'center',
    marginBottom: 20,
  },
  // Camera active mode
  cameraContainer: {
    width: '100%',
    borderRadius: 18,
    overflow: 'hidden',
  },
  camera: {
    width: '100%',
    height: 300,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 30,
    paddingTop: 30,
  },
  middleRow: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 40,
    overflow: 'hidden',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 30,
    paddingBottom: 30,
  },
  corner: {
    width: 24,
    height: 24,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#2dd4bf',
    borderTopLeftRadius: 6,
  },
  cornerRight: {
    width: 24,
    height: 24,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: '#2dd4bf',
    borderTopRightRadius: 6,
  },
  cornerBL: {
    width: 24,
    height: 24,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#2dd4bf',
    borderBottomLeftRadius: 6,
  },
  cornerBR: {
    width: 24,
    height: 24,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: '#2dd4bf',
    borderBottomRightRadius: 6,
  },
  scanLine: {
    height: 2,
    backgroundColor: '#2dd4bf',
    borderRadius: 2,
    shadowColor: '#2dd4bf',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
  cameraFooter: {
    backgroundColor: '#1e293b',
    padding: 14,
    alignItems: 'center',
    gap: 10,
  },
  verifyingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  verifyingText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  cameraGuide: {
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
  },
  exitCameraBtn: {
    backgroundColor: '#334155',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  exitCameraText: {
    color: '#f1f5f9',
    fontSize: 13,
    fontWeight: '600',
  },
  // Inactive camera placeholder
  activateCameraBtn: {
    alignItems: 'center',
    marginBottom: 12,
  },
  cameraBoxFrame: {
    width: 260,
    height: 260,
    backgroundColor: 'rgba(15,118,110,0.12)',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cameraBoxInner: {
    alignItems: 'center',
  },
  cameraIconLarge: {
    fontSize: 52,
    marginBottom: 10,
  },
  tapToScanText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#2dd4bf',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  tapToScanSub: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  guideText: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
  },
  // Manual input
  section: {
    marginBottom: 16,
  },
  toggleManualBtn: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  toggleManualText: {
    color: '#2dd4bf',
    fontSize: 14,
    fontWeight: '700',
  },
  toggleChevron: {
    color: '#2dd4bf',
    fontSize: 12,
  },
  manualCard: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#cbd5e1',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#475569',
    borderRadius: 10,
    padding: 13,
    fontSize: 15,
    color: '#ffffff',
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  verifyManualBtn: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  verifyManualText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  disabledBtn: {
    opacity: 0.5,
  },
  // Legend
  legendCard: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 8,
  },
  legendTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#64748b',
    letterSpacing: 1,
    marginBottom: 6,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 13,
    color: '#94a3b8',
  },
  legendBold: {
    fontWeight: '800',
    color: '#f1f5f9',
  },
  // Dev test buttons
  devSection: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  devSectionTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#64748b',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  devSectionSub: {
    fontSize: 12,
    color: '#475569',
    marginBottom: 14,
  },
  testGrid: {
    gap: 8,
  },
  testBtn: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  testBtnLabel: {
    fontWeight: '800',
    fontSize: 13,
  },
  testBtnToken: {
    color: '#64748b',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
});
