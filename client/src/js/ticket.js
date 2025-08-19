// src/js/tickets.js
import { db } from './firebase-config.js';
import { collection, getDocs, query, where, doc } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';
import { checkSession } from './check_session.js';

let userSession = JSON.parse(localStorage.getItem('user_session'));

// Kiểm tra đăng nhập
if (!checkSession()) {
  console.log("Phiên đăng nhập không hợp lệ, chuyển hướng...");
}

// Hàm lấy danh sách vé đã đặt
async function getTickets() {
  try {
    if (!userSession || !userSession.user || !userSession.user.email) {
      document.querySelector('.tickets-list').innerHTML =
        '<p class="text-center">Vui lòng đăng nhập để xem vé đã đặt.</p>';
      return;
    }

    const authorEmail = userSession.user.email;
    let htmls = "";

    // Tìm user theo email
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", authorEmail));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      htmls = '<p class="text-center">Không tìm thấy người dùng.</p>';
    } else {
      const userDoc = snapshot.docs[0];
      const transRef = collection(doc(db, "users", userDoc.id), "transactions");
      const transSnap = await getDocs(transRef);

      if (transSnap.empty) {
        htmls = '<p class="text-center">Bạn chưa đặt vé nào.</p>';
      } else {
        transSnap.forEach((tran) => {
          const data = tran.data();
          const createdAt = data.createdAt?.toDate
            ? data.createdAt.toDate().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
            : "Không rõ";

          htmls += `
            <div class="ticket-item shadow-md mt-2 p-2 rounded">
              <h6>${data.note}</h6>
              <p>Số tiền: ${data.amount.toLocaleString('vi-VN')} VND</p>
              <p>Ngày đặt: ${createdAt}</p>
              <p>Loại giao dịch: ${data.type}</p>
            </div>
          `;
        });
      }
    }

    document.querySelector('.tickets-list').innerHTML = htmls;
  } catch (error) {
    console.error("Lỗi khi tải danh sách vé:", error);
    document.querySelector('.tickets-list').innerHTML =
      '<p class="text-center text-danger">Lỗi tải danh sách vé.</p>';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  getTickets();
});
