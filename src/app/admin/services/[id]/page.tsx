import AdminServiceDetailPage from "./service-detail-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <AdminServiceDetailPage id={id} />;
}
