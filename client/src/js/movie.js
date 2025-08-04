import { 
  doc, getDoc, collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, getDocs 
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { auth, db } from './firebase-config.js';

/* ------------------ HIỂN THỊ CHI TIẾT PHIM ------------------ */
const movieHero = document.querySelector('.movie-hero');
const movieId = new URLSearchParams(window.location.search).get('id');

const formatDate = (timestamp) => {
  if (!timestamp || !timestamp.toDate) return '';
  const date = timestamp.toDate();
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const getMovie = async (id) => {
  try {
    const docRef = doc(collection(db, "Movie"), id);
    const movieSnapshot = await getDoc(docRef);

    if (!movieSnapshot.exists()) {
      movieHero.innerHTML = `<p>Không tìm thấy phim.</p>`;
      return;
    }

    const movie = movieSnapshot.data();

    movieHero.innerHTML = `
      <div class="video-background">
        <video autoplay muted loop>
          <source src="${movie.trailer || './video/default.mp4'}" type="video/mp4">
        </video>
        <div class="video-overlay"></div>
      </div>

      <div class="movie-info-container">
        <img src="${movie.image}" alt="Poster" class="movie-poster" />

        <div class="movie-details">
          <h1 class="movie-title">${movie.name}</h1>
          <p class="movie-contents">${movie.content}</p>
          <p class="movie-meta"><strong>Thể loại:</strong> ${movie.category}</p>
          <p class="movie-meta"><strong>Đạo diễn:</strong> ${movie.director}</p>
          <p class="movie-meta"><strong>Thời lượng:</strong> ${movie.duration} phút</p>
          <p class="movie-meta"><strong>Ngôn ngữ:</strong> ${movie.language}</p>
          <p class="movie-meta"><strong>Rated:</strong> ${movie.Rated}</p>
          <p class="movie-meta"><strong>Loại chiếu:</strong> ${movie.showing_typ}</p>
          <p class="movie-meta"><strong>Thời gian:</strong> ${formatDate(movie.time)}</p>

          <div class="movie-buttons">
            <button class="btn primary">Đặt vé</button>
          </div>
        </div>
      </div>
    `;
  } catch (error) {
    console.error('Lỗi khi lấy phim:', error);
    movieHero.innerHTML = `<p>Đã xảy ra lỗi khi tải phim.</p>`;
  }
};

if (movieId) {
  getMovie(movieId);
} else {
  movieHero.innerHTML = `<p>Không có ID phim trong đường dẫn.</p>`;
}

/* ------------------ BÌNH LUẬN ------------------ */
