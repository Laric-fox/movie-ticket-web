  const tabButtons = document.querySelectorAll(".tab-button");
  const contents = {
    now: document.getElementById("showing-now"),
    upcoming: document.getElementById("showing-upcoming")
  };

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      // Không làm gì nếu đã active
      if (button.classList.contains("active")) return;

      // Lấy tab mục tiêu
      const target = button.textContent.includes("chiếu") ? "now" : "upcoming";

      // Chuyển trạng thái tab button
      tabButtons.forEach(btn => btn.classList.remove("active"));
      button.classList.add("active");

      // Chuyển nội dung hiển thị
      Object.keys(contents).forEach(key => {
        if (key === target) {
          contents[key].classList.add("active");
        } else {
          contents[key].classList.remove("active");
        }
      });
    });
  });
