import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from '@/components/LinearGradient';
import { useRouter } from 'expo-router';
import { Mail, Lock, MapPin } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { Colors, Spacing, BorderRadius } from '@/lib/theme';
import { Column, Text } from '@/components/ExpoUI';
import { SafeAreaScreen } from '@/components/ui/SafeAreaScreen';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();

  const handleSignIn = async () => {

    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);

    if (error) {
      const message =
        error.message === 'Email not confirmed'
          ? 'Please confirm your email before signing in. Check your inbox for the confirmation link.'
          : error.message;
      Alert.alert('Sign In Failed', message);
      return;
    }

    router.replace('/(tabs)');
  };

  return (
    <SafeAreaScreen edges={['top', 'bottom']} style={styles.safeArea}>
    <LinearGradient colors={[Colors.neutral[900] as string, Colors.neutral[950] as string]} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Column spacing={16} alignment="center" style={{ marginTop: 24 }}>
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={['#3B82F6', '#2563EB']}
                style={styles.logoGradient}
              >
                <MapPin size={32} color="#FFFFFF" strokeWidth={2.5} />
              </LinearGradient>
            </View>
            <Text textStyle={{ fontSize: 32, fontWeight: '700', color: Colors.neutral[0] }}>
              Connekta
            </Text>
            <Text textStyle={{ fontSize: 16, color: Colors.neutral[400] }}>
              Stay connected with your circle
            </Text>
          </Column>

          <View style={styles.formSection}>
            <View style={styles.inputWrapper}>
              <Mail size={20} color={Colors.neutral[400]} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email address"
                placeholderTextColor={Colors.neutral[500]}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                textContentType="emailAddress"
              />
            </View>

            <View style={styles.inputWrapper}>
              <Lock size={20} color={Colors.neutral[400]} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={Colors.neutral[500]}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                textContentType="password"
              />
            </View>

            <TouchableOpacity style={styles.signInButton} onPress={handleSignIn}>
              <LinearGradient
                colors={['#3B82F6', '#2563EB']}
                style={styles.signInGradient}
              >
                <Text textStyle={styles.signInText}>
                  {loading ? 'Signing in...' : 'Sign In'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text textStyle={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.signUpRow}>
              <Text textStyle={styles.signUpText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/sign-up')}>
                <Text textStyle={styles.signUpLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
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
  logoContainer: { marginBottom: 16 },
  logoGradient: {
    width: 80, height: 80, borderRadius: 40,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
  },
  formSection: { marginTop: 32 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.neutral[800], borderRadius: 16,
    borderWidth: 1, borderColor: Colors.neutral[700],
    marginBottom: 16, paddingHorizontal: 16,
  },
  inputIcon: { marginRight: 8 },
  input: {
    flex: 1, color: Colors.neutral[0], fontSize: 16,
    paddingVertical: 16, fontFamily: 'Inter-Regular',
  },
  signInButton: { marginTop: 8, borderRadius: 16, overflow: 'hidden' },
  signInGradient: { paddingVertical: 16, alignItems: 'center', borderRadius: 16 },
  signInText: { color: '#fff', fontSize: 16, fontWeight: '600', fontFamily: 'Inter-SemiBold' },
  divider: { flexDirection: 'row', alignItems: 'center', marginTop: 24, marginBottom: 24 },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.neutral[700] },
  dividerText: { color: Colors.neutral[500], fontSize: 14, marginHorizontal: 16 },
  signUpRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  signUpText: { color: Colors.neutral[400], fontSize: 16, fontFamily: 'Inter-Regular' },
  signUpLink: { color: Colors.primary[400], fontWeight: '600', fontSize: 16 },
  features: { marginTop: 32, alignItems: 'center' },
  featureItem: { flexDirection: 'row', alignItems: 'center' },
  featureText: { color: Colors.neutral[400], fontSize: 14, marginLeft: 8, fontFamily: 'Inter-Regular' },
});
