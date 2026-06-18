import { BlueprintDetailView } from '@/views/BlueprintDetailView';
import { RequireAuth } from '@/lib/auth/guards';

export default function Page() {
  return (
    <RequireAuth>
      <BlueprintDetailView />
    </RequireAuth>
  );
}