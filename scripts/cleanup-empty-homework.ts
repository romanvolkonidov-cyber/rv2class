/**
 * Cleanup Script: Delete homework assignments with no questions
 * 
 * This script:
 * 1. Fetches all homework assignments from telegramAssignments
 * 2. For each assignment, checks if it has any questions
 * 3. Deletes assignments that have zero questions
 * 
 * Run with: npx tsx scripts/cleanup-empty-homework.ts
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, deleteDoc, query, where } from 'firebase/firestore';

// Firebase config (same as your app)
const firebaseConfig = {
  apiKey: "AIzaSyAWxyO_aBCXqj0bYBnKQJeYO_LBlC1Ag-Q",
  authDomain: "tracking-budget-app.firebaseapp.com",
  projectId: "tracking-budget-app",
  storageBucket: "tracking-budget-app.firebasestorage.app",
  messagingSenderId: "536906158371",
  appId: "1:536906158371:web:60d1a4277ec31be1f69322"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

interface Assignment {
  id: string;
  topicId?: string;
  topicIds?: string[];
  studentId: string;
  courseName?: string;
  chapterName?: string;
  topicName?: string;
}

async function cleanupEmptyHomework() {
  console.log('🔍 Starting cleanup of homework assignments with no questions...\n');

  try {
    // Fetch all assignments
    const assignmentsRef = collection(db, 'telegramAssignments');
    const assignmentsSnap = await getDocs(assignmentsRef);
    
    console.log(`📊 Found ${assignmentsSnap.size} total homework assignments\n`);
    
    const emptyAssignments: Assignment[] = [];
    let checkedCount = 0;

    // Check each assignment for questions
    for (const assignmentDoc of assignmentsSnap.docs) {
      checkedCount++;
      const assignment = {
        id: assignmentDoc.id,
        ...assignmentDoc.data()
      } as Assignment;

      // Get topic IDs
      const topicIds = assignment.topicIds || (assignment.topicId ? [assignment.topicId] : []);
      
      if (topicIds.length === 0) {
        console.log(`⚠️  [${checkedCount}/${assignmentsSnap.size}] Assignment ${assignment.id} has NO topic IDs`);
        emptyAssignments.push(assignment);
        continue;
      }

      // Check for questions
      let hasQuestions = false;
      for (const topicId of topicIds) {
        const questionsRef = collection(db, 'telegramQuestions');
        const q = query(questionsRef, where('topicId', '==', topicId));
        const questionsSnap = await getDocs(q);
        
        if (questionsSnap.size > 0) {
          hasQuestions = true;
          break;
        }
      }

      if (!hasQuestions) {
        console.log(`❌ [${checkedCount}/${assignmentsSnap.size}] Assignment ${assignment.id} has NO questions (Topics: ${topicIds.join(', ')})`);
        emptyAssignments.push(assignment);
      } else {
        console.log(`✅ [${checkedCount}/${assignmentsSnap.size}] Assignment ${assignment.id} has questions`);
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log(`\n📋 Summary:`);
    console.log(`   Total assignments checked: ${assignmentsSnap.size}`);
    console.log(`   Assignments WITH questions: ${assignmentsSnap.size - emptyAssignments.length}`);
    console.log(`   Assignments WITHOUT questions: ${emptyAssignments.length}\n`);

    if (emptyAssignments.length === 0) {
      console.log('✨ No empty homework assignments found! Database is clean.\n');
      return;
    }

    // Show details of what will be deleted
    console.log('📝 Assignments to be deleted:\n');
    emptyAssignments.forEach((assignment, index) => {
      console.log(`   ${index + 1}. ID: ${assignment.id}`);
      console.log(`      Student: ${assignment.studentId}`);
      console.log(`      Topic: ${assignment.topicName || 'N/A'}`);
      console.log(`      Course: ${assignment.courseName || 'N/A'}`);
      console.log(`      Chapter: ${assignment.chapterName || 'N/A'}`);
      console.log('');
    });

    // Confirm deletion
    console.log('⚠️  WARNING: This will permanently delete these assignments!');
    console.log('   Press Ctrl+C to cancel, or wait 5 seconds to proceed...\n');
    
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Delete empty assignments
    console.log('🗑️  Deleting assignments...\n');
    let deletedCount = 0;

    for (const assignment of emptyAssignments) {
      try {
        await deleteDoc(doc(db, 'telegramAssignments', assignment.id));
        deletedCount++;
        console.log(`✅ Deleted assignment ${assignment.id} (${deletedCount}/${emptyAssignments.length})`);
      } catch (error) {
        console.error(`❌ Failed to delete assignment ${assignment.id}:`, error);
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log(`\n🎉 Cleanup complete!`);
    console.log(`   Successfully deleted: ${deletedCount} assignments`);
    console.log(`   Failed: ${emptyAssignments.length - deletedCount} assignments\n`);

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
}

// Run the cleanup
cleanupEmptyHomework()
  .then(() => {
    console.log('✅ Script finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
