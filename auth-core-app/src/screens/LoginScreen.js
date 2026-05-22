import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Theme } from '../theme/Theme';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, ArrowRight } from 'lucide-react-native';
import { MotiView } from 'moti';

export default function LoginScreen() {
  const [licenceKey, setLicenceKey] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!licenceKey) {
      setError('Please enter your license key');
      return;
    }

    setError('');
    setIsSubmitting(true);
    
    const result = await login(licenceKey);
    
    if (!result.success) {
      setError(result.message);
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.innerContainer}>
        <MotiView 
          from={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring' }}
          style={styles.logoContainer}
        >
          <View style={styles.iconCircle}>
            <Shield size={48} color={Theme.colors.primary} />
          </View>
          <Text style={styles.title}>AUTH CORE</Text>
          <Text style={styles.subtitle}>SECURE MOBILE ACCESS</Text>
        </MotiView>

        <MotiView 
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 300 }}
          style={styles.form}
        >
          <View style={styles.inputWrapper}>
            <Lock size={20} color={Theme.colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="License Key"
              placeholderTextColor={Theme.colors.textMuted}
              value={licenceKey}
              onChangeText={setLicenceKey}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity 
            style={styles.button}
            onPress={handleLogin}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color={Theme.colors.text} />
            ) : (
              <View style={styles.buttonInner}>
                <Text style={styles.buttonText}>AUTHORIZE SYSTEM</Text>
                <ArrowRight size={20} color={Theme.colors.text} />
              </View>
            )}
          </TouchableOpacity>
        </MotiView>

        <Text style={styles.footer}>v1.0.0 Stable | Trusted Auth</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  innerContainer: {
    flex: 1,
    padding: Theme.spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.primary + '40', // 25% opacity
    marginBottom: Theme.spacing.md,
  },
  title: {
    color: Theme.colors.text,
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  subtitle: {
    color: Theme.colors.primary,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 5,
    letterSpacing: 1,
  },
  form: {
    width: '100%',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.roundness.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    paddingHorizontal: Theme.spacing.md,
    height: 60,
  },
  inputIcon: {
    marginRight: Theme.spacing.sm,
  },
  input: {
    flex: 1,
    color: Theme.colors.text,
    fontSize: 16,
  },
  errorText: {
    color: Theme.colors.error,
    marginTop: Theme.spacing.sm,
    fontSize: 14,
    textAlign: 'center',
  },
  button: {
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.roundness.md,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Theme.spacing.lg,
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    color: Theme.colors.text,
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: Theme.spacing.sm,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    color: Theme.colors.textMuted,
    fontSize: 12,
  }
});
