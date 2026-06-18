import { Input } from '@/components/ui/input';

type NumberInputProps = React.ComponentProps<typeof Input>;

export function NumberInput(props: NumberInputProps) {
  return <Input type="number" {...props} />;
}
