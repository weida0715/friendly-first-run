import { DashboardView } from '@/views/DashboardView';
import { RequireAuth } from '@/lib/auth/guards';

export default function Page() {
  return (
    <RequireAuth>
      <DashboardView />
    </RequireAuth>
  );
}