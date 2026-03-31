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

/* ---------------- EDIT TASK ---------------- */
app.patch("/tasks/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, date, category_id } = req.body;

    const result = await pool.query(
      `UPDATE tasks 
       SET title = $1, date = $2, category_id = $3
       WHERE id = $4 
       RETURNING *`,
      [title, date, category_id, id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("PATCH /tasks error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ---------------- START SERVER ---------------- */
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});