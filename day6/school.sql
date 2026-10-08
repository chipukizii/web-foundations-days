PRAGMA foreign_keys = ON;

CREATE TABLE students (
  student_id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE
);

CREATE TABLE courses (
  course_id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  course_code TEXT NOT NULL UNIQUE
);

CREATE TABLE enrolments (
  enrolment_id INTEGER PRIMARY KEY,
  student_id INTEGER NOT NULL,
  course_id INTEGER NOT NULL,
  grade TEXT NOT NULL,
  FOREIGN KEY (student_id) REFERENCES students(student_id),
  FOREIGN KEY (course_id) REFERENCES courses(course_id),
  UNIQUE (student_id, course_id)
);

CREATE INDEX idx_enrolments_course_id ON enrolments(course_id);

INSERT INTO students (student_id, name, email) VALUES
  (1, 'Maya Chen', 'maya@example.com'),
  (2, 'Omar Ali', 'omar@example.com'),
  (3, 'Priya Shah', 'priya@example.com'),
  (4, 'Noah Kim', 'noah@example.com');

INSERT INTO courses (course_id, title, course_code) VALUES
  (1, 'SQL Fundamentals', 'DB101'),
  (2, 'Web Development', 'WEB201'),
  (3, 'Data Analytics', 'DATA110'),
  (4, 'Creative Writing', 'WRIT105');

INSERT INTO enrolments (student_id, course_id, grade) VALUES
  (1, 1, 'B+'),
  (1, 2, 'A-'),
  (2, 1, 'A'),
  (2, 3, 'B'),
  (3, 2, 'A');

-- 1. All courses for one student, found by name.
SELECT s.name, c.title, e.grade
FROM students AS s
JOIN enrolments AS e ON e.student_id = s.student_id
JOIN courses AS c ON c.course_id = e.course_id
WHERE s.name = 'Maya Chen'
ORDER BY c.title;

-- 2. All students enrolled in one course.
SELECT c.title, s.name, e.grade
FROM courses AS c
JOIN enrolments AS e ON e.course_id = c.course_id
JOIN students AS s ON s.student_id = e.student_id
WHERE c.title = 'SQL Fundamentals'
ORDER BY s.name;

-- 3. Number of students per course, including courses with no enrolments.
SELECT c.title, COUNT(e.student_id) AS student_count
FROM courses AS c
LEFT JOIN enrolments AS e ON e.course_id = c.course_id
GROUP BY c.course_id, c.title
ORDER BY c.title;

-- 4. Students who have no enrolments.
SELECT s.name
FROM students AS s
LEFT JOIN enrolments AS e ON e.student_id = s.student_id
WHERE e.enrolment_id IS NULL;

-- 5. Update one enrolment's grade and show the changed row.
UPDATE enrolments
SET grade = 'A-'
WHERE student_id = 1 AND course_id = 1;

SELECT s.name, c.title, e.grade
FROM enrolments AS e
JOIN students AS s ON s.student_id = e.student_id
JOIN courses AS c ON c.course_id = e.course_id
WHERE e.student_id = 1 AND e.course_id = 1;
