import { ExperimentDetailView } from '@/views/ExperimentDetailView';
import { RequireAuth } from '@/lib/auth/guards';

export default function Page() {
  return (
    <RequireAuth>
      <ExperimentDetailView />
    </RequireAuth>
  );
}