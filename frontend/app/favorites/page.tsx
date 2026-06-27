import { FavoritesLibraryView } from '@/views/FavoritesLibraryView';
import { RequireAuth } from '@/lib/auth/guards';

export default function Page() {
  return (
    <RequireAuth>
      <FavoritesLibraryView />
    </RequireAuth>
  );
}
