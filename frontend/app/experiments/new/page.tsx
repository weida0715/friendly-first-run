import { ExperimentWizardView } from '@/views/ExperimentWizardView';
import { RequireAuth } from '@/lib/auth/guards';

export default function Page() {
  return (
    <RequireAuth>
      <ExperimentWizardView />
    </RequireAuth>
  );
}