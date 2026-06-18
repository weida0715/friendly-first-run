import { Label } from '@/components/ui/label';
import { FormErrorText } from './FormErrorText';

interface FormFieldRowProps {
  htmlFor?: string;
  label: string;
  required?: boolean;
  helpText?: string;
  error?: string | null;
  children: React.ReactNode;
}

export function FormFieldRow({ htmlFor, label, required = false, helpText, error, children }: FormFieldRowProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className="flex items-center gap-1">
        <span>{label}</span>
        {required ? <span aria-hidden className="text-destructive">*</span> : null}
      </Label>
      {children}
      {error ? <FormErrorText message={error} /> : helpText ? <p className="text-xs text-muted-foreground/80">{helpText}</p> : null}
    </div>
  );
}
