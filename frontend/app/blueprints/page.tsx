import { BlueprintsLibraryView } from '@/views/BlueprintsLibraryView';
import { RequireAuth } from '@/lib/auth/guards';

export default function Page() {
  return (
    <RequireAuth>
      <BlueprintsLibraryView />
    </RequireAuth>
  );
}