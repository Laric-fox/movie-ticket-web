const video = document.getElementById('myVideo');

async function initRandomVideo() {
  // 1. Load danh sách từ video.json
  const res = await fetch('./data/video.json');
  const videos = await res.json();

  // 2. Chọn ngẫu nhiên, này dùng hàm random nha em (không hiểu hỏi lại thầy)
  const idx = Math.floor(Math.random() * videos.length);
  const { src, poster, title } = videos[idx];

  // 3. Cập nhật thẻ <video> và overlay
  const sourceEl = video.querySelector('source');
  const imgOverlay = document.querySelector('.content-overlay img');
  const titleOverlay = document.querySelector('.content-overlay h1');

  sourceEl.src = src;
  video.load();
  video.play();

  imgOverlay.src = poster;
  imgOverlay.alt = title;
  titleOverlay.textContent = title;
}

document.addEventListener('DOMContentLoaded', initRandomVideo);


video.addEventListener("loadedmetadata", () => {
  if (video.requestFullscreen) {
    video.requestFullscreen;
  } else if (video.webkitRequestFullscreen) {
    video.webkitRequestFullscreen();
  } else if (video.msRequestFullscreen) {
    video.msRequestFullscreen();
  }
});

