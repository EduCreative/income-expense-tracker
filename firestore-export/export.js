// export.js
const admin = require("firebase-admin");
const fs = require("fs");
const { Parser } = require("json2csv");

const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function exportCategories() {
  const familiesSnapshot = await db.collection("families").get();
  const allData = [];

  for (const familyDoc of familiesSnapshot.docs) {
    const familyID = familyDoc.id;

    // Try all 3 collection names
    const subcollections = ["Categories", "incomeCategories", "expenseCategories"];
    for (const sub of subcollections) {
      const categoriesRef = db.collection("families").doc(familyID).collection(sub);
      const categoriesSnapshot = await categoriesRef.get();

      categoriesSnapshot.forEach(doc => {
        const data = doc.data();
        allData.push({
          familyID,
          subcollection: sub,
          id: doc.id,
          name: data.name || "",
          emoji: data.emoji || "",
          type: data.type || "",
          createdBy: data.createdBy || "",
        });
      });
    }
  }

  if (allData.length === 0) {
    console.log("No data found.");
    return;
  }

  const fields = ["familyID", "subcollection", "id", "name", "emoji", "type", "createdBy"];
  const parser = new Parser({ fields });
  const csv = parser.parse(allData);

  fs.writeFileSync("firebase_categories.csv", csv);
  console.log("✅ Export complete. File saved as firebase_categories.csv");
}

exportCategories().catch(console.error);
