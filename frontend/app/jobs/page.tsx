import { RequireAuth } from '@/lib/auth/guards';
import { JobListView } from '@/views/JobListView';

export default function Page() {
  return (
    <RequireAuth>
      <JobListView />
    </RequireAuth>
  );
}