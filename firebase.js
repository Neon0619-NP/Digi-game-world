// FIREBASE IMPORTS
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getAuth
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import {
    getFirestore
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// FIREBASE CONFIG
const firebaseConfig = {
    apiKey: "AIzaSyDsYZuMseyhmFdi_tQofOaSwW_jZk3kf9M",
    authDomain: "digi-game-world-e3e1a.firebaseapp.com",
    projectId: "digi-game-world-e3e1a",
    storageBucket: "digi-game-world-e3e1a.firebasestorage.app",
    messagingSenderId: "955241419078",
    appId: "1:955241419078:web:779fcb3253bbdb7c999547"
};

// INITIALIZE FIREBASE
const app = initializeApp(firebaseConfig);

// SERVICES
const auth = getAuth(app);
const db = getFirestore(app);

// EXPORTS
export { auth, db };