import { db } from './firebase-config.js';
import { collection, getDocs } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';

const listContainer = document.querySelector('.list-movie');
if (!listContainer) throw new Error('Không tìm thấy .list-movie');

function formatDuration(mins) {
  if (!mins) return '';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h > 0 ? h + 'h ' : ''}${m}m`;
}

function createMovieCard(movie) {
  const card = document.createElement('div');
  card.className = 'movie-card';
  card.innerHTML = `
    <div class="poster-wrapper">
      <img src="${movie.image || './img/placeholder.png'}" alt="${movie.name}" />
    </div>
    <div class="movie-info">
      <h4 class="movie-title">${movie.name || 'Không rõ tên'}</h4>
      <div class="movie-meta">
        ${movie.category || ''} • ${formatDuration(movie.duration)} • ${movie.language || ''}
      </div>
      <div class="movie-rated">Rated: ${movie.Rated || ''}</div>
    </div>
  `;
  card.addEventListener('click', () => {
    if (!movie.id) return;
    window.location.href = `movie.htm?id=${movie.id}`;
  });
  return card;
}

async function loadMovies() {
  listContainer.textContent = 'Đang tải phim...';
  try {
    const snap = await getDocs(collection(db, 'Movie'));
    listContainer.innerHTML = '';
    if (snap.empty) {
      listContainer.innerHTML = '<p class="text-muted text-center">Chưa có phim nào.</p>';
      return;
    }
    snap.forEach(d => {
      const movie = { id: d.id, ...d.data() };
      const card = createMovieCard(movie);
      listContainer.appendChild(card);
    });
  } catch (err) {
    console.error('Lỗi load Movie:', err);
    listContainer.innerHTML = '<p class="text-danger text-center">Lỗi tải phim.</p>';
  }
}

loadMovies();
