#!/usr/bin/env node

/**
 * Production Database Query Script
 * 
 * This script queries the PRODUCTION Firebase database to check homework answers
 * Run with: node scripts/query-production-db.mjs
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';

// Production Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyApqg1eUjbt0ZBzn3JNEPtfLz6gI4314xQ",
  authDomain: "tracking-budget-app.firebaseapp.com",
  databaseURL: "https://tracking-budget-app-default-rtdb.firebaseio.com",
  projectId: "tracking-budget-app",
  storageBucket: "tracking-budget-app.appspot.com",
  messagingSenderId: "912992088190",
  appId: "1:912992088190:web:926c8826b3bc39e2eb282f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log('🔍 Querying PRODUCTION Firebase Database...');
console.log('📊 Project:', firebaseConfig.projectId);
console.log('='.repeat(80));
console.log('');

async function checkHomeworkReports() {
  try {
    // Query homework reports
    const reportsRef = collection(db, 'telegramHomeworkReports');
    const q = query(reportsRef, orderBy('completedAt', 'desc'), limit(10));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.log('❌ No homework reports found in the database!');
      console.log('   Collection: telegramHomeworkReports');
      console.log('   This means no homework has been submitted yet.');
      return;
    }

    console.log(`✅ Found ${snapshot.size} homework reports\n`);
    
    let reportsWithAnswers = 0;
    let reportsWithoutAnswers = 0;
    let totalAnswersFound = 0;

    snapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      
      console.log(`\n📋 Report #${index + 1}`);
      console.log('-'.repeat(80));
      console.log(`   ID:              ${doc.id}`);
      console.log(`   Student ID:      ${data.studentId || 'N/A'}`);
      console.log(`   Homework ID:     ${data.homeworkId || 'N/A'}`);
      console.log(`   Score:           ${data.score}%`);
      console.log(`   Correct:         ${data.correctAnswers}/${data.totalQuestions}`);
      console.log(`   Completed Via:   ${data.completedVia || 'unknown'}`);
      
      // Check completedAt
      let completedAtStr = 'N/A';
      if (data.completedAt) {
        if (data.completedAt.toDate) {
          completedAtStr = data.completedAt.toDate().toLocaleString();
        } else if (data.completedAt.seconds) {
          completedAtStr = new Date(data.completedAt.seconds * 1000).toLocaleString();
        }
      }
      console.log(`   Completed At:    ${completedAtStr}`);
      
      // Check submittedAnswers
      console.log('');
      if (!data.submittedAnswers) {
        console.log('   ❌ submittedAnswers: FIELD MISSING');
        reportsWithoutAnswers++;
      } else if (!Array.isArray(data.submittedAnswers)) {
        console.log(`   ❌ submittedAnswers: NOT AN ARRAY (type: ${typeof data.submittedAnswers})`);
        reportsWithoutAnswers++;
      } else if (data.submittedAnswers.length === 0) {
        console.log('   ⚠️  submittedAnswers: EMPTY ARRAY');
        reportsWithoutAnswers++;
      } else {
        console.log(`   ✅ submittedAnswers: ${data.submittedAnswers.length} answers`);
        reportsWithAnswers++;
        totalAnswersFound += data.submittedAnswers.length;
        
        // Show first 3 answers
        console.log('');
        console.log('   📝 Sample Answers (first 3):');
        data.submittedAnswers.slice(0, 3).forEach((answer, idx) => {
          console.log(`      ${idx + 1}. Question: ${answer.questionId}`);
          console.log(`         Answer: "${answer.answer}"`);
          console.log(`         Type: ${typeof answer.answer} (${String(answer.answer).length} chars)`);
        });
        
        if (data.submittedAnswers.length > 3) {
          console.log(`      ... and ${data.submittedAnswers.length - 3} more answers`);
        }
      }
    });

    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('📊 SUMMARY');
    console.log('='.repeat(80));
    console.log(`   Total Reports Found:       ${snapshot.size}`);
    console.log(`   Reports WITH Answers:      ${reportsWithAnswers} ✅`);
    console.log(`   Reports WITHOUT Answers:   ${reportsWithoutAnswers} ${reportsWithoutAnswers > 0 ? '⚠️' : ''}`);
    console.log(`   Total Answers Found:       ${totalAnswersFound}`);
    console.log(`   Average Answers/Report:    ${snapshot.size > 0 ? (totalAnswersFound / snapshot.size).toFixed(1) : 0}`);
    
    console.log('');
    if (reportsWithoutAnswers > 0) {
      console.log('⚠️  ISSUE DETECTED: Some reports are missing answers!');
      console.log('');
      console.log('   Possible causes:');
      console.log('   1. Old reports from before the submission fix');
      console.log('   2. Database write error during submission');
      console.log('   3. Submission function not saving answers properly');
      console.log('');
      console.log('   ✅ RECOMMENDED ACTION:');
      console.log('   Submit NEW homework after the code fix and check again.');
    } else if (reportsWithAnswers > 0) {
      console.log('🎉 SUCCESS: All reports have answers saved correctly!');
      console.log('');
      console.log('   The database is working properly.');
      console.log('   If answers still don\'t show in UI, the issue is display logic only.');
    }

  } catch (error) {
    console.error('\n❌ ERROR querying database:');
    console.error('   ', error.message);
    if (error.code) {
      console.error('   Error code:', error.code);
    }
    console.error('');
    console.error('   This could mean:');
    console.error('   - Firebase connection issue');
    console.error('   - Incorrect collection name');
    console.error('   - Permission denied (should work with client SDK)');
  }
}

// Also check homework assignments
async function checkHomeworkAssignments() {
  try {
    console.log('\n\n🔍 Checking Homework Assignments...');
    console.log('='.repeat(80));
    
    const assignmentsRef = collection(db, 'telegramAssignments');
    const q = query(assignmentsRef, limit(5));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      console.log('❌ No homework assignments found');
      return;
    }
    
    console.log(`✅ Found ${snapshot.size} homework assignments (showing first 5)\n`);
    
    snapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`   ${index + 1}. ID: ${doc.id}`);
      console.log(`      Student: ${data.studentId || 'N/A'}`);
      console.log(`      Status: ${data.status || 'N/A'}`);
      console.log(`      Topic: ${data.topicName || data.topicId || 'N/A'}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error checking assignments:', error.message);
  }
}

// Run checks
async function main() {
  try {
    await checkHomeworkReports();
    await checkHomeworkAssignments();
    
    console.log('\n✅ Script completed successfully\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  }
}

main();
