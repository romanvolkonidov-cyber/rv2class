import { notFound } from "next/navigation";
import StudentHomework from "./student-homework";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export default async function HomeworkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Fetch student data from Firestore
  const studentRef = doc(db, "students", id);
  const studentSnap = await getDoc(studentRef);

  if (!studentSnap.exists()) {
    notFound();
  }

  const studentData = studentSnap.data();

  return <StudentHomework studentId={id} studentName={studentData.name || "Student"} />;
}
