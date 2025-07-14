window.addEventListener("scroll", function () {
  const header = document.querySelector("header");
  const currentScroll = window.pageYOffset;

  if (currentScroll > 40) {
    header.classList.add("scrolled-netflix");
  } else {
    header.classList.remove("scrolled-netflix");
  }
});

// Nhúng nội dung navbar.htm vào index
fetch('./navbar.htm')
  .then(res => res.text())
  .then(data => {
    document.getElementById('navbar').innerHTML = data;

    // Sau khi nhúng xong, gắn sự kiện cho nút
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
        window.location.href = "navbar.htm?mode=signup";
      });
    }
  });

