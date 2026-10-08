# School Database Design

## Tables

- `students` stores one row per student, with a unique email address.
- `courses` stores one row per course, with a unique course code.
- `enrolments` records which student takes which course, along with that student's grade for the course.

## Relationships

A student can have many enrolments, and a course can have many enrolments. These are one-to-many relationships from `students` to `enrolments` and from `courses` to `enrolments`. Students and courses are therefore many-to-many: one student can take several courses, and each course can have several students. The `enrolments` join table represents each pairing and stores the grade that belongs to that pairing. Its unique constraint prevents the same student being enrolled in the same course twice.

## Index

I added an index on `enrolments(course_id)`. It helps the database find enrolments quickly when listing students in a course or counting students per course. The unique student/course constraint already supports lookups by that pair.

## SQL or NoSQL?

I would choose a relational SQL database for this system. Students, courses, and enrolments have clear relationships, and foreign keys keep those relationships valid. SQL joins make it straightforward to list courses for a student or students for a course, while transactions can keep changes consistent. A NoSQL database could work, but it would require more application code to enforce the same rules and connect related records.
