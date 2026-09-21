import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect } from '@react-navigation/native';
import {
  CameraView,
  useCameraPermissions,
  type BarcodeScanningResult,
} from 'expo-camera';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import AppButton from '@/components/AppButton';
import { COLORS } from '@/constants/colors';
import { useAuth } from '@/lib/auth';
import { registerAttendance } from '@/lib/attendance';
import { getUserRole } from '@/lib/profiles';

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const { user } = useAuth();

  const [role, setRole] = useState<'student' | 'teacher' | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);

  const [scanned, setScanned] = useState(false);
  const [lastData, setLastData] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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

      getUserRole(user.id).then((role) => {
        if (!active) return;

        setRole(role ?? 'student');
        setRoleLoading(false);
      });

      return () => {
        active = false;
      };
    }, [user])
  );

  // QR code scanning
  const handleBarcodeScanned = async (
    result: BarcodeScanningResult
  ) => {
    const data = result.data;

    setScanned(true);
    setLastData(data);
    setMessage('Checking QR code...');
    setSuccess(false);

    try {
      const studentId = user?.id;

      if (!studentId) {
        setMessage(
          'You must be logged in to record attendance.'
        );
        setSuccess(false);
        return;
      }

      const attendanceResult = await registerAttendance(
        data,
        studentId
      );

      setMessage(attendanceResult.message);
      setSuccess(attendanceResult.success);
    } catch (error) {
      console.error(
        'Attendance registration error:',
        error
      );

      setMessage(
        'Something went wrong while recording attendance.'
      );
      setSuccess(false);
    }
  };

  // Scan another QR code
  const handleScanAgain = () => {
    setScanned(false);
    setLastData(null);
    setMessage(null);
    setSuccess(false);
  };

  // Role is still loading
  if (roleLoading) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.title}>
          Checking your account...
        </Text>
      </View>
    );
  }

  // Only students can use the scanner
  if (role !== 'student') {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.title}>Students Only</Text>

        <Text style={styles.subtitle}>
          This section is available only to student accounts.
        </Text>
      </View>
    );
  }

  // Camera permission is still loading
  if (!permission) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.subtitle}>
          Loading camera...
        </Text>
      </View>
    );
  }

  // Camera permission was not granted
  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.title}>
          Camera Permission Needed
        </Text>

        <Text style={styles.subtitle}>
          We need access to your camera to scan QR codes.
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

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
        onBarcodeScanned={
          scanned ? undefined : handleBarcodeScanned
        }
      />

      <View style={styles.overlay}>
        <Text style={styles.overlayText}>
          {scanned
            ? 'QR Code detected!'
            : 'Point your camera at a QR code'}
        </Text>

        {scanned && message && (
          <Text
            style={[
              styles.scanResult,
              success
                ? styles.success
                : styles.error,
            ]}
          >
            {message}
          </Text>
        )}

        {scanned && lastData && (
          <Text style={styles.scanData}>
            {lastData}
          </Text>
        )}

        {scanned && (
          <AppButton
            theme="primary"
            title="Scan Again"
            icon="refresh"
            onPress={handleScanAgain}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  permissionContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },

  camera: {
    ...StyleSheet.absoluteFillObject,
  },

  title: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },

  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },

  overlay: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 60,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },

  overlayText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 6,
    textAlign: 'center',
  },

  scanResult: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '600',
  },

  success: {
    color: '#2E7D32',
  },

  error: {
    color: '#C62828',
  },

  scanData: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 12,
  },
});