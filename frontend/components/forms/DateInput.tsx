import { Input } from '@/components/ui/input';

type DateInputProps = React.ComponentProps<typeof Input>;

export function DateInput(props: DateInputProps) {
  return <Input type="date" {...props} />;
}
