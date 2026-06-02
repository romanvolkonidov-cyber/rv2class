import { NextResponse } from 'next/server';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';

/**
 * API Route: Check Homework Answers in Database
 * 
 * GET /api/debug/check-homework-answers
 * 
 * This endpoint queries Firebase to verify if homework answers are being saved correctly
 */
export async function GET() {
  try {
    console.log('🔍 Querying Firebase for Homework Reports...');

    // Query the most recent homework reports
    const reportsRef = collection(db, 'telegramHomeworkReports');
    const q = query(reportsRef, orderBy('completedAt', 'desc'), limit(10));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return NextResponse.json({
        success: false,
        message: 'No homework reports found in the database',
        totalReports: 0,
        reports: []
      });
    }

    const reports = snapshot.docs.map(doc => {
      const data = doc.data();
      
      // Check if submittedAnswers exist and analyze them
      const hasAnswers = Boolean(data.submittedAnswers);
      const isArray = Array.isArray(data.submittedAnswers);
      const answersCount = isArray ? data.submittedAnswers.length : 0;
      
      // Get sample answers (first 3)
      const sampleAnswers = isArray && data.submittedAnswers.length > 0
        ? data.submittedAnswers.slice(0, 3).map((ans: any) => ({
            questionId: ans.questionId,
            answer: ans.answer,
            answerType: typeof ans.answer,
            answerLength: String(ans.answer).length
          }))
        : [];

      return {
        id: doc.id,
        studentId: data.studentId,
        homeworkId: data.homeworkId,
        score: data.score,
        correctAnswers: data.correctAnswers,
        totalQuestions: data.totalQuestions,
        completedVia: data.completedVia || 'unknown',
        completedAt: data.completedAt?.toDate?.()?.toISOString() || null,
        
        // Answer analysis
        hasAnswers,
        isArray,
        answersCount,
        sampleAnswers,
        
        // Include full answers for debugging (only first 5 reports)
        fullAnswers: snapshot.docs.indexOf(doc) < 5 ? data.submittedAnswers : undefined
      };
    });

    // Calculate summary statistics
    const reportsWithAnswers = reports.filter(r => r.hasAnswers && r.isArray && r.answersCount > 0).length;
    const reportsWithoutAnswers = reports.length - reportsWithAnswers;

    return NextResponse.json({
      success: true,
      message: 'Database query successful',
      totalReports: snapshot.size,
      reportsWithAnswers,
      reportsWithoutAnswers,
      reports,
      summary: {
        allReportsHaveAnswers: reportsWithoutAnswers === 0,
        percentageWithAnswers: ((reportsWithAnswers / snapshot.size) * 100).toFixed(1) + '%',
        note: reportsWithoutAnswers > 0 
          ? 'Some reports are missing answers - possibly old reports from before the fix'
          : 'All reports have answers saved correctly!'
      }
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Error querying database:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Error querying database',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
