// frontend/src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// กำหนดหน้าที่สามารถเข้าได้โดยไม่ต้อง Login
const publicPaths = ['/', '/help', '/login'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ลองเปิด log ดูว่ามันพยายามโหลด path ไหน (ดูใน Terminal)
  // console.log("Middleware path:", pathname);

  // 1. ข้ามการทำงานถ้าเป็นไฟล์ assets (มีจุดทศนิยมเช่น .svg, .png, .css) 
  // หรือเป็น API ของระบบ เพื่อป้องกัน 404 จากไฟล์ประกอบเว็บ
  if (pathname.includes('.') || pathname.startsWith('/api') || pathname.startsWith('/_next')) {
    return NextResponse.next();
  }

  // 2. ดึง token จาก cookie
  const token = request.cookies.get('token')?.value;

  // 3. เช็คว่าเป็น Public Path หรือไม่ (รองรับกรณีมี / ต่อท้ายด้วย)
  const isPublicPath = publicPaths.some(
    (path) => pathname === path || pathname === `${path}/`
  );

  // 4. ถ้าไม่มี Token และไม่ได้เข้าหน้า Public ให้เด้งไป Login
  if (!token && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 5. ถ้ามี Token (Login แล้ว) แต่พยายามเข้าหน้า Login ให้เด้งไป Dashboard
  if (token && pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  // ควบคุมให้ Middleware ทำงานทุก Path ยกเว้นไฟล์ระบบ
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};