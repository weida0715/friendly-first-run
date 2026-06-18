import { BlueprintWizardView } from '@/views/BlueprintWizardView';
import { RequireAuth } from '@/lib/auth/guards';

type BlueprintWizardPageProps = {
  searchParams?: Promise<{
    mode?: string;
    blueprintId?: string;
  }>;
};

export default async function Page({ searchParams }: BlueprintWizardPageProps) {
  const resolvedSearchParams = await searchParams;
  const mode = resolvedSearchParams?.mode === 'edit' ? 'edit' : 'create';
  const blueprintId = resolvedSearchParams?.blueprintId;

  return (
    <RequireAuth>
      <BlueprintWizardView mode={mode} sourceBlueprintId={blueprintId} />
    </RequireAuth>
  );
}