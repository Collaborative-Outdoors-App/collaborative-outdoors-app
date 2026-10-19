import { useEffect, useMemo, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { GROUPS } from "../constants/groups";
import { CURRENT_USER } from "../constants/currentUser";

const STORAGE_KEY = "outdoor-collaborative-group-chats-v1";

function formatTime(sentTime) {
  const date = new Date(sentTime);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function GroupChatScreen({ route }) {
  const { groupId } = route.params;
  const group = useMemo(
    () => route.params.group || GROUPS.groups.find((item) => item.groupId === groupId),
    [groupId, route.params.group],
  );
  const [activeTab, setActiveTab] = useState("chat");
  const [groupData, setGroupData] = useState({ messages: [], itinerary: null });
  const [draft, setDraft] = useState("");
  const [itineraryTitle, setItineraryTitle] = useState("");
  const [itineraryDate, setItineraryDate] = useState("");
  const [itineraryMeetingPoint, setItineraryMeetingPoint] = useState("");
  const [itineraryNotes, setItineraryNotes] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const scrollRef = useRef(null);
  const groupDataRef = useRef(groupData);
  const writeQueueRef = useRef(Promise.resolve());

  useEffect(() => {
    let isMounted = true;
    async function loadGroupData() {
      try {
        const savedValue = await AsyncStorage.getItem(STORAGE_KEY);
        if (!savedValue) return;
        const savedGroups = JSON.parse(savedValue);
        const savedGroup = savedGroups?.[groupId];
        if (savedGroup && isMounted) {
          const loadedData = {
            messages: Array.isArray(savedGroup.messages) ? savedGroup.messages : [],
            itinerary: savedGroup.itinerary && typeof savedGroup.itinerary === "object"
              ? savedGroup.itinerary
              : null,
          };
          groupDataRef.current = loadedData;
          setGroupData(loadedData);
        }
      } catch {
        if (isMounted) setError("Saved group data could not be read. New changes may replace corrupted data.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadGroupData();
    return () => {
      isMounted = false;
    };
  }, [groupId]);

  useEffect(() => {
    if (groupData.itinerary) {
      setItineraryTitle(groupData.itinerary.title || "");
      setItineraryDate(groupData.itinerary.date || "");
      setItineraryMeetingPoint(groupData.itinerary.meetingPoint || "");
      setItineraryNotes(groupData.itinerary.notes || "");
    }
  }, [groupData.itinerary]);

  useEffect(() => {
    if (activeTab === "chat") {
      scrollRef.current?.scrollToEnd({ animated: true });
    }
  }, [activeTab, groupData.messages]);

  function persistGroupData(nextData) {
    groupDataRef.current = nextData;
    setGroupData(nextData);
    setError("");
    const write = writeQueueRef.current.catch(() => {}).then(async () => {
      const savedValue = await AsyncStorage.getItem(STORAGE_KEY);
      const savedGroups = savedValue ? JSON.parse(savedValue) : {};
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ ...savedGroups, [groupId]: nextData }),
      );
    });
    writeQueueRef.current = write;
    return write;
  }

  async function appendMessage(text) {
    const message = {
      messageId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      userId: CURRENT_USER.currentUser.userId,
      firstName: CURRENT_USER.currentUser.firstName,
      lastName: CURRENT_USER.currentUser.lastName,
      text,
      sentTime: new Date().toISOString(),
    };
    const currentData = groupDataRef.current;
    await persistGroupData({
      ...currentData,
      messages: [...currentData.messages, message],
    });
  }

  async function handleSendMessage() {
    const message = draft.trim();
    if (!message || isLoading) return;
    setDraft("");
    try {
      await appendMessage(message);
    } catch {
      setDraft(message);
      setError("Message could not be saved on this device. Please try again.");
    }
  }

  async function handleSaveItinerary() {
    const title = itineraryTitle.trim();
    if (!title) {
      setError("Add a trip name before saving the itinerary.");
      return;
    }
    const itinerary = {
      title,
      date: itineraryDate.trim(),
      meetingPoint: itineraryMeetingPoint.trim(),
      notes: itineraryNotes.trim(),
      updatedAt: new Date().toISOString(),
    };
    const currentData = groupDataRef.current;
    const isNewItinerary = !currentData.itinerary;
    try {
      if (isNewItinerary) {
        const details = [
          `Itinerary proposal: ${itinerary.title}.`,
          itinerary.date ? `Date: ${itinerary.date}.` : "",
          itinerary.meetingPoint ? `Meet at: ${itinerary.meetingPoint}.` : "",
          itinerary.notes ? `Plan: ${itinerary.notes}` : "",
        ].filter(Boolean).join(" ");
        const message = {
          messageId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          userId: CURRENT_USER.currentUser.userId,
          firstName: CURRENT_USER.currentUser.firstName,
          lastName: CURRENT_USER.currentUser.lastName,
          text: details,
          sentTime: new Date().toISOString(),
        };
        await persistGroupData({
          itinerary,
          messages: [...currentData.messages, message],
        });
      } else {
        await persistGroupData({ ...currentData, itinerary });
      }
    } catch {
      setError("The itinerary could not be saved on this device. Please try again.");
    }
  }

  async function handleShareItinerary() {
    if (!groupData.itinerary) return;
    const itinerary = groupData.itinerary;
    const details = [
      `Let's discuss our itinerary: ${itinerary.title}.`,
      itinerary.date ? `Date: ${itinerary.date}.` : "",
      itinerary.meetingPoint ? `Meet at: ${itinerary.meetingPoint}.` : "",
      itinerary.notes ? `Plan: ${itinerary.notes}` : "",
    ].filter(Boolean).join(" ");
    try {
      await appendMessage(details);
      setActiveTab("chat");
    } catch {
      setError("The itinerary could not be shared to chat. Please try again.");
    }
  }

  if (!group) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>This group could not be found.</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#2F5D46" />
        <Text style={styles.loadingText}>Loading group conversation…</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <View style={styles.groupHeader}>
        <Text style={styles.groupName}>{group.name}</Text>
        <Text style={styles.memberCount}>{group.members.length} group members</Text>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          onPress={() => setActiveTab("chat")}
          style={[styles.tab, activeTab === "chat" && styles.activeTab]}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === "chat" }}
        >
          <Text style={[styles.tabText, activeTab === "chat" && styles.activeTabText]}>Chat</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab("itinerary")}
          style={[styles.tab, activeTab === "itinerary" && styles.activeTab]}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === "itinerary" }}
        >
          <Text style={[styles.tabText, activeTab === "itinerary" && styles.activeTabText]}>
            Itinerary
          </Text>
        </TouchableOpacity>
      </View>

      {!!error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {activeTab === "chat" ? (
        <View style={styles.chatArea}>
          <ScrollView
            ref={scrollRef}
            style={styles.messages}
            contentContainerStyle={groupData.messages.length ? styles.messageList : styles.emptyChat}
            keyboardShouldPersistTaps="handled"
          >
            {groupData.messages.length ? groupData.messages.map((message) => {
              const isMine = message.userId === CURRENT_USER.currentUser.userId;
              return (
                <View key={message.messageId} style={[styles.messageRow, isMine && styles.myMessageRow]}>
                  <View style={[styles.messageBubble, isMine ? styles.myMessageBubble : styles.otherMessageBubble]}>
                    {!isMine && (
                      <Text style={styles.senderName}>{message.firstName} {message.lastName}</Text>
                    )}
                    <Text style={[styles.messageText, isMine && styles.myMessageText]}>{message.text}</Text>
                    <Text style={[styles.messageTime, isMine && styles.myMessageTime]}>
                      {formatTime(message.sentTime)}
                    </Text>
                  </View>
                </View>
              );
            }) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>Start planning together</Text>
                <Text style={styles.emptyDescription}>
                  Share ideas, ask questions, and decide on the details of your next trip.
                </Text>
                <TouchableOpacity
                  style={styles.emptyAction}
                  onPress={() => setActiveTab("itinerary")}
                >
                  <Text style={styles.emptyActionText}>Create an itinerary</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
          <View style={styles.composer}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="Discuss your next trip…"
              placeholderTextColor="#89958d"
              style={styles.messageInput}
              multiline
              maxLength={1000}
              accessibilityLabel="Write a group message"
            />
            <TouchableOpacity
              style={[styles.sendButton, !draft.trim() && styles.disabledButton]}
              onPress={handleSendMessage}
              disabled={!draft.trim()}
              accessibilityRole="button"
              accessibilityLabel="Send message"
            >
              <Text style={styles.sendButtonText}>Send</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <ScrollView
          style={styles.itineraryArea}
          contentContainerStyle={styles.itineraryContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.itineraryIntro}>
            <Text style={styles.sectionTitle}>Plan your next outing</Text>
            <Text style={styles.sectionDescription}>
              Create a proposal, then share it in chat so everyone can discuss it.
            </Text>
          </View>
          <Text style={styles.fieldLabel}>Trip name</Text>
          <TextInput
            value={itineraryTitle}
            onChangeText={setItineraryTitle}
            placeholder="e.g. Saturday morning hike"
            placeholderTextColor="#89958d"
            style={styles.field}
            maxLength={80}
          />
          <Text style={styles.fieldLabel}>Date and time</Text>
          <TextInput
            value={itineraryDate}
            onChangeText={setItineraryDate}
            placeholder="e.g. Sat, June 14 at 9:00 AM"
            placeholderTextColor="#89958d"
            style={styles.field}
            maxLength={80}
          />
          <Text style={styles.fieldLabel}>Meeting point</Text>
          <TextInput
            value={itineraryMeetingPoint}
            onChangeText={setItineraryMeetingPoint}
            placeholder="Where should the group meet?"
            placeholderTextColor="#89958d"
            style={styles.field}
            maxLength={120}
          />
          <Text style={styles.fieldLabel}>Notes and stops</Text>
          <TextInput
            value={itineraryNotes}
            onChangeText={setItineraryNotes}
            placeholder="Route ideas, food stops, gear to bring…"
            placeholderTextColor="#89958d"
            style={[styles.field, styles.notesField]}
            multiline
            textAlignVertical="top"
            maxLength={500}
          />
          <TouchableOpacity style={styles.primaryButton} onPress={handleSaveItinerary}>
            <Text style={styles.primaryButtonText}>
              {groupData.itinerary ? "Save itinerary" : "Save and propose itinerary"}
            </Text>
          </TouchableOpacity>
          {groupData.itinerary && (
            <TouchableOpacity style={styles.secondaryButton} onPress={handleShareItinerary}>
              <Text style={styles.secondaryButtonText}>Share in group chat</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.localNotice}>This itinerary is saved on this device only.</Text>
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F4F6F5" },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: "#F4F6F5" },
  loadingText: { marginTop: 12, color: "#647067" },
  groupHeader: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 14 },
  groupName: { color: "#17211b", fontSize: 22, fontWeight: "700" },
  memberCount: { marginTop: 4, color: "#647067", fontSize: 13 },
  tabs: { flexDirection: "row", paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: "#dce4de" },
  tab: { marginRight: 24, paddingBottom: 11, borderBottomWidth: 2, borderBottomColor: "transparent" },
  activeTab: { borderBottomColor: "#2F5D46" },
  tabText: { color: "#647067", fontSize: 15, fontWeight: "600" },
  activeTabText: { color: "#2F5D46" },
  errorBanner: { marginHorizontal: 16, marginTop: 10, padding: 10, borderRadius: 8, backgroundColor: "#fee2e2" },
  errorText: { color: "#991b1b", fontSize: 13, textAlign: "center" },
  chatArea: { flex: 1 },
  messages: { flex: 1 },
  messageList: { padding: 16, paddingBottom: 24 },
  messageRow: { alignItems: "flex-start", marginBottom: 12 },
  myMessageRow: { alignItems: "flex-end" },
  messageBubble: { maxWidth: "84%", paddingHorizontal: 13, paddingVertical: 10, borderRadius: 16 },
  otherMessageBubble: { backgroundColor: "#fff", borderBottomLeftRadius: 5 },
  myMessageBubble: { backgroundColor: "#2F5D46", borderBottomRightRadius: 5 },
  senderName: { marginBottom: 3, color: "#2F5D46", fontSize: 12, fontWeight: "700" },
  messageText: { color: "#17211b", fontSize: 15, lineHeight: 21 },
  myMessageText: { color: "#fff" },
  messageTime: { marginTop: 5, color: "#829087", fontSize: 10, textAlign: "right" },
  myMessageTime: { color: "#d2e1d8" },
  emptyChat: { flexGrow: 1, alignItems: "center", justifyContent: "center", padding: 28 },
  emptyState: { maxWidth: 320, alignItems: "center" },
  emptyTitle: { color: "#17211b", fontSize: 20, fontWeight: "700", textAlign: "center" },
  emptyDescription: { marginTop: 8, color: "#647067", fontSize: 14, lineHeight: 21, textAlign: "center" },
  emptyAction: { marginTop: 18, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, backgroundColor: "#E2ECE6" },
  emptyActionText: { color: "#1E3F30", fontWeight: "700" },
  composer: { flexDirection: "row", alignItems: "flex-end", paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: "#e2e8e4", backgroundColor: "#fff" },
  messageInput: { flex: 1, maxHeight: 110, minHeight: 42, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, backgroundColor: "#F1F4F2", color: "#17211b", fontSize: 15 },
  sendButton: { marginLeft: 8, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20, backgroundColor: "#2F5D46" },
  disabledButton: { opacity: 0.45 },
  sendButtonText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  itineraryArea: { flex: 1 },
  itineraryContent: { padding: 20, paddingBottom: 36 },
  itineraryIntro: { marginBottom: 18 },
  sectionTitle: { color: "#17211b", fontSize: 20, fontWeight: "700" },
  sectionDescription: { marginTop: 6, color: "#647067", fontSize: 14, lineHeight: 20 },
  fieldLabel: { marginBottom: 6, color: "#34423a", fontSize: 13, fontWeight: "700" },
  field: { minHeight: 46, marginBottom: 16, paddingHorizontal: 13, paddingVertical: 11, borderWidth: 1, borderColor: "#d9e1dc", borderRadius: 10, backgroundColor: "#fff", color: "#17211b", fontSize: 15 },
  notesField: { minHeight: 110 },
  primaryButton: { alignItems: "center", paddingVertical: 14, borderRadius: 10, backgroundColor: "#2F5D46" },
  primaryButtonText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  secondaryButton: { alignItems: "center", marginTop: 10, paddingVertical: 13, borderWidth: 1, borderColor: "#2F5D46", borderRadius: 10 },
  secondaryButtonText: { color: "#2F5D46", fontSize: 14, fontWeight: "700" },
  localNotice: { marginTop: 14, color: "#748178", fontSize: 12, textAlign: "center" },
});
