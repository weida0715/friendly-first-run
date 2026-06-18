interface TableEmptyRowProps {
  colSpan: number;
  message?: string;
}

export function TableEmptyRow({ colSpan, message = 'No records available.' }: TableEmptyRowProps) {
  return (
    <tr>
      <td colSpan={colSpan} className="py-6 text-center text-sm text-muted-foreground">
        {message}
      </td>
    </tr>
  );
}
