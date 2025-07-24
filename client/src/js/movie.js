import { collection, getDocs } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-firestore.js";
import { db } from "./firebase-config.js"; // file config firebase của bạn

const movieListEl = document.getElementById('movie-list');

async function renderMovies() {
  const movieCol = collection(db, "Movie"); // hoặc "now_showing" tùy bạn dùng
  const snapshot = await getDocs(movieCol);
  const movieData = snapshot.docs.map(doc => doc.data());

  movieListEl.innerHTML = movieData.map(movie => {
    const date = movie.time.toDate().toLocaleDateString("vi-VN", {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });

    return `
      <div class="movie-card">
        ￼
        <div class="movie-info">
          <h3 class="movie-title">${movie.name}</h3>
          <p><strong>Thể loại:</strong> ${movie.category}</p>
          <p><strong>Đạo diễn:</strong> ${movie.director}</p>
          <p><strong>Thời lượng:</strong> ${movie.duration} phút</p>
          <p><strong>Ngôn ngữ:</strong> ${movie.language}</p>
          <p><strong>Khởi chiếu:</strong> ${date}</p>
          <p class="movie-desc">${movie.content}</p>
        </div>
      </div>
    `;
  }).join('');
}

renderMovies();