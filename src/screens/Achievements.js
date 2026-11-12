import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { getAchievements } from '../services/achievementService';

const GREEN = '#2F5D46';
const GOLD = '#F5B301';

function formatNumber(num, maxDecimals = 1) {
  if (num == null || isNaN(num)) return '0';
  if (Number.isInteger(num)) return String(num);
  return Number(num.toFixed(maxDecimals)).toString();
}

function ProgressBar({ progress, unlocked }) {
  const percent = Math.min(Math.max(Math.round(progress * 100), 0), 100);
  return (
    <View style={styles.track}>
      <View
        style={[
          styles.fill,
          { width: `${percent}%` },
          unlocked && styles.fillUnlocked,
        ]}
      />
    </View>
  );
}

function AchievementRow({ achievement, unlockDate, stats, isLast }) {
  const unlocked = Boolean(unlockDate);
  const requirement = achievement.requirement || 1;
  const metric = achievement.metric;

  let current = 0;
  let progressText = '';
  let remainingText = '';

  if (metric === 'distance') {
    current = stats?.totalDistanceKm ?? 0;
    const capped = unlocked ? requirement : Math.min(current, requirement);
    const remaining = Math.max(requirement - current, 0);
    progressText = `${formatNumber(capped)} / ${formatNumber(requirement)} km`;
    remainingText = `${formatNumber(remaining)} km to go`;
  } else if (metric === 'hike_count') {
    current = stats?.hikeCount ?? 0;
    const capped = unlocked ? requirement : Math.min(current, requirement);
    const remaining = Math.max(requirement - current, 0);
    const unit = requirement === 1 ? 'hike' : 'hikes';
    const remUnit = remaining === 1 ? 'hike' : 'hikes';
    progressText = `${formatNumber(capped)} / ${formatNumber(requirement)} ${unit}`;
    remainingText = `${formatNumber(remaining)} ${remUnit} to go`;
  } else if (metric === 'hiking_time') {
    current = stats?.totalDurationMins ?? 0;
    const capped = unlocked ? requirement : Math.min(current, requirement);
    const remaining = Math.max(requirement - current, 0);
    const unit = requirement === 1 ? 'min' : 'mins';
    const remUnit = remaining === 1 ? 'min' : 'mins';
    progressText = `${formatNumber(capped)} / ${formatNumber(requirement)} ${unit}`;
    remainingText = `${formatNumber(remaining)} ${remUnit} to go`;
  } else {
    current = stats?.totalDistanceKm ?? 0;
    const capped = unlocked ? requirement : Math.min(current, requirement);
    const remaining = Math.max(requirement - current, 0);
    progressText = `${formatNumber(capped)} / ${formatNumber(requirement)}`;
    remainingText = `${formatNumber(remaining)} to go`;
  }

  const progress = unlocked ? 1 : Math.min(Math.max(current / requirement, 0), 1);
  const formattedDate =
    typeof unlockDate === 'string' && unlockDate.includes('T')
      ? unlockDate.split('T')[0]
      : unlockDate;

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
          <Text style={styles.progressText}>{progressText}</Text>
          <Text style={[styles.status, unlocked && styles.statusUnlocked]}>
            {unlocked ? `Unlocked: ${formattedDate || ''}` : remainingText}
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function Achievements() {
  const [achievements, setAchievements] = useState([]);
  const [stats, setStats] = useState(null);
  const [unlockedList, setUnlockedList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadAchievements = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const data = await getAchievements();
      const list = Array.isArray(data?.achievements) ? data.achievements : [];
      const userStats = Array.isArray(data?.stats) ? data.stats[0] : (data?.stats || null);
      const unlocked = Array.isArray(data?.unlocked) ? data.unlocked : [];

      setAchievements(list);
      setStats(userStats);
      setUnlockedList(unlocked);
    } catch (err) {
      console.error('Failed to load achievements:', err);
      setError(err.message || 'Unable to load achievements.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAchievements();
  }, [loadAchievements]);

  // Map of achievementId -> unlockDate for quick lookup
  const unlockDates = useMemo(() => {
    const map = {};
    for (const item of unlockedList) {
      const key = item.achievementId || item.id;
      if (key) {
        map[key] = item.unlockDate || true;
      }
    }
    return map;
  }, [unlockedList]);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => loadAchievements(true)}
          colors={[GREEN]}
          tintColor={GREEN}
        />
      }
    >
      <Text style={styles.title}>Your Achievements</Text>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={GREEN} />
          <Text style={styles.loadingText}>Loading achievements...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadAchievements()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : achievements.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No achievements available.</Text>
        </View>
      ) : (
        <View style={styles.card}>
          {achievements.map((achievement, index) => {
            const key = achievement.achievementId || achievement.id || String(index);
            return (
              <AchievementRow
                key={key}
                achievement={achievement}
                unlockDate={unlockDates[key]}
                stats={stats}
                isLast={index === achievements.length - 1}
              />
            );
          })}
        </View>
      )}
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
  loadingContainer: {
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  errorContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  errorText: {
    fontSize: 14,
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: GREEN,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
  },
});