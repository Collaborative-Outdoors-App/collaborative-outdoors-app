import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import AuthenticationButtons from '../components/AuthenticationButtons';
import NavBar from '../components/NavBar';
import { colors, common } from '../styles/theme';
import { CURRENT_USER as currentUserData } from '../constants/currentUser';

const currentUser = currentUserData.currentUser;

function Row({ label, onPress, last }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.row, !last && styles.rowDivider, pressed && { opacity: 0.7 }]}
    >
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

export default function ProfileScreen({ navigation }) {
  return (
    <View style={common.screen}>
      <ScrollView contentContainerStyle={common.content}>
        <View style={[common.card, styles.profile]}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{currentUser.firstName[0]}{currentUser.lastName[0]}</Text>
          </View>
          <View>
            <Text style={styles.name}>{currentUser.firstName} {currentUser.lastName}</Text>
            <Text style={styles.email}>{currentUser.email}</Text>
          </View>
        </View>

        <View style={[common.card, styles.group]}>
          <Row label="Personal Details" onPress={() => navigation.navigate('PersonalDetails')} />
          <Row label="Change Password" onPress={() => navigation.navigate('ChangePassword')} />
          <Row label="Wearable" onPress={() => navigation.navigate('ConnectWearable')} />
          <Row label="Two-Step Verification" onPress={() => navigation.navigate('MFASetup')} last />
        </View>

        <AuthenticationButtons
          title="Log Out"
          variant="secondary"
          onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Login' }] })}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  profile: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 17, fontWeight: '700', color: colors.primary },
  name: { fontSize: 17, fontWeight: '600', color: colors.ink },
  email: { marginTop: 2, fontSize: 14, color: colors.stone },
  group: { padding: 0, overflow: 'hidden' },
  row: { minHeight: 56, paddingHorizontal: 18, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: colors.line },
  rowLabel: { flex: 1, fontSize: 16, fontWeight: '600', color: colors.ink },
  chevron: { fontSize: 22, color: colors.stone },
});