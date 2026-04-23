import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Theme } from '../../constants/Theme';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const signInWithEmail = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) Alert.alert('Login Failed', error.message);
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.logo}>C&B</Text>
        <Text style={styles.title}>Welcome back</Text>
        
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={Theme.colors.mutedBrown}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={Theme.colors.mutedBrown}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <Button 
            title="Sign In" 
            onPress={signInWithEmail} 
            loading={loading}
            style={styles.button}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.darkBrown,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: Theme.spacing.lg,
  },
  logo: {
    fontFamily: Theme.typography.display.fontFamily,
    fontSize: 64,
    color: Theme.colors.primaryOrange,
    textAlign: 'center',
    marginBottom: Theme.spacing.md,
  },
  title: {
    fontFamily: Theme.typography.heading.fontFamily,
    fontSize: Theme.typography.heading.fontSize,
    color: Theme.colors.white,
    textAlign: 'center',
    marginBottom: Theme.spacing.xl,
  },
  form: {
    gap: Theme.spacing.md,
  },
  input: {
    backgroundColor: Theme.colors.white,
    height: 48,
    borderRadius: Theme.radius.sm,
    paddingHorizontal: Theme.spacing.md,
    fontFamily: Theme.typography.body.fontFamily,
    fontSize: Theme.typography.body.fontSize,
    color: Theme.colors.darkBrown,
  },
  button: {
    marginTop: Theme.spacing.md,
  }
});
