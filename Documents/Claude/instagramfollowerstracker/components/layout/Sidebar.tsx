interface SidebarProps {
  children: React.ReactNode;
}

export function Sidebar({ children }: SidebarProps) {
  return (
    <aside className="w-72 shrink-0 border-r border-gray-100 bg-white h-full overflow-y-auto">
      <div className="p-4">{children}</div>
    </aside>
  );
}
