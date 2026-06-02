#!/usr/bin/env ts-node

/**
 * Diagnostic Script: Check Homework Answers in Firebase
 * 
 * This script queries the Firebase database to verify:
 * 1. If homework reports exist
 * 2. If submittedAnswers are being saved
 * 3. The structure of saved answers
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDVI1lcD5eW8kvLHVvN8TG1w7gWtgKx-5M",
  authDomain: "rv2class-5b6a1.firebaseapp.com",
  projectId: "rv2class-5b6a1",
  storageBucket: "rv2class-5b6a1.firebasestorage.app",
  messagingSenderId: "692746717893",
  appId: "1:692746717893:web:f7a6a31bf1f1cd5c78b3eb",
  measurementId: "G-PXBEJ42YCN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

interface HomeworkReport {
  id: string;
  studentId: string;
  homeworkId: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  submittedAnswers?: Array<{ questionId: string; answer: string }>;
  completedAt: any;
  completedVia?: string;
}

async function checkHomeworkAnswers() {
  console.log('🔍 Querying Firebase for Homework Reports...\n');
  console.log('=' .repeat(80));

  try {
    // Query the most recent homework reports
    const reportsRef = collection(db, 'telegramHomeworkReports');
    const q = query(reportsRef, orderBy('completedAt', 'desc'), limit(5));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.log('❌ No homework reports found in the database!');
      console.log('   This means no homework has been submitted yet.');
      return;
    }

    console.log(`✅ Found ${snapshot.size} recent homework reports\n`);

    snapshot.docs.forEach((doc, index) => {
      const data = doc.data() as HomeworkReport;
      
      console.log(`\n📋 Report #${index + 1} (ID: ${doc.id})`);
      console.log('-'.repeat(80));
      console.log(`   Student ID:      ${data.studentId}`);
      console.log(`   Homework ID:     ${data.homeworkId}`);
      console.log(`   Score:           ${data.score}%`);
      console.log(`   Correct:         ${data.correctAnswers}/${data.totalQuestions}`);
      console.log(`   Completed Via:   ${data.completedVia || 'unknown'}`);
      console.log(`   Completed At:    ${data.completedAt?.toDate?.() || 'N/A'}`);
      
      // Check if submittedAnswers exist
      if (!data.submittedAnswers) {
        console.log(`   ⚠️  WARNING: submittedAnswers field is MISSING!`);
      } else if (!Array.isArray(data.submittedAnswers)) {
        console.log(`   ❌ ERROR: submittedAnswers is not an array!`);
        console.log(`   Type: ${typeof data.submittedAnswers}`);
        console.log(`   Value:`, data.submittedAnswers);
      } else if (data.submittedAnswers.length === 0) {
        console.log(`   ⚠️  WARNING: submittedAnswers array is EMPTY!`);
      } else {
        console.log(`   ✅ Submitted Answers: ${data.submittedAnswers.length} answers found`);
        
        // Show first 3 answers as examples
        console.log(`\n   📝 Sample Answers (first 3):`);
        data.submittedAnswers.slice(0, 3).forEach((answer, idx) => {
          console.log(`      ${idx + 1}. Question ID: ${answer.questionId}`);
          console.log(`         Answer: "${answer.answer}"`);
          console.log(`         Answer Type: ${typeof answer.answer}`);
          console.log(`         Answer Length: ${String(answer.answer).length} chars`);
        });
        
        if (data.submittedAnswers.length > 3) {
          console.log(`      ... and ${data.submittedAnswers.length - 3} more answers`);
        }
      }
    });

    console.log('\n' + '='.repeat(80));
    console.log('✅ Database query complete!\n');
    
    // Summary
    let reportsWithAnswers = 0;
    let reportsWithoutAnswers = 0;
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.submittedAnswers && Array.isArray(data.submittedAnswers) && data.submittedAnswers.length > 0) {
        reportsWithAnswers++;
      } else {
        reportsWithoutAnswers++;
      }
    });
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.submittedAnswers && Array.isArray(data.submittedAnswers) && data.submittedAnswers.length > 0) {
        reportsWithAnswers++;
      } else {
        reportsWithoutAnswers++;
      }
    });
    
    console.log('📊 Summary:');
    console.log(`   Total reports checked:     ${snapshot.size}`);
    console.log(`   Reports WITH answers:      ${reportsWithAnswers} ✅`);
    console.log(`   Reports WITHOUT answers:   ${reportsWithoutAnswers} ${reportsWithoutAnswers > 0 ? '⚠️' : ''}`);
    
    if (reportsWithoutAnswers > 0) {
      console.log('\n⚠️  Some reports are missing answers!');
      console.log('   Possible causes:');
      console.log('   1. Old reports from before the fix');
      console.log('   2. Submission error during save');
      console.log('   3. Database write failure');
      console.log('\n   Solution: Submit new homework to test if answers are now being saved.');
    }

  } catch (error) {
    console.error('❌ Error querying database:', error);
    if (error instanceof Error) {
      console.error('   Error message:', error.message);
      console.error('   Error stack:', error.stack);
    }
  }
}

// Run the check
checkHomeworkAnswers()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
