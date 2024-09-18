const searchInputEl = document.querySelector("#searchInput");
const autocompleteEl = document.querySelector("#autocomplete");
const errorEl = document.querySelector("#error");
const cardsListEl = document.querySelector("#cardsList");

let repositories;

function debounce(fn, delay) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn.apply(this, args), delay);
  };
}

function createResultSearch(repo) {
  return `
    <li class="select__option">
        <button class="select__item" data-id='${repo.id}'>${repo.name}</button>
    </li>`;
}

function createCardItem(repo) {
  return `
    <h2 class="card__name">Name: <span class="card__text">${repo.name}</span></h2>
    <p class="card__owner">Owner: <span class="card__text">${repo.owner.login}</span></p>
    <p class="card__stars">Stars: <span class="card__text card__text--star">${repo.stargazers_count}</span></p>
    <button class="card__disabled"></button>`;
}

function removeAutocomplete() {
  autocompleteEl.classList.remove("select--isActive");
  autocompleteEl.innerHTML = "";
}

async function searchRepositories() {
  const query = searchInputEl.value.trim();

  if (query.length === 0) {
    removeAutocomplete();
    return;
  }

  let itemHTML = "";

  try {
    repositories = await fetchRepositories(query);

    repositories.forEach((repo) => {
      itemHTML += createResultSearch(repo);
    });
  } catch (err) {
    errorEl.textContent = err.message;
    autocompleteEl.innerHTML = "";
    return;
  }

  autocompleteEl.innerHTML = "";
  autocompleteEl.insertAdjacentHTML("beforeend", itemHTML);

  if (!autocompleteEl.classList.contains("select--isActive")) {
    autocompleteEl.classList.add("select--isActive");
  }

  document.addEventListener("click", closeAutocomplete);
}

async function fetchRepositories(query) {
  const response = await fetch(
    `https://api.github.com/search/repositories?q=${query}&per_page=5`
  );

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  return data.items;
}

const debouncedSearch = debounce(searchRepositories, 400);

searchInputEl.addEventListener("input", debouncedSearch);

autocompleteEl.addEventListener("click", (event) => {
  const el = event.target;

  if (el.tagName !== "BUTTON") {
    return;
  }

  const dataRepo = repositories.filter((repo) => repo.id === +el.dataset.id);

  if (dataRepo.length) {
    const liEl = document.createElement("li");
    liEl.classList.add("cards__item", "card");
    liEl.innerHTML = createCardItem(dataRepo[0]);
    cardsListEl.prepend(liEl);

    liEl.addEventListener("click", deleteCard);
  }

  searchInputEl.value = "";
  removeAutocomplete();
});

const deleteCard = (event) => {
  const el = event.target;
  const li = event.currentTarget;

  if (!el.classList.contains("card__disabled")) {
    return;
  }

  li.removeEventListener("click", deleteCard);
  li.remove();
};

const closeAutocomplete = (event) => {
  const el = event.target;

  if (el.closest("#autocomplete") || event.target === autocompleteEl) {
    return;
  }

  removeAutocomplete();
  document.removeEventListener("click", closeAutocomplete);
};
