import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import Button from '../components/Button';
import { CURRENT_USER } from '../constants/currentUser';


const GREEN = '#2F5D46';
const RED = '#B91C1C';

function getAge(dateOfBirth) {
  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const hasHadBirthday =
    today.getMonth() > dob.getMonth() ||
    (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate());
  return hasHadBirthday ? age : age - 1;
}

function Stat({ label, value }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function ProfileScreen({ navigation }) {
  const user = CURRENT_USER.currentUser;
  const initials = `${user.firstName[0]}${user.lastName[0]}`;

  const handleLogout = () => {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: () => {
          // TODO: clear auth state / tokens here
          navigation.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          });
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.name}>
          {user.firstName} {user.lastName}
        </Text>
        <Text style={styles.email}>{user.email}</Text>
      </View>

      {/* Stats */}
      <View style={styles.card}>
        <View style={styles.statsRow}>
          <Stat label="Age" value={getAge(user.dateOfBirth)} />
          <View style={styles.divider} />
          <Stat label="Weight" value={`${user.weightKg} kg`} />
          <View style={styles.divider} />
          <Stat label="Groups" value={user.groupIds.length} />
        </View>
      </View>

      {/* Navigation */}
      <View style={styles.card}>
        <Button
          title="Account Details"
          onPress={() => navigation.navigate('AccountDetails')}
        />
        <Button
          title="Activity Trends"
          onPress={() => navigation.navigate('ActivityTrends')}
        />
        <Button
          title="Achievements"
          onPress={() => navigation.navigate('Achievements')}
        />
        <Button
          title="Personal Records"
          onPress={() => navigation.navigate('PersonalRecords')}
        />
      </View>

      {/* Logout */}
      <Button
        title="Log Out"
        onPress={handleLogout}
        style={styles.logoutButton}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F4F6F5',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: GREEN,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  avatarText: {
    color: '#fff',
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: 1,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  email: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: GREEN,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: '#E5E7EB',
  },
  logoutButton: {
    backgroundColor: '#B5402F',
  }
});