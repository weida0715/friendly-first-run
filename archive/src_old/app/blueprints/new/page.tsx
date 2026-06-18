import { Suspense } from 'react';
import NewBlueprint from '@/screens/NewBlueprint';

export default function NewSfmPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NewBlueprint />
    </Suspense>
  );
}