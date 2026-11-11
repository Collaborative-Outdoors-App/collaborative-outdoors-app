import { useState } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import Button from '../components/Button';
import { useAuth } from '../auth/authContext';
import { clearMapCache } from '../services/offlineMapService';

const GREEN = '#2F5D46';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const firstName = user?.displayName?.split(' ')[0] || 'there';
  
  const [clearing, setClearing] = useState(false);

  const handleClearMapCache = () => {
    Alert.alert(
      'Clear Map Cache',
      'Select how you want to clear MapLibre cache to test offline maps:',
      [
        {
          text: 'Clear Browsing Cache',
          onPress: async () => {
            setClearing(true);
            try {
              await clearMapCache({ resetAll: false });
              Alert.alert(
                'Browsing Cache Cleared',
                'Temporary tiles cached while browsing online have been deleted. Explicitly downloaded offline trail packs are kept intact so you can test offline rendering.'
              );
            } catch (err) {
              Alert.alert('Error', 'Could not clear map cache: ' + err.message);
            } finally {
              setClearing(false);
            }
          },
        },
        {
          text: 'Reset All (Wipe Everything)',
          style: 'destructive',
          onPress: async () => {
            setClearing(true);
            try {
              await clearMapCache({ resetAll: true });
              Alert.alert(
                'All Map Cache Reset',
                'All MapLibre ambient cache and downloaded offline packs have been completely erased.'
              );
            } catch (err) {
              Alert.alert('Error', 'Could not reset map cache: ' + err.message);
            } finally {
              setClearing(false);
            }
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  return (
    <View style={styles.screen}>
      {/* Greeting */}
      <View style={styles.header}>
        <Text style={styles.greeting}>{getGreeting()},</Text>
        <Text style={styles.name}>{firstName}</Text>
      </View>

      {/* Hero card */}
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Ready to hit the trail?</Text>
        <Text style={styles.heroSubtitle}>
          Find a trail, start tracking, and bring your group along.
        </Text>
        <Button
          title="Start Hike"
          variant="secondary"
          onPress={() => navigation.navigate('TrailSearch')}
          style={styles.heroButton}
        />
      </View>

      {/* Quick access */}
      <Text style={styles.sectionTitle}>Quick Access</Text>
      <View style={styles.row}>
        <Button
          title="Profile"
          onPress={() => navigation.navigate('Profile')}
          style={styles.rowButton}
        />
        <Button
          title="Groups"
          onPress={() => navigation.navigate('Groups')}
          style={styles.rowButton}
        />
      </View>

      {/* Debug Map Cache */}
      <Text style={[styles.sectionTitle, { marginTop: 28 }]}>Debug Tools</Text>
      <View style={styles.debugCard}>
        <Text style={styles.debugSubtitle}>
          Clear MapLibre tile cache to test if downloaded offline maps render when offline.
        </Text>
        {clearing ? (
          <ActivityIndicator size="small" color={GREEN} style={{ marginVertical: 12 }} />
        ) : (
          <Button
            title="Clear Map Cache"
            variant="outline"
            onPress={handleClearMapCache}
            style={styles.debugButton}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F4F6F5',
    padding: 20,
  },
  header: {
    marginTop: 24,
    marginBottom: 28,
  },
  greeting: {
    fontSize: 16,
    color: '#6B7280',
  },
  name: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1A1A1A',
    marginTop: 2,
  },
  hero: {
    backgroundColor: GREEN,
    borderRadius: 20,
    padding: 24,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 8,
    marginBottom: 12,
  },
  heroButton: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
    marginLeft: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  rowButton: {
    flex: 1,
  },
  debugCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  debugSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 8,
    lineHeight: 18,
  },
  debugButton: {
    marginVertical: 4,
  },
});
