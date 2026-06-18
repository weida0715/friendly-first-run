import { ExperimentListView } from '@/views/ExperimentListView';
import { RequireAuth } from '@/lib/auth/guards';

export default function Page() {
  return (
    <RequireAuth>
      <ExperimentListView />
    </RequireAuth>
  );
}