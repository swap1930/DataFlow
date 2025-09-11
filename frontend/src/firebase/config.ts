// Firebase Configuration
// तुझं Firebase project चे details येथे टाक

export const firebaseConfig = {
  apiKey: "AIzaSyAZH9RshMe4XVXiTXZWtoOFQQm9tBzXLFs",
  authDomain: window.location.hostname.includes("netlify.app")
    ? "excelprocess.netlify.app"
    : "dataflow-bc2c8.firebaseapp.com",
  projectId: "dataflow-bc2c8",
  storageBucket: "dataflow-bc2c8.appspot.com",
    messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef123456"
};

// 🚨 IMPORTANT: तू हे values replace करल्याशिवाय authentication work होणार नाही!

// Instructions to get your Firebase config:
// 1. Go to https://console.firebase.google.com/
// 2. Select your project (dataflow-bc2c8)
// 3. Click on the gear icon (⚙️) next to "Project Overview"
// 4. Select "Project settings"
// 5. Scroll down to "Your apps" section
// 6. If you don't have a web app, click "Add app" and choose web
// 7. Copy the config values from the provided code snippet
// 8. Replace the placeholder values above with your actual values

// Example of what your config should look like:
/*
export const firebaseConfig = {
  apiKey: "AIzaSyC...",
  authDomain: "dataflow-bc2c8.firebaseapp.com",
  projectId: "dataflow-bc2c8",
  storageBucket: "dataflow-bc2c8.appspot.com",
  messagingSenderId: "123456789", // ← तुझं actual value
  appId: "1:123456789:web:abcdef123456" // ← तुझं actual value
};
*/
