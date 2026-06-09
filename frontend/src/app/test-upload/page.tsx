"use client";

import { useState, useEffect } from "react";

export default function TestUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [illegalsData, setIllegalsData] = useState<any[]>([]);

  // 1. ฟังก์ชันดึงข้อมูลจาก Backend มาแสดงในตาราง
  const fetchData = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/immigrants");
      const json = await res.json();
      if (json.success) {
        setIllegalsData(json.data.illegals);
      }
    } catch (error) {
      console.error("Fetch Error:", error);
    }
  };

  // ดึงข้อมูลตั้งแต่เปิดหน้าเว็บครั้งแรก
  useEffect(() => {
    fetchData();
  }, []);

  // 2. ฟังก์ชันอัปโหลดไฟล์
  const handleUpload = async () => {
    if (!file) {
      setMessage("⚠️ กรุณาเลือกไฟล์ Excel ก่อนครับ");
      return;
    }

    setLoading(true);
    setMessage("กำลังอัปโหลด...");

    const formData = new FormData();
    formData.append("file", file); // ชื่อ "file" ต้องตรงกับที่ Backend รับ

    try {
      const res = await fetch("http://localhost:8000/api/immigrants/upload-excel-illegal", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setMessage(`✅ ${data.message}`);
        setFile(null); // ล้างช่องเลือกไฟล์
        fetchData();   // โหลดตารางข้อมูลใหม่ทันที จะได้เห็นว่าข้อมูลเข้าจริง!
      } else {
        setMessage(`❌ เกิดข้อผิดพลาด: ${data.message}`);
      }
    } catch (error) {
      setMessage(`❌ เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ ตรวจสอบว่า Backend รันอยู่หรือไม่`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto font-sans">
      <h1 className="text-3xl font-bold mb-6">🧪 ทดสอบอัปโหลดข้อมูลแอบเข้า (Excel)</h1>

      {/* กล่องอัปโหลด */}
      <div className="bg-white p-6 rounded-lg shadow-md border mb-8">
        <div className="flex items-center gap-4">
          <input 
            type="file" 
            accept=".xlsx, .xls"
            onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 border p-2 rounded"
          />
          <button 
            onClick={handleUpload}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 whitespace-nowrap"
          >
            {loading ? "กำลังโหลด..." : "อัปโหลดเลย"}
          </button>
        </div>
        
        {/* ข้อความแจ้งเตือนผลลัพธ์ */}
        {message && (
          <div className={`mt-4 p-3 rounded ${message.includes("✅") ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
            {message}
          </div>
        )}
      </div>

      {/* ตารางแสดงข้อมูล */}
      <h2 className="text-2xl font-semibold mb-4">📋 ข้อมูลในฐานข้อมูลตอนนี้ (อัปเดตเรียลไทม์)</h2>
      <div className="overflow-x-auto bg-white rounded-lg shadow border">
        <table className="min-w-full text-sm text-left text-gray-600">
          <thead className="bg-gray-100 text-gray-700 font-medium">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">ชื่อ-นามสกุล (TH)</th>
              <th className="px-4 py-3">ชื่อ-นามสกุล (EN)</th>
              <th className="px-4 py-3">เลขพาสปอร์ต</th>
              <th className="px-4 py-3">สถานที่เจอ</th>
              <th className="px-4 py-3">ผู้เสียหาย?</th>
              <th className="px-4 py-3">เพศ</th>
            </tr>
          </thead>
          <tbody>
            {illegalsData.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  ยังไม่มีข้อมูลในระบบ ลองอัปโหลดไฟล์ด้านบนดูสิ!
                </td>
              </tr>
            ) : (
              illegalsData.map((person, index) => (
                <tr key={person.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 text-xs text-gray-400" title={person.id}>
                    {person.id.substring(0, 8)}...
                  </td>
                  <td className="px-4 py-3">
                    {person.first_name_th} {person.middle_name_th || ""} {person.last_name_th}
                  </td>
                  <td className="px-4 py-3">
                    {person.first_name_en} {person.middle_name_en || ""} {person.last_name_en}
                  </td>
                  <td className="px-4 py-3">{person.passport_id || "-"}</td>
                  <td className="px-4 py-3">{person.detected_location}</td>
                  <td className="px-4 py-3">
                    {person.is_victim ? (
                      <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs">ใช่</span>
                    ) : (
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">ไม่ใช่</span>
                    )}
                  </td>
                  <td className="px-4 py-3">{person.gender || "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}