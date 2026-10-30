import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useAuth } from '@/context/AuthContext';

export default function IndexScreen() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#0f766e" />
      </View>
    );
  }

  if (user) {
    if (user.roles?.includes('TICKET_VERIFIER') && !user.roles?.includes('DRIVER')) {
      return <Redirect href="/verifier/dashboard" />;
    }
    if (user.roles?.includes('DRIVER')) {
      return <Redirect href="/driver" />;
    }
    return <Redirect href="/passenger/home" />;
  }

  return <Redirect href="/passenger/home" />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
});
