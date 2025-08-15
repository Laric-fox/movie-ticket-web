// /js/booking.js — FULL (Firebase v11.10.0 + realtime seat locking + WALLET from users.balance only)
// YÊU CẦU: firebase-config.js export sẵn { auth, db }

import { auth, db } from './firebase-config.js';
import {
  collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc,
  query, where, serverTimestamp, runTransaction, onSnapshot
} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js';

/* ==================== DOM ==================== */
const panels = {
  1: document.getElementById('step-1'),
  2: document.getElementById('step-2'),
  3: document.getElementById('step-3'),
  4: document.getElementById('step-4'),
};
const stepsEls      = document.querySelectorAll('.steps .step');

const posterGrid    = document.getElementById('posterGrid');
const toStep2Btn    = document.getElementById('toStep2');
const toStep3Btn    = document.getElementById('toStep3');
const toStep4Btn    = document.getElementById('toStep4');
const backTo1Btn    = document.getElementById('backTo1');
const backTo2Btn    = document.getElementById('backTo2');
const backTo3Btn    = document.getElementById('backTo3');

const movieInfo     = document.getElementById('movieInfo');
const cinemaSel     = document.getElementById('cinemaSel');
const dateChips     = document.getElementById('dateChips');
const timeChips     = document.getElementById('timeChips');
const manualBtn     = document.getElementById('useManualShowtime');

const seatArea      = document.getElementById('seatArea');
const orderCard     = document.getElementById('orderCard');

const buyerNameEl   = document.getElementById('buyerName');
const buyerEmailEl  = document.getElementById('buyerEmail');
const confirmPayBtn = document.getElementById('confirmPay');

/* ==================== HẰNG SỐ + STATE ==================== */
const PRICE = 80000;         // Giá 1 ghế
const ROWS  = 9, COLS = 12;  // Layout ghế
const DEFAULT_CINEMAS = ['Galaxy Nguyễn Du', 'Galaxy Vincom', 'Galaxy Landmark'];
const DEFAULT_TIMES   = ['10:00','13:00','16:00','19:00','21:30'];
const HOLD_MS = 5 * 60 * 1000; // 5 phút giữ ghế

let MOVIES = [];                 // {id, name, image, ...}
let SELECTED_MOVIE = null;
let SELECTED_CINEMA = null;
let SELECTED_DATE = null;        // yyyy-mm-dd
let SELECTED_TIME = null;        // "HH:mm"
let SELECTED_SHOWTIME = null;    // { id, movieId, cinema, date, time }
let SELECTED_SEATS = [];         // ["A1","A2",...]

let CURRENT_USER = null;         // auth user
let CURRENT_USER_DOC = null;     // users/{docId} data
let CURRENT_USER_DOC_ID = null;  // users/{docId}

/* ===== phiên cho khách (nếu chưa login) để giữ ghế tạm ===== */
const SESSION_ID = (() => {
  let id = localStorage.getItem('cf_session');
  if (!id) {
    id = 'guest_' + Math.random().toString(36).slice(2);
    localStorage.setItem('cf_session', id);
  }
  return id;
})();
const HOLDER_ID = () => (CURRENT_USER?.uid || SESSION_ID);

/* ===== realtime listener ghế của showtime hiện tại ===== */
let unsubscribeSeats = null;

/* ==================== TIỆN ÍCH ==================== */
const seatId   = (r,c) => String.fromCharCode(65+r) + (c+1);
const currency = n => new Intl.NumberFormat('vi-VN').format(n) + ' VND';

function setStep(n){
  Object.keys(panels).forEach(k => panels[k].classList.remove('active'));
  panels[n].classList.add('active');
  stepsEls.forEach(s => s.classList.toggle('active', Number(s.dataset.step) === n));
}

/* ==================== STYLES FOR SEATS (ADDED) ==================== */
(function injectSeatStyles(){
  const style = document.createElement('style');
  style.textContent = `
    /* seat states */
    .seat { display:inline-block; width:44px; height:44px; margin:6px; border-radius:6px; user-select:none; }
    .seat .seat-inner { display:flex; align-items:center; justify-content:center; height:100%; font-weight:600; }
    .seat.available { background:#f0f0f0; cursor:pointer; pointer-events:auto; }
    .seat.selected { background:#4caf50; color:#fff; pointer-events:auto; }
    .seat.sold { background:#999; color:#fff; cursor:not-allowed; pointer-events:none; } /* ADDED: paid seats */
    .seat.held { background:#ffb84d; color:#111; cursor:not-allowed; pointer-events:none; }   /* ADDED: held seats */
  `;
  document.head.appendChild(style);
})();

/* ==================== AUTH ==================== */
onAuthStateChanged(auth, async (user) => {
  CURRENT_USER = user || null;

  if (CURRENT_USER) {
    if (!buyerEmailEl.value) buyerEmailEl.value = CURRENT_USER.email || '';
    if (!buyerNameEl.value)  buyerNameEl.value  = CURRENT_USER.displayName || '';

    // Đảm bảo có user doc trong collection "users" (đúng ví của bạn)
    const { data, id } = await getOrInitUsersDocByEmail(CURRENT_USER.email, CURRENT_USER.displayName);
    CURRENT_USER_DOC = data;
    CURRENT_USER_DOC_ID = id;
  } else {
    CURRENT_USER_DOC = null;
    CURRENT_USER_DOC_ID = null;
  }
});

/** Tìm/khởi tạo doc trong collection "users" theo email, có balance */
async function getOrInitUsersDocByEmail(email, name){
  const qy = query(collection(db, 'users'), where('email','==', email));
  const snap = await getDocs(qy);
  if (!snap.empty) {
    const d = snap.docs[0];
    return { id: d.id, data: d.data() };
  }
  // chưa có → tạo mới
  const ref = await addDoc(collection(db, 'users'), {
    email: email || '',
    name: name || '',
    balance: 0,
    createdAt: serverTimestamp()
  });
  const newSnap = await getDoc(ref);
  return { id: ref.id, data: newSnap.data() || { email, name, balance: 0 } };
}

/* ==================== INIT ==================== */
init();
async function init(){
  setStep(1);
  bindNav();
  await loadMovies();
  fillCinemas();
  renderDateChips();
  renderTimeChips();
  renderSeats();
  updateSummaryUI();
}

/* ==================== NAVIGATION ==================== */
function bindNav(){
  toStep2Btn.addEventListener('click', () => setStep(2));

  // FIX: hủy listener khi back để tránh rò rỉ / duplicate listeners
  backTo1Btn?.addEventListener('click', () => {
    if (unsubscribeSeats) { unsubscribeSeats(); unsubscribeSeats = null; }
    setStep(1);
  });
  backTo2Btn?.addEventListener('click', () => {
    if (unsubscribeSeats) { unsubscribeSeats(); unsubscribeSeats = null; }
    setStep(2);
  });
  backTo3Btn?.addEventListener('click', () => {
    if (unsubscribeSeats) { unsubscribeSeats(); unsubscribeSeats = null; }
    setStep(3);
  });

  toStep3Btn.addEventListener('click', () => {
    if (!SELECTED_SHOWTIME) return alert('Vui lòng chọn rạp / ngày / giờ rồi nhấn "Chọn suất này".');
    setStep(3);
    subscribeSeatStream(); // bật realtime ghế
  });

  toStep4Btn.addEventListener('click', () => {
    if (SELECTED_SEATS.length === 0) return alert('Chọn ít nhất 1 ghế');
    setStep(4);
    updateSummaryUI();
  });

  manualBtn.addEventListener('click', onPickShowtime);
  confirmPayBtn.addEventListener('click', onConfirmPay);
}

/* ==================== STEP 1: PHIM ==================== */
async function loadMovies(){
  posterGrid.textContent = 'Đang tải phim...';
  MOVIES = [];
  try {
    const snap = await getDocs(collection(db, 'Movie')); // <- dùng collection Movie của bạn
    posterGrid.innerHTML = '';
    snap.forEach(d => {
      const data = d.data();
      const movie = { id: d.id, ...data };
      MOVIES.push(movie);

      const card = document.createElement('div');
      card.className = 'poster-card';
      card.innerHTML = `
        <img src="${movie.image || './img/placeholder.png'}" alt="${movie.name || ''}">
        <p class="p-title">${movie.name || 'Không rõ tên'}</p>
      `;
      card.addEventListener('click', () => selectMovie(movie, card));
      posterGrid.appendChild(card);
    });

    if (MOVIES.length) {
      const first = posterGrid.querySelector('.poster-card');
      selectMovie(MOVIES[0], first);
    } else {
      posterGrid.textContent = 'Không có phim.';
      toStep2Btn.disabled = true;
    }
  } catch (err) {
    console.error('Lỗi load Movie:', err);
    posterGrid.textContent = 'Lỗi tải phim.';
  }
}

function selectMovie(movie, cardEl){
  SELECTED_MOVIE = movie;
  posterGrid.querySelectorAll('.poster-card').forEach(c => c.classList.remove('active'));
  cardEl?.classList.add('active');

  // Reset các lựa chọn sau
  SELECTED_CINEMA = cinemaSel.value || DEFAULT_CINEMAS[0];
  SELECTED_DATE   = null;
  SELECTED_TIME   = null;
  SELECTED_SHOWTIME = null;
  SELECTED_SEATS  = [];
  toStep2Btn.disabled = false;
  toStep3Btn.disabled = true;
  toStep4Btn.disabled = true;

  // ngắt listener ghế cũ nếu có
  if (unsubscribeSeats) { unsubscribeSeats(); unsubscribeSeats = null; }

  renderMovieInfo(movie);
  renderSeats();
  updateSummaryUI();
}

function renderMovieInfo(movie){
  if (!movie) { movieInfo.innerHTML = 'Chưa chọn phim'; return; }
  movieInfo.innerHTML = `
    <div style="display:flex; gap:12px; align-items:flex-start;">
      <img src="${movie.image || './img/placeholder.png'}" alt="${movie.name||''}" style="width:120px;height:160px;object-fit:cover;border-radius:6px">
      <div>
        <h3 style="margin:0 0 6px 0">${movie.name||''}</h3>
        <div style="opacity:.75">${movie.category||''} • ${movie.duration||''}p • ${movie.language||''}</div>
        <div style="margin-top:6px">Rated: ${movie.Rated||''}</div>
      </div>
    </div>
  `;
}

/* ==================== STEP 2: SUẤT ==================== */
function fillCinemas(){
  cinemaSel.innerHTML = DEFAULT_CINEMAS.map(c => `<option value="${c}">${c}</option>`).join('');
  cinemaSel.addEventListener('change', () => {
    SELECTED_CINEMA = cinemaSel.value;
    invalidateShowtime();
  });
  SELECTED_CINEMA = cinemaSel.value || DEFAULT_CINEMAS[0];
}

function renderDateChips(){
  dateChips.innerHTML = '';
  const today = new Date();
  for (let i = 0; i < 10; i++){
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const iso = d.toISOString().slice(0,10); // yyyy-mm-dd
    const label = d.toLocaleDateString('vi-VN', { weekday:'short', day:'2-digit', month:'2-digit' });

    const chip = document.createElement('button');
    chip.className = 'chip';
    chip.type = 'button';
    chip.dataset.value = iso;
    chip.textContent = label;
    chip.addEventListener('click', () => {
      SELECTED_DATE = iso;
      dateChips.querySelectorAll('.chip').forEach(c => c.classList.remove('selected'));
      chip.classList.add('selected');
      invalidateShowtime(false);
    });
    dateChips.appendChild(chip);
  }
}

function renderTimeChips(){
  timeChips.innerHTML = '';
  DEFAULT_TIMES.forEach(t => {
    const chip = document.createElement('button');
    chip.className = 'chip';
    chip.type = 'button';
    chip.dataset.value = t;
    chip.textContent = t;
    chip.addEventListener('click', () => {
      SELECTED_TIME = t;
      timeChips.querySelectorAll('.chip').forEach(c => c.classList.remove('selected'));
      chip.classList.add('selected');
      invalidateShowtime(false);
    });
    timeChips.appendChild(chip);
  });
}

function invalidateShowtime(disableToStep3 = true){
  SELECTED_SHOWTIME = null;
  if (disableToStep3) toStep3Btn.disabled = true;

  // tắt realtime ghế nếu đang nghe
  if (unsubscribeSeats) { unsubscribeSeats(); unsubscribeSeats = null; }
  renderSeats();
  updateSummaryUI();
}

function onPickShowtime(){
  if (!SELECTED_MOVIE)       return alert('Chọn phim trước');
  if (!SELECTED_CINEMA)      return alert('Chọn rạp');
  if (!SELECTED_DATE)        return alert('Chọn ngày');
  if (!SELECTED_TIME)        return alert('Chọn giờ');

  SELECTED_SHOWTIME = {
    id: `${SELECTED_MOVIE.id}__${SELECTED_CINEMA}__${SELECTED_DATE}__${SELECTED_TIME}`,
    movieId: SELECTED_MOVIE.id,
    cinema: SELECTED_CINEMA,
    date: SELECTED_DATE,
    time: SELECTED_TIME
  };
  toStep3Btn.disabled = false;
  updateSummaryUI();

  // Chuyển qua ghế + bật realtime
  setStep(3);
  subscribeSeatStream();
}

/* ==================== STEP 3: GHẾ (realtime lock) ==================== */
function renderSeats(){
  seatArea.innerHTML = '';
  for (let r = 0; r < ROWS; r++){
    for (let c = 0; c < COLS; c++){
      const id = seatId(r,c);
      const el = document.createElement('div');
      el.className = 'seat available';
      el.setAttribute('data-seat', id); // ADDED: dễ lookup
      el.setAttribute('role', 'button');
      el.innerHTML = `<div class="seat-inner">${id}</div>`;
      el.addEventListener('click', () => onSeatClick(el, id));
      seatArea.appendChild(el);
    }
  }
  SELECTED_SEATS = [];
  toStep4Btn.disabled = true;
}

function onSeatClick(el, id){
  if (!SELECTED_SHOWTIME?.id) return;

  // nếu ghế đang bị sold (paid/held bởi người khác) thì thôi
  if (el.classList.contains('sold') || el.classList.contains('held')) return;

  // nếu mình đã chọn (đang hold bởi mình) => bỏ chọn (release)
  if (el.classList.contains('selected')){
    releaseSeat(id).catch(()=>{});
    return;
  }

  // còn lại: thử hold ghế này
  tryHoldSeat(id).catch(err => {
    console.warn(err);
    alert('Ghế vừa bị người khác chọn hoặc đã thanh toán.');
  });
}

function findSeatEl(id){
  return Array.from(seatArea.children).find(ch => ch.querySelector('.seat-inner')?.textContent === id);
}

// Realtime stream ghế theo showtime
function subscribeSeatStream(){
  if (!SELECTED_SHOWTIME?.id) return;

  // clear & huỷ listener cũ
  if (unsubscribeSeats) { unsubscribeSeats(); unsubscribeSeats = null; }
  // reset UI seats
  Array.from(seatArea.children).forEach(el => {
    el.classList.remove('sold','selected','held');
    el.classList.add('available');
    el.title = '';
    el.style.pointerEvents = 'auto'; // ADDED
  });
  SELECTED_SEATS = [];
  toStep4Btn.disabled = true;

  const qy = query(collection(db, 'BookedSeats'), where('showtimeId','==', SELECTED_SHOWTIME.id));
  unsubscribeSeats = onSnapshot(qy, (snap) => {
    const now = Date.now();

    // clear tất cả trước khi apply trạng thái
    Array.from(seatArea.children).forEach(el => {
      el.classList.remove('sold','selected','held');
      el.classList.add('available');
      el.title = '';
      el.style.pointerEvents = 'auto'; // ADDED
    });
    SELECTED_SEATS = [];

    snap.forEach(docSnap => {
      const d = docSnap.data();
      const seat = d.seatId;
      const el = findSeatEl(seat);
      if (!el) return;

      const exp = d.expiresAt?.toDate?.() || new Date(0);
      const notExpired = exp.getTime() > now;

      // paid => khoá vĩnh viễn
      if (d.status === 'paid') {
        el.classList.remove('available','selected','held');
        el.classList.add('sold');
        el.title = 'Đã bán';
        el.style.pointerEvents = 'none'; // ADDED: prevent clicks
      } else if (d.status === 'held' && notExpired) {
        // held (còn hạn)
        if (d.heldBy === HOLDER_ID()) {
          // held by me => mark selected
          el.classList.remove('available','sold','held');
          el.classList.add('selected');
          el.title = 'Bạn đang giữ ghế';
          el.style.pointerEvents = 'auto'; // still allow me to click to release
          if (!SELECTED_SEATS.includes(seat)) SELECTED_SEATS.push(seat);
        } else {
          // held by others => treat as blocked
          el.classList.remove('available','selected','sold');
          el.classList.add('held');
          el.title = 'Đang được giữ bởi người khác';
          el.style.pointerEvents = 'none'; // ADDED
        }
      } else {
        // expired or no doc => available
        el.classList.remove('sold','selected','held');
        el.classList.add('available');
        el.title = '';
        el.style.pointerEvents = 'auto'; // ADDED
      }
    });

    toStep4Btn.disabled = SELECTED_SEATS.length === 0;
    updateSummaryUI();
  }, (err) => console.error('onSnapshot seats error:', err));
}

// transaction: thử hold một ghế trong HOLD_MS
async function tryHoldSeat(seat){
  const ref = doc(db, 'BookedSeats', `${SELECTED_SHOWTIME.id}__${seat}`);
  const holder = HOLDER_ID();
  const newExp = new Date(Date.now() + HOLD_MS);

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (snap.exists()) {
      const d = snap.data();
      const exp = d.expiresAt?.toDate?.() || new Date(0);
      const notExpired = exp.getTime() > Date.now();

      if (d.status === 'paid') throw new Error('SEAT_PAID');
      if (d.status === 'held' && notExpired && d.heldBy !== holder) {
        throw new Error('SEAT_HELD_BY_OTHER');
      }
    }
    // set/renew hold cho mình
    tx.set(ref, {
      showtimeId: SELECTED_SHOWTIME.id,
      seatId: seat,
      status: 'held',
      heldBy: holder,
      expiresAt: newExp,
      updatedAt: serverTimestamp()
    }, { merge: true });
  });
}

// transaction: thả ghế nếu đang hold bởi mình
async function releaseSeat(seat){
  const ref = doc(db, 'BookedSeats', `${SELECTED_SHOWTIME.id}__${seat}`);
  const holder = HOLDER_ID();

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return;
    const d = snap.data();
    if (d.status === 'paid') return; // đã trả tiền thì không được huỷ
    if (d.heldBy !== holder) return; // không phải mình giữ
    // xoá doc cho sạch
    tx.delete(ref);
  });
}

/* ==================== STEP 4: TỔNG KẾT + THANH TOÁN ==================== */
function updateSummaryUI(){
  const movieName = SELECTED_MOVIE?.name || '—';
  const st        = SELECTED_SHOWTIME || {};
  const seatsTxt  = SELECTED_SEATS.length ? SELECTED_SEATS.join(', ') : '—';
  const total     = SELECTED_SEATS.length * PRICE;

  orderCard.innerHTML = `
    <div><strong>Phim:</strong> ${movieName}</div>
    <div><strong>Rạp • Suất:</strong> ${st.cinema || SELECTED_CINEMA || '—'} • ${st.date || SELECTED_DATE || '—'} • ${st.time || SELECTED_TIME || '—'}</div>
    <div><strong>Ghế:</strong> ${seatsTxt}</div>
    <div><strong>Tổng:</strong> ${currency(total)}</div>
  `;

  let active = 1;
  Object.keys(panels).forEach(k => { if (panels[k].classList.contains('active')) active = Number(k); });
  stepsEls.forEach(s => s.classList.toggle('active', Number(s.dataset.step) === active));
}

async function onConfirmPay(){
  if (!SELECTED_MOVIE)             return alert('Thiếu phim');
  if (!SELECTED_SHOWTIME?.id)      return alert('Thiếu suất chiếu');
  if (SELECTED_SEATS.length === 0) return alert('Chưa chọn ghế');

  const buyerName  = (buyerNameEl.value || '').trim();
  const buyerEmail = (buyerEmailEl.value || '').trim();
  if (!buyerName || !buyerEmail) return alert('Nhập họ tên & email');

  if (!CURRENT_USER?.email) {
    return alert('Vui lòng đăng nhập để thanh toán bằng ví.');
  }

  const st = SELECTED_SHOWTIME;
  const total = SELECTED_SEATS.length * PRICE;
  const holder = HOLDER_ID();

  try {
    // Sửa: đảm bảo **read-before-write** trong transaction
    await runTransaction(db, async (tx) => {
      // -- READ PHASE --
      // 1) Đọc tất cả seat docs trước
      const seatRefs = SELECTED_SEATS.map(seat => doc(db, 'BookedSeats', `${st.id}__${seat}`));
      const seatSnaps = await Promise.all(seatRefs.map(ref => tx.get(ref)));

      // Validate seats
      for (let i = 0; i < seatSnaps.length; i++) {
        const ssnap = seatSnaps[i];
        const seat = SELECTED_SEATS[i];
        if (!ssnap.exists()) throw new Error(`Ghế ${seat} chưa được giữ`);
        const d = ssnap.data();
        const exp = (d.expiresAt && d.expiresAt.toDate) ? d.expiresAt.toDate() : new Date(0);
        const notExpired = exp.getTime() > Date.now();
        if (d.status === 'paid') throw new Error(`Ghế ${seat} đã thanh toán`);
        if (!(d.heldBy === holder && notExpired)) throw new Error(`Ghế ${seat} không còn giữ bởi bạn`);
      }

      // 2) Đọc user doc
      let usersDocId = CURRENT_USER_DOC_ID;
      if (!usersDocId) {
        throw new Error('Không tìm thấy người dùng trong "users". Hãy đăng xuất và đăng nhập lại.');
      }
      const userRef = doc(db, 'users', usersDocId);
      const userSnap = await tx.get(userRef);
      if (!userSnap.exists()) throw new Error('Không tìm thấy user trong "users".');
      const usersData = userSnap.data();
      const balance = Number(usersData.balance || 0);
      if (balance < total) throw new Error('Số dư ví không đủ');

      // -- WRITE PHASE: tất cả write sau khi đã đọc hết --
      // a) mark seats paid
      for (const sref of seatRefs) {
        tx.set(sref, {
          status: 'paid',
          paidBy: CURRENT_USER.uid,
          updatedAt: serverTimestamp()
        }, { merge: true });
      }

      // b) trừ balance
      tx.update(userRef, {
        balance: balance - total,
        updatedAt: serverTimestamp()
      });

      // c) log transaction
      const transRef = doc(collection(db, 'users', usersDocId, 'transactions'));
      tx.set(transRef, {
        type: 'debit',
        amount: total,
        note: `Mua vé ${SELECTED_MOVIE.name} • ${st.date} ${st.time} • Ghế: ${SELECTED_SEATS.join(', ')}`,
        createdAt: serverTimestamp()
      });

      // d) tạo booking
      const bookingRef = doc(collection(db, 'Bookings'));
      tx.set(bookingRef, {
        id: bookingRef.id,
        userId: CURRENT_USER.uid,
        userEmail: CURRENT_USER.email,
        movieId: SELECTED_MOVIE.id,
        movieName: SELECTED_MOVIE.name || '',
        showtimeId: st.id,
        cinema: st.cinema,
        date: st.date,
        time: st.time,
        seats: SELECTED_SEATS.slice(),
        ticketPrice: PRICE,
        total,
        buyerName,
        buyerEmail,
        status: 'paid',
        createdAt: serverTimestamp()
      });
    });

    // Sau khi transaction thành công, cập nhật biến local nếu có
    if (CURRENT_USER_DOC) {
      CURRENT_USER_DOC.balance = Number(CURRENT_USER_DOC.balance || 0) - total;
    }

    alert('Thanh toán thành công! Vé đã được lưu.');
    // reset + về trang chủ
    SELECTED_SEATS = [];
    if (unsubscribeSeats) { unsubscribeSeats(); unsubscribeSeats = null; }
    window.location.href = './index.htm';


  } catch (e) {
    console.error('Lỗi khi thanh toán:', e);
    alert(e?.message || 'Có lỗi khi thanh toán. Vui lòng thử lại.');
  }
}

/* ==================== CHIP SELECTION (UI) ==================== */
function enableChipSelection(rowSelector) {
  const chipRow = document.querySelector(rowSelector);
  if (!chipRow) return;

  chipRow.addEventListener("click", (e) => {
    if (!e.target.classList.contains("chip")) return;
    chipRow.querySelectorAll(".chip").forEach(chip => chip.classList.remove("active"));
    e.target.classList.add("active");
  });
}
enableChipSelection("#dateChips");
enableChipSelection("#timeChips");
