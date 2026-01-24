import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

import { initializeApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: "AIzaSyBhzrfOvq5EkKC3fwCiRsB4azlgacZNLXE",
  authDomain: "bill-money-tracker.firebaseapp.com",
  projectId: "bill-money-tracker",
  storageBucket: "bill-money-tracker.firebasestorage.app",
  messagingSenderId: "995323580749",
  appId: "1:995323580749:web:4320988067c5481d1fe704"
};

initializeApp(firebaseConfig);

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
