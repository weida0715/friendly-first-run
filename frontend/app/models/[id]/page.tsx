import { ModelDetailView } from '@/views/ModelDetailView';
import { RequireAuth } from '@/lib/auth/guards';

export default function Page() {
  return (
    <RequireAuth>
      <ModelDetailView />
    </RequireAuth>
  );
}