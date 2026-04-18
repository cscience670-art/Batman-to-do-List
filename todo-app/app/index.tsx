import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, Animated, Dimensions, Modal, ScrollView,
  KeyboardAvoidingView, Platform,
} from "react-native";
import axios from "axios";
import * as Notifications from "expo-notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const API_URL = "http://192.168.1.24:3000";
const SCREEN_WIDTH = Dimensions.get("window").width;

type Category = { id: number; name: string };
type Task = {
  id: number; title: string; completed: boolean;
  category_name?: string; category_id?: number; date: string;
};

const emojiMap: Record<string, string> = {
  Work: "💼", Study: "📚", Health: "🏃‍♂️", Fitness: "💪",
  Shopping: "🛒", Finance: "💰", Coding: "💻", Projects: "🚀",
  Reading: "📖", Travel: "✈️", Other: "📌",
};

const defaultCategories: Category[] = [
  { id: 1, name: "Work" }, { id: 2, name: "Study" },
  { id: 3, name: "Health" }, { id: 4, name: "Fitness" },
  { id: 5, name: "Shopping" }, { id: 6, name: "Finance" },
  { id: 7, name: "Coding" }, { id: 8, name: "Projects" },
  { id: 9, name: "Reading" }, { id: 10, name: "Travel" },
];

type Screen = "tasks" | "stats";

export default function Index() {
  const [screen, setScreen] = useState<Screen>("tasks");

  const [task, setTask] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(defaultCategories[0]);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "done" | "pending">("all");
  const [filterCategory, setFilterCategory] = useState<number | null>(null);

  const [editTask, setEditTask] = useState<Task | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editCategory, setEditCategory] = useState(defaultCategories[0]);

  const [bats, setBats] = useState<{ id: number; x: number; anim: Animated.Value }[]>([]);

  /* ── NOTIFICATIONS ── */
  useEffect(() => {
    (async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") console.log("Notification permission denied");
    })();
  }, []);

  /* ── FETCH ── */
  const fetchTasks = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/tasks`);
      setTasks(res.data);
      scheduleReminders(res.data);
    } catch (err) { console.log(err); }
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  /* ── REMINDERS ── */
  const scheduleReminders = async (allTasks: Task[]) => {
    await Notifications.cancelAllScheduledNotificationsAsync();
    const today = new Date().toISOString().split("T")[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];

    for (const t of allTasks) {
      if (t.completed) continue;
      if (t.date === today || t.date === tomorrow) {
        const label = t.date === today ? "today" : "tomorrow";
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "🦇 Batman Reminder",
            body: `"${t.title}" is due ${label}!`,
          },
          trigger: {
            type: "timeInterval",
            seconds: 5,
            repeats: false,
          } as Notifications.TimeIntervalTriggerInput,
        });
      }
    }
  };

  /* ── ADD ── */
  const addTask = async () => {
    if (!task.trim()) return;
    await axios.post(`${API_URL}/tasks`, {
      title: task, category_id: selectedCategory.id, date,
    });
    setTask(""); fetchTasks();
  };

  /* ── TOGGLE ── */
  const toggleTask = useCallback(async (id: number) => {
    const current = tasks.find((t) => t.id === id);
    if (current && !current.completed) spawnBats();
    await axios.put(`${API_URL}/tasks/${id}`);
    fetchTasks();
  }, [tasks]);

  /* ── DELETE ── */
  const deleteTask = useCallback(async (id: number) => {
    await axios.delete(`${API_URL}/tasks/${id}`);
    fetchTasks();
  }, []);

  /* ── EDIT SAVE ── */
  const saveEdit = async () => {
    if (!editTask) return;
    await axios.patch(`${API_URL}/tasks/${editTask.id}`, {
      title: editTitle, date: editDate, category_id: editCategory.id,
    });
    setEditTask(null); fetchTasks();
  };

  /* ── BATS ── */
  const spawnBats = () => {
    const newBats = Array.from({ length: 40 }).map((_, i) => {
      const anim = new Animated.Value(0);
      Animated.timing(anim, {
        toValue: 1, duration: 1000, useNativeDriver: true,
      }).start();
      return { id: Date.now() + i, x: Math.random() * (SCREEN_WIDTH - 40), anim };
    });
    setBats(newBats);
    setTimeout(() => setBats([]), 1200);
  };

  /* ── FILTER ── */
  const filtered = tasks.filter((t) => {
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      filterStatus === "all" ? true :
      filterStatus === "done" ? t.completed : !t.completed;
    const matchCat = filterCategory === null || t.category_id === filterCategory;
    return matchSearch && matchStatus && matchCat;
  });

  /* ── STATS ── */
  const total = tasks.length;
  const done = tasks.filter((t) => t.completed).length;
  const rate = total === 0 ? 0 : Math.round((done / total) * 100);
  const byCategory = defaultCategories.map((c) => ({
    ...c,
    count: tasks.filter((t) => t.category_id === c.id).length,
    doneCount: tasks.filter((t) => t.category_id === c.id && t.completed).length,
  })).filter((c) => c.count > 0);

  /* ── RENDER TASK ITEM (memoized for smoothness) ── */
  const renderTask = useCallback(({ item }: { item: Task }) => (
    <View style={styles.taskItem}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.taskText, item.completed && styles.completed]}>
          {item.title}
        </Text>
        <Text style={styles.meta}>
          {emojiMap[item.category_name ?? ""] ?? "📌"} {item.category_name} • {item.date}
        </Text>
      </View>

      <View style={styles.taskActions}>
        {/* EDIT */}
        <TouchableOpacity
          onPress={() => {
            setEditTask(item);
            setEditTitle(item.title);
            setEditDate(item.date);
            setEditCategory(
              defaultCategories.find(c => c.id === item.category_id) ?? defaultCategories[0]
            );
          }}
          style={styles.actionBtn}
        >
          <Text style={styles.actionIcon}>✏️</Text>
        </TouchableOpacity>

        {/* TOGGLE */}
        <TouchableOpacity onPress={() => toggleTask(item.id)} style={styles.actionBtn}>
          <Text style={styles.actionIcon}>{item.completed ? "✅" : "⭕"}</Text>
        </TouchableOpacity>

        {/* DELETE */}
        <TouchableOpacity onPress={() => deleteTask(item.id)} style={styles.actionBtn}>
          <Text style={styles.actionIcon}>🗑️</Text>
        </TouchableOpacity>
      </View>
    </View>
  ), [tasks]);

  /* ══════════════════
     STATS SCREEN
  ══════════════════ */
  if (screen === "stats") {
    return (
      <View style={styles.container}>
        <View style={styles.navRow}>
          <TouchableOpacity onPress={() => setScreen("tasks")}>
            <Text style={styles.navBack}>← Tasks</Text>
          </TouchableOpacity>
          <Text style={styles.title}>📊 Stats</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Overall Progress</Text>
          <Text style={styles.statBig}>{rate}%</Text>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${rate}%` as any }]} />
          </View>
          <Text style={styles.statSub}>{done} / {total} tasks completed</Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {byCategory.map((c) => {
            const pct = c.count === 0 ? 0 : Math.round((c.doneCount / c.count) * 100);
            return (
              <View key={c.id} style={styles.statCard}>
                <Text style={styles.statLabel}>{emojiMap[c.name]} {c.name}</Text>
                <View style={styles.progressBg}>
                  <View style={[styles.progressFill, { width: `${pct}%` as any, backgroundColor: "#facc15" }]} />
                </View>
                <Text style={styles.statSub}>{c.doneCount}/{c.count} — {pct}%</Text>
              </View>
            );
          })}
        </ScrollView>
      </View>
    );
  }

  /* ══════════════════
     TASKS SCREEN
  ══════════════════ */
  return (
    /* 🔑 KeyboardAvoidingView fixes keyboard covering inputs */
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
    >
      <View style={styles.container}>

        {/* HEADER */}
        <View style={styles.navRow}>
          <Text style={styles.title}>🦇 Batman Tasks</Text>
          <TouchableOpacity onPress={() => setScreen("stats")} style={styles.statsBtn}>
            <Text style={{ color: "#fff", fontWeight: "bold" }}>📊 Stats</Text>
          </TouchableOpacity>
        </View>

        {/* SEARCH */}
        <TextInput
          placeholder="🔍 Search tasks..."
          value={search}
          onChangeText={setSearch}
          style={styles.input}
          placeholderTextColor="#94a3b8"
        />

        {/* FILTER STATUS */}
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 10 }}>
          {(["all", "pending", "done"] as const).map((s) => (
            <TouchableOpacity
              key={s}
              onPress={() => setFilterStatus(s)}
              style={[styles.filterBtn, filterStatus === s && styles.filterBtnActive]}
            >
              <Text style={styles.filterText}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* CATEGORY FILTER — bigger */}
        <FlatList
          horizontal
          data={[{ id: 0, name: "All" } as Category, ...defaultCategories]}
          keyExtractor={(item) => item.id.toString()}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => {
                setFilterCategory(item.id === 0 ? null : item.id);
                if (item.id !== 0) setSelectedCategory(item);
              }}
              style={[
                styles.category,
                (item.id === 0 ? filterCategory === null : filterCategory === item.id)
                  && styles.selectedCategory,
              ]}
            >
              <Text style={styles.categoryText}>
                {item.id === 0 ? "🗂️ All" : `${emojiMap[item.name]} ${item.name}`}
              </Text>
            </TouchableOpacity>
          )}
          style={{ marginBottom: 10 }}
        />

        {/* DATE INPUT */}
        <TextInput
          value={date}
          onChangeText={setDate}
          style={styles.input}
          placeholderTextColor="#94a3b8"
          placeholder="Date (YYYY-MM-DD)"
        />

        {/* ADD TASK */}
        <View style={styles.inputContainer}>
          <TextInput
            placeholder="Add task..."
            value={task}
            onChangeText={setTask}
            style={styles.input}
            placeholderTextColor="#94a3b8"
            onSubmitEditing={addTask}
            returnKeyType="done"
          />
          <TouchableOpacity onPress={addTask} style={styles.addButton}>
            <Text style={styles.addText}>+</Text>
          </TouchableOpacity>
        </View>

        {/* TASK LIST */}
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderTask}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />

        {/* EDIT MODAL */}
        <Modal visible={!!editTask} transparent animationType="slide">
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalBox}>
                <Text style={styles.modalTitle}>✏️ Edit Task</Text>

                <TextInput
                  value={editTitle}
                  onChangeText={setEditTitle}
                  style={styles.input}
                  placeholderTextColor="#94a3b8"
                  placeholder="Task title"
                />
                <TextInput
                  value={editDate}
                  onChangeText={setEditDate}
                  style={styles.input}
                  placeholderTextColor="#94a3b8"
                  placeholder="Date (YYYY-MM-DD)"
                />

                <FlatList
                  horizontal
                  data={defaultCategories}
                  keyExtractor={(item) => item.id.toString()}
                  showsHorizontalScrollIndicator={false}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      onPress={() => setEditCategory(item)}
                      style={[
                        styles.category,
                        editCategory.id === item.id && styles.selectedCategory,
                      ]}
                    >
                      <Text style={styles.categoryText}>
                        {emojiMap[item.name]} {item.name}
                      </Text>
                    </TouchableOpacity>
                  )}
                  style={{ marginBottom: 14 }}
                />

                <View style={{ flexDirection: "row", gap: 10 }}>
                  <TouchableOpacity onPress={saveEdit} style={[styles.addButton, { flex: 1 }]}>
                    <Text style={[styles.addText, { textAlign: "center" }]}>Save</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setEditTask(null)}
                    style={[styles.addButton, { flex: 1, backgroundColor: "#ef4444" }]}
                  >
                    <Text style={[styles.addText, { textAlign: "center" }]}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* BATS */}
        {bats.map((bat) => (
          <Animated.View
            key={bat.id}
            style={{
              position: "absolute", bottom: 80, left: bat.x,
              transform: [
                { translateY: bat.anim.interpolate({ inputRange: [0, 1], outputRange: [0, -300] }) },
                { scale: bat.anim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1.5] }) },
              ],
              opacity: bat.anim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
            }}
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <Text key={i} style={{ fontSize: 24 }}>🦇🦇</Text>
            ))}
          </Animated.View>
        ))}

      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  /* ── MAIN ── */
  container: {
    flex: 1,
    backgroundColor: "transparent", // ✅ IMPORTANT (show background)
    padding: 20,
  },

  title: {
    fontSize: 24,
    color: "#fff",
    fontWeight: "bold",
  },

  /* ── NAV ── */
  navRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },

  navBack: {
    color: "#94a3b8",
    fontSize: 16,
  },

  statsBtn: {
    backgroundColor: "rgba(30, 41, 59, 0.85)", // ✅ glass effect
    padding: 10,
    borderRadius: 10,
  },

  /* ── INPUT ── */
  inputContainer: {
    flexDirection: "row",
    marginVertical: 6,
  },

  input: {
    flex: 1,
    backgroundColor: "rgba(30, 41, 59, 0.85)", // ✅ transparent card
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    color: "#fff",
    marginVertical: 4,
    fontSize: 15,
  },

  addButton: {
    backgroundColor: "#22c55e",
    paddingHorizontal: 18,
    borderRadius: 12,
    marginLeft: 10,
    justifyContent: "center",
  },

  addText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
  },

  /* ── CATEGORY ── */
  category: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginRight: 8,
    backgroundColor: "rgba(30, 41, 59, 0.85)", // ✅ glass
    borderRadius: 12,
  },

  selectedCategory: {
    backgroundColor: "#22c55e",
  },

  categoryText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },

  /* ── FILTER ── */
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "rgba(30, 41, 59, 0.85)",
    borderRadius: 20,
  },

  filterBtnActive: {
    backgroundColor: "#7c3aed",
  },

  filterText: {
    color: "#fff",
    textTransform: "capitalize",
    fontSize: 14,
  },

  /* ── TASK ITEM ── */
  taskItem: {
    backgroundColor: "rgba(30, 41, 59, 0.8)", // ✅ glass card
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  taskText: {
    color: "#fff",
    fontSize: 15,
  },

  completed: {
    textDecorationLine: "line-through",
    color: "#94a3b8",
  },

  meta: {
    color: "#94a3b8",
    fontSize: 12,
    marginTop: 4,
  },

  taskActions: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
  },

  actionBtn: {
    backgroundColor: "rgba(15, 23, 42, 0.9)",
    padding: 8,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  actionIcon: {
    fontSize: 18,
  },

  /* ── MODAL ── */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    padding: 20,
  },

  modalBox: {
    backgroundColor: "rgba(30, 41, 59, 0.95)",
    borderRadius: 16,
    padding: 20,
  },

  modalTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 14,
  },

  /* ── STATS ── */
  statCard: {
    backgroundColor: "rgba(30, 41, 59, 0.85)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },

  statLabel: {
    color: "#94a3b8",
    fontSize: 14,
    marginBottom: 6,
  },

  statBig: {
    color: "#22c55e",
    fontSize: 48,
    fontWeight: "bold",
  },

  statSub: {
    color: "#94a3b8",
    fontSize: 12,
    marginTop: 4,
  },

  progressBg: {
    height: 10,
    backgroundColor: "rgba(15, 23, 42, 0.9)",
    borderRadius: 5,
    overflow: "hidden",
    marginVertical: 6,
  },

  progressFill: {
    height: 10,
    backgroundColor: "#22c55e",
    borderRadius: 5,
  },
});
