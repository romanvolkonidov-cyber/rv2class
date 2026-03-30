import { initializeApp, getApps } from "firebase/app";
import { getAuth, onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { getFirestore, collection, getDocs, getDoc, query, where, addDoc, updateDoc, doc, serverTimestamp, deleteField, Timestamp } from "firebase/firestore";

// Helper to convert Firebase Timestamps to plain objects
const serializeTimestamp = (value: any): any => {
  if (value instanceof Timestamp) {
    return { seconds: value.seconds, nanoseconds: value.nanoseconds };
  }
  if (value && typeof value === 'object' && value.toDate && typeof value.toDate === 'function') {
    return { seconds: Math.floor(value.toDate().getTime() / 1000), nanoseconds: 0 };
  }
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, serializeTimestamp(v)])
    );
  }
  if (Array.isArray(value)) {
    return value.map(serializeTimestamp);
  }
  return value;
};

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
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
export const db = getFirestore(app);

// Ensure we have an auth user (anonymous is fine) before any Firestore calls
const authReady: Promise<void> = new Promise((resolve) => {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      try {
        await signInAnonymously(auth);
      } catch (err) {
        console.error("Anonymous auth failed:", err);
      }
    }
    resolve();
  });
});

export const ensureAuth = async () => {
  await authReady;
};

// Student interface
export interface Student {
  id: string;
  name: string;
  teacher?: string;
  subjects?: { English?: boolean; IT?: boolean };
  price?: number;
  currency?: string;
  tag?: "red" | "orange" | "yellow" | "green" | "blue" | "purple" | "pink" | "gray";
}

// Topic interface
export interface Topic {
  id: string;
  name: string;
  sentence?: string; // Base sentence for fill-in-blank questions
  text?: string; // Alternative field for topic content
  description?: string;
  courseId?: string;
  chapterId?: string;
  order?: number;
}

// Homework Assignment interface
export interface HomeworkAssignment {
  id: string;
  studentId: string;
  topicId: string;
  topicIds: string[];
  courseId: string;
  chapterId: string;
  assignedAt: any;
  status?: string;
  courseName?: string;
  chapterName?: string;
  topicName?: string;
  // Homework-level media (shown above all questions)
  homeworkMediaFiles?: Array<{
    filename: string;
    url: string;
    type: string;
  }>;
}

// Homework Report interface
export interface HomeworkReport {
  id: string;
  studentId: string;
  homeworkId: string;
  score?: number;
  completedAt?: any;
  submittedAnswers?: any;
  correctAnswers?: number;
  totalQuestions?: number;
  seenByTeacher?: boolean;
}

// Question interface
export interface Question {
  id: string;
  topicId: string;
  text: string; // For fill-in-blank: blank number ("1", "2", "3"); For others: full question text
  sentence?: string; // Base sentence from topic (injected client-side)
  question?: string; // Fallback
  options?: string[];
  correctAnswer: string | number; // Can be string or index number
  type?: string; // 'textAnswer', 'multipleChoice', 'fillInBlank', etc.
  mediaUrl?: string;
  mediaType?: string; // 'image', 'audio', 'video'
  mediaFiles?: Array<{
    filename: string;
    url: string;
    type: string;
  }>;
  audioUrl?: string;
  videoUrl?: string;
  imageUrl?: string;
  explanation?: string;
  order?: number;
  createdAt?: string;
}

// Fetch all students from Firestore
export const fetchStudents = async (): Promise<Student[]> => {
  try {
    await ensureAuth();
    const querySnapshot = await getDocs(collection(db, "students"));
    const students = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Student[];
    return students.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  } catch (error) {
    console.error("Error fetching students:", error);
    return [];
  }
};

// Update student tag
export const updateStudentTag = async (studentId: string, tag: string | null): Promise<boolean> => {
  try {
    await ensureAuth();
    const studentRef = doc(db, "students", studentId);
    if (tag === null) {
      await updateDoc(studentRef, {
        tag: deleteField()
      });
    } else {
      await updateDoc(studentRef, {
        tag: tag
      });
    }
    return true;
  } catch (error) {
    console.error("Error updating student tag:", error);
    return false;
  }
};

// Fetch a single topic by ID
export const fetchTopic = async (topicId: string): Promise<Topic | null> => {
  try {
    await ensureAuth();
    const topicRef = doc(db, "telegramTopics", topicId);
    const topicSnap = await getDoc(topicRef);
    
    if (topicSnap.exists()) {
      return {
        id: topicSnap.id,
        ...topicSnap.data()
      } as Topic;
    }
    return null;
  } catch (error) {
    console.error("Error fetching topic:", error);
    return null;
  }
};

// Fetch homework assignments for a specific student (Telegram only)
export const fetchStudentHomework = async (studentId: string): Promise<HomeworkAssignment[]> => {
  try {
    await ensureAuth();
    // Only fetch from telegramAssignments (the main Telegram homework collection)
    const assignmentsRef = collection(db, "telegramAssignments");
    const q = query(assignmentsRef, where("studentId", "==", studentId));
    const querySnapshot = await getDocs(q);
    
    const assignments = querySnapshot.docs.map(doc => {
      const data = serializeTimestamp(doc.data());
      return {
        id: doc.id,
        ...data
      };
    }) as HomeworkAssignment[];
    
    return assignments;
  } catch (error) {
    console.error("Error fetching homework assignments:", error);
    return [];
  }
};

// Fetch homework reports for a specific student (Telegram only)
export const fetchHomeworkReports = async (studentId: string): Promise<HomeworkReport[]> => {
  try {
    await ensureAuth();
    const reportsRef = collection(db, "telegramHomeworkReports");
    const q = query(reportsRef, where("studentId", "==", studentId));
    const querySnapshot = await getDocs(q);
    
    const reports = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...serializeTimestamp(doc.data())
    })) as HomeworkReport[];
    
    return reports;
  } catch (error) {
    console.error("Error fetching homework reports:", error);
    return [];
  }
};

// Fetch ALL homework assignments (for debugging - Telegram only)
export const fetchAllHomework = async (): Promise<HomeworkAssignment[]> => {
  try {
    await ensureAuth();
    const assignmentsRef = collection(db, "telegramAssignments");
    const querySnapshot = await getDocs(assignmentsRef);
    
    const assignments = querySnapshot.docs.map(doc => {
      const data = serializeTimestamp(doc.data());
      return {
        id: doc.id,
        ...data
      };
    }) as HomeworkAssignment[];
    
    return assignments;
  } catch (error) {
    console.error("Error fetching all homework assignments:", error);
    return [];
  }
};

// Fetch questions for a homework assignment by topicIds
export const fetchQuestionsForHomework = async (topicIds: string[]): Promise<Question[]> => {
  try {
    await ensureAuth();
    if (!topicIds || topicIds.length === 0) {
      return [];
    }

    // Fetch from telegramQuestions collection
    const questionsRef = collection(db, "telegramQuestions");
    const allQuestions: Question[] = [];
    
    // Fetch questions for each topic
    for (const topicId of topicIds) {
      const q = query(questionsRef, where("topicId", "==", topicId));
      const querySnapshot = await getDocs(q);
      
      const topicQuestions = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Question[];
      
      allQuestions.push(...topicQuestions);
    }
    
    // Sort by order field to maintain the correct sequence
    allQuestions.sort((a, b) => {
      const orderA = a.order ?? 999999;
      const orderB = b.order ?? 999999;
      return orderA - orderB;
    });
    
    return allQuestions;
  } catch (error) {
    console.error("Error fetching questions:", error);
    return [];
  }
};

// Submit homework answers and calculate score
export const submitHomeworkAnswers = async (
  assignmentId: string,
  studentId: string,
  answers: { questionId: string; answer: string }[],
  questions: Question[]
): Promise<{ success: boolean; score: number; correctAnswers: number; totalQuestions: number }> => {
  try {
    await ensureAuth();
    // Calculate score
    let correctCount = 0;
    const totalCount = questions.length;
    
    console.log("=== HOMEWORK SUBMISSION DEBUG ===");
    console.log(`Total questions: ${totalCount}`);
    console.log(`Total answers: ${answers.length}`);
    
    
    answers.forEach(answer => {
      const question = questions.find(q => q.id === answer.questionId);
      if (question) {
        console.log(`\nQuestion ID: ${answer.questionId}`);
        console.log(`  User answer: "${answer.answer}" (type: ${typeof answer.answer})`);
        console.log(`  Correct answer: "${question.correctAnswer}" (type: ${typeof question.correctAnswer})`);
        console.log(`  Options:`, question.options);
        
        // Handle both string and number correctAnswer values
        let isCorrect = false;
        
        // If correctAnswer is a number, it might be an index into the options array
        if (typeof question.correctAnswer === 'number' && question.options) {
          // Compare with the option at that index
          const correctOption = question.options[question.correctAnswer];
          // Case-insensitive comparison with trimming
          const userAnswerNorm = String(answer.answer).trim().toLowerCase();
          const correctOptionNorm = String(correctOption).trim().toLowerCase();
          isCorrect = correctOptionNorm === userAnswerNorm;
          console.log(`  Comparing index ${question.correctAnswer} (option: "${correctOption}") with user answer`);
          console.log(`  Normalized: "${correctOptionNorm}" === "${userAnswerNorm}"`);
        } else {
          // Direct string comparison with normalization
          const userAnswerNorm = String(answer.answer).trim().toLowerCase();
          const correctAnswerNorm = String(question.correctAnswer).trim().toLowerCase();
          isCorrect = correctAnswerNorm === userAnswerNorm;
          console.log(`  Direct string comparison`);
          console.log(`  Normalized: "${correctAnswerNorm}" === "${userAnswerNorm}"`);
        }
        
        console.log(`  Match: ${isCorrect}`);
        
        if (isCorrect) {
          correctCount++;
          console.log(`  ✓ CORRECT`);
        } else {
          console.log(`  ✗ INCORRECT`);
        }
      }
    });
    
    console.log(`\n=== FINAL SCORE: ${correctCount}/${totalCount} (${Math.round((correctCount / totalCount) * 100)}%) ===\n`);
    
    const score = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
    
    // CRITICAL DEBUG: Log the exact values being saved
    console.log('📊 About to save these values:');
    console.log(`   correctAnswers: ${correctCount} (type: ${typeof correctCount})`);
    console.log(`   totalQuestions: ${totalCount} (type: ${typeof totalCount})`);
    console.log(`   score: ${score} (type: ${typeof score})`);
    console.log(`   answers array length: ${answers.length}`);
    
    // Update assignment status
    const assignmentRef = doc(db, "telegramAssignments", assignmentId);
    await updateDoc(assignmentRef, {
      status: "completed",
      completedAt: serverTimestamp()
    });

    // Create homework report with answers
    const reportData = {
      studentId,
      homeworkId: assignmentId,
      score,
      correctAnswers: correctCount,
      totalQuestions: totalCount,
      submittedAnswers: answers, // CRITICAL: This saves the actual answers for review
      completedAt: serverTimestamp(),
      completedVia: "web-app"
    };

    // Validate that answers array is not empty before saving
    if (!answers || answers.length === 0) {
      console.warn('⚠️ WARNING: Attempting to save homework report with EMPTY answers array!');
      console.warn('   This might indicate a problem with answer collection.');
    } else {
      console.log(`✅ Saving ${answers.length} answers to database...`);
      console.log('   Sample answer:', answers[0]);
    }

    // Save to database
    const docRef = await addDoc(collection(db, "telegramHomeworkReports"), reportData);
    
    console.log(`✅ Homework report saved successfully!`);
    console.log(`   Report ID: ${docRef.id}`);
    console.log(`   Score: ${correctCount}/${totalCount} correct (${score}%)`);
    console.log(`   Answers saved: ${answers.length}`);
    
    return {
      success: true,
      score,
      correctAnswers: correctCount,
      totalQuestions: totalCount
    };
  } catch (error) {
    console.error("❌ Error submitting homework:", error);
    console.error("   This error prevented the homework from being saved!");
    return {
      success: false,
      score: 0,
      correctAnswers: 0,
      totalQuestions: 0
    };
  }
};

// Mark homework as complete (legacy function - kept for compatibility)
export const completeHomework = async (
  assignmentId: string,
  studentId: string,
  score: number = 100
): Promise<boolean> => {
  try {
    await ensureAuth();
    // Update the assignment status
    const assignmentRef = doc(db, "telegramAssignments", assignmentId);
    await updateDoc(assignmentRef, {
      status: "completed",
      completedAt: serverTimestamp()
    });

    // Create a completion report
    const reportData = {
      studentId,
      homeworkId: assignmentId,
      score,
      completedAt: serverTimestamp(),
      completedVia: "web-app"
    };

    await addDoc(collection(db, "telegramHomeworkReports"), reportData);
    
    console.log("Homework marked as complete:", assignmentId);
    return true;
  } catch (error) {
    console.error("Error completing homework:", error);
    return false;
  }
};

// Chat Message interface
export interface ChatMessage {
  id?: string;
  roomName: string; // Tutor's room
  from: string; // Sender's identity (name)
  message: string;
  timestamp: number;
  createdAt?: any; // Firestore timestamp
  recipients: string[]; // Array of participant identities who should see this message
  isGroupMessage: boolean; // True if sent when 2+ students were present
}

// Save a chat message to Firebase
export const saveChatMessage = async (
  roomName: string,
  from: string,
  message: string,
  timestamp: number,
  recipients: string[] // All participants who should see this message
): Promise<void> => {
  try {
    await ensureAuth();
    const isGroupMessage = recipients.length > 2; // More than just sender + teacher = group
    
    const chatData: ChatMessage = {
      roomName,
      from,
      message,
      timestamp,
      recipients, // Store who should see this message
      isGroupMessage,
      createdAt: serverTimestamp()
    };

    await addDoc(collection(db, "chatMessages"), chatData);
    console.log("💬 Chat message saved to Firebase:", { 
      roomName, 
      from, 
      recipients: recipients.length,
      isGroup: isGroupMessage 
    });
  } catch (error) {
    console.error("❌ Error saving chat message:", error);
    throw error;
  }
};

// Load chat history for a room, filtered by participant identity
export const loadChatHistory = async (
  roomName: string,
  userIdentity: string,
  isTutor: boolean
): Promise<ChatMessage[]> => {
  try {
    await ensureAuth();
    const q = query(
      collection(db, "chatMessages"),
      where("roomName", "==", roomName)
    );
    
    const snapshot = await getDocs(q);
    const messages: ChatMessage[] = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      
      // Teachers see all messages
      // Students only see messages where they are in recipients array
      if (isTutor || (data.recipients && data.recipients.includes(userIdentity))) {
        messages.push({
          id: doc.id,
          roomName: data.roomName,
          from: data.from,
          message: data.message,
          timestamp: data.timestamp,
          recipients: data.recipients || [],
          isGroupMessage: data.isGroupMessage || false,
          createdAt: data.createdAt
        });
      }
    });

    // Sort by timestamp (oldest first)
    messages.sort((a, b) => a.timestamp - b.timestamp);
    
    console.log(`💬 Loaded ${messages.length} chat messages for ${isTutor ? 'teacher' : 'student'} ${userIdentity} in room: ${roomName}`);
    return messages;
  } catch (error) {
    console.error("❌ Error loading chat history:", error);
    return [];
  }
};

// Fetch student ratings
export const fetchStudentRatings = async (studentId: string): Promise<any> => {
  try {
    console.log("🔍 Fetching ratings via API proxy for student:", studentId);
    const url = `/api/student-ratings?studentId=${studentId}`;
    console.log("📡 Request URL:", url);
    
    const response = await fetch(url);
    console.log("📥 Response status:", response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Cloud Function error response:", errorText);
      throw new Error(`Failed to fetch ratings: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log("✅ Cloud Function returned data:", JSON.stringify(data, null, 2));
    
    // The Cloud Function returns ALL students, we need to find our specific student
    if (data.success && data.ratings && Array.isArray(data.ratings)) {
      // Filter out students who are excluded from rating
      const filteredRatings = await filterExcludedStudents(data.ratings);
      console.log(`🔍 Filtered ratings: ${data.ratings.length} -> ${filteredRatings.length} students`);
      
      // Recalculate ranks after filtering
      const rerankedRatings = filteredRatings.map((student: any, index: number) => ({
        ...student,
        rank: index + 1
      }));
      
      const studentRating = rerankedRatings.find((r: any) => r.studentId === studentId);
      
      if (studentRating) {
        console.log("🎯 Found student rating:", studentRating);
        // Transform to match expected structure
        return {
          overallRating: studentRating.averagePercentage / 10, // Convert 0-100 to 0-10
          homeworkCompletion: studentRating.completedHomeworks / studentRating.totalAssigned || 0,
          homeworkScore: studentRating.averagePercentage / 100, // 0-1 scale
          rank: studentRating.rank,
          totalStudents: rerankedRatings.length,
          completedHomeworks: studentRating.completedHomeworks,
          totalAssigned: studentRating.totalAssigned,
          averagePercentage: studentRating.averagePercentage
        };
      } else {
        console.warn("⚠️ Student not found in ratings list (may be excluded from rating)");
        return null;
      }
    }
    
    return null;
  } catch (error) {
    console.error("❌ Error fetching student ratings:", error);
    return null;
  }
};

// Helper function to filter out excluded students
const filterExcludedStudents = async (ratings: any[]): Promise<any[]> => {
  try {
    await ensureAuth();
    // Get all student profiles to check exclusion status
    const studentIds = ratings.map(r => r.studentId);
    const profileChecks = await Promise.all(
      studentIds.map(async (id) => {
        try {
          const profileRef = doc(db, 'studentProfiles', id);
          const profileSnap = await getDoc(profileRef);
          const excludeFromRating = profileSnap.exists() ? profileSnap.data()?.excludeFromRating : false;
          return { studentId: id, excluded: excludeFromRating };
        } catch (error) {
          console.error(`Error checking profile for ${id}:`, error);
          return { studentId: id, excluded: false }; // Include by default if error
        }
      })
    );
    
    // Create a map of excluded students
    const excludedMap = new Map(
      profileChecks.map(check => [check.studentId, check.excluded])
    );
    
    // Filter out excluded students
    const filtered = ratings.filter(rating => !excludedMap.get(rating.studentId));
    
    console.log(`📊 Exclusion stats: ${profileChecks.filter(c => c.excluded).length} students excluded`);
    
    return filtered;
  } catch (error) {
    console.error("Error filtering excluded students:", error);
    return ratings; // Return all if error
  }
};

// Fetch ALL student ratings for comparison (leaderboard)
export const fetchAllStudentRatings = async (tutorKey?: string): Promise<any[]> => {
  try {
    console.log('📊 Fetching ALL student ratings for comparison...');
    
    // Use the API proxy endpoint without a specific studentId to get all ratings
    // This endpoint returns all students' ratings already calculated and ranked
    const url = '/api/student-ratings';
    
    console.log("📡 Request URL:", url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log("📥 Response status:", response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Cloud Function error response:", errorText);
      throw new Error(`Failed to fetch all student ratings: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("✅ All student ratings fetched:", data);
    console.log("📋 Response keys:", Object.keys(data));
    console.log("📋 Ratings type:", typeof data.ratings);
    console.log("📋 Is ratings array?:", Array.isArray(data.ratings));
    console.log("📋 Ratings length:", data.ratings?.length);
    
    if (data.success && data.ratings && Array.isArray(data.ratings)) {
      console.log(`📊 Raw ratings count: ${data.ratings.length}`);
      
      // Filter out students who are excluded from rating
      const filteredRatings = await filterExcludedStudents(data.ratings);
      console.log(`🔍 Filtered ratings: ${data.ratings.length} -> ${filteredRatings.length} students`);
      
      // Recalculate ranks after filtering and transform data
      const rerankedRatings = filteredRatings.map((student: any, index: number) => ({
        studentId: student.studentId,
        studentName: student.studentName,
        rank: index + 1,
        overallRating: student.averagePercentage / 10, // Convert 0-100 to 0-10
        averagePercentage: student.averagePercentage, // Keep original percentage
        completedHomeworks: student.completedHomeworks,
        totalAssigned: student.totalAssigned,
        completionRate: student.totalAssigned > 0 ? (student.completedHomeworks / student.totalAssigned * 100) : 0,
      }));
      
      console.log(`📊 Final reranked ratings count: ${rerankedRatings.length}`);
      console.log(`📊 First few students:`, rerankedRatings.slice(0, 3));
      
      return rerankedRatings;
    }
    
    console.warn("⚠️ Unexpected response structure:", data);
    console.warn("⚠️ Success:", data.success);
    console.warn("⚠️ Has ratings:", !!data.ratings);
    console.warn("⚠️ Is array:", Array.isArray(data.ratings));
    return [];
  } catch (error) {
    console.error('❌ Error fetching all student ratings:', error);
    throw error;
  }
};

// Count uncompleted homework for a student
export const countUncompletedHomework = async (studentId: string): Promise<number> => {
  try {
    const assignments = await fetchStudentHomework(studentId);
    const reports = await fetchHomeworkReports(studentId);
    
    // Get completed homework IDs
    const completedIds = new Set(reports.map(r => r.homeworkId));
    
    // Count assignments that don't have a report
    const uncompletedCount = assignments.filter(a => !completedIds.has(a.id)).length;
    
    return uncompletedCount;
  } catch (error) {
    console.error("Error counting uncompleted homework:", error);
    return 0;
  }
};

// Count unseen homework reports (not yet viewed by teacher)
export const countUnseenHomework = async (): Promise<number> => {
  try {
    await ensureAuth();
    const reportsRef = collection(db, "telegramHomeworkReports");
    const querySnapshot = await getDocs(reportsRef);
    
    // Count reports that don't have seenByTeacher or it's false
    const unseenCount = querySnapshot.docs.filter(doc => {
      const data = doc.data();
      return !data.seenByTeacher;
    }).length;
    
    return unseenCount;
  } catch (error) {
    console.error("Error counting unseen homework:", error);
    return 0;
  }
};

// Check if all homeworks are completed by a student
export const areAllHomeworksCompleted = async (studentId: string): Promise<boolean> => {
  try {
    const assignments = await fetchStudentHomework(studentId);
    const reports = await fetchHomeworkReports(studentId);
    
    // If no assignments, return false (nothing to complete)
    if (assignments.length === 0) {
      return false;
    }
    
    // Get completed homework IDs
    const completedIds = new Set(reports.map(r => r.homeworkId));
    
    // Check if all assignments have reports
    const allCompleted = assignments.every(a => completedIds.has(a.id));
    
    return allCompleted;
  } catch (error) {
    console.error("Error checking homework completion:", error);
    return false;
  }
};

// Get student's ranking position in the leaderboard (1, 2, 3 or null if not in top 3)
export const getStudentRankingPosition = async (studentId: string): Promise<number | null> => {
  try {
    const allRatings = await fetchAllStudentRatings();
    
    // Filter out students who have never completed any homework
    const filteredRatings = allRatings.filter((rating: any) => 
      rating.completedHomeworks && rating.completedHomeworks > 0
    );
    
    // Sort by average percentage (descending)
    const sortedRatings = filteredRatings.sort((a: any, b: any) => b.averagePercentage - a.averagePercentage);
    
    // Find student's position
    const studentIndex = sortedRatings.findIndex((rating: any) => rating.studentId === studentId);
    
    if (studentIndex !== -1 && studentIndex < 3) {
      return studentIndex + 1; // 1-based ranking
    }
    
    return null; // Not in top 3 or not found
  } catch (error) {
    console.error("Error getting student ranking position:", error);
    return null;
  }
};

// Fetch all completed homework reports with student information and assignment details
export const fetchAllCompletedHomework = async (): Promise<Array<HomeworkReport & { studentName?: string; topicIds?: string[] }>> => {
  try {
    await ensureAuth();
    const reportsRef = collection(db, "telegramHomeworkReports");
    const querySnapshot = await getDocs(reportsRef);
    
    // Get all students to map IDs to names
    const students = await fetchStudents();
    const studentMap = new Map(students.map(s => [s.id, s.name]));
    
    // Get all assignments to get topicIds
    const assignmentsRef = collection(db, "telegramAssignments");
    const assignmentsSnapshot = await getDocs(assignmentsRef);
    const assignmentMap = new Map(
      assignmentsSnapshot.docs.map(doc => [doc.id, doc.data()])
    );
    
    // Map reports with student names and assignment details
    const reports = querySnapshot.docs.map(doc => {
      const data = serializeTimestamp(doc.data());
      const assignment = assignmentMap.get(data.homeworkId);
      const topicIds = assignment?.topicIds || (assignment?.topicId ? [assignment.topicId] : []);
      
      return {
        id: doc.id,
        ...data,
        studentName: studentMap.get(data.studentId) || "Unknown Student",
        topicIds
      };
    }) as Array<HomeworkReport & { studentName?: string; topicIds?: string[] }>;
    
    // Sort by completedAt, latest first
    reports.sort((a, b) => {
      const aTime = a.completedAt?.seconds || 0;
      const bTime = b.completedAt?.seconds || 0;
      return bTime - aTime;
    });
    
    return reports;
  } catch (error) {
    console.error("Error fetching all completed homework:", error);
    return [];
  }
};

// Mark homework report as seen by teacher
export const markHomeworkAsSeen = async (reportId: string): Promise<boolean> => {
  try {
    await ensureAuth();
    const reportRef = doc(db, "telegramHomeworkReports", reportId);
    await updateDoc(reportRef, {
      seenByTeacher: true
    });
    return true;
  } catch (error) {
    console.error("Error marking homework as seen:", error);
    return false;
  }
};

// Mark all unseen homework reports as seen by teacher
export const markAllHomeworkAsSeen = async (): Promise<boolean> => {
  try {
    await ensureAuth();
    const reportsRef = collection(db, "telegramHomeworkReports");
    const querySnapshot = await getDocs(reportsRef);
    
    // Update all reports that don't have seenByTeacher or it's false
    const updatePromises = querySnapshot.docs
      .filter(doc => {
        const data = doc.data();
        return !data.seenByTeacher;
      })
      .map(doc => updateDoc(doc.ref, { seenByTeacher: true }));
    
    await Promise.all(updatePromises);
    return true;
  } catch (error) {
    console.error("Error marking all homework as seen:", error);
    return false;
  }
};

export { app, auth };
