import { useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import TrendChart from '../components/TrendChart';
import { DISTANCE_TRAVELLED_TRENDS } from '../constants/currentUser';

const GREEN = '#2F5D46';

const RANGES = [
  { label: '7 Days', days: 7 },
  { label: '30 Days', days: 30 },
];

// Index 0 is the most recent day, so daysAgo = 0 is today
function getDateLabel(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function Stat({ label, value }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function ActivityTrends() {
  const [range, setRange] = useState(7);

  const data = useMemo(() => {
    const slice = DISTANCE_TRAVELLED_TRENDS.slice(0, range).reverse();
    return slice.map((d, i) => {
      const daysAgo = slice.length - 1 - i;
      return {
        value: d.km,
        date: getDateLabel(daysAgo), // shown in the tooltip only
      };
    });
  }, [range]);

  const stats = useMemo(() => {
    const values = data.map((d) => d.value);
    const total = values.reduce((sum, v) => sum + v, 0);
    return {
      total: total.toFixed(1),
      average: (total / values.length).toFixed(1),
      best: Math.max(...values).toFixed(1),
    };
  }, [data]);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Activity Trends</Text>
      <Text style={styles.subtitle}>Distance travelled per day</Text>

      {/* Time filter */}
      <View style={styles.segment}>
        {RANGES.map((r) => {
          const active = range === r.days;
          return (
            <Pressable
              key={r.days}
              onPress={() => setRange(r.days)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              style={[styles.segmentItem, active && styles.segmentItemActive]}
            >
              <Text
                style={[styles.segmentText, active && styles.segmentTextActive]}
              >
                {r.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Chart (key remounts it so the animation replays when the range changes) */}
      <TrendChart
        key={range}
        data={data}
        yAxisTitle="Kilometres"
        unit="km"
        hideDataPoints={range === 30}
      />

      {/* Summary */}
      <View style={styles.card}>
        <View style={styles.statsRow}>
          <Stat label="Total" value={`${stats.total} km`} />
          <View style={styles.divider} />
          <Stat label="Daily avg" value={`${stats.average} km`} />
          <View style={styles.divider} />
          <Stat label="Best day" value={`${stats.best} km`} />
        </View>
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
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    marginBottom: 20,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: '#ffffffff',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 9,
    alignItems: 'center',
  },
  segmentItemActive: {
    backgroundColor: GREEN,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
    color: GREEN,
  },
  segmentTextActive: {
    color: '#fff',
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
    fontSize: 18,
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
});