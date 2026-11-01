import ProjectProgress from "./progress";
export default async function ProjectPage({ params }: { params: Promise<{ shareId: string }> }) {
  const { shareId } = await params;
  return <ProjectProgress shareId={shareId} />;
}
