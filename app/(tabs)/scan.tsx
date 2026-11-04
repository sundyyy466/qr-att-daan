
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import {
  Camera,
  CameraView,
  useCameraPermissions,
  type BarcodeScanningResult,
} from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';

import AppButton from '@/components/AppButton';
import { useAuth } from '@/lib/auth';
import { registerAttendance } from '@/lib/attendance';
import { getUserRole } from '@/lib/profiles';

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const { user } = useAuth();
  const [flashEnabled, setFlashEnabled] = useState(false);

  const [role, setRole] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);
  const [scanned, setScanned] = useState(false);
  const [lastData, setLastData] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      if (!user) {
        setRoleLoading(false);
        return () => {
          active = false;
        };
      }

      setRoleLoading(true);

      getUserRole(user.id)
        .then((userRole) => {
          if (!active) return;
          setRole(userRole ?? 'student');
        })
        .catch(() => {
          if (active) setRole(null);
        })
        .finally(() => {
          if (active) setRoleLoading(false);
        });

      return () => {
        active = false;
      };
    }, [user])
  );

  const handleBarcodeScanned = async (
    result: BarcodeScanningResult
  ) => {
    if (scanned) return;

    setScanned(true);
    setLastData(result.data);
    setMessage('Checking QR code...');
    setSuccess(false);

    try {
      const studentId = user?.id;

      if (!studentId) {
        setMessage('You must be logged in to record attendance.');
        return;
      }

      const attendanceResult = await registerAttendance(
        result.data,
        studentId
      );

      setMessage(attendanceResult.message);

      if (attendanceResult.eventTitle) {
        setLastData(attendanceResult.eventTitle);
      }

      setSuccess(attendanceResult.success);
    } catch (error) {
      console.error('Attendance registration error:', error);
      setMessage('Something went wrong while recording attendance.');
      setSuccess(false);
    }
  };

  const handleScanAgain = () => {
    setScanned(false);
    setLastData(null);
    setMessage(null);
    setSuccess(false);
  };
  





const handlePickFromGallery = async () => {
  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 1,
    });

    if (result.canceled || !result.assets?.[0]?.uri) {
      return;
    }

    setScanned(true);
    setLastData(null);
    setMessage('Reading QR code from image...');
    setSuccess(false);

    const qrResults = await Camera.scanFromURLAsync(
      result.assets[0].uri,
      ['qr']
    );

    const qr = qrResults.find((item) => item.type === 'qr');

    if (!qr?.data) {
      setMessage('No QR code found. Please choose a clear QR image.');
      setScanned(false);
      return;
    }

    setScanned(false);

    await handleBarcodeScanned({
      type: 'qr',
      data: qr.data,
      cornerPoints: qr.cornerPoints ?? [],
      bounds: qr.bounds ?? {
        origin: { x: 0, y: 0 },
        size: { width: 0, height: 0 },
      },
    });
  } catch (error) {
    console.error('Gallery QR scan error:', error);
    setScanned(false);
    setMessage('Could not read this image. Please try another QR image.');
    setSuccess(false);
  }
};




  if (roleLoading) {
    return (
      <View style={styles.permissionContainer}>
        <ActivityIndicator size="large" color="#39C9B0" />
        <Text style={styles.subtitle}>Checking your account...</Text>
      </View>
    );
  }

  if (role !== 'student') {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="lock-closed-outline" size={42} color="#398D91" />
        <Text style={styles.title}>Students Only</Text>
        <Text style={styles.subtitle}>
          This section is available only to student accounts.
        </Text>
      </View>
    );
  }

  if (!permission) {
    return (
      <View style={styles.permissionContainer}>
        <ActivityIndicator size="large" color="#39C9B0" />
        <Text style={styles.subtitle}>Loading camera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="camera-outline" size={48} color="#398D91" />
        <Text style={styles.title}>Camera Permission Needed</Text>
        <Text style={styles.subtitle}>
          Allow camera access to scan event QR codes.
        </Text>
        <AppButton
          theme="primary"
          title="Grant Permission"
          icon="camera"
          onPress={requestPermission}
        />
      </View>
    );
  }

  if (scanned) {
    return (
      <SafeAreaView style={styles.resultScreen}>
        <StatusBar barStyle="dark-content" backgroundColor="#F1FCFF" />

        <Pressable
          style={styles.backButton}
          onPress={() => router.replace('/(tabs)')}
          accessibilityRole="button"
          accessibilityLabel="Back to Home"
        >
          <Ionicons name="chevron-back" size={26} color="#163B62" />
        </Pressable>

        <View style={styles.resultContent}>
          <View
            style={[
              styles.resultIcon,
              { backgroundColor: success ? '#D9F9E9' : '#FFF0F0' },
            ]}
          >
            <Ionicons
              name={success ? 'checkmark' : 'alert-circle-outline'}
              size={54}
              color={success ? '#16A779' : '#D64545'}
            />
          </View>

          <Text style={styles.resultTitle}>
            {success ? 'Attendance Recorded!' : 'Scan Result'}
          </Text>

          <Text style={styles.resultSubtitle}>
            {message ?? 'Your scan has been processed.'}
          </Text>

          <View style={styles.eventCard}>
            <View style={styles.eventIcon}>
              <Ionicons name="calendar" size={27} color="#2879ED" />
            </View>
            <View style={styles.eventText}>
              <Text style={styles.eventTitle}>
                {lastData ?? 'Event details'}
              </Text>
              <Text style={styles.eventDescription}>
                {success
                  ? 'Your attendance has been saved.'
                  : 'Please check the result above.'}
              </Text>
            </View>
          </View>

          <Pressable
            style={styles.homeButton}
            onPress={() => router.replace('/(tabs)')}
            accessibilityRole="button"
          >
            <Text style={styles.homeButtonText}>Back to Home</Text>
          </Pressable>

          <Pressable
            style={styles.historyButton}
            onPress={() => router.push('/history')}
            accessibilityRole="button"
          >
            <Ionicons name="time-outline" size={20} color="#167C94" />
            <Text style={styles.historyButtonText}>View History</Text>
          </Pressable>

          <Pressable
            style={styles.scanAgainButton}
            onPress={handleScanAgain}
            accessibilityRole="button"
          >
            <Ionicons name="refresh-outline" size={18} color="#526A83" />
            <Text style={styles.scanAgainText}>Scan Another QR Code</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#10212D" />

      <CameraView
  style={StyleSheet.absoluteFillObject}
  facing="back"
  enableTorch={torchOn}
  zoom={0.1}
  barcodeScannerSettings={{
    barcodeTypes: ['qr'],
  }}
  onBarcodeScanned={
  scanned
    ? undefined
    : (result) => {
        console.log('QR DATA:', result.data);
        console.log('QR BOUNDS:', result.bounds);
        console.log('QR CORNERS:', result.cornerPoints);
        handleBarcodeScanned(result);
      }
}
/>
      <SafeAreaView style={styles.cameraOverlay}>
        <View style={styles.topBar}>
          <Pressable
            style={styles.topButton}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={26} color="#FFFFFF" />
          </Pressable>

          <Text style={styles.topTitle}>Scan QR Code</Text>

          <Pressable
            style={styles.topButton}
            onPress={() => setTorchOn((current) => !current)}
            accessibilityRole="button"
            accessibilityLabel={torchOn ? 'Turn flashlight off' : 'Turn flashlight on'}
          >
            <Ionicons
              name={torchOn ? 'flash' : 'flash-outline'}
              size={23}
              color={torchOn ? '#FFD76A' : '#FFFFFF'}
            />
          </Pressable>
        </View>

        <View style={styles.scanArea}>
          <View style={styles.scanFrame}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
            <Ionicons
              name="qr-code-outline"
              size={94}
              color="rgba(255,255,255,0.45)"
            />
          </View>

          <Text style={styles.instruction}>
            Align the QR code within the frame
          </Text>
          <Text style={styles.instructionHint}>
            Keep your camera steady while scanning.
          </Text>
        </View>

        <View style={styles.bottomPanel}>
  {/* Flash button */}
  <Pressable
    style={styles.controlButton}
    onPress={() => setTorchOn((current) => !current)}
    accessibilityRole="button"
  >
    <View style={styles.controlCircle}>
      <Ionicons
        name={torchOn ? 'flash' : 'flash-outline'}
        size={24}
        color={torchOn ? '#E8A900' : '#2679E9'}
      />
    </View>
    <Text style={styles.controlLabel}>
      {torchOn ? 'Flash On' : 'Flash'}
    </Text>
  </Pressable>

  {/* Center scan icon */}
  <View style={styles.scanControl}>
    <Ionicons
      name="scan-outline"
      size={34}
      color="#FFFFFF"
    />
  </View>

  {/* Gallery button */}
  <Pressable
    style={styles.controlButton}
    onPress={handlePickFromGallery}
    accessibilityRole="button"
  >
    <View style={styles.controlCircle}>
      <Ionicons
        name="images-outline"
        size={24}
        color="#2679E9"
      />
    </View>
    <Text style={styles.controlLabel}>Gallery</Text>
  </Pressable>
</View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#10212D',
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: 'space-between',
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: '#F1FCFF',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#17365D',
    marginTop: 14,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#637894',
    textAlign: 'center',
    lineHeight: 21,
    marginTop: 10,
    marginBottom: 18,
  },
  topBar: {
    minHeight: 66,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(8,20,31,0.48)',
  },
  topButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  scanArea: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  scanFrame: {
  width: 300,
  height: 300,
  borderRadius: 26,
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'rgba(5,17,25,0.24)',
},
  corner: {
    position: 'absolute',
    width: 43,
    height: 43,
    borderColor: '#71F1E1',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 5,
    borderLeftWidth: 5,
    borderTopLeftRadius: 14,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 5,
    borderRightWidth: 5,
    borderTopRightRadius: 14,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 5,
    borderLeftWidth: 5,
    borderBottomLeftRadius: 14,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 5,
    borderRightWidth: 5,
    borderBottomRightRadius: 14,
  },
  instruction: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 24,
  },
  instructionHint: {
    color: '#E2EBF1',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
  bottomPanel: {
    marginHorizontal: 20,
    marginBottom: 24,
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.94)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  controlButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 66,
  },
  controlCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F7FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlLabel: {
    color: '#24364B',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 7,
  },
  scanControl: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#31BBD2',
    borderWidth: 5,
    borderColor: '#B8F5FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultScreen: {
    flex: 1,
    backgroundColor: '#F1FCFF',
  },
  backButton: {
    width: 48,
    height: 48,
    marginLeft: 12,
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultContent: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultIcon: {
    width: 94,
    height: 94,
    borderRadius: 47,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },
  resultTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#14264D',
    textAlign: 'center',
    marginBottom: 10,
  },
  resultSubtitle: {
    fontSize: 14,
    lineHeight: 22,
    color: '#536B9A',
    textAlign: 'center',
    marginBottom: 26,
  },
  eventCard: {
    width: '100%',
    minHeight: 90,
    borderRadius: 18,
    padding: 16,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
    borderWidth: 1,
    borderColor: '#E1F0F6',
  },
  eventIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#EAF4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },
  eventText: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#15274C',
  },
  eventDescription: {
    fontSize: 12,
    color: '#60739A',
    marginTop: 6,
  },
  homeButton: {
    width: '100%',
    minHeight: 50,
    borderRadius: 14,
    backgroundColor: '#20BCA1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  homeButtonText: {
    fontSize: 15,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  historyButton: {
    width: '100%',
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: '#DDF5FA',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  historyButtonText: {
    fontSize: 14,
    color: '#167C94',
    fontWeight: '800',
  },
  scanAgainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    padding: 8,
    gap: 7,
  },
  scanAgainText: {
    fontSize: 13,
    color: '#526A83',
    fontWeight: '700',
  },
});
