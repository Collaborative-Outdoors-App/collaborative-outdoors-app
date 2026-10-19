import { View, Text, StyleSheet } from 'react-native';
import Button from '../components/Button';
import { CURRENT_USER } from '../constants/currentUser';
import NavBar from '../components/NavBar';

const GREEN = '#2F5D46';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen({ navigation }) {
  const user = CURRENT_USER.currentUser;

  return (
    <View style={styles.screen}>
      {/* Greeting */}
      <View style={styles.header}>
        <Text style={styles.greeting}>{getGreeting()},</Text>
        <Text style={styles.name}>{user.firstName}</Text>
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
});