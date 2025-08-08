const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

db.collection("families")
  .get()
  .then((snapshot) => {
    console.log(`Found ${snapshot.size} families:`);
    snapshot.docs.forEach((doc) => {
      console.log(" -", doc.id);
    });
  })
  .catch(console.error);
