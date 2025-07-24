import { auth, db } from './firebase-config.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-firestore.js";

// Tự động nhúng nội dung navbar.htm vào phần tử #navbar
fetch('./navbar.htm')
  .then(res => res.text())
  .then(data => {
    document.getElementById('navbar').innerHTML = data;

    // Thêm hiệu ứng cuộn cho header
    window.addEventListener("scroll", function () {
      const header = document.querySelector("header");
      const currentScroll = window.pageYOffset;
      if (currentScroll > 40) {
        header.classList.add("scrolled-netflix");
      } else {
        header.classList.remove("scrolled-netflix");
      }
    });

    // Sự kiện cho các nút đăng nhập / đăng ký
    const loginBtn = document.getElementById("nav-login-btn");
    const registerBtn = document.getElementById("nav-register-btn");

    if (loginBtn) {
      loginBtn.addEventListener("click", function (e) {
        e.preventDefault();
        window.location.href = "signup.htm?mode=login";
      });
    }

    if (registerBtn) {
      registerBtn.addEventListener("click", function (e) {
        e.preventDefault();
        window.location.href = "signup.htm?mode=signup";
      });
    }

    // Theo dõi trạng thái đăng nhập
    auth.onAuthStateChanged(async (user) => {
      const navAccount = document.getElementById("nav-account");
      if (user) {
        try {
          // Lấy thông tin người dùng từ Firestore
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            navAccount.textContent = userData.email || "Tài khoản";
          } else {
            navAccount.textContent = "Tài khoản";
          }
        } catch (err) {
          console.error("Lỗi lấy dữ liệu email:", err);
          navAccount.textContent = "Tài khoản";
        }

        // Sau 2 tiếng sẽ tự đăng xuất và reload
        setTimeout(() => {
          auth.signOut().then(() => {
            location.reload();
          });
        }, 2 * 60 * 60 * 1000); // 2 tiếng
      } else {
        navAccount.textContent = "Tài khoản";
      }
    });
  });