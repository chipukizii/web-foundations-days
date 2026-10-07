const usersUrl = "https://jsonplaceholder.typicode.com/users";
const loadButton = document.querySelector("#load-users");
const filterInput = document.querySelector("#filter-input");
const status = document.querySelector("#status");
const usersList = document.querySelector("#users-list");

let users = [];

function renderUsers(list) {
  usersList.textContent = "";

  if (filterInput.value.trim() && list.length === 0) {
    const message = document.createElement("li");
    message.textContent = "No users match your filter.";
    usersList.append(message);
    return;
  }

  list.forEach(user => {
    const item = document.createElement("li");
    const name = document.createElement("h2");
    const email = document.createElement("p");
    const city = document.createElement("p");
    const company = document.createElement("p");

    name.textContent = user.name;
    email.textContent = `Email: ${user.email}`;
    city.textContent = `City: ${user.address.city}`;
    company.textContent = `Company: ${user.company.name}`;

    item.append(name, email, city, company);
    usersList.append(item);
  });
}

function filterUsers() {
  const search = filterInput.value.trim().toLowerCase();
  const matches = users.filter(user => user.name.toLowerCase().includes(search));
  renderUsers(matches);
}

async function loadUsers() {
  loadButton.disabled = true;
  status.textContent = "Loading users...";

  try {
    const response = await fetch(usersUrl);
    if (!response.ok) throw new Error(`Request failed: ${response.status}`);

    users = await response.json();
    status.textContent = `Loaded ${users.length} users.`;
    filterUsers();
  } catch (error) {
    users = [];
    renderUsers([]);
    status.textContent = "Could not load users. Please try again.";
  } finally {
    loadButton.disabled = false;
  }
}

loadButton.addEventListener("click", loadUsers);
filterInput.addEventListener("input", filterUsers);
