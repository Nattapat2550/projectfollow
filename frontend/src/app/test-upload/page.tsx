'use client';

import { useState } from 'react';

export default function TestUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('กรุณาเลือกไฟล์ Excel ก่อนทำการตรวจสอบ');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      // หมายเหตุ: ปรับเปลี่ยน URL ตรงนี้ให้ตรงกับ Port Backend ของคุณ (เช่น http://localhost:5000 หรือ http://localhost:3001)
      const response = await fetch('http://localhost:8000/api/immigrants/upload-excel-illegal', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
      } else {
        setError(data.message || 'เกิดข้อผิดพลาดในการอ่านไฟล์');
      }
    } catch (err: any) {
      setError('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ Backend ได้: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen bg-background text-foreground">
      <div className="mb-8 border-b pb-4">
        <h1 className="text-3xl font-extrabold tracking-tight text-blue-600 dark:text-blue-400">
          ระบบทดสอบและตรวจสอบโครงสร้าง Excel
        </h1>
        <p className="text-muted-foreground mt-2">
          อัปโหลดไฟล์ Excel เพื่อจำลองการ Map ข้อมูลตามคอลัมน์ที่กำหนด (ข้อมูลจะไม่ถูกบันทึกดิ่งลงฐานข้อมูล)
        </p>
      </div>

      {/* ฟอร์มเลือกไฟล์ */}
      <form onSubmit={handleUpload} className="mb-8 p-6 bg-card border rounded-xl shadow-sm max-w-xl">
        <div className="flex flex-col gap-4">
          <label className="font-semibold text-sm">เลือกไฟล์ Excel ของคุณ (.xlsx, .xls)</label>
          <input 
            type="file" 
            accept=".xlsx, .xls" 
            onChange={handleFileChange}
            className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 border p-2 rounded-md bg-white dark:bg-zinc-900 cursor-pointer w-full text-sm"
          />
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition shadow-sm text-sm"
          >
            {loading ? 'กำลังประมวลผลและอ่านไฟล์...' : 'เริ่มตรวจสอบข้อมูลในไฟล์'}
          </button>
        </div>
      </form>

      {/* แสดง Error ถ้ามี */}
      {error && (
        <div className="p-4 mb-6 bg-red-50 text-red-700 border border-red-200 rounded-lg dark:bg-red-950/30 dark:text-red-400 dark:border-red-900 text-sm font-medium">
          ⚠️ {error}
        </div>
      )}

      {/* ส่วนแสดงผลลัพธ์ข้อมูล */}
      {result && (
        <div className="space-y-6 animate-fadeIn">
          {/* กล่องแจ้งสถานะโดยรวม */}
          <div className="p-5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900 flex justify-between items-center shadow-sm">
            <div>
              <p className="font-bold text-lg text-emerald-700 dark:text-emerald-400">✨ {result.message}</p>
              <p className="text-sm mt-1">ตรวจสอบโครงสร้างข้อมูลแล้วเสร็จทั้งหมด</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black">{result.total_rows}</span>
              <p className="text-xs opacity-80">แถวที่ตรวจพบ</p>
            </div>
          </div>

          {/* รายชื่อหัวคอลัมน์ที่ Backend แกะออกมาได้จริงๆ */}
          <div className="p-5 bg-zinc-50 dark:bg-zinc-900 border rounded-xl shadow-sm">
            <h3 className="font-bold text-sm text-zinc-700 dark:text-zinc-300 mb-3">
              📋 รายชื่อหัวคอลัมน์ (Headers) ที่ตรวจพบจากไฟล์ Excel จริงของคุณ:
            </h3>
            <div className="flex flex-wrap gap-2">
              {result.headers_found?.map((header: string, i: number) => (
                <span key={i} className="bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 text-xs font-mono px-3 py-1.5 rounded-md border shadow-sm">
                  "{header}"
                </span>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3 italic">
              *หากชื่อคอลัมน์ใดพ่นข้อมูลไม่ขึ้น ให้เช็คตัวสะกดหรือช่องว่าง (Spacebar) ในไฟล์ Excel ให้ตรงกับชื่อข้างบนนี้
            </p>
          </div>

          {/* ตารางเปรียบเทียบข้อมูลจริง */}
          <div>
            <h3 className="font-bold text-xl mb-4 text-zinc-800 dark:text-zinc-200">
              🔍 ตารางเปรียบเทียบการ Map ข้อมูล (ตรวจสอบความถูกต้อง)
            </h3>
            <div className="overflow-x-auto border rounded-xl shadow-md bg-white dark:bg-zinc-950">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-zinc-100 dark:bg-zinc-900 font-bold border-b text-xs text-zinc-700 dark:text-zinc-300 uppercase">
                  <tr>
                    <th className="p-4 border-r w-16 text-center">แถวที่</th>
                    <th className="p-4 border-r bg-blue-50/50 dark:bg-blue-950/10 text-blue-700 dark:text-blue-400 w-1/2">
                      ข้อมูลที่ระบบแปลงสำเร็จ (พร้อมลง Database)
                    </th>
                    <th className="p-4 text-amber-700 dark:text-amber-400 bg-amber-50/30 dark:bg-amber-950/5 w-1/2">
                      ข้อมูลดิบดั้งเดิมจาก Excel (Raw Object)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {result.preview_data?.map((row: any, idx: number) => (
                    <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition">
                      {/* ลำดับ */}
                      <td className="p-4 font-bold border-r text-center align-top text-zinc-500">
                        {row.ลำดับที่อ่านได้}
                        {row.ชื่อชีต && (
                          <div className="mt-3 text-[10px] font-normal bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded text-zinc-500 break-words">
                            Sheet:<br/>
                            <span className="font-semibold text-blue-600 dark:text-blue-400">{row.ชื่อชีต}</span>
                          </div>
                        )}
                      </td>
                      
                      {/* ข้อมูลที่จัดรูปแบบแล้ว */}
                      <td className="p-4 border-r bg-blue-50/10 dark:bg-blue-950/5 align-top space-y-2">
                        <div className="grid grid-cols-1 gap-1">
                          <div>
                            <span className="text-xs font-semibold text-zinc-400 block">ชื่อ - นามสกุล (ภาษาไทย):</span>
                            <span className="font-medium text-base text-zinc-900 dark:text-zinc-100">
                              {row.first_name_th} {row.last_name_th}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 mt-1">
                            <div>
                              <span className="text-xs font-semibold text-zinc-400 block">สัญชาติ:</span>
                              <span className="text-zinc-800 dark:text-zinc-200 font-medium">
                                {row.nationality || <span className="text-zinc-400 italic font-normal text-xs">null (ไม่มีข้อมูล)</span>}
                              </span>
                            </div>
                            <div>
                              <span className="text-xs font-semibold text-zinc-400 block">เลขหนังสือเดินทาง (Passport):</span>
                              <span className="text-zinc-800 dark:text-zinc-200 font-mono font-medium">
                                {row.passport_id || <span className="text-zinc-400 italic font-normal text-xs">null (ไม่มีข้อมูล)</span>}
                              </span>
                            </div>
                          </div>
                          <div className="mt-1">
                            <span className="text-xs font-semibold text-zinc-400 block">สถานที่ตรวจพบ:</span>
                            <span className="text-zinc-800 dark:text-zinc-200">{row.detected_location}</span>
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-zinc-400 block">สถานที่ทำงาน:</span>
                            <span className="text-zinc-800 dark:text-zinc-200">
                              {row.workplace || <span className="text-zinc-400 italic font-normal text-xs">null (ไม่มีข้อมูล)</span>}
                            </span>
                          </div>
                          <div className="pt-1 border-t mt-1">
                            <span className="text-xs font-semibold text-zinc-400 block mb-0.5">ผลการคัดกรอง (เป็นผู้เสียหาย):</span>
                            {row.is_victim ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
                                TRUE (เป็นผู้เสียหาย)
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400">
                                FALSE (ไม่เป็นผู้เสียหาย)
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* ข้อมูลดิบดั้งเดิมจาก Excel */}
                      <td className="p-4 align-top bg-amber-50/10 dark:bg-amber-950/5">
                        <pre className="text-xs font-mono bg-zinc-950 text-zinc-200 p-3 border rounded-lg max-h-60 overflow-y-auto shadow-inner whitespace-pre-wrap">
                          {JSON.stringify(row.raw_data_from_excel, null, 2)}
                        </pre>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}