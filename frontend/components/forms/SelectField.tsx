interface SelectFieldProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  options: Array<{ value: string; label: string }>;
  onValueChange?: (value: string) => void;
}

export function SelectField({ options, onValueChange, ...props }: SelectFieldProps) {
  return (
    <select
      {...props}
      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
      onChange={(e) => onValueChange?.(e.target.value)}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
