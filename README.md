# 📝 To-Do List App (Full-Stack)

A modern, full-stack Task Management application designed specifically for **first-year Computer Science students**. This project serves as a practical introduction to mobile development and the crucial bridge between a mobile **Frontend** and a robust **Backend**.

While the UI is sleek and modern, the core mission is to help learners understand how data flows from a user's finger-tap on a screen all the way to a **PostgreSQL** database.

---

## 🎯 Learning Objectives
This project is engineered to teach:
* **Full-Stack Connectivity:** Connecting a React Native (Expo) frontend to a Node.js REST API.
* **Database Fundamentals:** Designing schemas and performing CRUD operations in PostgreSQL.
* **State Management:** Handling task lists, filtering, and progress tracking dynamically.
* **API Design:** Building structured routes with Express.js.

---

## 🚀 Features
* **Core CRUD:** Add, edit, and delete tasks with ease.
* **Categorization:** Organize your life by grouping tasks into custom categories.
* **Task Analytics:** Visual progress tracking and statistics.
* **Smart Filtering:** Quickly find what needs to be done.
* **Persistent Storage:** Your data stays safe in a PostgreSQL database.
* **Modern Aesthetics:** A dark-themed, smooth UI designed for 2026 standards.

---

## 🛠️ Tech Stack

### **Frontend**
* **React Native (Expo):** Cross-platform mobile framework.
* **TypeScript/JavaScript:** For type-safe, scalable logic.
* **React Hooks:** Functional state management.

### **Backend**
* **Node.js & Express.js:** Fast and minimalist web framework.
* **PostgreSQL:** Relational database for structured data.
* **REST API:** Standardized communication between client and server.

---

## 📂 Project Structure
```text
project-root/
│
├── frontend/             # React Native Expo App
│   ├── App.js            # Main entry point
│   
│
├── backend/              # Node.js Express Server
│   ├── server.js         # API Initialization
│   
│
└── README.md
```

---

## ⚙️ Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/todo-list-app.git
```

### 2. Backend Setup
```bash
cd backend
npm install
```
Create a `.env` file in the `backend` folder:
```env
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=todo_app
DB_HOST=localhost
DB_PORT=5432
```

### 3. Database Initialization
Run these commands in your PostgreSQL terminal:
```sql
CREATE DATABASE todo_app;

CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  category_id INT,
  task_date DATE DEFAULT CURRENT_DATE
);
```

### 4. Frontend Setup
```bash
cd ../frontend
npm install
```

---

## ▶️ Running the Project

**Step 1: Start the Backend Server**
```bash
cd backend
npx nodemon server.js
```

**Step 2: Start the Mobile App**
```bash
cd frontend
npx expo start
```

---

## 🎯 Future Roadmap
* 🔔 **Push Notifications:** Reminders for overdue tasks.
* ☁️ **Cloud Sync:** Sync data across multiple devices.
* 👤 **Authentication:** Secure login and user profiles.
* 🌙 **Theme Engine:** Toggle between Dark and Light modes.

---

## 👨‍💻 Author
  Sadek Amine
)

---

