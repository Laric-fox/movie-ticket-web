import { db } from './firebase-config.js';
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

// Tải dữ liệu top 10 phim từ Firestore
async function loadTop10Movies() {
  try {
    const top10Container = document.querySelector(".top10-slider");
    if (!top10Container) {
      console.error("Không tìm thấy .top10-slider");
      return;
    }

    const q = query(collection(db, "Movie"), orderBy("rank"), limit(10));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.warn("Không có phim nào trong top 10.");
      return;
    }

    querySnapshot.forEach((doc) => {
      const data = doc.data();

      const item = document.createElement("div");
      item.classList.add("top10-item");

      item.innerHTML = `
        <div class="top10-rank">${data.rank}</div>
        <img src="${data.image}" class="movie-image" alt="${data.name}" data-id="${doc.id}">
      `;

      top10Container.appendChild(item);
    });
  } catch (error) {
    console.error("Lỗi khi tải top 10:", error);
  }
}

// Xử lý tab 'Đang chiếu / Sắp chiếu'
function setupTabs() {
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
}

// Xử lý khi click vào ảnh phim => chuyển đến movie.html?id=...
function setupClickHandlers() {
  document.addEventListener('click', (e) => {
    const img = e.target.closest('.movie-image');
    if (img) {
      const movieId = img.getAttribute('data-id');
      if (movieId) {
        window.location.href = `movie.htm?id=${movieId}`;
      }
    }
  });
}

// Gọi khi trang sẵn sàng
document.addEventListener("DOMContentLoaded", () => {
  loadTop10Movies();
  setupTabs();
  setupClickHandlers();
});