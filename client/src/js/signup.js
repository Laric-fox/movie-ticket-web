window.hideSignup = function () {
  document.getElementById("container").classList.remove("show-signup");
}

import { auth, db } from "./firebase-config.js";
import {createUserWithEmailAndPassword,signInWithEmailAndPassword,fetchSignInMethodsForEmail} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import {collection,addDoc} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
// === ĐĂNG KÝ ===
const inpUsername = document.querySelector("#username");
const inpEmailSignup = document.querySelector("#email_signup");
const inpPwdSignup = document.querySelector("#password_signup");
const inpConfirmPwd = document.querySelector("#confirm-password");
const registerForm = document.querySelector("#signup-side");

const handleRegister =async function (event) {
  event.preventDefault();

  const username = inpUsername.value;
  const email = inpEmailSignup.value;
  const password = inpPwdSignup.value;
  const confirmPassword = inpConfirmPwd.value;
  const role_id = 2;

  if (!username || !email || !password || !confirmPassword) {
    alert("Vui lòng nhập đầy đủ tất cả các trường.");
    return;
  }

  if (password !== confirmPassword) {
    alert("Mật khẩu và xác nhận mật khẩu không khớp.");
    return;
  }

  if (password.length < 6) {
    alert("Mật khẩu phải có ít nhất 6 ký tự.");
    return;
  }

  if (!/[A-Z]/.test(password)) {
    alert("Mật khẩu phải chứa ít nhất một chữ cái viết hoa (A-Z).");
    return;
  }

  if (!/[a-z]/.test(password)) {
    alert("Mật khẩu phải chứa ít nhất một chữ cái thường (a-z).");
    return;
  }

  if (!/\d/.test(password)) {
    alert("Mật khẩu phải chứa ít nhất một chữ số (0-9).");
    return;
  }

  try {
    // Kiểm tra email đã tồn tại chưa
    const methods = await fetchSignInMethodsForEmail(auth, email);
    if (methods.length > 0) {
      alert("Email này đã được đăng ký. Vui lòng dùng email khác.");
      return;
    }

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    const userData = {
      username,
      email,
      password,
      role_id,
      balance: 0,
    };

    await addDoc(collection(db, "users"), userData);

    alert("Đăng ký thành công! Mời bạn đăng nhập.");
    hideSignup(); // Chuyển form chứ không chuyển trang
  } catch (e) {
    console.error("Lỗi:", e.message);
    alert("Đã xảy ra lỗi. Vui lòng thử lại sau.");
  }
};

registerForm.addEventListener("submit", handleRegister);

// === ĐĂNG NHẬP ===
const inpEmailLogin = document.querySelector("#email");
const inpPwdLogin = document.querySelector("#password");
const loginForm = document.querySelector("#login-side");

const handleLogin =async function  (event) {
  event.preventDefault();

  const email = inpEmailLogin.value;
  const password = inpPwdLogin.value;

  if (!email || !password) {
    alert("Vui lòng nhập đầy đủ email và mật khẩu.");
    return;
  }

  signInWithEmailAndPassword(auth,email,password)
  .then((userCredential)=>{
    const user = userCredential.user;
    const userSession = {
        user: {
            email: user.email
        },
        expiry : new Date().getTime() + 2*60*60*1000 
    };

    localStorage.setItem('user_session',JSON.stringify(userSession));
    alert("Đăng nhập thành công!");
    window.location.href = 'index.htm';
  })
    .catch(e => {
    if (e.code === "auth/user-not-found") {
      alert("Không tìm thấy tài khoản với email này.");
    } else if (e.code === "auth/wrong-password") {
      alert("Mật khẩu không đúng.");
    } else {
      alert("Lỗi không xác định: " + e.message);
      console.log("Chi tiết lỗi:", e.code);
    }
    });
};

loginForm.addEventListener("submit", handleLogin);