import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, Animated, Dimensions, Modal, ScrollView, Platform,
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

  useEffect(() => {
    (async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") console.log("Notification permission denied");
    })();
  }, []);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/tasks`);
      setTasks(res.data);
      scheduleReminders(res.data);
    } catch (err) { console.log(err); }
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

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
  const addTask = async () => {
    if (!task.trim()) return;
    await axios.post(`${API_URL}/tasks`, {
      title: task, category_id: selectedCategory.id, date,
    });
    setTask(""); fetchTasks();
  };

  const toggleTask = async (id: number) => {
    const current = tasks.find((t) => t.id === id);
    if (current && !current.completed) spawnBats();
    await axios.put(`${API_URL}/tasks/${id}`);
    fetchTasks();
  };

  const deleteTask = async (id: number) => {
    await axios.delete(`${API_URL}/tasks/${id}`);
    fetchTasks();
  };

  const saveEdit = async () => {
    if (!editTask) return;
    await axios.patch(`${API_URL}/tasks/${editTask.id}`, {
      title: editTitle, date: editDate, category_id: editCategory.id,
    });
    setEditTask(null); fetchTasks();
  };

  const spawnBats = () => {
    const newBats = Array.from({ length: 80 }).map((_, i) => {
      const anim = new Animated.Value(0);
      Animated.timing(anim, { toValue: 1, duration: 1000, useNativeDriver: true }).start();
      return { id: Date.now() + i, x: Math.random() * (SCREEN_WIDTH - 40), anim };
    });
    setBats(newBats);
    setTimeout(() => setBats([]), 1200);
  };

  const filtered = tasks.filter((t) => {
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      filterStatus === "all" ? true :
      filterStatus === "done" ? t.completed : !t.completed;
    const matchCat = filterCategory === null || t.category_id === filterCategory;
    return matchSearch && matchStatus && matchCat;
  });

  const total = tasks.length;
  const done = tasks.filter((t) => t.completed).length;
  const rate = total === 0 ? 0 : Math.round((done / total) * 100);

  const byCategory = defaultCategories.map((c) => ({
    ...c,
    count: tasks.filter((t) => t.category_id === c.id).length,
    doneCount: tasks.filter((t) => t.category_id === c.id && t.completed).length,
  })).filter((c) => c.count > 0);

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

        <ScrollView>
          {byCategory.map((c) => {
            const pct = c.count === 0 ? 0 : Math.round((c.doneCount / c.count) * 100);
            return (
              <View key={c.id} style={styles.statCard}>
                <Text style={styles.statLabel}>
                  {emojiMap[c.name]} {c.name}
                </Text>
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

  return (
    <View style={styles.container}>
      <View style={styles.navRow}>
        <Text style={styles.title}>🦇 Batman Tasks</Text>
        <TouchableOpacity onPress={() => setScreen("stats")} style={styles.statsBtn}>
          <Text style={{ color: "#fff", fontWeight: "bold" }}>📊 Stats</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        placeholder="🔍 Search tasks..."
        value={search}
        onChangeText={setSearch}
        style={styles.input}
        placeholderTextColor="#94a3b8"
      />

      <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
        {(["all", "pending", "done"] as const).map((s) => (
          <TouchableOpacity
            key={s}
            onPress={() => setFilterStatus(s)}
            style={[styles.filterBtn, filterStatus === s && styles.filterBtnActive]}
          >
            <Text style={{ color: "#fff", textTransform: "capitalize" }}>{s}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        horizontal
        data={[{ id: 0, name: "All" } as Category, ...defaultCategories]}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => {
              setFilterCategory(item.id === 0 ? null : item.id);
              if (item.id !== 0) setSelectedCategory(item);
            }}
            style={[
              styles.category,
              (item.id === 0 ? filterCategory === null : filterCategory === item.id) && styles.selectedCategory,
            ]}
          >
            <Text style={{ color: "#fff" }}>
              {item.id === 0 ? "🗂️ All" : `${emojiMap[item.name]} ${item.name}`}
            </Text>
          </TouchableOpacity>
        )}
        style={{ marginBottom: 8 }}
      />

      <TextInput value={date} onChangeText={setDate} style={styles.input} placeholderTextColor="#94a3b8" />

      <View style={styles.inputContainer}>
        <TextInput
          placeholder="Add task..."
          value={task}
          onChangeText={setTask}
          style={styles.input}
          placeholderTextColor="#94a3b8"
        />
        <TouchableOpacity onPress={addTask} style={styles.addButton}>
          <Text style={styles.addText}>+</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.taskItem}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.taskText, item.completed && styles.completed]}>
                {item.title}
              </Text>
              <Text style={styles.meta}>
                {emojiMap[item.category_name ?? ""] ?? "📌"} {item.category_name} • {item.date}
              </Text>
            </View>
          </View>
        )}
      />

      {bats.map((bat) => (
        <Animated.View key={bat.id} style={{ position: "absolute" }}>
          <Text>🦇</Text>
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a", padding: 20 },
  title: { fontSize: 24, color: "#fff", fontWeight: "bold" },
  navRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  navBack: { color: "#94a3b8", fontSize: 16 },
  statsBtn: { backgroundColor: "#1e293b", padding: 8, borderRadius: 10 },
  inputContainer: { flexDirection: "row", marginVertical: 6 },
  input: { flex: 1, backgroundColor: "#1e293b", padding: 10, borderRadius: 10, color: "#fff", marginVertical: 4 },
  addButton: { backgroundColor: "#22c55e", padding: 10, borderRadius: 10, marginLeft: 10, justifyContent: "center" },
  addText: { color: "#fff", fontSize: 18 },
  category: { padding: 10, marginRight: 8, backgroundColor: "#1e293b", borderRadius: 10 },
  selectedCategory: { backgroundColor: "#22c55e" },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 6, backgroundColor: "#1e293b", borderRadius: 20 },
  filterBtnActive: { backgroundColor: "#7c3aed" },
  taskItem: { backgroundColor: "#1e293b", padding: 14, borderRadius: 10, marginBottom: 10 },
  taskText: { color: "#fff", fontSize: 15 },
  completed: { textDecorationLine: "line-through", color: "#94a3b8" },
  meta: { color: "#94a3b8", fontSize: 12, marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "center", padding: 20 },
  modalBox: { backgroundColor: "#1e293b", borderRadius: 16, padding: 20 },
  modalTitle: { color: "#fff", fontSize: 20, fontWeight: "bold", marginBottom: 12 },
  statCard: { backgroundColor: "#1e293b", borderRadius: 12, padding: 16, marginBottom: 12 },
  statLabel: { color: "#94a3b8", fontSize: 14, marginBottom: 6 },
  statBig: { color: "#22c55e", fontSize: 48, fontWeight: "bold" },
  statSub: { color: "#94a3b8", fontSize: 12, marginTop: 4 },
  progressBg: { height: 10, backgroundColor: "#0f172a", borderRadius: 5, overflow: "hidden", marginVertical: 6 },
  progressFill: { height: 10, backgroundColor: "#22c55e", borderRadius: 5 },
});