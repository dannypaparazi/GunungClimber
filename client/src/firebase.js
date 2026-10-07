import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyCQdtxj0MIYj6vB_xgAiAJPVApTG1ydRps',
  authDomain: 'gunungclimber.firebaseapp.com',
  projectId: 'gunungclimber',
  storageBucket: 'gunungclimber.firebasestorage.app',
  messagingSenderId: '1056782323610',
  appId: '1:1056782323610:web:55c79be3158db3ef4df423',
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
