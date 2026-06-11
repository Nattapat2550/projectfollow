'use client';
import { useState } from 'react';

export default function DisplaySensitiveImage() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const fetchSecureImage = async () => {
    // ยิงไปที่ Backend Express ของคุณ
    const res = await fetch('http://localhost:8000/api/get-secure-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filePath: 'user-docs/some-unique-file-id.jpg' }),
    });
    
    const data = await res.json();
    if (data.signedUrl) {
      setImageUrl(data.signedUrl); // นำลิงก์ชั่วคราวมาเซ็ต
    }
  };

  return (
    <div className="p-6">
      <button 
        onClick={fetchSecureImage}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        ดูรูปภาพข้อมูลสำคัญ
      </button>

      {imageUrl && (
        <div className="mt-4">
          {/* รูปจะแสดงผลได้ปกติ แต่ถ้าใคร Copy URL นี้ไปเปิดที่อื่นหลังจาก 60 วินาที จะเข้าไม่ได้ */}
          <img src={imageUrl} alt="Sensitive Data" className="max-w-md rounded shadow" />
        </div>
      )}
    </div>
  );
}