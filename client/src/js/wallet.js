// src/js/wallet.js
import { auth, db } from './firebase-config.js';
import { collection, query, where, getDocs, updateDoc, doc, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';
import { checkSession } from './check_session.js';

let userSession = JSON.parse(localStorage.getItem('user_session'));

// Kiểm tra session ngay lập tức
if (!checkSession()) {
  console.log("Phiên đăng nhập không hợp lệ, chuyển hướng...");
}

document.addEventListener('DOMContentLoaded', () => {
  loadBalance();
  loadTransactionHistory();
});

function formatBalance(balance) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(balance);
}

async function loadBalance() {
  const balanceEl = document.querySelector('.balance-number');
  const lastUpdatedEl = document.getElementById('last-updated');
  if (!balanceEl) return;

  if (!userSession?.user?.email) {
    balanceEl.textContent = "Vui lòng đăng nhập";
    return;
  }

  try {
    const authorEmail = userSession.user.email;
    const q = query(collection(db, "users"), where("email", "==", authorEmail));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      balanceEl.textContent = "Không tìm thấy người dùng";
      return;
    }

    const userDoc = snapshot.docs[0];
    const balance = userDoc.data().balance || 0;
    balanceEl.textContent = formatBalance(balance);
    if (lastUpdatedEl) {
      lastUpdatedEl.textContent = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
    }

  } catch (err) {
    console.error("Lỗi tải số dư:", err);
    balanceEl.textContent = "Lỗi tải số dư";
  }
}

async function loadTransactionHistory() {
  const listEl = document.querySelector('.transaction-list');
  if (!listEl || !userSession?.user?.email) return;

  try {
    const q = query(collection(db, "transactions"), where("userEmail", "==", userSession.user.email));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      listEl.innerHTML = '<p class="text-muted text-center">Chưa có giao dịch nào.</p>';
      return;
    }

    let html = '';
    snapshot.forEach(doc => {
      const t = doc.data();
      const date = t.timestamp?.toDate?.()?.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) || '';
      const amount = formatBalance(t.amount);
      html += `
        <div class="transaction-item d-flex justify-content-between">
          <span>${t.type === 'deposit' ? 'Nạp tiền' : 'Thanh toán'} - ${t.bank || 'Ví'}</span>
          <span class="amount text-${t.type === 'deposit' ? 'success' : 'danger'}">${amount}</span>
          <span>${date}</span>
        </div>
      `;
    });
    listEl.innerHTML = html;

  } catch (err) {
    console.error("Lỗi tải lịch sử:", err);
    listEl.innerHTML = '<p class="text-danger text-center">Lỗi tải lịch sử.</p>';
  }
}

// Nạp tiền
const balanceForm = document.querySelector('#balance-form');
if (balanceForm) {
  balanceForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const card = document.querySelector('#card-number').value;
    const bank = document.querySelector('#bank-select').value;
    const amount = parseFloat(document.querySelector('#amount').value);

    if (!card || !bank || isNaN(amount) || amount < 10000) {
      alert("Vui lòng nhập đầy đủ và đúng thông tin (tối thiểu 10,000 VND)!");
      return;
    }

    try {
      const authorEmail = userSession.user.email;
      const q = query(collection(db, "users"), where("email", "==", authorEmail));
      const snap = await getDocs(q);
      if (snap.empty) { alert("Không tìm thấy người dùng"); return; }

      const userDoc = snap.docs[0];
      const newBalance = (userDoc.data().balance || 0) + amount;

      await updateDoc(doc(db, "users", userDoc.id), { balance: newBalance });
      await addDoc(collection(db, "transactions"), {
        userEmail: authorEmail,
        type: 'deposit',
        amount,
        bank,
        timestamp: serverTimestamp()
      });

      alert("Nạp tiền thành công!");
      balanceForm.reset();
      loadBalance();
      loadTransactionHistory();

    } catch (err) {
      console.error("Lỗi nạp tiền:", err);
      alert("Có lỗi xảy ra khi nạp tiền!");
    }
  });
}
