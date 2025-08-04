import { auth, db } from './firebase-config.js';
import {
  onAuthStateChanged,
  signOut
} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js';
import {
  collection,
  query,
  where,
  getDocs
} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';

// Scroll hiệu ứng cho navbar
window.addEventListener('scroll', () => {
  const header = document.querySelector('header');
  if (window.pageYOffset > 40) {
    header.classList.add('scrolled-netflix');
  } else {
    header.classList.remove('scrolled-netflix');
  }
});


// Nhúng footer
fetch('footer.htm')
  .then(response => response.text())
  .then(data => {
    document.getElementById('footer-placeholder').innerHTML = data;
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
      console.log(user);
      if (user) {
        let displayName = user.email; // fallback

        try {
          // Truy vấn người dùng theo email thay vì user.uid
          const q = query(collection(db, 'users'), where('email', '==', user.email));
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0].data();
            console.log("user doc:", userDoc);
            displayName = userDoc.username || user.email;
          } else {
            console.warn("Không tìm thấy user với email:", user.email);
          }
        } catch (err) {
          console.error('Lỗi khi lấy username từ Firestore:', err);
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
  