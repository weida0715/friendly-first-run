interface DataTableProps {
  children: React.ReactNode;
}

export function DataTable({ children }: DataTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">{children}</table>
    </div>
  );
}
