# Day 8 Reflection

The most difficult concept for me was understanding how database transactions and constraints protect data when several requests happen at once. At first, a seat map showing “available” looked like enough to prevent two purchases, but I learned that two buyers can see the same state at the same time. I worked through this by revisiting the SQL exercises, running queries in SQLite, and tracing the reservation as a transaction: change the seat only if it is still available, check that every requested seat was claimed, and roll back if any claim fails. That made the difference between displaying availability and guaranteeing ownership much clearer.

The part of my capstone I would improve is the high-traffic sale path. I would add a small simulation with concurrent buyers and test that exactly one order can reserve each seat, including when payment times out or an expiry job retries. This would give stronger evidence for the fairness and correctness claims in my design and help tune the queue and hold duration.

Next, I want to learn how to build and test a small API with a real database, transactions, and automated tests. I would also like to practise load testing so I can compare my traffic estimates with measured results and improve the design based on evidence.
