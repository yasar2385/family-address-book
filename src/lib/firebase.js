// Import the functions you need from the SDKs you need
import {
    initializeApp
} from "firebase/app";
import {
    getAnalytics
} from "firebase/analytics";
import {
    getAuth
} from 'firebase/auth';
import {
    getStorage
} from 'firebase/storage';
import {
    getFirestore
} from 'firebase/firestore';

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyA12-mZ38xZg6vKjz7G2N98gAZVdiIuZy8",
    authDomain: "family-address-book.firebaseapp.com",
    projectId: "family-address-book",
    storageBucket: "family-address-book.firebasestorage.app",
    messagingSenderId: "38819936319",
    appId: "1:38819936319:web:32b409f499645e7261608a",
    measurementId: "G-2LXHJHPBNE"
};

// Initialize Firebase
let app;
try {
    app = initializeApp(firebaseConfig);
    console.log("Firebase initialized successfully.");
} catch (error) {
    console.error("Firebase initialization error:", error);
}
// const analytics = getAnalytics(app);

const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export {
    app,
    db,
    auth,
    storage
};