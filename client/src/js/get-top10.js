import { db } from './firebase-config.js';
import { collection, query, orderBy, limit, getDocs } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

async function loadTop10Movies() {
  try {
    const top10Container = document.querySelector(".top10-slider");
    if (!top10Container) {
      console.error("Không tìm thấy .top10-slider");
      return;
    }

    const q = query(
      collection(db, "Movie"),
      orderBy("rank"),
      limit(10)
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.warn("Không có phim nào trong top 10.");
      return;
    }

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      console.log("🔥 Phim:", data); // Kiểm tra trả dữ liệu

      const item = document.createElement("div");
      item.classList.add("top10-item");

      item.innerHTML = `
        <div class="top10-rank">${data.rank}</div>
        <img src="${data.image}" class="top10-image" alt="${data.name}">
      `;

      top10Container.appendChild(item);
    });
  } catch (error) {
    console.error("Lỗi khi tải top 10:", error);
  }
}

document.addEventListener("DOMContentLoaded", loadTop10Movies);