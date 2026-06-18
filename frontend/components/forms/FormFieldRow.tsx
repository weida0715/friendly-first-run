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
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>
        {label}
        {required ? ' *' : ''}
      </Label>
      {children}
      {error ? <FormErrorText message={error} /> : helpText ? <p className="text-xs text-muted-foreground">{helpText}</p> : null}
    </div>
  );
}
