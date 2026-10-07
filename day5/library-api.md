# Library Books API

Base URL: `https://api.example.com`

## Endpoints

- **GET `/books`** - List all books. Success: `200 OK`.
- **GET `/books?author={author}`** - List books by author, for example `/books?author=Ursula%20Le%20Guin`. Success: `200 OK`.
- **GET `/books/{bookId}`** - Get one book by its ID. Success: `200 OK`.
- **POST `/books`** - Create a book. Success: `201 Created`.

  Example request body:
  ```json
  { "title": "A Wizard of Earthsea", "author": "Ursula K. Le Guin", "year": 1968 }
  ```

- **PUT `/books/{bookId}`** - Replace all fields for a book. Success: `200 OK`.

  Example request body:
  ```json
  { "title": "A Wizard of Earthsea", "author": "Ursula K. Le Guin", "year": 1968 }
  ```

- **PATCH `/books/{bookId}`** - Update selected book fields. Success: `200 OK`.

  Example request body:
  ```json
  { "year": 1969 }
  ```

- **DELETE `/books/{bookId}`** - Delete a book. Success: `204 No Content`.

## Errors

- **400 Bad Request** - The request is invalid, such as creating a book without a title.
- **404 Not Found** - The requested book ID does not exist.
