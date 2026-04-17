-- ==============================
-- 1. CREATE DATABASE
-- ==============================
CREATE DATABASE task_manager;

-- ==============================
-- 2. USE DATABASE
-- ==============================
\c task_manager;

-- ==============================
-- 3. CREATE TABLE: categories
-- ==============================
CREATE TABLE categories (
    id INT PRIMARY KEY,
    name TEXT NOT NULL,
    emoji TEXT
);

-- ==============================
-- 4. INSERT DATA: categories
-- ==============================
INSERT INTO categories (id, name, emoji) VALUES
(1, 'Work', '💼'),
(2, 'Study', '📚'),
(3, 'Health', '🏃‍♂️'),
(4, 'Fitness', '💪'),
(5, 'Shopping', '🛒'),
(6, 'Finance', '💰'),
(7, 'Coding', '💻'),
(8, 'Projects', '🚀'),
(9, 'Reading', '📖'),
(10, 'Travel', '✈️');

-- ==============================
-- 5. CREATE TABLE: tasks
-- ==============================
CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    category_id INT NOT NULL,
    date DATE,
    completed BOOLEAN DEFAULT FALSE,
    
    CONSTRAINT fk_category
    FOREIGN KEY (category_id)
    REFERENCES categories(id)
    ON DELETE CASCADE
);

-- ==============================
-- 6. INSERT DATA: tasks (TEST)
-- ==============================
INSERT INTO tasks (title, category_id, date, completed) VALUES
('Finish project', 8, '2026-04-17', false),
('Go to gym', 4, '2026-04-18', false),
('Read book', 9, '2026-04-19', true),
('Study PostgreSQL', 2, '2026-04-20', false),
('Buy groceries', 5, '2026-04-21', false);

-- ==============================
-- 7. TEST QUERY (JOIN)
-- ==============================
SELECT 
    t.id,
    t.title,
    t.date,
    t.completed,
    c.name AS category_name,
    c.emoji AS category_emoji
FROM tasks t
JOIN categories c ON t.category_id = c.id
ORDER BY t.id DESC;
