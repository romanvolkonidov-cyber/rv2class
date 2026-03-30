import { notFound } from "next/navigation";
import StudentWelcome from "./student-welcome";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export default async function StudentPage({ params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Fetch student data from Firestore
    const studentRef = doc(db, "students", id);
    const studentSnap = await getDoc(studentRef);

    if (!studentSnap.exists()) {
      notFound();
    }

    const studentData = { 
      id: studentSnap.id, 
      ...studentSnap.data() 
    } as any; // Type assertion to handle dynamic Firestore data

    return <StudentWelcome student={studentData} />;
  } catch (error) {
    console.error("Error loading student page:", error);
    notFound();
  }
}
