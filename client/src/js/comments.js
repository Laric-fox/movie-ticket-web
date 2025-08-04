import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js';
import {
  addDoc,
  collection,
  getDocs,
  serverTimestamp,
  query,
  orderBy,
  doc,
  getDoc
} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';

const commentForm = document.getElementById('comment-form');
const commentInput = document.getElementById('comment-input');
const commentsList = document.getElementById('comments');
const commentBoxContainer = document.getElementById('comment-box-container');

let currentUser = null;
let currentMovieId = null;
const COMMENTS_TO_SHOW = 4;

function renderComment({ username, content, time }) {
  const div = document.createElement('div');
  div.className = 'comment-content';
  div.innerHTML = `
    <img src="./img/web.img/fox-2.png" id="avatar-comment" alt="">
    <div class="comment-item">
      <div class="comment-text">
        <strong>${username}</strong>
        <p>${content}</p>
      </div>
      <p>${time}</p>
    </div>
  `;
  return div;
}

function formatTime(timestamp) {
  const date = timestamp.toDate();
  const pad = (n) => n.toString().padStart(2, '0');
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

async function getUsername(uid, fallback = 'Ẩn danh') {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (userDoc.exists()) {
      return userDoc.data().username || fallback;
    }
  } catch (err) {
    console.error('Lỗi lấy username:', err);
  }
  return fallback;
}

async function loadComments(movieId) {
  const q = query(collection(db, 'movies', movieId, 'comments'), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  const comments = [];

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const username = await getUsername(data.userId, data.userEmail || 'Ẩn danh');
    comments.push({
      username,
      content: data.content,
      time: data.createdAt ? formatTime(data.createdAt) : 'Vừa xong'
    });
  }

  return comments;
}

function displayComments(comments) {
  commentsList.innerHTML = '';

  let isExpanded = false;
  const renderLimited = () => {
    commentsList.innerHTML = '';
    for (let i = 0; i < COMMENTS_TO_SHOW; i++) {
      if (i < comments.length) {
        commentsList.appendChild(renderComment(comments[i]));
      }
    }
    if (comments.length > COMMENTS_TO_SHOW) commentsList.appendChild(expandBtn);
  };

  const renderAll = () => {
    commentsList.innerHTML = '';
    for (const c of comments) {
      commentsList.appendChild(renderComment(c));
    }
    commentsList.appendChild(collapseBtn);
  };

  const expandBtn = document.createElement('button');
  expandBtn.textContent = 'Xem thêm';
  expandBtn.className = 'btn btn-outline-light mt-3';
  expandBtn.onclick = () => {
    isExpanded = true;
    renderAll();
  };

  const collapseBtn = document.createElement('button');
  collapseBtn.textContent = 'Thu gọn';
  collapseBtn.className = 'btn btn-outline-light mt-3';
  collapseBtn.onclick = () => {
    isExpanded = false;
    renderLimited();
  };

  if (comments.length <= COMMENTS_TO_SHOW) {
    for (const c of comments) commentsList.appendChild(renderComment(c));
  } else {
    renderLimited();
  }
}

// === Theo dõi trạng thái đăng nhập ===
onAuthStateChanged(auth, async (user) => {
  currentUser = user;
  const urlParams = new URLSearchParams(window.location.search);
  currentMovieId = urlParams.get('id');
  if (!currentMovieId) return;

  if (!currentUser) {
    commentInput.disabled = true;
    commentInput.placeholder = 'Đăng nhập để bình luận';
    commentForm.querySelector('button').disabled = true;
    commentsList.innerHTML = ''; // Ẩn bình luận
    return;
  }

  commentInput.disabled = false;
  commentInput.placeholder = 'Nhập bình luận của bạn...';
  commentForm.querySelector('button').disabled = false;

  const comments = await loadComments(currentMovieId);
  displayComments(comments);
});

commentForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!currentUser || !currentMovieId) return;

  const content = commentInput.value.trim();
  if (!content) return;

  try {
    await addDoc(collection(db, 'movies', currentMovieId, 'comments'), {
      userId: currentUser.uid,
      userEmail: currentUser.email,
      content,
      createdAt: serverTimestamp()
    });

    commentInput.value = '';
    const comments = await loadComments(currentMovieId);
    displayComments(comments);
  } catch (err) {
    console.error('Lỗi gửi bình luận:', err);
  }
});
