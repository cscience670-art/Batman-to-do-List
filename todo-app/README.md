# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.













const exampleTasks: Task[] = [
  {
    id: "1",
    title: "Finish React Native To-Do App",
    completed: false,
    category: defaultCategories[7], // 🚀 Projects
    date: "2026-03-31",
  },
  {
    id: "2",
    title: "Go to the gym",
    completed: true,
    category: defaultCategories[3], // 💪 Fitness
    date: "2026-03-30",
  },
  {
    id: "3",
    title: "Study AI concepts",
    completed: false,
    category: defaultCategories[1], // 📚 Study
    date: "2026-04-01",
  },
  {
    id: "4",
    title: "Push code to GitHub",
    completed: false,
    category: defaultCategories[6], // 💻 Coding
    date: "2026-03-31",
  },
  {
    id: "5",
    title: "Buy groceries",
    completed: true,
    category: defaultCategories[4], // 🛒 Shopping
    date: "2026-03-29",
  },
];


























































import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Animated,
  Dimensions,
} from "react-native";
import axios from "axios";

/* ---------------- API ---------------- */
const API_URL = "http://192.168.1.11:3000";
const SCREEN_WIDTH = Dimensions.get("window").width;

/* ---------------- TYPES ---------------- */
type Category = {
  id: number;
  name: string;
};

type Task = {
  id: number;
  title: string;
  completed: boolean;
  category_name?: string;
  category_id?: number;
  date: string;
};

/* ---------------- EMOJIS ---------------- */
const emojiMap: Record<string, string> = {
  Work: "💼",
  Study: "📚",
  Health: "🏃‍♂️",
  Fitness: "💪",
  Shopping: "🛒",
  Finance: "💰",
  Coding: "💻",
  Projects: "🚀",
  Reading: "📖",
  Travel: "✈️",
  Other: "📌",
};

/* ---------------- CATEGORIES ---------------- */
const defaultCategories: Category[] = [
  { id: 1, name: "Work" },
  { id: 2, name: "Study" },
  { id: 3, name: "Health" },
  { id: 4, name: "Fitness" },
  { id: 5, name: "Shopping" },
  { id: 6, name: "Finance" },
  { id: 7, name: "Coding" },
  { id: 8, name: "Projects" },
  { id: 9, name: "Reading" },
  { id: 10, name: "Travel" },
];

/* ================= COMPONENT ================= */
export default function Index() {
  const [task, setTask] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(defaultCategories[0]);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  /* 🦇 BATS STATE */
  const [bats, setBats] = useState<
    { id: number; x: number; anim: Animated.Value }[]
  >([]);

  /* ---------------- FETCH TASKS ---------------- */
  const fetchTasks = async () => {
    try {
      const res = await axios.get(`${API_URL}/tasks`);
      setTasks(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  /* ---------------- ADD TASK ---------------- */
  const addTask = async () => {
    if (!task.trim()) return;

    await axios.post(`${API_URL}/tasks`, {
      title: task,
      category_id: selectedCategory.id,
      date,
    });

    setTask("");
    fetchTasks();
  };

  /* 🦇 SPAWN BATS ANIMATION */
  const spawnBats = () => {
    const newBats = Array.from({ length: 80 }).map((_, i) => {
      const anim = new Animated.Value(0);

      const bat = {
        id: Date.now() + i,
        x: Math.random() * (SCREEN_WIDTH - 40),
        anim,
      };

      Animated.timing(anim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start();

      return bat;
    });

    setBats(newBats);

    setTimeout(() => {
      setBats([]);
    }, 1200);
  };

  /* ---------------- TOGGLE ---------------- */
  const toggleTask = async (id: number) => {
    const current = tasks.find((t) => t.id === id);

    // 🦇 only when completing (false -> true)
    if (current && !current.completed) {
      spawnBats();
    }

    await axios.put(`${API_URL}/tasks/${id}`);
    fetchTasks();
  };

  /* ---------------- DELETE ---------------- */
  const deleteTask = async (id: number) => {
    await axios.delete(`${API_URL}/tasks/${id}`);
    fetchTasks();
  };

  /* ================= UI ================= */
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🦇 Batman Tasks</Text>

      {/* CATEGORY */}
      <FlatList
        horizontal
        data={defaultCategories}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => setSelectedCategory(item)}
            style={[
              styles.category,
              selectedCategory.id === item.id && styles.selectedCategory,
            ]}
          >
            <Text style={{ color: "#fff" }}>
              {emojiMap[item.name]} {item.name}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* DATE */}
      <TextInput
        value={date}
        onChangeText={setDate}
        style={styles.input}
      />

      {/* INPUT */}
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

      {/* TASKS */}
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.taskItem}>
            <View>
              <Text
                style={[
                  styles.taskText,
                  item.completed && styles.completed,
                ]}
              >
                {item.title}
              </Text>

              <Text style={styles.meta}>
                {emojiMap[item.category_name ?? ""] ?? "📌"}{" "}
                {item.category_name} • {item.date}
              </Text>
            </View>

            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity onPress={() => toggleTask(item.id)}>
                <Text style={{ fontSize: 18 }}>
                  {item.completed ? "✅" : "⭕"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => deleteTask(item.id)}>
                <Text>🗑️</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* 🦇 BATS OVERLAY */}
      {bats.map((bat) => (
        <Animated.View
          key={bat.id}
          style={{
            position: "absolute",
            bottom: 80,
            left: bat.x,
            transform: [
              {
                translateY: bat.anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -300],
                }),
              },
              {
                scale: bat.anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.5, 1.5],
                }),
              },
            ],
            opacity: bat.anim.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 0],
            }),
          }}
        >
          <Text style={{ fontSize: 24 }}>🦇🦇</Text>
          <Text style={{ fontSize: 24 }}>🦇🦇</Text>
          <Text style={{ fontSize: 24 }}>🦇🦇</Text>
          <Text style={{ fontSize: 24 }}>🦇🦇</Text>
          <Text style={{ fontSize: 24 }}>🦇🦇</Text>
          <Text style={{ fontSize: 24 }}>🦇🦇</Text>
          <Text style={{ fontSize: 24 }}>🦇🦇</Text>
          <Text style={{ fontSize: 24 }}>🦇🦇</Text>
          <Text style={{ fontSize: 24 }}>🦇🦇</Text>
          <Text style={{ fontSize: 24 }}>🦇🦇</Text>
          <Text style={{ fontSize: 24 }}>🦇🦇</Text>
          <Text style={{ fontSize: 24 }}>🦇🦇</Text>
        </Animated.View>
      ))}
    </View>
  );
}

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a", padding: 20 },
  title: { fontSize: 28, color: "#fff", marginBottom: 20 },

  inputContainer: { flexDirection: "row", marginVertical: 10 },

  input: {
    flex: 1,
    backgroundColor: "#1e293b",
    padding: 10,
    borderRadius: 10,
    color: "#fff",
    marginVertical: 5,
  },

  addButton: {
    backgroundColor: "#22c55e",
    padding: 10,
    borderRadius: 10,
    marginLeft: 10,
  },

  addText: { color: "#fff", fontSize: 18 },

  category: {
    padding: 10,
    marginRight: 10,
    backgroundColor: "#1e293b",
    borderRadius: 10,
  },

  selectedCategory: { backgroundColor: "#22c55e" },

  taskItem: {
    backgroundColor: "#1e293b",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },

  taskText: { color: "#fff" },
  completed: { textDecorationLine: "line-through", color: "#94a3b8" },

  meta: { color: "#94a3b8", fontSize: 12 },
});































sever.js



process.env.LANG = "en_US.UTF-8";
const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");

const categoryMap = [
  { id: 1, name: "Work", emoji: "💼" },
  { id: 2, name: "Study", emoji: "📚" },
  { id: 3, name: "Health", emoji: "🏃‍♂️" },
  { id: 4, name: "Fitness", emoji: "💪" },
  { id: 5, name: "Shopping", emoji: "🛒" },
  { id: 6, name: "Finance", emoji: "💰" },
  { id: 7, name: "Coding", emoji: "💻" },
  { id: 8, name: "Projects", emoji: "🚀" },
  { id: 9, name: "Reading", emoji: "📖" },
  { id: 10, name: "Travel", emoji: "✈️" },
];

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "todo_app",
  password: "sadek2025",
  port: 5432,
  client_encoding: "UTF8",
});

/* ---------------- GET TASKS ---------------- */
app.get("/tasks", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM tasks ORDER BY id DESC
    `);

    const enriched = result.rows.map(task => {
      const category = categoryMap.find(c => c.id === task.category_id);

      return {
        ...task,
        category_name: category?.name || "Unknown",
        category_emoji: category?.emoji || "📌",
      };
    });

    res.json(enriched);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});
/* ---------------- ADD TASK ---------------- */
app.post("/tasks", async (req, res) => {
  const { title, category_id, date } = req.body;

  const result = await pool.query(
    `INSERT INTO tasks (title, category_id, date, completed)
     VALUES ($1, $2, $3, false)
     RETURNING *`,
    [title, category_id, date]
  );

  res.json(result.rows[0]);
});

/* ---------------- TOGGLE TASK ---------------- */
app.put("/tasks/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE tasks 
       SET completed = NOT completed 
       WHERE id = $1 
       RETURNING *`,
      [id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("PUT /tasks error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ---------------- DELETE TASK ---------------- */
app.delete("/tasks/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query("DELETE FROM tasks WHERE id=$1", [id]);

    res.json({ message: "Deleted" });
  } catch (err) {
    console.error("DELETE /tasks error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ---------------- START SERVER ---------------- */
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});