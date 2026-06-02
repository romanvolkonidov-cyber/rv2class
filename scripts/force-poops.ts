import { cert, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
// @ts-ignore
import * as key from '../tracking-budget-app-firebase-adminsdk-mnfty-9b3a7ad2b9.json';

const app = initializeApp({
  // @ts-ignore
  credential: cert(key.default || key)
});
const db = getFirestore(app);

const PET_CARE_CYCLE_MS = 3 * 24 * 60 * 60 * 1000;

async function forcePoops() {
  console.log("🐾 Scanning for pets that haven't pooped yet (Admin SDK)...");
  
  try {
    const profilesRef = db.collection('studentGameProfiles');
    const snap = await profilesRef.get();
    
    let checkedPets = 0;
    let updatedCount = 0;
    
    for (const profileDoc of snap.docs) {
      const data = profileDoc.data();
      
      if (!data.petId) continue;
      checkedPets++;
      
      let needsPoopUpdate = false;
      
      if (!data.petLastCleaned) {
        needsPoopUpdate = true;
      } else {
        const elapsed = Date.now() - new Date(data.petLastCleaned).getTime();
        const currentPoops = Math.floor(elapsed / PET_CARE_CYCLE_MS);
        
        if (currentPoops === 0) {
          needsPoopUpdate = true;
        }
      }
      
      if (needsPoopUpdate) {
        // Set timestamp to ~3 days ago to trigger exactly 1 poop
        const threeDaysAgo = new Date(Date.now() - PET_CARE_CYCLE_MS - 2000).toISOString();
        
        await profileDoc.ref.update({
          petLastCleaned: threeDaysAgo
        });
        
        console.log(`💩 Dropped 1 poop for student ${data.studentId || profileDoc.id} (Pet: ${data.petId})`);
        updatedCount++;
      }
    }
    
    console.log(`\\n✅ Scan Complete!`);
    console.log(`   Pets checked: ${checkedPets}`);
    console.log(`   Pets updated: ${updatedCount}\\n`);
    
  } catch (error) {
    console.error('❌ Error updating profiles:', error);
    process.exit(1);
  }
}

forcePoops()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
