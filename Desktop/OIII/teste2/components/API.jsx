// Import the functions you need from the SDKs you need
import { firebase,initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import React from "react";
// TODO: Add SDKs for Firebase products that you want to use

// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC6WSG3Pl1i01TfmWmQlkWzF8D3DELJlz0",
  authDomain: "zorby-eaf6b.firebaseapp.com",
  projectId: "zorby-eaf6b",
  storageBucket: "zorby-eaf6b.appspot.com",
  messagingSenderId: "55841006486",
  appId: "1:55841006486:web:8f934aa280fcee0a1bf3b7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const databaseApp = getFirestore(app);
export function login(email, password) {
  try {
    const userCredential =  firebase.auth().signInWithEmailAndPassword(email, password);
    const user = userCredential.user;
    // User is signed in
    return user;
  } catch (error) {
    // Handle sign-in error
    throw error;
  }
}


export default app;