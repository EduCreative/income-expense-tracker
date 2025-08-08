const admin = require("firebase-admin");
const fs = require("fs");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;

const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function exportUsers() {
  const usersSnapshot = await db.collection("users").get();

  const users = [];
  usersSnapshot.forEach((doc) => {
    users.push({ id: doc.id, ...doc.data() });
  });

  const csvWriter = createCsvWriter({
    path: "users.csv",
    header: Object.keys(users[0] || {}).map((key) => ({ id: key, title: key })),
  });

  await csvWriter.writeRecords(users);
  console.log("✅ users.csv exported successfully.");
}

exportUsers();
