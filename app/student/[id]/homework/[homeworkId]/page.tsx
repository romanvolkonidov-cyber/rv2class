import { fetchStudents } from "@/lib/firebase";
import HomeworkQuiz from "./homework-quiz";
import { notFound } from "next/navigation";

export default async function HomeworkQuizPage({ 
  params 
}: { 
  params: Promise<{ id: string; homeworkId: string }> 
}) {
  const { id: studentId, homeworkId } = await params;
  
  // Fetch student data
  const students = await fetchStudents();
  const student = students.find(s => s.id === studentId);

  if (!student) {
    notFound();
  }

  return <HomeworkQuiz studentId={studentId} studentName={student.name} homeworkId={homeworkId} />;
}
