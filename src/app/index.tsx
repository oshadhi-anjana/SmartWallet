import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function WelcomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>SmartWallet</Text>
      <Text style={styles.subtitle}>Manage your money anywhere, even when you are offline.</Text>

      <Link href="/login" style={styles.button}>
        Login
      </Link>

      <Link href="/register" style={styles.secondaryButton}>
        Create Account
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#F5F7FA',
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },
  button: {
    padding: 16,
    backgroundColor: '#1E6F5C',
    color: '#FFFFFF',
    textAlign: 'center',
    borderRadius: 10,
    marginBottom: 12,
  },
  secondaryButton: {
    padding: 16,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#1E6F5C',
    borderRadius: 10,
  },
});
