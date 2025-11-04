import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '../hooks/useAuth';

type LoginMethod = 'code' | 'email';

export default function LoginScreen() {
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('code');
  const [loginCode, setLoginCode] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, error: authError, isAuthenticated } = useAuth();

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  const handleLogin = async () => {
    if (loginMethod === 'code') {
      if (!loginCode || loginCode.length !== 4) {
        Alert.alert('Błąd', 'Wprowadź 4-cyfrowy kod logowania');
        return;
      }
    } else {
      if (!email || !email.includes('@')) {
        Alert.alert('Błąd', 'Wprowadź prawidłowy adres email');
        return;
      }
    }

    setLoading(true);
    try {
      const success = await login(
        loginMethod === 'code' ? loginCode : undefined,
        loginMethod === 'email' ? email : undefined
      );
      
      if (!success) {
        Alert.alert('Błąd logowania', authError || 'Nieprawidłowy kod logowania lub email');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      Alert.alert('Błąd', message || 'Wystąpił błąd podczas logowania');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>EmpApp</Text>
        <Text style={styles.subtitle}>Zaloguj się do systemu</Text>

        {/* Login Method Toggle */}
        <View style={styles.methodToggle}>
          <TouchableOpacity
            style={[styles.methodButton, loginMethod === 'code' && styles.methodButtonActive]}
            onPress={() => {
              setLoginMethod('code');
              setEmail('');
              setLoginCode('');
            }}
          >
            <Text style={[styles.methodButtonText, loginMethod === 'code' && styles.methodButtonTextActive]}>
              Kod
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.methodButton, loginMethod === 'email' && styles.methodButtonActive]}
            onPress={() => {
              setLoginMethod('email');
              setEmail('');
              setLoginCode('');
            }}
          >
            <Text style={[styles.methodButtonText, loginMethod === 'email' && styles.methodButtonTextActive]}>
              Email
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>
            {loginMethod === 'code' ? 'Kod logowania' : 'Email'}
          </Text>
          {loginMethod === 'code' ? (
            <TextInput
              style={styles.input}
              value={loginCode}
              onChangeText={setLoginCode}
              placeholder="1234"
              keyboardType="number-pad"
              maxLength={4}
              autoFocus
              editable={!loading}
            />
          ) : (
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="pracownik@restauracja.pl"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
              editable={!loading}
            />
          )}
        </View>

        {authError && (
          <Text style={styles.error}>{authError}</Text>
        )}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Zaloguj się</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.hint}>
          {loginMethod === 'code' 
            ? 'Wprowadź 4-cyfrowy kod otrzymany od administratora'
            : 'Wprowadź email z systemu POS'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  methodToggle: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 4,
  },
  methodButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  methodButtonActive: {
    backgroundColor: '#007AFF',
  },
  methodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  methodButtonTextActive: {
    color: '#fff',
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    fontSize: 18,
    backgroundColor: '#fff',
  },
  error: {
    color: '#d32f2f',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  hint: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
});
