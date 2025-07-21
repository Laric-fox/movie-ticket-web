import { db } from './js/firebase-config.js';
import { collection, getDocs, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-firestore.js";

const top10Slider = document.querySelector('.top10-slider');

async function loadTop10Movies() {
  try {
    const q = query(collection(db, "Movie"), limit(10));
    const querySnapshot = await getDocs(q);

    let rank = 1;
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const item = document.createElement('div');
      item.className = 'top10-item';

      item.innerHTML = `
        <div class="rank-number">${rank}</div>
        <img src="${data.image}" alt="${data.name}" />
      `;

      top10Slider.appendChild(item);
      rank++;
    });
  } catch (e) {
    console.error("Lỗi khi tải Top 10 phim:", e);
  }
}

loadTop10Movies();