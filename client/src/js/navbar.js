// 1. Tải navbar
fetch("navbar.htm")
  .then(res => res.text())
  .then(data => {
    document.getElementById("navbar").innerHTML = data;

    // 2. Sau khi navbar đã được thêm vào trang, gắn hiệu ứng scroll
    let lastScroll = 0;
    window.addEventListener("scroll", function () {
      const header = document.querySelector("header");
      const currentScroll = window.pageYOffset;

      if (currentScroll > 40) {
        header.classList.add("scrolled-netflix");
      } else {
        header.classList.remove("scrolled-netflix");
      }

      lastScroll = currentScroll;
    });
  });