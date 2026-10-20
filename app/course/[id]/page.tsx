import { Suspense } from 'react';
import CourseView from './course-view';

export default function Page(props: PageProps<'/course/[id]'>) {
  return (
    <Suspense>
      <Course params={props.params} />
    </Suspense>
  );
}

async function Course({ params }: { params: PageProps<'/course/[id]'>['params'] }) {
  const { id } = await params;
  return <CourseView index={Number(id)} />;
}
