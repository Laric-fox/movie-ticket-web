import { db } from './firebase-config.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

// DOM Elements
const theaterSelect = document.getElementById('theater-select');
const dateList = document.getElementById('date-list');
const timeList = document.getElementById('time-list');
const nextBtn = document.getElementById('next-to-seat');

let selectedTheater = null;
let selectedDate = null;
let selectedTime = null;

// Lấy danh sách rạp từ Firestore
async function loadTheaters() {
  const querySnapshot = await getDocs(collection(db, 'Movie'));
  const theaters = new Set();

  querySnapshot.forEach((doc) => {
    const data = doc.data();
    if (data.time) {
      data.time.forEach((t) => {
        theaters.add(t.theater);
      });
    }
  });

  theaters.forEach((theater) => {
    const option = document.createElement('option');
    option.value = theater;
    option.textContent = theater;
    theaterSelect.appendChild(option);
  });
}

// Hiển thị ngày dựa trên rạp
async function loadDates(theater) {
  dateList.innerHTML = '';
  timeList.innerHTML = '';
  selectedDate = null;
  selectedTime = null;

  const querySnapshot = await getDocs(collection(db, 'Movie'));
  const dates = new Set();

  querySnapshot.forEach((doc) => {
    const data = doc.data();
    if (data.time) {
      data.time.forEach((t) => {
        if (t.theater === theater) {
          dates.add(t.date);
        }
      });
    }
  });

  Array.from(dates).forEach((date) => {
    const btn = document.createElement('button');
    btn.textContent = date;
    btn.addEventListener('click', () => {
      selectedDate = date;
      document.querySelectorAll('#date-list button').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      loadTimes(theater, date);
    });
    dateList.appendChild(btn);
  });
}

// Hiển thị giờ chiếu
async function loadTimes(theater, date) {
  timeList.innerHTML = '';
  selectedTime = null;

  const querySnapshot = await getDocs(collection(db, 'Movie'));
  const times = new Set();

  querySnapshot.forEach((doc) => {
    const data = doc.data();
    if (data.time) {
      data.time.forEach((t) => {
        if (t.theater === theater && t.date === date) {
          t.hour.forEach((h) => times.add(h));
        }
      });
    }
  });

  Array.from(times).forEach((hour) => {
    const btn = document.createElement('button');
    btn.textContent = hour;
    btn.addEventListener('click', () => {
      selectedTime = hour;
      document.querySelectorAll('#time-list button').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
    });
    timeList.appendChild(btn);
  });
}

// Khi chọn rạp
theaterSelect.addEventListener('change', (e) => {
  selectedTheater = e.target.value;
  loadDates(selectedTheater);
});

// Tiếp tục
nextBtn.addEventListener('click', () => {
  if (!selectedTheater || !selectedDate || !selectedTime) {
    alert("Vui lòng chọn đầy đủ rạp, ngày và suất chiếu.");
    return;
  }

  // Lưu vào localStorage hoặc sessionStorage để dùng bước sau
  const bookingInfo = {
    theater: selectedTheater,
    date: selectedDate,
    time: selectedTime,
  };
  localStorage.setItem('booking-step1', JSON.stringify(bookingInfo));

  // Chuyển bước (giả định)
  window.location.href = 'booking-seat.html';
});

// Load khi vào trang
loadTheaters();