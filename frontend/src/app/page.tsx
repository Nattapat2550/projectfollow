"use client";

import RepatriatedPage from './immigrants/repatriated/page';
import IllegalPage from './immigrants/illegal/page';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col w-full min-h-[calc(100vh-80px)] p-8 overflow-x-hidden bg-(--wrapper) items-center">
      {/* 
        We use xl:w-1/2 so that on very large screens they are side-by-side, 
        and on smaller screens (below 1280px) they stack vertically.
      */}
        <h1 className="text-2xl font-bold text-(--header) text-center">โปรดเลือกรายการที่ท่านต้องการดูข้อมูล</h1>
        <div className="flex flex-col sm:flex-row my-4">
          <Link href={"/immigrants/repatriated"}>
          <div className='flex flex-1 flex-row sm:flex-col m-4 p-8 rounded bg-(--container) border-2 border-(--shadow) shadow-[5px_5px_0px_var(--shadow)] gap-8 items-center hover:opacity-70  transition-all'>
            <div 
                className='h-30 w-40 sm:h-50 border-2 rounded-lg border-(--wrapper)' 
                style={{
                  backgroundColor: "var(--header)",
                  WebkitMaskImage: "url('/return.png')",
                  maskImage: "url('/return.png')",
                  WebkitMaskSize: "cover",
                  maskSize: "cover",
                  WebkitMaskPosition: "center",
                  maskPosition: "center",
                  WebkitMaskRepeat: "no-repeat",
                  maskRepeat: "no-repeat"
                }}
              />
            <h1 className='font-bold text-(--header) sm:text-center'>ผู้ถูกส่งกลับ (Repatriated)</h1>
          </div>
          </Link>
          <Link href={"/immigrants/illegal"}>
          <div className='flex flex-1 flex-row sm:flex-col m-4  p-8 rounded bg-(--container) border-2 border-(--shadow) shadow-[5px_5px_0px_var(--shadow)] gap-8 items-center   hover:opacity-70  transition-all'>
            <div 
                className='h-30 w-40 sm:h-50 border-2 rounded-lg border-(--wrapper)' 
                style={{
                  backgroundColor: "var(--header)",
                  WebkitMaskImage: "url('/enter.png')",
                  maskImage: "url('/enter.png')",
                  WebkitMaskSize: "cover",
                  maskSize: "cover",
                  WebkitMaskPosition: "center",
                  maskPosition: "center",
                  WebkitMaskRepeat: "no-repeat",
                  maskRepeat: "no-repeat"
                }}
              />
            <h1 className='font-bold text-(--header) sm:text-center'>ผู้ลักลอบเข้าเมือง (Illegal)</h1>
          </div>
          </Link>
        </div>
      </div>
  );
}