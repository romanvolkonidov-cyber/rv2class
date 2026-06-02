import StudentWelcome from "./student-welcome";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export default async function StudentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const fallbackStudent = { id, name: "Student" };
  try {
    const studentRef = doc(db, "students", id);
    const studentSnap = await getDoc(studentRef);

    if (!studentSnap.exists()) {
      return <StudentWelcome student={fallbackStudent} />;
    }

    const studentData = { 
      id: studentSnap.id, 
      ...studentSnap.data() 
    } as any;

    return <StudentWelcome student={studentData} />;
  } catch (error) {
    console.error("Error loading student page:", error);
    return <StudentWelcome student={fallbackStudent} />;
  }
}
