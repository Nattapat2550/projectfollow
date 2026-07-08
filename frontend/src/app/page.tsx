"use client";

import RepatriatedPage from './immigrants/repatriated/page';
import IllegalPage from './immigrants/illegal/page';

export default function Home() {
  return (
    <div className="flex flex-col xl:flex-row w-full min-h-[calc(100vh-80px)] overflow-x-hidden">
      {/* 
        We use xl:w-1/2 so that on very large screens they are side-by-side, 
        and on smaller screens (below 1280px) they stack vertically.
      */}
      <div className="w-full xl:w-1/2 flex flex-col border-b xl:border-b-0 xl:border-r border-zinc-200 dark:border-zinc-800">
        <div className="flex-1 overflow-hidden relative bg-(--wrapper)">
           <RepatriatedPage />
        </div>
      </div>
      <div className="w-full xl:w-1/2 flex flex-col">
        <div className="flex-1 overflow-hidden relative bg-(--wrapper)">
           <IllegalPage />
        </div>
      </div>
    </div>
  );
}