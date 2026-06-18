import { SystemManagementView } from '@/views/SystemManagementView';
import { RequireRole } from '@/lib/auth/guards';

export default function Page() {
  return (
    <RequireRole minimumRole="Admin" fallbackTo="/dashboard">
      <SystemManagementView />
    </RequireRole>
  );
}