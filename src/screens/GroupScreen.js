import { useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { GROUPS } from "../constants/groups";
import { CURRENT_USER } from "../constants/currentUser";

const STORAGE_KEY = "outdoor-collaborative-groups-v1";
const CHAT_STORAGE_KEY = "outdoor-collaborative-group-chats-v1";
const ROLE_OPTIONS = ["member", "admin"];

function getInitials(name) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

export default function GroupScreen({ navigation }) {
  const [groups, setGroups] = useState(GROUPS.groups);
  const [activeTab, setActiveTab] = useState("groups");
  const [selectedGroupId, setSelectedGroupId] = useState(GROUPS.groups[0]?.groupId || null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [deleteConfirmation, setDeleteConfirmation] = useState(false);
  const [removalConfirmation, setRemovalConfirmation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const selectedGroup = useMemo(
    () => groups.find((group) => group.groupId === selectedGroupId) || null,
    [groups, selectedGroupId],
  );
  const currentUserRole = selectedGroup?.members.find(
    (member) => member.userId === CURRENT_USER.currentUser.userId,
  )?.role;
  const canManageGroup = currentUserRole === "owner" || currentUserRole === "admin";

  useEffect(() => {
    let isMounted = true;
    async function loadGroups() {
      try {
        const storedValue = await AsyncStorage.getItem(STORAGE_KEY);
        if (!storedValue) return;
        const storedGroups = JSON.parse(storedValue);
        if (!Array.isArray(storedGroups)) {
          throw new Error("Saved groups have an invalid format.");
        }
        if (isMounted) {
          setGroups(storedGroups);
          setSelectedGroupId(storedGroups[0]?.groupId || null);
        }
      } catch {
        if (isMounted) setError("Saved groups could not be loaded. Existing groups are shown for this session.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadGroups();
    return () => {
      isMounted = false;
    };
  }, []);

  async function saveGroups(nextGroups) {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextGroups));
      setGroups(nextGroups);
      setError("");
    } catch {
      setError("Your group change could not be saved on this device. Please try again.");
      throw new Error("Group changes could not be saved.");
    }
  }

  async function handleCreateGroup() {
    const name = newGroupName.trim();
    if (!name) {
      setError("Enter a name for your group.");
      return;
    }
    const user = CURRENT_USER.currentUser;
    const newGroup = {
      groupId: `g-${Date.now()}`,
      name,
      createdDate: new Date().toISOString(),
      members: [{
        userId: user.userId,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: "owner",
        dateJoined: new Date().toISOString(),
      }],
      invitations: [],
      messages: [],
    };
    try {
      await saveGroups([...groups, newGroup]);
      setSelectedGroupId(newGroup.groupId);
      setNewGroupName("");
      setShowCreateForm(false);
      setActiveTab("manage");
    } catch {
      return;
    }
  }

  async function handleInvite() {
    if (!selectedGroup) return;
    const email = inviteEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid email address to invite.");
      return;
    }
    const isMember = selectedGroup.members.some((member) => member.email?.toLowerCase() === email);
    const alreadyInvited = selectedGroup.invitations.some(
      (invitation) => invitation.inviteeEmail.toLowerCase() === email && invitation.status === "pending",
    );
    if (isMember || alreadyInvited) {
      setError(isMember ? "That person is already in this group." : "There is already a pending invitation for that email.");
      return;
    }
    const invitation = {
      invitationId: `i-${Date.now()}`,
      inviteeEmail: email,
      status: "pending",
      role: inviteRole,
      sentDate: new Date().toISOString(),
      sentBy: CURRENT_USER.currentUser.userId,
    };
    try {
      await saveGroups(groups.map((group) => (
        group.groupId === selectedGroup.groupId
          ? { ...group, invitations: [...group.invitations, invitation] }
          : group
      )));
      setInviteEmail("");
      setError("");
    } catch {
      return;
    }
  }

  async function handleAssignRole(member, role) {
    if (!selectedGroup || member.role === "owner" || member.role === role) return;
    try {
      await saveGroups(groups.map((group) => (
        group.groupId === selectedGroup.groupId
          ? {
            ...group,
            members: group.members.map((item) => (
              item.userId === member.userId ? { ...item, role } : item
            )),
          }
          : group
      )));
    } catch {
      return;
    }
  }

  async function handleRemoveMember(member) {
    if (!selectedGroup || member.role === "owner") return;
    try {
      await saveGroups(groups.map((group) => (
        group.groupId === selectedGroup.groupId
          ? { ...group, members: group.members.filter((item) => item.userId !== member.userId) }
          : group
      )));
      setRemovalConfirmation(null);
    } catch {
      return;
    }
  }

  async function handleCancelInvitation(invitationId) {
    if (!selectedGroup) return;
    try {
      await saveGroups(groups.map((group) => (
        group.groupId === selectedGroup.groupId
          ? {
            ...group,
            invitations: group.invitations.filter((invitation) => invitation.invitationId !== invitationId),
          }
          : group
      )));
    } catch {
      return;
    }
  }

  async function handleDeleteGroup() {
    if (!selectedGroup) return;
    const groupId = selectedGroup.groupId;
    const nextGroups = groups.filter((group) => group.groupId !== groupId);
    try {
      await saveGroups(nextGroups);
    } catch {
      return;
    }
    setSelectedGroupId(nextGroups[0]?.groupId || null);
    setDeleteConfirmation(false);
    try {
      const storedValue = await AsyncStorage.getItem(CHAT_STORAGE_KEY);
      if (storedValue) {
        const chats = JSON.parse(storedValue);
        delete chats[groupId];
        if (Object.keys(chats).length) {
          await AsyncStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(chats));
        } else {
          await AsyncStorage.removeItem(CHAT_STORAGE_KEY);
        }
      }
    } catch {
      setError("The group was deleted, but its saved chat and itinerary data could not be cleared.");
    }
  }

  function openGroupChat(group) {
    navigation.navigate("GroupChat", { groupId: group.groupId, group });
  }

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#2F5D46" />
        <Text style={styles.loadingText}>Loading your groups…</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.heading}>
          <Text style={styles.eyebrow}>YOUR COMMUNITY</Text>
          <Text style={styles.title}>Groups</Text>
          <Text style={styles.subtitle}>Plan outings and stay connected with your people.</Text>
        </View>

        <View style={styles.tabs}>
          <TouchableOpacity
            onPress={() => setActiveTab("groups")}
            style={[styles.tab, activeTab === "groups" && styles.activeTab]}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === "groups" }}
          >
            <Text style={[styles.tabText, activeTab === "groups" && styles.activeTabText]}>My groups</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setActiveTab("manage");
              setSelectedGroupId((current) => current || groups[0]?.groupId || null);
            }}
            style={[styles.tab, activeTab === "manage" && styles.activeTab]}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === "manage" }}
          >
            <Text style={[styles.tabText, activeTab === "manage" && styles.activeTabText]}>Management</Text>
          </TouchableOpacity>
        </View>

        {!!error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {activeTab === "groups" ? (
          <>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => {
                setShowCreateForm((visible) => !visible);
                setError("");
              }}
              accessibilityRole="button"
            >
              <Text style={styles.createButtonText}>{showCreateForm ? "Close" : "+ Create a group"}</Text>
            </TouchableOpacity>

            {showCreateForm && (
              <View style={styles.formCard}>
                <Text style={styles.cardTitle}>Start a new group</Text>
                <TextInput
                  value={newGroupName}
                  onChangeText={setNewGroupName}
                  placeholder="Group name"
                  placeholderTextColor="#89958d"
                  style={styles.input}
                  maxLength={60}
                  accessibilityLabel="New group name"
                />
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleCreateGroup}
                  accessibilityRole="button"
                >
                  <Text style={styles.primaryButtonText}>Create group</Text>
                </TouchableOpacity>
              </View>
            )}

            {groups.length ? groups.map((group) => (
              <View key={group.groupId} style={styles.groupCard}>
                <TouchableOpacity
                  style={styles.groupMain}
                  activeOpacity={0.8}
                  onPress={() => openGroupChat(group)}
                  accessibilityRole="button"
                  accessibilityLabel={`${group.name}, ${group.members.length} members. Open group chat`}
                >
                  <View style={styles.groupIcon}>
                    <Text style={styles.groupIconText}>{getInitials(group.name)}</Text>
                  </View>
                  <View style={styles.groupCopy}>
                    <Text style={styles.groupName}>{group.name}</Text>
                    <Text style={styles.memberCount}>
                      {group.members.length} members · Chat and itinerary
                    </Text>
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.manageLink}
                  onPress={() => {
                    setSelectedGroupId(group.groupId);
                    setActiveTab("manage");
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Manage ${group.name}`}
                >
                  <Text style={styles.manageLinkText}>Manage</Text>
                </TouchableOpacity>
              </View>
            )) : (
              <View style={styles.emptyCard}>
                <Text style={styles.cardTitle}>No groups yet</Text>
                <Text style={styles.emptyText}>Create a group to start planning together.</Text>
              </View>
            )}

            <View style={styles.note}>
              <Text style={styles.noteTitle}>Plan together</Text>
              <Text style={styles.noteText}>
                Groups, invitations, roles, messages, and itineraries are saved on this device only.
              </Text>
            </View>
          </>
        ) : (
          <View>
            <Text style={styles.sectionTitle}>Choose a group to manage</Text>
            {groups.length ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.groupPicker}>
                {groups.map((group) => (
                  <TouchableOpacity
                    key={group.groupId}
                    onPress={() => {
                      setSelectedGroupId(group.groupId);
                      setDeleteConfirmation(false);
                      setRemovalConfirmation(null);
                      setError("");
                    }}
                    style={[styles.groupChip, selectedGroupId === group.groupId && styles.groupChipSelected]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: selectedGroupId === group.groupId }}
                  >
                    <Text style={[styles.groupChipText, selectedGroupId === group.groupId && styles.groupChipTextSelected]}>
                      {group.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>Create a group before opening its management settings.</Text>
              </View>
            )}

            {selectedGroup && (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Members and roles</Text>
                  <Text style={styles.memberCount}>{selectedGroup.members.length} members</Text>
                </View>
                {!canManageGroup && (
                  <View style={styles.permissionNote}>
                    <Text style={styles.emptyText}>Only group owners and admins can change roles or manage invitations.</Text>
                  </View>
                )}
                {selectedGroup.members.map((member) => {
                  const fullName = `${member.firstName} ${member.lastName}`.trim();
                  const isCurrentUser = member.userId === CURRENT_USER.currentUser.userId;
                  const isOwner = member.role === "owner";
                  return (
                    <View key={member.userId} style={styles.memberCard}>
                      <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{getInitials(fullName)}</Text>
                      </View>
                      <View style={styles.memberCopy}>
                        <Text style={styles.memberName}>{fullName}{isCurrentUser ? " (You)" : ""}</Text>
                        <Text style={styles.memberEmail}>{member.email}</Text>
                        <View style={styles.roleControls}>
                          {isOwner ? (
                            <View style={styles.ownerBadge}>
                              <Text style={styles.ownerBadgeText}>Owner</Text>
                            </View>
                          ) : canManageGroup ? (
                            ROLE_OPTIONS.map((role) => (
                              <TouchableOpacity
                                key={role}
                                onPress={() => handleAssignRole(member, role)}
                                style={[styles.roleOption, member.role === role && styles.roleOptionSelected]}
                                accessibilityRole="button"
                                accessibilityState={{ selected: member.role === role }}
                              >
                                <Text style={[styles.roleOptionText, member.role === role && styles.roleOptionTextSelected]}>
                                  {role === "admin" ? "Admin" : "Member"}
                                </Text>
                              </TouchableOpacity>
                            ))
                          ) : (
                            <View style={styles.ownerBadge}>
                              <Text style={styles.ownerBadgeText}>
                                {member.role === "admin" ? "Admin" : "Member"}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                      {canManageGroup && !isOwner && !isCurrentUser && (
                        <TouchableOpacity
                          onPress={() => setRemovalConfirmation(member)}
                          style={styles.removeButton}
                          accessibilityRole="button"
                          accessibilityLabel={`Remove ${fullName}`}
                        >
                          <Text style={styles.removeButtonText}>Remove</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}

                {removalConfirmation && (
                  <View style={styles.confirmCard}>
                    <Text style={styles.cardTitle}>
                      Remove {removalConfirmation.firstName} {removalConfirmation.lastName}?
                    </Text>
                    <Text style={styles.emptyText}>They will no longer be a member of this group.</Text>
                    <View style={styles.confirmActions}>
                      <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => setRemovalConfirmation(null)}
                        accessibilityRole="button"
                      >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.dangerButton}
                        onPress={() => handleRemoveMember(removalConfirmation)}
                        accessibilityRole="button"
                      >
                        <Text style={styles.dangerButtonText}>Remove member</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {canManageGroup ? (
                  <View style={styles.formCard}>
                    <Text style={styles.cardTitle}>Invite someone</Text>
                    <Text style={styles.emptyText}>
                      Invitations are recorded as pending on this device; no email is sent.
                    </Text>
                    <TextInput
                      value={inviteEmail}
                      onChangeText={setInviteEmail}
                      placeholder="name@example.com"
                      placeholderTextColor="#89958d"
                      style={[styles.input, styles.inviteInput]}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                      maxLength={254}
                      accessibilityLabel="Invitee email address"
                    />
                    <Text style={styles.fieldLabel}>Assign role when they join</Text>
                    <View style={styles.roleControls}>
                      {ROLE_OPTIONS.map((role) => (
                        <TouchableOpacity
                          key={role}
                          onPress={() => setInviteRole(role)}
                          style={[styles.roleOption, inviteRole === role && styles.roleOptionSelected]}
                          accessibilityRole="button"
                          accessibilityState={{ selected: inviteRole === role }}
                        >
                          <Text style={[styles.roleOptionText, inviteRole === role && styles.roleOptionTextSelected]}>
                            {role === "admin" ? "Admin" : "Member"}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <TouchableOpacity
                      style={styles.primaryButton}
                      onPress={handleInvite}
                      accessibilityRole="button"
                    >
                      <Text style={styles.primaryButtonText}>Create invitation</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.formCard}>
                    <Text style={styles.cardTitle}>Invite someone</Text>
                    <Text style={styles.emptyText}>Ask a group owner or admin to invite new members.</Text>
                  </View>
                )}

                <Text style={styles.sectionTitle}>Pending invitations</Text>
                {selectedGroup.invitations.filter((invitation) => invitation.status === "pending").length ? (
                  selectedGroup.invitations
                    .filter((invitation) => invitation.status === "pending")
                    .map((invitation) => (
                      <View key={invitation.invitationId} style={styles.inviteCard}>
                        <View style={styles.inviteCopy}>
                          <Text style={styles.memberName}>{invitation.inviteeEmail}</Text>
                          <Text style={styles.memberEmail}>
                            Pending · {invitation.role || "member"}
                          </Text>
                        </View>
                        {canManageGroup && (
                          <TouchableOpacity
                            onPress={() => handleCancelInvitation(invitation.invitationId)}
                            style={styles.removeButton}
                            accessibilityRole="button"
                            accessibilityLabel={`Cancel invitation for ${invitation.inviteeEmail}`}
                          >
                            <Text style={styles.removeButtonText}>Cancel</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    ))
                ) : (
                  <View style={styles.emptyCard}>
                    <Text style={styles.emptyText}>No pending invitations.</Text>
                  </View>
                )}

                {currentUserRole === "owner" && (
                  <View style={styles.dangerZone}>
                    <Text style={styles.dangerTitle}>Delete group</Text>
                    <Text style={styles.emptyText}>
                      This removes the group and its saved chat and itinerary from this device.
                    </Text>
                    {deleteConfirmation ? (
                      <View style={styles.confirmActions}>
                        <TouchableOpacity
                          style={styles.cancelButton}
                          onPress={() => setDeleteConfirmation(false)}
                          accessibilityRole="button"
                        >
                          <Text style={styles.cancelButtonText}>Keep group</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.dangerButton}
                          onPress={handleDeleteGroup}
                          accessibilityRole="button"
                        >
                          <Text style={styles.dangerButtonText}>Delete permanently</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.dangerButton}
                        onPress={() => setDeleteConfirmation(true)}
                        accessibilityRole="button"
                      >
                        <Text style={styles.dangerButtonText}>Delete this group</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F4F6F5" },
  content: { flexGrow: 1, padding: 20, paddingBottom: 32 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F4F6F5" },
  loadingText: { marginTop: 12, color: "#647067" },
  heading: { marginTop: 16, marginBottom: 18 },
  eyebrow: { color: "#2F5D46", fontSize: 12, fontWeight: "700", letterSpacing: 1.1 },
  title: { marginTop: 5, color: "#17211b", fontSize: 30, fontWeight: "700" },
  subtitle: { marginTop: 6, color: "#647067", fontSize: 15 },
  tabs: { flexDirection: "row", marginBottom: 18, borderBottomWidth: 1, borderBottomColor: "#dce4de" },
  tab: { marginRight: 24, paddingBottom: 11, borderBottomWidth: 2, borderBottomColor: "transparent" },
  activeTab: { borderBottomColor: "#2F5D46" },
  tabText: { color: "#647067", fontSize: 15, fontWeight: "600" },
  activeTabText: { color: "#2F5D46" },
  errorBanner: { marginBottom: 12, padding: 11, borderRadius: 9, backgroundColor: "#fee2e2" },
  errorText: { color: "#991b1b", fontSize: 13 },
  createButton: { alignSelf: "flex-start", marginBottom: 14, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, backgroundColor: "#2F5D46" },
  createButtonText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  formCard: { marginBottom: 16, padding: 16, borderRadius: 14, backgroundColor: "#fff" },
  cardTitle: { color: "#17211b", fontSize: 16, fontWeight: "700" },
  input: { minHeight: 44, marginTop: 12, marginBottom: 12, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: "#d9e1dc", borderRadius: 9, backgroundColor: "#fff", color: "#17211b", fontSize: 15 },
  inviteInput: { marginTop: 14 },
  primaryButton: { alignItems: "center", marginTop: 8, paddingVertical: 12, borderRadius: 9, backgroundColor: "#2F5D46" },
  primaryButtonText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  groupCard: { marginBottom: 12, padding: 14, borderRadius: 16, backgroundColor: "#fff", shadowColor: "#0f172a", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  groupMain: { minHeight: 58, flexDirection: "row", alignItems: "center" },
  groupIcon: { width: 46, height: 46, alignItems: "center", justifyContent: "center", borderRadius: 23, backgroundColor: "#E2ECE6" },
  groupIconText: { color: "#1E3F30", fontSize: 17, fontWeight: "700" },
  groupCopy: { flex: 1, marginLeft: 13 },
  groupName: { color: "#17211b", fontSize: 16, fontWeight: "700" },
  memberCount: { marginTop: 4, color: "#647067", fontSize: 13 },
  chevron: { marginLeft: 8, color: "#829087", fontSize: 28 },
  manageLink: { alignSelf: "flex-end", marginTop: 8, paddingHorizontal: 10, paddingVertical: 6 },
  manageLinkText: { color: "#2F5D46", fontSize: 13, fontWeight: "700" },
  note: { marginTop: 4, padding: 16, borderRadius: 14, backgroundColor: "#EAF0EC" },
  noteTitle: { color: "#1E3F30", fontSize: 14, fontWeight: "700" },
  noteText: { marginTop: 4, color: "#526158", fontSize: 13, lineHeight: 19 },
  sectionTitle: { marginBottom: 10, color: "#17211b", fontSize: 17, fontWeight: "700" },
  groupPicker: { flexGrow: 0, marginBottom: 18 },
  groupChip: { marginRight: 8, paddingHorizontal: 13, paddingVertical: 9, borderWidth: 1, borderColor: "#d5ded8", borderRadius: 20, backgroundColor: "#fff" },
  groupChipSelected: { borderColor: "#2F5D46", backgroundColor: "#E2ECE6" },
  groupChipText: { color: "#536158", fontSize: 13, fontWeight: "600" },
  groupChipTextSelected: { color: "#1E3F30" },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4 },
  memberCard: { flexDirection: "row", alignItems: "center", marginBottom: 9, padding: 12, borderRadius: 13, backgroundColor: "#fff" },
  avatar: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 21, backgroundColor: "#E2ECE6" },
  avatarText: { color: "#1E3F30", fontSize: 14, fontWeight: "700" },
  memberCopy: { flex: 1, marginLeft: 11 },
  memberName: { color: "#17211b", fontSize: 14, fontWeight: "700" },
  memberEmail: { marginTop: 3, color: "#748178", fontSize: 12 },
  roleControls: { flexDirection: "row", marginTop: 8 },
  roleOption: { marginRight: 6, paddingHorizontal: 9, paddingVertical: 5, borderWidth: 1, borderColor: "#d9e1dc", borderRadius: 14 },
  roleOptionSelected: { borderColor: "#2F5D46", backgroundColor: "#E2ECE6" },
  roleOptionText: { color: "#647067", fontSize: 11, fontWeight: "600" },
  roleOptionTextSelected: { color: "#1E3F30" },
  ownerBadge: { alignSelf: "flex-start", marginTop: 8, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 14, backgroundColor: "#e8eaf6" },
  ownerBadgeText: { color: "#4338ca", fontSize: 11, fontWeight: "700" },
  permissionNote: { marginBottom: 12, paddingHorizontal: 13, paddingVertical: 9, borderRadius: 9, backgroundColor: "#EAF0EC" },
  removeButton: { marginLeft: 8, padding: 7 },
  removeButtonText: { color: "#b42318", fontSize: 12, fontWeight: "700" },
  confirmCard: { marginBottom: 14, padding: 14, borderWidth: 1, borderColor: "#fecaca", borderRadius: 12, backgroundColor: "#fff" },
  confirmActions: { flexDirection: "row", justifyContent: "flex-end", marginTop: 12 },
  cancelButton: { marginRight: 8, paddingHorizontal: 13, paddingVertical: 10, borderRadius: 8, backgroundColor: "#eef1ef" },
  cancelButtonText: { color: "#34423a", fontSize: 13, fontWeight: "700" },
  dangerButton: { alignItems: "center", alignSelf: "flex-start", marginTop: 10, paddingHorizontal: 13, paddingVertical: 10, borderRadius: 8, backgroundColor: "#b42318" },
  dangerButtonText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  emptyCard: { marginBottom: 12, padding: 16, borderRadius: 12, backgroundColor: "#fff" },
  emptyText: { marginTop: 5, color: "#647067", fontSize: 13, lineHeight: 19 },
  fieldLabel: { marginTop: 12, color: "#34423a", fontSize: 13, fontWeight: "700" },
  inviteCard: { flexDirection: "row", alignItems: "center", marginBottom: 8, padding: 13, borderRadius: 11, backgroundColor: "#fff" },
  inviteCopy: { flex: 1 },
  dangerZone: { marginTop: 20, padding: 16, borderWidth: 1, borderColor: "#fecaca", borderRadius: 13, backgroundColor: "#fff" },
  dangerTitle: { color: "#991b1b", fontSize: 16, fontWeight: "700" },
});
