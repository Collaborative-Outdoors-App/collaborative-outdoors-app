import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { PERSONAL_RECORDS } from '../constants/currentUser';

const GREEN = '#2F5D46';
const EMPTY_VALUE = '--';

function RecordRow({ record, isLast }) {
  return (
    <View style={[styles.row, !isLast && styles.rowBorder]}>
      <View style={styles.left}>
        <Text style={styles.name}>{record.name}</Text>
        <Text style={styles.setOn}>Set On: {EMPTY_VALUE}</Text>
      </View>
      <Text style={styles.value}>{EMPTY_VALUE}</Text>
    </View>
  );
}

export default function PersonalRecordsScreen() {
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