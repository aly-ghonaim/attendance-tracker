import { Suspense } from 'react';
import DayView from './day-view';

export default function Page(props: PageProps<'/day/[d]'>) {
  return (
    <Suspense>
      <Day params={props.params} />
    </Suspense>
  );
}

async function Day({ params }: { params: PageProps<'/day/[d]'>['params'] }) {
  const { d } = await params;
  return <DayView day={Number(d)} />;
}
