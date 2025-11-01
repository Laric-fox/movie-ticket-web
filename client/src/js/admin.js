// src/js/admin.js
import { auth, db } from './firebase-config.js';
import { collection, getDocs, addDoc, deleteDoc, doc, serverTimestamp, where, query } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';
import { checkSession } from './check_session.js';
import { Timestamp } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';

const formatDate = (timestamp) => {
  if (!timestamp || !timestamp.toDate) return '';
  const date = timestamp.toDate();
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

let userSession = JSON.parse(localStorage.getItem('user_session'));
checkSession();

document.addEventListener('DOMContentLoaded', async () => {
  try {
    if (!userSession) {
      alert("Vui lòng đăng nhập để truy cập!");
      window.location.href = "./index.htm";
      return;
    }

    const email = userSession.user.email;
    const q = query(collection(db, "users"), where("email", "==", email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      alert("Không tìm thấy người dùng!");
      window.location.href = "./index.htm";
      return;
    }

    querySnapshot.forEach((doc) => {
      const user = doc.data();
      if (user.role_id !== 1) {
        alert("Bạn không có quyền truy cập!");
        window.location.href = "./index.htm";
      }
    });

    await loadMovies();
  } catch (error) {
    console.error("Lỗi khi kiểm tra quyền truy cập:", error);
    alert("Có lỗi xảy ra khi kiểm tra quyền truy cập!");
  }
});

// Thêm phim
document.getElementById('movie-form').addEventListener('submit', async (event) => {
  event.preventDefault();

  const name = document.getElementById("name").value;
  const category = document.getElementById("category").value;
  const content = document.getElementById("content").value;
  const director = document.getElementById("director").value;
  const duration = document.getElementById("duration").value;
  const language = document.getElementById("language").value;
  const rated = document.getElementById("rated").value;
  const showing_type = document.getElementById("showing_typ").value;
  const time = document.getElementById("time").value;

  const imageFile = document.getElementById("poster").files[0];
  const trailerFile = document.getElementById("trailer").files[0];

  if (!name || !category || !content || !director || !duration || !language || !rated || !showing_type || !time || !imageFile || !trailerFile) {
    alert("Vui lòng điền đầy đủ thông tin!");
    return;
  }

  try {
  const upload = async (fieldName, file) => {
    const fd = new FormData();
    fd.append(fieldName, file);
    const res = await fetch("https://movie-ticket-web.onrender.com/upload", { method: "POST", body: fd });
    if (!res.ok) {
      const text = await res.text();  // đọc nội dung lỗi thay vì .json()
      throw new Error(`Upload ${fieldName} fail ${res.status}: ${text}`);
    }
    const data = await res.json();
    if (!data?.data?.secure_url) throw new Error(`Upload ${fieldName} thiếu secure_url`);
    return data.data.secure_url;
  };

  // Upload ảnh & video
  const [imageUrl, trailerUrl] = await Promise.all([
    upload("image", imageFile),
    upload("video",  trailerFile),
  ]);

  // Lưu Firestore
  await addDoc(collection(db, "Movie"), {
    name, category, content, director, duration, language,
    Rated: rated,
    showing_typ: showing_type,
    time: Timestamp.fromDate(new Date(time)),
    image: imageUrl,
    trailer: trailerUrl,
    createdAt: serverTimestamp(),
  });

  alert("Thêm phim thành công!");
  document.getElementById("movie-form").reset();
  await loadMovies();
} catch (error) {
  console.error("Lỗi khi thêm phim:", error);
  alert(error.message || "Có lỗi xảy ra khi thêm phim!");
}
});

// Hiển thị danh sách phim
async function loadMovies() {
  try {
    const movieTableBody = document.getElementById("movies-list");
    if (!movieTableBody) {
        console.error("Không tìm thấy phần tử danh sách phim.");
        return;
        }
    let htmls = "";
    let index = 1;
    const querySnapshot = await getDocs(collection(db, "Movie"));

    querySnapshot.forEach((docSnap) => {
      const movie = docSnap.data();
      htmls += `
        <tr class="text-center">
          <th>${index}</th>
          <td><img src="${movie.image}" alt="${movie.name}" style="width:80px"></td>
          <td>${movie.name}</td>
          <td>${movie.category}</td>
          <td>${formatDate(movie.time)}</td>
          <td>${movie.Rated}</td>
          <td>${movie.showing_typ}</td>
          <td>
            <button class="btn btn-danger btn-sm btn-delete-movie" data-id="${docSnap.id}">Xóa</button>
          </td>
        </tr>
      `;
      index++;
    });

    movieTableBody.innerHTML = htmls;

    document.querySelectorAll(".btn-delete-movie").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const movieId = btn.getAttribute("data-id");
        if (confirm("Bạn có chắc chắn muốn xóa phim này?")) {
          try {
            await deleteDoc(doc(db, "Movie", movieId));
            alert("Xóa phim thành công!");
            await loadMovies();
          } catch (error) {
            console.error("Lỗi khi xóa phim:", error);
            alert("Có lỗi xảy ra khi xóa phim!");
          }
        }
      });
    });
  } catch (error) {
    console.error("Lỗi khi tải danh sách phim:", error);
  }
}

loadMovies();
