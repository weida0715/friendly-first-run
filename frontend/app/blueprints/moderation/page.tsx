import { BlueprintModerationView } from '@/views/BlueprintModerationView';
import { RequireAuth } from '@/lib/auth/guards';

export default function Page() {
  return (
    <RequireAuth>
      <BlueprintModerationView />
    </RequireAuth>
  );
}
