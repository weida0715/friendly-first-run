interface TableToolbarProps {
  children: React.ReactNode;
}

export function TableToolbar({ children }: TableToolbarProps) {
  return <div className="grid grid-cols-1 gap-3 md:grid-cols-4">{children}</div>;
}
