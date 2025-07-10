  const video = document.getElementById("myVideo");

  // Khi video đã tải metadata xong, thì yêu cầu fullscreen
  video.addEventListener('loadedmetadata', () => {
    // Tự động play (nếu autoplay bị chặn)
    video.play();

    // Yêu cầu toàn màn hình (nếu được phép)
    if (video.requestFullscreen) {
      video.requestFullscreen();
    } else if (video.webkitRequestFullscreen) { // Safari
      video.webkitRequestFullscreen();
    } else if (video.msRequestFullscreen) { // IE11
      video.msRequestFullscreen();
    }
  });

