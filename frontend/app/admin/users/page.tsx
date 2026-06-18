import { UserManagementView } from '@/views/UserManagementView';
import { RequireRole } from '@/lib/auth/guards';

export default function Page() {
  return (
    <RequireRole minimumRole="Moderator" fallbackTo="/dashboard">
      <UserManagementView />
    </RequireRole>
  );
}