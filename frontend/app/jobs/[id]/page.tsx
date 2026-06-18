import { JobDetailView } from '@/views/JobDetailView';
import { RequireAuth } from '@/lib/auth/guards';

export default function Page() {
  return (
    <RequireAuth>
      <JobDetailView />
    </RequireAuth>
  );
}