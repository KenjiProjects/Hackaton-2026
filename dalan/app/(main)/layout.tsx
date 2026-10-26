import BottomNav from "../../Components/BottomNav";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="flex flex-1 flex-col pb-16">{children}</div>
      <BottomNav />
    </>
  );
}
