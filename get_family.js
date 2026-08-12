import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";

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
    // find "Pass GED" in tasks, sideQuests, or storeItems
    let found = false;
    
    ['tasks', 'sideQuests', 'storeItems'].forEach(key => {
        if (data[key]) {
            data[key].forEach(item => {
                if (item.title && item.title.toLowerCase().includes('pass ged')) {
                    console.log(`Found in ${key}:`, item);
                    found = true;
                    // update it
                    if (item.points === 7000) {
                        item.points = 8000;
                    } else if (item.basePoints === 7000) {
                        item.basePoints = 8000;
                    }
                }
            });
        }
    });

    if (found) {
        await updateDoc(docRef, {
            tasks: data.tasks,
            sideQuests: data.sideQuests,
            storeItems: data.storeItems
        });
        console.log("Updated in Firebase!");
    } else {
        console.log("Pass GED not found in Firebase database.");
    }
    
  } else {
    console.log("No such document!");
  }
  process.exit(0);
}
main();
