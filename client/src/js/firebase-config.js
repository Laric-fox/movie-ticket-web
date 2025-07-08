  import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-analytics.js";
  import { getAuth } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
  import { getFirestore } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
  
  const firebaseConfig = {
    apiKey: "AIzaSyCzvKNEClYiOt6R9x9XfoEHkP5gtBSp35M",
    authDomain: "cinefox-7418a.firebaseapp.com",
    projectId: "cinefox-7418a",
    storageBucket: "cinefox-7418a.firebasestorage.app",
    messagingSenderId: "1072459546544",
    appId: "1:1072459546544:web:4683161a0733bba5952075",
    measurementId: "G-9F6G3ZS5VP"
  };

  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
  const auth = getAuth(app);
  const db = getFirestore(app);

  export {auth, db}