'use client';

import { useState } from 'react';

export default function TestUpload2Page() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
      setProgress({ current: 0, total: 0 });
      setCurrentPage(1);
    }
  };

  const handlePreview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('กรุณาเลือกไฟล์ Excel ก่อนทำการตรวจสอบ');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setProgress({ current: 0, total: 0 });

    const formData = new FormData();
    formData.append('file', file);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

      const response = await fetch(`${backendUrl}/api/v1/test-upload2/upload-excel?action=preview`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
        setCurrentPage(1);
      } else {
        setError(data.message || 'เกิดข้อผิดพลาดในการอ่านไฟล์');
      }
    } catch (err: any) {
      setError('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ Backend ได้: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    const jobId = Date.now().toString();
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${backendUrl}/api/v1/test-upload2/upload-progress/${jobId}`);
        const data = await res.json();
        setProgress({ current: data.current, total: data.total });
        if (data.status === 'completed') clearInterval(interval);
      } catch (e) {}
    }, 1000);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${backendUrl}/api/v1/test-upload2/upload-excel?action=upload&jobId=${jobId}`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        alert(data.message);
        setResult(null);
        setFile(null);
      } else {
        setError(data.message || 'เกิดข้อผิดพลาด');
      }
    } catch (err: any) {
      setError('ล้มเหลว: ' + err.message);
    } finally {
      clearInterval(interval);
      setIsUploading(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  const renderNull = (text = "null") => (
    <span className="text-[var(--shadow)] italic font-normal text-xs">{text}</span>
  );

  const paginatedData = result?.preview_data?.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil((result?.preview_data?.length || 0) / itemsPerPage);

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="mb-8 border-b border-[var(--wrapper)] pb-4">
        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--blueText)]">
          ระบบพรีวิวข้อมูล Excel (ข้อมูลบุคคลส่งกลับ)
        </h1>
        <p className="text-[var(--header)] opacity-70 mt-2">
          ตรวจสอบความถูกต้องของการ Map ข้อมูลบุคคลส่งกลับก่อนนำเข้าฐานข้อมูล
        </p>
      </div>

      <form onSubmit={handlePreview} className="mb-8 p-6 bg-[var(--container)] border border-[var(--wrapper)] rounded-xl shadow-sm max-w-xl">
        <div className="flex flex-col gap-4">
          <label className="font-semibold text-sm text-[var(--blueText)]">เลือกไฟล์ Excel ของคุณ (.xlsx, .xls)</label>
          <input 
            type="file" 
            accept=".xlsx, .xls" 
            onChange={handleFileChange}
            className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[var(--button)] file:text-[var(--header)] hover:file:opacity-80 border border-[var(--wrapper)] p-2 rounded-md bg-[var(--container)] text-[var(--blueText)] cursor-pointer w-full text-sm"
          />
          <button 
            type="submit" 
            disabled={loading || isUploading}
            className="w-full bg-[var(--blueText)] text-[var(--button)] py-2.5 px-4 rounded-lg font-medium hover:opacity-90 disabled:bg-[var(--wrapper)] disabled:text-[var(--header)] disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm text-sm"
          >
            {loading ? 'กำลังประมวลผลและอ่านไฟล์...' : 'พรีวิวข้อมูล (ยังไม่บันทึก)'}
          </button>
        </div>
      </form>

      {error && (
        <div className="p-4 mb-6 bg-[var(--redBG)] text-[var(--redText)] border border-[var(--redBorder)] rounded-lg text-sm font-medium">
          ⚠️ {error}
        </div>
      )}

      {result && (
        <div className="space-y-6 animate-fadeIn">
          
          <div className="p-6 border rounded-xl bg-[var(--container)] shadow-sm border-[var(--wrapper)]">
             <h3 className="font-bold text-lg mb-2 text-[var(--blueText)]">ยืนยันการนำเข้าข้อมูล</h3>
             <p className="text-sm mb-4 text-[var(--header)] opacity-80">เมื่อกดปุ่มนี้ ระบบจะเริ่มบันทึกข้อมูลและอัปโหลดรูปภาพทั้งหมดขึ้น Google Drive ทันที</p>
             {isUploading ? (
                 <div className="w-full">
                     <div className="flex justify-between text-sm mb-1 font-semibold text-[var(--blueText)]">
                         <span>กำลังบันทึกลง Database & Google Drive...</span>
                         <span>{progress.current} / {progress.total || result.total_rows} รายการ</span>
                     </div>
                     <div className="w-full bg-[var(--wrapper)] rounded-full h-3">
                         <div className="bg-[var(--blueText)] h-3 rounded-full transition-all duration-300" style={{ width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%` }}></div>
                     </div>
                 </div>
             ) : (
                 <button onClick={handleConfirmUpload} className="w-full bg-[var(--greenBG)] text-[var(--greenText)] border border-[var(--greenBorder)] py-3 px-4 rounded-lg font-bold hover:opacity-90 transition shadow-md">
                     ยืนยันบันทึกลงฐานข้อมูลและอัปโหลดรูปภาพ
                 </button>
             )}
          </div>

          <div className="p-5 bg-[var(--greenBG)] text-[var(--greenText)] border border-[var(--greenBorder)] rounded-xl flex justify-between items-center shadow-sm">
            <div>
              <p className="font-bold text-lg text-[var(--greenText)]">✨ {result.message}</p>
              <p className="text-sm mt-1">ข้อมูลพร้อมสำหรับนำเข้าฐานข้อมูลจริง</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black">{result.total_rows}</span>
              <p className="text-xs opacity-80">แถวที่อ่านได้</p>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-xl mb-4 text-[var(--header)]">
              🔍 ตารางพรีวิวข้อมูล
            </h3>

            {totalPages > 1 && (
              <div className="flex justify-between items-center bg-[var(--container)] p-4 border border-[var(--wrapper)] rounded-xl mb-4 shadow-sm">
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-4 py-2 bg-[var(--button)] border border-[var(--wrapper)] rounded-md disabled:opacity-50 text-sm font-medium hover:bg-[var(--wrapper)] text-[var(--header)] transition">
                  ก่อนหน้า
                </button>
                <span className="text-sm font-medium text-[var(--header)]">หน้า {currentPage} จาก {totalPages}</span>
                <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="px-4 py-2 bg-[var(--button)] border border-[var(--wrapper)] rounded-md disabled:opacity-50 text-sm font-medium hover:bg-[var(--wrapper)] text-[var(--header)] transition">
                  ถัดไป
                </button>
              </div>
            )}

            <div className="overflow-x-auto border border-[var(--wrapper)] rounded-xl shadow-md bg-[var(--button)]">
              <table className="w-full text-sm text-left border-collapse min-w-250">
                <thead className="bg-[var(--container)] font-bold border-b border-[var(--wrapper)] text-xs text-[var(--header)] uppercase">
                  <tr>
                    <th className="p-4 border-r border-[var(--wrapper)] w-16 text-center">แถวที่</th>
                    <th className="p-4 border-r border-[var(--wrapper)] bg-[var(--container)] text-[var(--blueText)] w-3/5">
                      ข้อมูลที่จะถูกบันทึกลงฐานข้อมูล
                    </th>
                    <th className="p-4 text-[var(--orangeText)] bg-[var(--container)] w-2/5">
                      ข้อมูลดิบจาก Excel
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--wrapper)]">
                  {paginatedData?.map((row: any, idx: number) => (
                    <tr key={idx} className="hover:bg-[var(--row-hover)] transition">
                      <td className="p-4 font-bold border-r border-[var(--wrapper)] text-center align-top text-[var(--header)] opacity-60">
                        {row.ลำดับที่อ่านได้}
                      </td>
                      <td className="p-4 border-r border-[var(--wrapper)] bg-[var(--container)] opacity-95 align-top text-[var(--header)]">
                        <div className="grid grid-cols-2 gap-4 mb-3 pb-3 border-b border-[var(--wrapper)]">
                          <div>
                            <span className="text-[10px] font-semibold text-[var(--header)] opacity-50 uppercase tracking-wider block mb-1">หมวดหมู่ชื่อ (ภาษาไทย)</span>
                            <div className="text-sm">
                              <span className="text-[var(--header)] opacity-50 mr-2">[DB: first_name_th]</span>
                              <span className="font-medium text-[var(--blueText)]">{row.first_name_th || renderNull()}</span>
                            </div>
                            <div className="text-sm">
                              <span className="text-[var(--header)] opacity-50 mr-2">[DB: last_name_th]</span>
                              <span className="font-medium text-[var(--blueText)]">{row.last_name_th || renderNull()}</span>
                            </div>
                          </div>
                          <div>
                            <span className="text-[10px] font-semibold text-[var(--header)] opacity-50 uppercase tracking-wider block mb-1">หมวดหมู่ชื่อ (ภาษาอังกฤษ)</span>
                            <div className="text-sm">
                              <span className="text-[var(--header)] opacity-50 mr-2">[DB: first_name_en]</span>
                              <span className="font-medium text-[var(--blueText)]">{row.first_name_en || renderNull()}</span>
                            </div>
                            <div className="text-sm">
                              <span className="text-[var(--header)] opacity-50 mr-2">[DB: last_name_en]</span>
                              <span className="font-medium text-[var(--blueText)]">{row.last_name_en || renderNull()}</span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-3 pb-3 border-b border-[var(--wrapper)]">
                          <div>
                            <span className="text-[10px] font-semibold text-[var(--header)] opacity-50 uppercase block mb-1">ข้อมูลส่วนบุคคล (อายุ/วันเกิด/เพศ)</span>
                            <div className="text-sm"><span className="text-[var(--header)] opacity-50 mr-1">[DB: age]</span> <span className="font-medium">{row.age || renderNull()}</span></div>
                            <div className="text-sm"><span className="text-[var(--header)] opacity-50 mr-1">[DB: dob]</span> <span className="font-medium">{row.dob || renderNull()}</span></div>
                            <div className="text-sm"><span className="text-[var(--header)] opacity-50 mr-1">[DB: gender]</span> <span className="font-medium text-[var(--blueText)]">{row.gender || renderNull()}</span></div>
                          </div>
                          <div>
                            <span className="text-[10px] font-semibold text-[var(--header)] opacity-50 uppercase block mb-1">เอกสาร</span>
                            <div className="text-sm"><span className="text-[var(--header)] opacity-50 mr-1">[DB: national_id]</span> <span className="font-mono">{row.id_card || renderNull()}</span></div>
                            <div className="text-sm"><span className="text-[var(--header)] opacity-50 mr-1">[DB: passport_id]</span> <span className="font-mono">{row.passport || renderNull()}</span></div>
                            <div className="text-sm mt-1">
                              <span className="text-[var(--header)] opacity-50 block mb-2">[DB: photo_url]</span> 
                              {row.photo_url && (row.photo_url.startsWith('data:image') || row.photo_url.startsWith('http')) ? (
                                <img 
                                  src={row.photo_url} 
                                  alt="พรีวิวรูปโปรไฟล์" 
                                  className="w-16 h-20 object-cover rounded-md border border-[var(--wrapper)] shadow-sm" 
                                />
                              ) : (
                                <span className="font-medium truncate block text-[var(--orangeText)]" title={row.photo_url}>
                                  {row.photo_url || renderNull()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 align-top bg-[var(--button)]">
                        <pre className="text-xs font-mono bg-[var(--container)] text-[var(--header)] p-3 border border-[var(--wrapper)] rounded-lg max-h-screen overflow-y-auto shadow-inner whitespace-pre-wrap sticky top-4">
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