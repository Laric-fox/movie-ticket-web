import { db } from './firebase-config.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-firestore.js";

const tabButtons = document.querySelectorAll(".tab-button");
const tabContents = document.querySelectorAll(".tab-content");
const now = new Date();

// 👇 Tab switching
tabButtons.forEach(button => {
  button.addEventListener("click", () => {
    // Active tab button
    tabButtons.forEach(btn => btn.classList.remove("active"));
    button.classList.add("active");

    // Active content
    const target = button.dataset.tab;
    tabContents.forEach(content => {
      content.classList.remove("active");
      if (content.classList.contains(target)) {
        content.classList.add("active");
      }
    });
  });
});

// 👇 Load movie data
async function loadMovies() {
  const querySnapshot = await getDocs(collection(db, "Movie"));

  const nowContainer = document.querySelector(".now-showing .movie-slider");
  const soonContainer = document.querySelector(".coming-soon .movie-slider");

  querySnapshot.forEach((doc) => {
    const data = doc.data();
    const movieTime = data.time?.toDate?.();

    const html = `
      <div class="movie-card">
        <img src="${data.image}" alt="${data.name}">
        <h4>${data.name}</h4>
      </div>
    `;

    if (!movieTime || !data.image || !data.name) return;

    if (movieTime <= now) {
      nowContainer.innerHTML += html;
    } else {
      soonContainer.innerHTML += html;
    }
  });
}

loadMovies();