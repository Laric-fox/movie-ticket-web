import { db } from "./firebase-config.js";
import { collection, query, where, getDocs, updateDoc } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

// Lấy thông tin user đang đăng nhập
const userSession = JSON.parse(localStorage.getItem("user_session"));
const email = userSession?.user?.email;

const inpEmail = document.getElementById("email");
const inpUsername = document.getElementById("username");
const inpPassword = document.getElementById("password");
const inpBalance = document.getElementById("balance");
const inpRole = document.getElementById("role_id");
const btnSave = document.getElementById("btnSaveChanges");
const btnChangePwd = document.getElementById("btnChangePwd");

let userDocRef = null; // Lưu docRef để cập nhật sau

// Hiển thị thông tin người dùng
async function loadUserProfile() {
  if (!email) {
    alert("Không xác định được người dùng. Vui lòng đăng nhập lại.");
    return;
  }

  const q = query(collection(db, "users"), where("email", "==", email));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    alert("Không tìm thấy người dùng.");
    return;
  }

  const doc = querySnapshot.docs[0];
  userDocRef = doc.ref;
  const data = doc.data();

  inpEmail.value = data.email || "";
  inpUsername.value = data.username || "";
  inpPassword.value = data.password ? "********" : "";
  inpBalance.value = data.balance ?? 0;
  inpRole.value = data.role_id == 1 ? "Admin" : "Người dùng";
}

loadUserProfile();

// Lưu thay đổi
btnSave.addEventListener("click", async () => {
  if (!userDocRef) return alert("Không xác định được tài khoản.");

  const newUsername = inpUsername.value.trim();
  const newBalance = Number(inpBalance.value);

  try {
    await updateDoc(userDocRef, {
      username: newUsername,
      balance: newBalance
    });
    alert("Cập nhật thông tin thành công!");
  } catch (err) {
    console.error(err);
    alert("Lỗi khi lưu thay đổi.");
  }
});

// Đổi mật khẩu
btnChangePwd.addEventListener("click", () => {
  alert("Chức năng đổi mật khẩu đang được phát triển 😄");
});
