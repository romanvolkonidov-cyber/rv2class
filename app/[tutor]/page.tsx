import { notFound } from "next/navigation";
import JoinTutorRoom from "./join-client";
import { getTutorConfig, type TutorKey } from "./config";

export default async function TutorPage({ params }: { params: Promise<{ tutor: string }> }) {
  const { tutor: tutorSlug } = await params;
  const normalized = tutorSlug?.trim().toLowerCase() as TutorKey | undefined;
  const tutor = getTutorConfig(normalized);

  if (!tutor) {
    notFound();
  }

  return <JoinTutorRoom tutorKey={normalized!} tutor={tutor} />;
}
