const admin = require("firebase-admin");
const fs = require("fs");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;

const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function exportAllTransactions() {
  console.log("🔄 Fetching families...");

  const familiesSnapshot = await db.collection("families").get();
  const families = familiesSnapshot.docs;

  console.log(`✅ Found ${families.length} families`);

  for (const doc of families) {
    const familyID = doc.id;
    console.log(`\n📂 Processing family: ${familyID}`);

    const transactionsRef = db
      .collection("families")
      .doc(familyID)
      .collection("transactions");
    const transactionsSnap = await transactionsRef.get();

    if (transactionsSnap.empty) {
      console.log("  ⚠️ No transactions found.");
      continue;
    }

    const records = transactionsSnap.docs.map((txDoc) => {
      const data = txDoc.data();
      return {
        id: txDoc.id,
        familyID,
        ...data,
      };
    });

    const csvWriter = createCsvWriter({
      path: `transactions_${familyID}.csv`,
      header: Object.keys(records[0]).map((key) => ({ id: key, title: key })),
    });

    await csvWriter.writeRecords(records);
    console.log(`  ✅ Exported ${records.length} transactions.`);
  }

  console.log("\n🎉 Export complete.");
}

exportAllTransactions();
