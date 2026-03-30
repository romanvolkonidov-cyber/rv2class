import GlobalPetWidget from "@/components/GlobalPetWidget";

export default async function StudentLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  
  return (
    <>
      {children}
      {/* 
        This widget will be persistently rendered over all student pages 
        (dashboard, homework list, homework quiz) 
      */}
      <GlobalPetWidget studentId={id} />
    </>
  );
}
