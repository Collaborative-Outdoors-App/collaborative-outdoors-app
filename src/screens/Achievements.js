import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { CURRENT_USER, ACHIEVEMENT_DATA } from '../constants/currentUser';

const GREEN = '#2F5D46';
const GOLD = '#F5B301';

function ProgressBar({ progress, unlocked }) {
  return (
    <View style={styles.track}>
      <View
        style={[
          styles.fill,
          { width: `${Math.round(progress * 100)}%` },
          unlocked && styles.fillUnlocked,
        ]}
      />
    </View>
  );
}

function AchievementRow({ achievement, unlockDate, totalDistance, isLast }) {
  const unlocked = Boolean(unlockDate);
  const progress = Math.min(totalDistance / achievement.requirement, 1);
  const remaining = Math.max(achievement.requirement - totalDistance, 0);

  return (
    <View style={[styles.row, !isLast && styles.rowBorder]}>
      {/* Badge */}
      <View style={[styles.badge, unlocked ? styles.badgeUnlocked : styles.badgeLocked]}>
        <Text style={[styles.badgeIcon, !unlocked && styles.badgeIconLocked]}>
          {unlocked ? '🏅' : '🔒'}
        </Text>
      </View>

      {/* Details */}
      <View style={styles.details}>
        <View style={styles.titleRow}>
          <Text style={[styles.name, !unlocked && styles.nameLocked]} numberOfLines={1}>
            {achievement.name}
          </Text>
        </View>

        <Text style={styles.description}>{achievement.description}</Text>

        <ProgressBar progress={progress} unlocked={unlocked} />

        <View style={styles.progressRow}>
          <Text style={styles.progressText}>
            {Math.min(totalDistance, achievement.requirement).toFixed(1)} /{' '}
            {achievement.requirement} km
          </Text>
          <Text style={[styles.status, unlocked && styles.statusUnlocked]}>
            {unlocked ? `Unlocked: ${unlockDate}` : `${remaining.toFixed(1)} km to go`}
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function Achievements() {
  const user = CURRENT_USER.currentUser;
  const totalDistance = user.totalDistance;

  // Map of achievement id -> unlockDate for quick lookup
  const unlockDates = Object.fromEntries(
    user.achievements.map((a) => [a.id, a.unlockDate])
  );

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Your Achievements</Text>

      {/* Achievement list */}
      <View style={styles.card}>
        {ACHIEVEMENT_DATA.map((achievement, index) => (
          <AchievementRow
            key={achievement.id}
            achievement={achievement}
            unlockDate={unlockDates[achievement.id]}
            totalDistance={totalDistance}
            isLast={index === ACHIEVEMENT_DATA.length - 1}
          />
        ))}
      </View>
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
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 15,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  badge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  badgeUnlocked: {
    backgroundColor: '#FFF4D1',
    borderWidth: 2,
    borderColor: GOLD,
  },
  badgeLocked: {
    backgroundColor: '#F1F2F2',
  },
  badgeIcon: {
    fontSize: 24,
  },
  badgeIconLocked: {
    opacity: 0.5,
  },
  details: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    flexShrink: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  nameLocked: {
    color: '#4B5563',
  },
  description: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
    marginBottom: 8,
  },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#8FB5A1',
  },
  fillUnlocked: {
    backgroundColor: GREEN,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  progressText: {
    fontSize: 12,
    color: '#6B7280',
  },
  status: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  statusUnlocked: {
    color: GREEN,
  },
});