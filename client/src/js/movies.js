import { collection, getDocs } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { db } from './firebase-config.js';

async function loadMovies() {
  try {
    const querySnapshot = await getDocs(collection(db, "Movie"));

    const nowShowingSlider = document.querySelector('.tab-content.now-showing .movie-slider');
    const comingSoonSlider = document.querySelector('.tab-content.coming-soon .movie-slider');

    nowShowingSlider.innerHTML = '';
    comingSoonSlider.innerHTML = '';

    querySnapshot.forEach((doc) => {
      const movie = doc.data();
      console.log("Movie:", movie); 

      const movieHTML = `
        <a href="movie.htm?id=${doc.id}" class="movie-card" >
          <img src="${movie.image || './img/placeholder.png'}" alt="${movie.name}" data-id="${doc.id}" class="movie-thumbnail" />
          <div class="movie-info">
            <h3>${movie.name || 'Không rõ tên'}</h3>
            <p>${movie.Rated || ''}</p>
          </div>
        </a>
      `;

      if (movie.showing_typ === 'now_showing') {
        nowShowingSlider.innerHTML += movieHTML;
      } else if (movie.showing_typ === 'coming_soon') {
        comingSoonSlider.innerHTML += movieHTML;
      }
    });
  } catch (error) {
    console.error("Lỗi khi load phim:", error);
  }
}

document.addEventListener('DOMContentLoaded', loadMovies);
document.addEventListener('DOMContentLoaded', () => {
  const tabs = document.querySelectorAll('.tab-button');
  const contents = document.querySelectorAll('.tab-content');

  tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      tabs.forEach(b => b.classList.remove('active'));
      contents.forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      document.querySelector(`.tab-content.${btn.dataset.tab}`).classList.add('active');
    });
  });
});
document.querySelectorAll('.movie-image').forEach(img => {
  img.addEventListener('click', () => {
    const movieId = img.getAttribute('data-id');
    window.location.href = `movie.htm?id=${movieId}`;
  });
});