import { db } from "./firebase-config.js";
import { collection, getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const usersList = document.getElementById("users-list");

// Hàm load danh sách user
async function loadUsers() {
  usersList.innerHTML = "<tr><td colspan='6'>Đang tải...</td></tr>";

  const querySnapshot = await getDocs(collection(db, "users"));
  let html = "";
  let index = 1;

  querySnapshot.forEach((docSnap) => {
    const user = docSnap.data();
    const createdAt = user.createdAt?.toDate().toLocaleDateString("vi-VN") || "-";
    html += `
      <tr>
        <td>${index++}</td>
        <td>${user.email || "-"}</td>
        <td>${user.username || "-"}</td>
        <td>${(user.balance || 0).toLocaleString("vi-VN")} VND</td>
        <td>
          <button class="btn btn-danger btn-sm" data-id="${docSnap.id}">
            <i class="fa-solid fa-trash"></i>
          </button>
        </td>
      </tr>
    `;
  });

  usersList.innerHTML = html;

  // Bắt sự kiện xóa user
  document.querySelectorAll(".btn-danger").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const userId = btn.getAttribute("data-id");
      if (confirm("Bạn có chắc muốn xóa user này?")) {
        await deleteDoc(doc(db, "users", userId));
        alert("Xóa thành công!");
        loadUsers();
      }
    });
  });
}

// Load khi mở trang
document.addEventListener("DOMContentLoaded", loadUsers);
