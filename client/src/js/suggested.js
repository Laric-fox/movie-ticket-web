import { collection, getDocs } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { db } from './firebase-config.js';

async function loadRecommendedMovies() {
  try {
    const querySnapshot = await getDocs(collection(db, "Movie"));
    const container = document.querySelector('.recommended-slider');

    if (!container) return;

    // Lấy ID phim hiện tại từ URL
    const params = new URLSearchParams(window.location.search);
    const currentMovieId = params.get('id');

    let html = '';
    querySnapshot.forEach((doc) => {
      const movie = doc.data();
      const movieId = doc.id;

      // Hiển thị phim đang chiếu, và KHÔNG trùng với phim hiện tại
      if (movie.showing_typ === 'now_showing' && movieId !== currentMovieId) {
        html += `
          <a href="movie.html?id=${movieId}" class="movie-card">
            <img src="${movie.image || './img/placeholder.png'}" alt="${movie.name}" class="movie-thumbnail" />
            <div class="movie-info">
              <h3>${movie.name || 'Không rõ tên'}</h3>
              <p>${movie.Rated || ''}</p>
            </div>
          </a>
        `;
      }
    });

    container.innerHTML = html;
  } catch (error) {
    console.error("Lỗi khi load phim đề xuất:", error);
  }
}

document.addEventListener('DOMContentLoaded', loadRecommendedMovies);