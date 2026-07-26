import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';

export default function CameraScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraRef, setCameraRef] = useState<CameraView | null>(null);

  if (!permission) {
    return null;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Camera permission is required to capture receipts.</Text>
        <Button title="Grant permission" onPress={requestPermission} />
      </View>
    );
  }

  async function captureReceipt() {
    if (!cameraRef) {
      return;
    }

    const photo = await cameraRef.takePictureAsync();
    if (photo?.uri) {
      router.back();
    }
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={setCameraRef}
        style={styles.camera}
        facing="back"
      />
      <View style={styles.controls}>
        <Button title="Capture receipt" onPress={captureReceipt} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  camera: { flex: 1, width: '100%' },
  controls: { padding: 16 },
  message: { fontSize: 16, marginBottom: 12, textAlign: 'center' },
});
