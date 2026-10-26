import BottomNav from "../../Components/BottomNav";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="flex flex-1 flex-col pb-[calc(5rem+env(safe-area-inset-bottom)+1rem)]">
        {children}
      </div>
      <BottomNav />
    </>
  );
}
