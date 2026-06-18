import { UserProfileView } from '@/views/UserProfileView';
import { RequireAuth } from '@/lib/auth/guards';

export default function Page() {
  return (
    <RequireAuth>
      <UserProfileView />
    </RequireAuth>
  );
}
