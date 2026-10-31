import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Vibration,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  FadeIn,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { apiService } from '@/services/api';

const TEAL = '#0d9488';
const TEAL_DARK = '#0f766e';
const HEADER_BG = '#11423f';
const STRIP_BG = '#0d3835';

// Try to import camera safely
let CameraView: any = null;
let useCameraPermissions: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const cam = require('expo-camera');
  CameraView = cam.CameraView;
  useCameraPermissions = cam.useCameraPermissions;
} catch {
  // Manual mode fallback
}

export default function ScanTicketScreen() {
  const router = useRouter();
  const [manualToken, setManualToken] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [cameraMode, setCameraMode] = useState(false);
  const [torch, setTorch] = useState(false);

  const [permission, requestPermission] = useCameraPermissions
    ? useCameraPermissions()
    : [null, async () => {}];

  const scanLineY = useSharedValue(0);
  const scanLineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanLineY.value }],
  }));

  useEffect(() => {
    if (cameraMode) {
      scanLineY.value = withRepeat(
        withSequence(
          withTiming(200, { duration: 1600 }),
          withTiming(0, { duration: 1600 })
        ),
        -1,
        false
      );
    }
  }, [cameraMode, scanLineY]);

  const handleVerifyToken = async (tokenToVerify: string) => {
    const cleanToken = tokenToVerify.trim();
    if (!cleanToken || verifying) return;

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
        Alert.alert('Verification Notice', res.error || 'Ticket could not be verified.');
      }
    } catch {
      Alert.alert('Connection Error', 'Unable to reach server. Check network.');
    } finally {
      setVerifying(false);
      setScanned(false);
    }
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned || verifying) return;
    setScanned(true);
    Vibration.vibrate([0, 80, 40, 80]);
    void handleVerifyToken(data);
  };

  const enableCamera = async () => {
    if (!CameraView) {
      Alert.alert('Camera Unavailable', 'Camera module not found. Use manual token entry below.');
      return;
    }

    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Camera Permission Required', 'Please enable camera permission in device settings.');
        return;
      }
    }

    setCameraMode(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan Ticket</Text>
        {cameraMode ? (
          <TouchableOpacity
            style={[styles.torchBtn, torch && styles.torchBtnActive]}
            onPress={() => setTorch(!torch)}
            activeOpacity={0.7}
          >
            <Text style={styles.torchIcon}>{torch ? '🔦' : '💡'}</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 38 }} />
        )}
      </View>

      {/* Role Strip */}
      <View style={styles.roleStrip}>
        <View style={styles.roleDot} />
        <Text style={styles.roleText}>TICKET VERIFIER · BOARDING CHECK</Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* CAMERA VIEWFINDER CARD */}
          <Animated.View entering={FadeIn.duration(350)} style={styles.scannerCard}>
            {cameraMode && CameraView ? (
              <View style={styles.cameraBox}>
                <CameraView
                  style={styles.camera}
                  facing="back"
                  barcodeScannerSettings={{ barcodeTypes: ['qr', 'pdf417'] }}
                  onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                  enableTorch={torch}
                >
                  <View style={styles.overlayFrame}>
                    <View style={styles.reticleCornerTL} />
                    <View style={styles.reticleCornerTR} />
                    <View style={styles.reticleCornerBL} />
                    <View style={styles.reticleCornerBR} />
                    <Animated.View style={[styles.laserLine, scanLineStyle]} />
                  </View>
                </CameraView>

                <View style={styles.cameraActions}>
                  <Text style={styles.cameraPrompt}>
                    {scanned ? 'Processing QR...' : 'Align passenger QR inside frame'}
                  </Text>
                  <TouchableOpacity
                    style={styles.closeCamBtn}
                    onPress={() => { setCameraMode(false); setScanned(false); }}
                  >
                    <Text style={styles.closeCamText}>✕ Close Camera</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.openCamHero}
                onPress={enableCamera}
                activeOpacity={0.88}
              >
                <View style={styles.reticleBox}>
                  <View style={styles.reticleCornerTL} />
                  <View style={styles.reticleCornerTR} />
                  <View style={styles.reticleCornerBL} />
                  <View style={styles.reticleCornerBR} />
                  <View style={styles.camIconCircle}>
                    <Text style={styles.camIcon}>📷</Text>
                  </View>
                  <Text style={styles.camPromptTitle}>TAP TO OPEN CAMERA</Text>
                  <Text style={styles.camPromptSub}>Instant QR code validation</Text>
                </View>
              </TouchableOpacity>
            )}
          </Animated.View>

          {/* MANUAL ENTRY */}
          <Animated.View entering={FadeInDown.duration(400).delay(80)} style={styles.manualSection}>
            <Text style={styles.sectionLabel}>MANUAL TICKET ENTRY</Text>
            <View style={styles.inputCard}>
              <TextInput
                style={styles.input}
                placeholder="Enter Ticket # (e.g. ET-TKT-1001)"
                placeholderTextColor="#94a3b8"
                value={manualToken}
                onChangeText={setManualToken}
                autoCapitalize="characters"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={() => void handleVerifyToken(manualToken)}
              />
              <TouchableOpacity
                style={[
                  styles.verifyBtn,
                  (verifying || !manualToken.trim()) && styles.verifyBtnDisabled,
                ]}
                onPress={() => void handleVerifyToken(manualToken)}
                disabled={verifying || !manualToken.trim()}
                activeOpacity={0.88}
              >
                {verifying ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.verifyBtnText}>Verify</Text>
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* QUICK SAMPLES FOR RAPID TESTING */}
          <Animated.View entering={FadeInDown.duration(400).delay(140)} style={styles.testSection}>
            <Text style={styles.sectionLabel}>SAMPLE TICKET TOKENS</Text>
            <View style={styles.testChipsRow}>
              {[
                { label: 'Valid Sample', token: 'QR_VALID_TKT_001', color: '#15803d', bg: '#f0fdf4' },
                { label: 'Used Sample', token: 'QR_USED_TKT_002', color: '#b45309', bg: '#fffbeb' },
                { label: 'Invalid Token', token: 'INVALID_9999', color: '#b91c1c', bg: '#fef2f2' },
              ].map((item) => (
                <TouchableOpacity
                  key={item.token}
                  style={[styles.sampleChip, { backgroundColor: item.bg }]}
                  onPress={() => void handleVerifyToken(item.token)}
                  disabled={verifying}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.sampleChipText, { color: item.color }]}>
                    {item.label}
                  </Text>
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
  container: { flex: 1, backgroundColor: '#f8fafc' },
  flex: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: HEADER_BG,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { fontSize: 26, color: '#ffffff', fontWeight: '300', marginTop: -2 },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#ffffff' },
  torchBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  torchBtnActive: { backgroundColor: '#facc15' },
  torchIcon: { fontSize: 16 },

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

  scrollContent: { padding: 16, paddingBottom: 60 },

  scannerCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  openCamHero: { alignItems: 'center' },
  reticleBox: {
    width: '100%',
    height: 220,
    borderRadius: 12,
    backgroundColor: '#f0fdfa',
    borderWidth: 1,
    borderColor: '#ccfbf1',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  reticleCornerTL: { position: 'absolute', top: 12, left: 12, width: 22, height: 22, borderTopWidth: 3, borderLeftWidth: 3, borderColor: TEAL },
  reticleCornerTR: { position: 'absolute', top: 12, right: 12, width: 22, height: 22, borderTopWidth: 3, borderRightWidth: 3, borderColor: TEAL },
  reticleCornerBL: { position: 'absolute', bottom: 12, left: 12, width: 22, height: 22, borderBottomWidth: 3, borderLeftWidth: 3, borderColor: TEAL },
  reticleCornerBR: { position: 'absolute', bottom: 12, right: 12, width: 22, height: 22, borderBottomWidth: 3, borderRightWidth: 3, borderColor: TEAL },

  camIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#99f6e4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: TEAL,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  camIcon: { fontSize: 26 },
  camPromptTitle: { fontSize: 14, fontWeight: '900', color: TEAL_DARK, letterSpacing: 0.5 },
  camPromptSub: { fontSize: 12, color: '#64748b', marginTop: 2 },

  cameraBox: { borderRadius: 12, overflow: 'hidden' },
  camera: { width: '100%', height: 260 },
  overlayFrame: { flex: 1, position: 'relative', alignItems: 'center', justifyContent: 'center' },
  laserLine: { width: '80%', height: 2, backgroundColor: '#10b981', position: 'absolute', top: 30 },
  cameraActions: { backgroundColor: '#0f172a', padding: 12, alignItems: 'center' },
  cameraPrompt: { color: '#ffffff', fontSize: 12, fontWeight: '700', marginBottom: 8 },
  closeCamBtn: { paddingVertical: 4, paddingHorizontal: 12 },
  closeCamText: { color: '#94a3b8', fontSize: 12, fontWeight: '700' },

  manualSection: { marginBottom: 18 },
  sectionLabel: { fontSize: 11, fontWeight: '800', color: '#94a3b8', letterSpacing: 1, marginBottom: 8 },
  inputCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    padding: 6,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
    fontWeight: '600',
  },
  verifyBtn: {
    backgroundColor: TEAL,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyBtnDisabled: { opacity: 0.5 },
  verifyBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '800' },

  testSection: { marginBottom: 16 },
  testChipsRow: { flexDirection: 'row', gap: 8 },
  sampleChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sampleChipText: { fontSize: 11, fontWeight: '800' },
});
