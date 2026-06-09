import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  TextInput,
  TouchableOpacity,
  Image,
} from 'react-native';
import { LinearGradient } from '@/components/LinearGradient';
import { useRouter } from 'expo-router';
import { User, MapPin, Smartphone } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { normalizeUsername } from '@/lib/device-auth';
import { checkUsernameAvailable } from '@/lib/username-availability';
import { Colors } from '@/lib/theme';
import { Column, Text } from '@/components/ExpoUI';
import { SafeAreaScreen } from '@/components/ui/SafeAreaScreen';

type AuthMode = 'sign-in' | 'register';
type AvailabilityState = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';

export default function AuthScreen() {
  const [username, setUsername] = useState('');
  const [mode, setMode] = useState<AuthMode>('sign-in');
  const [loading, setLoading] = useState(false);
  const [availability, setAvailability] = useState<AvailabilityState>('idle');
  const { signIn, register } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (mode !== 'register') {
      setAvailability('idle');
      return;
    }

    const normalized = normalizeUsername(username);
    if (!normalized) {
      setAvailability(username.trim().length > 0 ? 'invalid' : 'idle');
      return;
    }

    setAvailability('checking');
    const timer = setTimeout(async () => {
      const result = await checkUsernameAvailable(normalized);
      if (!result.normalized) {
        setAvailability('invalid');
        return;
      }
      setAvailability(result.available ? 'available' : 'taken');
    }, 400);

    return () => clearTimeout(timer);
  }, [username, mode]);

  const handleSubmit = async () => {
    const normalized = normalizeUsername(username);
    if (!normalized) {
      Alert.alert(
        'Invalid username',
        'Use 3–20 characters: letters, numbers, and underscore only.'
      );
      return;
    }

    if (mode === 'register') {
      const result = await checkUsernameAvailable(normalized);
      if (!result.available) {
        Alert.alert('Username taken', 'That username is already in use. Try another one.');
        setAvailability('taken');
        return;
      }
    }

    setLoading(true);
    const { error } =
      mode === 'register' ? await register(normalized) : await signIn(normalized);
    setLoading(false);

    if (error) {
      Alert.alert(mode === 'register' ? 'Registration Failed' : 'Sign In Failed', error.message);
      return;
    }

    router.replace('/(tabs)');
  };

  return (
    <SafeAreaScreen edges={['top', 'bottom']} style={styles.safeArea}>
      <LinearGradient
        colors={[Colors.neutral[900] as string, Colors.neutral[950] as string]}
        style={styles.container}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Column spacing={16} alignment="center" style={styles.hero}>
              <Image
                source={require('@/assets/app-logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
              <Text textStyle={{ fontSize: 32, fontWeight: '700', color: Colors.neutral[0] }}>
                LocateMe
              </Text>
              <Text textStyle={{ fontSize: 16, color: Colors.neutral[400], textAlign: 'center' }}>
                Sign in with your username on this device
              </Text>
            </Column>

            <View style={styles.formSection}>
              <View style={styles.modeRow}>
                <TouchableOpacity
                  style={[styles.modeButton, mode === 'sign-in' && styles.modeButtonActive]}
                  onPress={() => setMode('sign-in')}
                >
                  <Text
                    textStyle={[
                      styles.modeButtonText,
                      mode === 'sign-in' && styles.modeButtonTextActive,
                    ]}
                  >
                    Sign In
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modeButton, mode === 'register' && styles.modeButtonActive]}
                  onPress={() => setMode('register')}
                >
                  <Text
                    textStyle={[
                      styles.modeButtonText,
                      mode === 'register' && styles.modeButtonTextActive,
                    ]}
                  >
                    Register
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputWrapper}>
                <User size={20} color={Colors.neutral[400]} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Username"
                  placeholderTextColor={Colors.neutral[500]}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="username"
                />
              </View>

              {mode === 'register' && availability !== 'idle' ? (
                <Text
                  textStyle={[
                    styles.availabilityText,
                    availability === 'available' && styles.availabilityAvailable,
                    (availability === 'taken' || availability === 'invalid') &&
                      styles.availabilityError,
                    availability === 'checking' && styles.availabilityChecking,
                  ]}
                >
                  {availability === 'checking' && 'Checking availability...'}
                  {availability === 'available' && 'Username is available'}
                  {availability === 'taken' && 'Username is already taken'}
                  {availability === 'invalid' &&
                    'Invalid username (3–20 chars, letters, numbers, underscore)'}
                </Text>
              ) : null}

              <View style={styles.deviceNote}>
                <Smartphone size={16} color={Colors.primary[400]} />
                <Text textStyle={styles.deviceNoteText}>
                  Your account is linked to this device. No password needed.
                </Text>
              </View>

              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleSubmit}
                disabled={
                  loading ||
                  (mode === 'register' &&
                    (availability === 'taken' ||
                      availability === 'invalid' ||
                      availability === 'checking'))
                }
              >
                <LinearGradient colors={['#3B82F6', '#2563EB']} style={styles.submitGradient}>
                  <Text textStyle={styles.submitText}>
                    {loading
                      ? mode === 'register'
                        ? 'Creating account...'
                        : 'Signing in...'
                      : mode === 'register'
                        ? 'Create Account'
                        : 'Sign In'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <View style={styles.features}>
              <View style={styles.featureItem}>
                <MapPin size={16} color={Colors.primary[400]} />
                <Text textStyle={styles.featureText}>Real-time location sharing</Text>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaScreen>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 32 },
  hero: { marginTop: 24, alignItems: 'center' },
  logo: { width: 100, height: 100 },
  formSection: { marginTop: 32 },
  modeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  modeButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.neutral[900],
    borderWidth: 1,
    borderColor: Colors.neutral[800],
  },
  modeButtonActive: {
    borderColor: Colors.primary[500],
    backgroundColor: Colors.neutral[800],
  },
  modeButtonText: {
    color: Colors.neutral[500],
    fontSize: 15,
    fontWeight: '600',
  },
  modeButtonTextActive: {
    color: Colors.primary[400],
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral[800],
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.neutral[700],
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  inputIcon: { marginRight: 8 },
  input: {
    flex: 1,
    color: Colors.neutral[0],
    fontSize: 16,
    paddingVertical: 16,
    fontFamily: 'Inter-Regular',
  },
  availabilityText: {
    fontSize: 13,
    marginBottom: 12,
    marginTop: -4,
    paddingHorizontal: 4,
  },
  availabilityAvailable: {
    color: Colors.secondary[500],
  },
  availabilityError: {
    color: '#F87171',
  },
  availabilityChecking: {
    color: Colors.neutral[500],
  },
  deviceNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  deviceNoteText: {
    flex: 1,
    color: Colors.neutral[400],
    fontSize: 13,
    lineHeight: 18,
  },
  submitButton: { marginTop: 8, borderRadius: 16, overflow: 'hidden' },
  submitGradient: { paddingVertical: 16, alignItems: 'center', borderRadius: 16 },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  features: { marginTop: 32, alignItems: 'center' },
  featureItem: { flexDirection: 'row', alignItems: 'center' },
  featureText: {
    color: Colors.neutral[400],
    fontSize: 14,
    marginLeft: 8,
    fontFamily: 'Inter-Regular',
  },
});
