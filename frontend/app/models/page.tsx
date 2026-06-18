import { ModelsRankingsView } from '@/views/ModelsRankingsView';
import { RequireAuth } from '@/lib/auth/guards';

export default function Page() {
  return (
    <RequireAuth>
      <ModelsRankingsView />
    </RequireAuth>
  );
}