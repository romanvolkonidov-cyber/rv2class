/**
 * Simple Database Query Script
 * 
 * This script directly queries Firebase to check homework answers
 * Run with: node --loader tsx scripts/simple-check-answers.ts
 */

import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { join } from 'path';

// Try to initialize Firebase Admin
let db: admin.firestore.Firestore;

try {
  // Check if already initialized
  if (admin.apps.length === 0) {
    // Try to find service account key
    try {
      const serviceAccount = JSON.parse(
        readFileSync(join(process.cwd(), 'serviceAccountKey.json'), 'utf8')
      );
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
    } catch {
      // If no service account, try default credentials
      admin.initializeApp({
        projectId: 'rv2class-5b6a1'
      });
    }
  }
  
  db = admin.firestore();
} catch (error) {
  console.error('❌ Failed to initialize Firebase Admin:', error);
  console.log('\n⚠️  This script requires Firebase Admin SDK credentials.');
  console.log('   Please either:');
  console.log('   1. Place serviceAccountKey.json in the project root, OR');
  console.log('   2. Start the dev server and use the API endpoint instead');
  console.log('\n   To use the API endpoint, run:');
  console.log('   npm run dev');
  console.log('   Then visit: http://localhost:3000/api/debug/check-homework-answers');
  process.exit(1);
}

interface HomeworkReport {
  studentId: string;
  homeworkId: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  submittedAnswers?: Array<{ questionId: string; answer: string }>;
  completedAt: admin.firestore.Timestamp;
  completedVia?: string;
}

async function checkHomeworkAnswers() {
  console.log('🔍 Querying Firebase for Homework Reports...\n');
  console.log('='.repeat(80));

  try {
    // Query the most recent homework reports
    const snapshot = await db
      .collection('telegramHomeworkReports')
      .orderBy('completedAt', 'desc')
      .limit(10)
      .get();

    if (snapshot.empty) {
      console.log('❌ No homework reports found in the database!');
      console.log('   This means no homework has been submitted yet.');
      return;
    }

    console.log(`✅ Found ${snapshot.size} recent homework reports\n`);

    let reportsWithAnswers = 0;
    let reportsWithoutAnswers = 0;

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
        console.log(`   ❌ WARNING: submittedAnswers field is MISSING!`);
        reportsWithoutAnswers++;
      } else if (!Array.isArray(data.submittedAnswers)) {
        console.log(`   ❌ ERROR: submittedAnswers is not an array!`);
        console.log(`   Type: ${typeof data.submittedAnswers}`);
        reportsWithoutAnswers++;
      } else if (data.submittedAnswers.length === 0) {
        console.log(`   ⚠️  WARNING: submittedAnswers array is EMPTY!`);
        reportsWithoutAnswers++;
      } else {
        console.log(`   ✅ Submitted Answers: ${data.submittedAnswers.length} answers found`);
        reportsWithAnswers++;
        
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
      console.log('\n   ✅ Solution: Submit NEW homework to verify answers are now being saved.');
    } else {
      console.log('\n🎉 All checked reports have answers saved correctly!');
    }

  } catch (error) {
    console.error('❌ Error querying database:', error);
    if (error instanceof Error) {
      console.error('   Error message:', error.message);
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
