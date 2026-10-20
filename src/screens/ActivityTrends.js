import { useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import TrendChart from '../components/TrendChart';
import {
  DISTANCE_TRAVELLED_TRENDS,
  TIME_SPENT_HIKING_TRENDS,
} from '../constants/currentUser';

const GREEN = '#2F5D46';

const STAT_OPTIONS = [
  {
    id: 'distance',
    label: 'Distance Travelled',
    data: DISTANCE_TRAVELLED_TRENDS,
    getValue: (d) => d.km,
    unit: 'km',
    yAxisTitle: 'Kilometres',
    formatTotal: (v) => `${v.toFixed(1)} km`,
    formatAvg: (v) => `${v.toFixed(1)} km`,
    formatBest: (v) => `${v.toFixed(1)} km`,
  },
  {
    id: 'hiking_time',
    label: 'Time Spent Hiking',
    data: TIME_SPENT_HIKING_TRENDS,
    getValue: (d) => d.minutes,
    unit: 'min',
    yAxisTitle: 'Minutes',
    formatTotal: (v) => `${Math.round(v)} min`,
    formatAvg: (v) => `${v.toFixed(1)} min`,
    formatBest: (v) => `${Math.round(v)} min`,
  },
];

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
  const [selectedStatId, setSelectedStatId] = useState(STAT_OPTIONS[0].id);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [range, setRange] = useState(7);

  const selectedStat =
    STAT_OPTIONS.find((s) => s.id === selectedStatId) || STAT_OPTIONS[0];

  const data = useMemo(() => {
    const slice = selectedStat.data.slice(0, range).reverse();
    return slice.map((d, i) => {
      const daysAgo = slice.length - 1 - i;
      return {
        value: selectedStat.getValue(d),
        date: getDateLabel(daysAgo), // shown in the tooltip only
      };
    });
  }, [selectedStat, range]);

  const stats = useMemo(() => {
    const values = data.map((d) => d.value);
    const total = values.reduce((sum, v) => sum + v, 0);
    const count = values.length || 1;
    const avg = total / count;
    const best = values.length ? Math.max(...values) : 0;
    return {
      total: selectedStat.formatTotal(total),
      average: selectedStat.formatAvg(avg),
      best: selectedStat.formatBest(best),
    };
  }, [data, selectedStat]);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Activity Trends</Text>

      {/* Metric filter dropdown */}
      <View style={styles.dropdownContainer}>
        <Pressable
          onPress={() => setDropdownOpen((prev) => !prev)}
          accessibilityRole="button"
          accessibilityLabel={`Select statistic, currently selected: ${selectedStat.label}`}
          accessibilityState={{ expanded: dropdownOpen }}
          style={[
            styles.dropdownButton,
            dropdownOpen && styles.dropdownButtonActive,
          ]}
        >
          <View style={styles.dropdownLeft}>
            <Text style={styles.dropdownLabelText}>Statistic</Text>
            <Text style={styles.dropdownValueText}>{selectedStat.label}</Text>
          </View>
          <Text style={styles.dropdownChevron}>{dropdownOpen ? '▲' : '▼'}</Text>
        </Pressable>

        {dropdownOpen && (
          <View style={styles.dropdownMenu}>
            {STAT_OPTIONS.map((stat, idx) => {
              const isSelected = stat.id === selectedStat.id;
              const isLast = idx === STAT_OPTIONS.length - 1;
              return (
                <Pressable
                  key={stat.id}
                  onPress={() => {
                    setSelectedStatId(stat.id);
                    setDropdownOpen(false);
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  style={[
                    styles.dropdownItem,
                    isSelected && styles.dropdownItemActive,
                    !isLast && styles.dropdownItemBorder,
                  ]}
                >
                  <View style={styles.dropdownItemTextContainer}>
                    <Text
                      style={[
                        styles.dropdownItemTitle,
                        isSelected && styles.dropdownItemTitleActive,
                      ]}
                    >
                      {stat.label}
                    </Text>
                    <View
                      style={[
                        styles.unitBadge,
                        isSelected && styles.unitBadgeActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.unitBadgeText,
                          isSelected && styles.unitBadgeTextActive,
                        ]}
                      >
                        {stat.unit}
                      </Text>
                    </View>
                  </View>
                  {isSelected && (
                    <Text style={styles.dropdownCheckmark}>✓</Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        )}
      </View>

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

      {/* Chart (key remounts it so the animation replays when the range or metric changes) */}
      <TrendChart
        key={`${selectedStat.id}-${range}`}
        data={data}
        yAxisTitle={selectedStat.yAxisTitle}
        unit={selectedStat.unit}
        hideDataPoints={range === 30}
      />

      {/* Summary */}
      <View style={styles.card}>
        <View style={styles.statsRow}>
          <Stat label="Total" value={stats.total} />
          <View style={styles.divider} />
          <Stat label="Daily avg" value={stats.average} />
          <View style={styles.divider} />
          <Stat label="Best day" value={stats.best} />
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
    marginBottom: 15,
  },
  dropdownContainer: {
    marginBottom: 16,
  },
  dropdownButton: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  dropdownButtonActive: {
    borderColor: GREEN,
  },
  dropdownLeft: {
    flex: 1,
  },
  dropdownLabelText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  dropdownValueText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  dropdownChevron: {
    fontSize: 12,
    color: GREEN,
    fontWeight: '700',
    marginLeft: 12,
  },
  dropdownMenu: {
    backgroundColor: '#fff',
    borderRadius: 14,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
  },
  dropdownItemActive: {
    backgroundColor: '#F0F5F2',
  },
  dropdownItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownItemTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dropdownItemTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#374151',
  },
  dropdownItemTitleActive: {
    fontWeight: '700',
    color: GREEN,
  },
  unitBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 8,
  },
  unitBadgeActive: {
    backgroundColor: '#DDE9E2',
  },
  unitBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  unitBadgeTextActive: {
    color: GREEN,
  },
  dropdownCheckmark: {
    fontSize: 16,
    fontWeight: '700',
    color: GREEN,
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