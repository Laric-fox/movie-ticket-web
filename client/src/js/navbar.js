import { auth, db } from './firebase-config.js';
import {
  onAuthStateChanged,
  signOut
} from 'https://www.gstatic.com/firebasejs/11.7.1/firebase-auth.js';
import {
  doc,
  getDoc
} from 'https://www.gstatic.com/firebasejs/11.7.1/firebase-firestore.js';

// Scroll hiệu ứng cho navbar
window.addEventListener('scroll', () => {
  const header = document.querySelector('header');
  if (window.pageYOffset > 40) {
    header.classList.add('scrolled-netflix');
  } else {
    header.classList.remove('scrolled-netflix');
  }
});

// Nhúng navbar vào
fetch('./navbar.htm')
  .then((res) => res.text())
  .then((data) => {
    document.getElementById('navbar').innerHTML = data;

    const profileBtn = document.getElementById('profile-dropdown');
    const authorMenu = document.getElementById('author-menu-drd');

    const attachNavEvents = () => {
      const loginBtn = document.getElementById('nav-login-btn');
      const registerBtn = document.getElementById('nav-register-btn');

      if (loginBtn) {
        loginBtn.addEventListener('click', (e) => {
          e.preventDefault();
          window.location.href = 'signup.htm?mode=login';
        });
      }

      if (registerBtn) {
        registerBtn.addEventListener('click', (e) => {
          e.preventDefault();
          window.location.href = 'signup.htm?mode=signup';
        });
      }
    };

    // Theo dõi trạng thái người dùng
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        let displayName = '';
        try {
          const docSnap = await getDoc(doc(db, 'users', user.uid));
          if (docSnap.exists() && docSnap.data().username) {
            displayName = docSnap.data().username;
          } else {
            displayName = user.email;
          }
        } catch (err) {
          console.error('Lỗi khi lấy username từ Firestore:', err);
          displayName = user.email;
        }

        // Cập nhật tên
        profileBtn.innerHTML = `
          <img src="img/web.img/fox-2.png" alt="Profile">
          ${displayName}
        `;

        authorMenu.innerHTML = `
          <li><a class="dropdown-item" href="#">Hồ sơ</a></li>
          <li><a class="dropdown-item" href="#" id="logout-btn">Đăng xuất</a></li>
        `;

        // Gắn nút đăng xuất
        const logoutBtn = document.getElementById('logout-btn');
        logoutBtn.addEventListener('click', async () => {
          try {
            await signOut(auth);
            location.reload();
          } catch (error) {
            console.error('Lỗi đăng xuất:', error);
          }
        });

        // Tự động đăng xuất sau 2 giờ
        setTimeout(async () => {
          try {
            await signOut(auth);
            location.reload();
          } catch (error) {
            console.error('Lỗi auto logout:', error);
          }
        }, 2 * 60 * 60 * 1000); // 2 tiếng
      } else {
        // Nếu chưa đăng nhập
        profileBtn.innerHTML = `
          <img src="img/web.img/fox-2.png" alt="Profile">
          Account
        `;
        authorMenu.innerHTML = `
          <li><a class="dropdown-item" href="#" id="nav-login-btn">Sign in</a></li>
          <li><a class="dropdown-item" href="#" id="nav-register-btn">Sign up</a></li>
        `;
        attachNavEvents();
      }
    });
  });