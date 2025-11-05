import { Suspense } from "react";
import GroupExpensePage from "./GroupExpensePage";

export default function Page({ searchParams }) {
  return (
    <Suspense fallback={<div>Loading expense form...</div>}>
      <GroupExpensePage searchParams={searchParams} />
    </Suspense>
  );
}
