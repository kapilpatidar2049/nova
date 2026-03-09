// Auto-generated from .env - do not edit
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');
firebase.initializeApp({
  apiKey: "AIzaSyDMcPbTMg3n9whHIRjw95FuHrCcvV_H9lw",
  authDomain: "beauticianapp-87b50.firebaseapp.com",
  projectId: "beauticianapp-87b50",
  storageBucket: "beauticianapp-87b50.firebasestorage.app",
  messagingSenderId: "1080967301820",
  appId: "1:1080967301820:web:dcf9a03483401606d91eb9"
});
firebase.messaging().onBackgroundMessage(function(payload) {
  var title = (payload.notification && payload.notification.title) || 'Nova ';
  var body = (payload.notification && payload.notification.body) || '';
  return self.registration.showNotification(title, { body: body, icon: '/placeholder.svg', data: payload.data || {} });
});
