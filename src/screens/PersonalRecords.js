import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { CURRENT_USER, PERSONAL_RECORDS } from '../constants/currentUser';

const GREEN = '#2F5D46';

// Duration records are stored in minutes, e.g. 135 -> "2hr 15min"
function formatDuration(totalMinutes) {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}hr`;
  return `${h}hr ${m}min`;
}

function formatValue(record, value) {
  if (record.unit === 'minutes') return formatDuration(value);
  if (record.unit === 'km') return `${value}km`;
  return `${value} ${record.unit}`;
}

function RecordRow({ record, userRecord, isLast }) {
  return (
    <View style={[styles.row, !isLast && styles.rowBorder]}>
      <View style={styles.left}>
        <Text style={styles.name}>{record.name}</Text>
        <Text style={styles.setOn}>Set On: {userRecord ? userRecord.setOn : '---'}</Text>
      </View>
      <Text style={styles.value}>
        {userRecord ? formatValue(record, userRecord.value) : '---'}
      </Text>
    </View>
  );
}

export default function PersonalRecordsScreen() {
  const user = CURRENT_USER.currentUser;

  // Map of record id -> the user's record for quick lookup
  const userRecords = Object.fromEntries(
    user.personalRecords.map((r) => [r.id, r])
  );

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Personal Records</Text>

      <View style={styles.card}>
        {PERSONAL_RECORDS.map((record, index) => (
          <RecordRow
            key={record.id}
            record={record}
            userRecord={userRecords[record.id]}
            isLast={index === PERSONAL_RECORDS.length - 1}
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
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  left: {
    flex: 1,
    paddingRight: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  setOn: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  value: {
    fontSize: 18,
    fontWeight: '700',
    color: GREEN,
  },
});