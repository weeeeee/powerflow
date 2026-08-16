import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAkUjpBHzVgb2UyCiIeaAGIj_A-vBz3YH0",
  authDomain: "powerflowadhd.firebaseapp.com",
  projectId: "powerflowadhd",
  storageBucket: "powerflowadhd.firebasestorage.app",
  messagingSenderId: "173956659319",
  appId: "1:173956659319:web:3d07d6df6af776aedc2e72"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function main() {
  const docRef = doc(db, "users", "defaultFamily");
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    console.log("TASKS:");
    console.dir(data.tasks, { depth: null });
    console.log("SIDE QUESTS:");
    console.dir(data.sideQuests, { depth: null });
  } else {
    console.log("No such document for defaultFamily!");
  }
  process.exit(0);
}
main();
