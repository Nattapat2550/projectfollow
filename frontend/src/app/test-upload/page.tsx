'use client';

import { useState } from 'react';

export default function TestUploadPage() {
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
      const response = await fetch(`${backendUrl}/api/v1/immigrants/upload-excel-illegal?action=preview`, {
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
        const res = await fetch(`${backendUrl}/api/v1/immigrants/upload-progress/${jobId}`);
        const data = await res.json();
        setProgress({ current: data.current, total: data.total });
        if (data.status === 'completed') clearInterval(interval);
      } catch (e) {}
    }, 1000);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${backendUrl}/api/v1/immigrants/upload-excel-illegal?action=upload&jobId=${jobId}`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        alert(data.message);
        setResult(null);
        setFile(null);
      } else {
        setError(data.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      }
    } catch (err: any) {
      setError('การอัปโหลดล้มเหลว: ' + err.message);
    } finally {
      clearInterval(interval);
      setIsUploading(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  const renderNull = (text = "null") => (
    <span className="text-zinc-400 italic font-normal text-xs">{text}</span>
  );

  const paginatedData = result?.preview_data?.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil((result?.preview_data?.length || 0) / itemsPerPage);

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen bg-background text-foreground">
      <div className="mb-8 border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <h1 className="text-3xl font-extrabold tracking-tight text-blue-600 dark:text-blue-400">
          ระบบพรีวิวข้อมูล Excel ก่อนลงฐานข้อมูลจริง
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-2">
          ตรวจสอบความถูกต้องของการ Map ข้อมูลเข้ากับคอลัมน์ใน Database
        </p>
      </div>

      <form onSubmit={handlePreview} className="mb-8 p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm max-w-xl">
        <div className="flex flex-col gap-4">
          <label className="font-semibold text-sm text-blue-900 dark:text-blue-100">เลือกไฟล์ Excel ของคุณ (.xlsx, .xls)</label>
          <input 
            type="file" 
            accept=".xlsx, .xls" 
            onChange={handleFileChange}
            className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 border border-zinc-200 dark:border-zinc-700 p-2 rounded-md bg-white dark:bg-zinc-950 text-blue-900 dark:text-blue-100 cursor-pointer w-full text-sm"
          />
          <button 
            type="submit" 
            disabled={loading || isUploading}
            className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-zinc-400 dark:disabled:bg-zinc-700 disabled:cursor-not-allowed transition shadow-sm text-sm"
          >
            {loading ? 'กำลังประมวลผลและอ่านไฟล์...' : 'พรีวิวข้อมูล (ยังไม่บันทึก)'}
          </button>
        </div>
      </form>

      {error && (
        <div className="p-4 mb-6 bg-red-50 text-red-700 border border-red-200 rounded-lg dark:bg-red-950/30 dark:text-red-400 dark:border-red-900 text-sm font-medium">
          ⚠️ {error}
        </div>
      )}

      {result && (
        <div className="space-y-6 animate-fadeIn">
          
          <div className="p-6 border rounded-xl bg-blue-50 dark:bg-blue-900/20 shadow-sm border-blue-100 dark:border-blue-800">
             <h3 className="font-bold text-lg mb-2 text-blue-800 dark:text-blue-300">ยืนยันการนำเข้าข้อมูล</h3>
             <p className="text-sm mb-4 text-blue-600 dark:text-blue-400">ตรวจสอบข้อมูลพรีวิวด้านล่าง หากถูกต้องแล้ว กดปุ่มเพื่อนำเข้าฐานข้อมูลจริง</p>
             {isUploading ? (
                 <div className="w-full">
                     <div className="flex justify-between text-sm mb-1 font-semibold text-blue-800 dark:text-blue-300">
                         <span>กำลังบันทึกลง Database...</span>
                         <span>{progress.current} / {progress.total || result.total_rows} รายการ</span>
                     </div>
                     <div className="w-full bg-blue-200 rounded-full h-3 dark:bg-blue-950">
                         <div className="bg-blue-600 h-3 rounded-full transition-all duration-300" style={{ width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%` }}></div>
                     </div>
                 </div>
             ) : (
                 <button onClick={handleConfirmUpload} className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-bold hover:bg-green-700 transition shadow-md">
                     ยืนยันบันทึกลงฐานข้อมูล (Illegal Immigrants)
                 </button>
             )}
          </div>

          <div className="p-5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900 flex justify-between items-center shadow-sm">
            <div>
              <p className="font-bold text-lg text-emerald-700 dark:text-emerald-400">✨ {result.message}</p>
              <p className="text-sm mt-1">ข้อมูลพร้อมสำหรับนำเข้าตาราง <strong>illegal_immigrants</strong></p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black">{result.total_rows}</span>
              <p className="text-xs opacity-80">แถวที่อ่านได้</p>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-xl mb-4 text-blue-900 dark:text-blue-100">
              🔍 ตารางพรีวิวข้อมูล
            </h3>

            {totalPages > 1 && (
              <div className="flex justify-between items-center bg-white dark:bg-zinc-900 p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl mb-4 shadow-sm">
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md disabled:opacity-50 text-sm font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 text-blue-900 dark:text-blue-100 transition">
                  ก่อนหน้า
                </button>
                <span className="text-sm font-medium text-blue-900 dark:text-blue-100">หน้า {currentPage} จาก {totalPages}</span>
                <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md disabled:opacity-50 text-sm font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 text-blue-900 dark:text-blue-100 transition">
                  ถัดไป
                </button>
              </div>
            )}

            <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-md bg-white dark:bg-zinc-950">
              <table className="w-full text-sm text-left border-collapse min-w-200">
                <thead className="bg-zinc-100 dark:bg-zinc-900 font-bold border-b border-zinc-200 dark:border-zinc-800 text-xs text-zinc-700 dark:text-zinc-300 uppercase">
                  <tr>
                    <th className="p-4 border-r border-zinc-200 dark:border-zinc-800 w-16 text-center">แถวที่</th>
                    <th className="p-4 border-r border-zinc-200 dark:border-zinc-800 bg-blue-50/50 dark:bg-blue-950/20 text-blue-800 dark:text-blue-300 w-3/5">
                      ข้อมูลที่จะถูกบันทึกลงฐานข้อมูล (แยกตามชื่อคอลัมน์จริง)
                    </th>
                    <th className="p-4 text-amber-800 dark:text-amber-300 bg-amber-50/50 dark:bg-amber-950/20 w-2/5">
                      ข้อมูลดิบจาก Excel (Raw Excel Data)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {paginatedData?.map((row: any, idx: number) => (
                    <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition">
                      
                      <td className="p-4 font-bold border-r border-zinc-200 dark:border-zinc-800 text-center align-top text-zinc-500 dark:text-zinc-400">
                        {row.ลำดับที่อ่านได้}
                      </td>
                      
                      <td className="p-4 border-r border-zinc-200 dark:border-zinc-800 bg-blue-50/10 dark:bg-blue-950/5 align-top text-blue-900 dark:text-blue-100">
                        
                        <div className="grid grid-cols-2 gap-4 mb-3 pb-3 border-b border-zinc-200 dark:border-zinc-800">
                          <div>
                            <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1">หมวดหมู่ชื่อ (ภาษาไทย)</span>
                            <div className="text-sm">
                              <span className="text-zinc-500 mr-2">[DB: first_name_th]</span>
                              <span className="font-medium text-blue-700 dark:text-blue-400">{row.first_name_th || renderNull()}</span>
                            </div>
                            <div className="text-sm">
                              <span className="text-zinc-500 mr-2">[DB: middle_name_th]</span>
                              <span className="font-medium text-blue-700 dark:text-blue-400">{row.middle_name_th || renderNull()}</span>
                            </div>
                            <div className="text-sm">
                              <span className="text-zinc-500 mr-2">[DB: last_name_th]</span>
                              <span className="font-medium text-blue-700 dark:text-blue-400">{row.last_name_th || renderNull()}</span>
                            </div>
                          </div>
                          <div>
                            <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1">หมวดหมู่ชื่อ (ภาษาอังกฤษ)</span>
                            <div className="text-sm">
                              <span className="text-zinc-500 mr-2">[DB: first_name_en]</span>
                              <span className="font-medium text-blue-700 dark:text-blue-400">{row.first_name_en || renderNull()}</span>
                            </div>
                            <div className="text-sm">
                              <span className="text-zinc-500 mr-2">[DB: middle_name_en]</span>
                              <span className="font-medium text-blue-700 dark:text-blue-400">{row.middle_name_en || renderNull()}</span>
                            </div>
                            <div className="text-sm">
                              <span className="text-zinc-500 mr-2">[DB: last_name_en]</span>
                              <span className="font-medium text-blue-700 dark:text-blue-400">{row.last_name_en || renderNull()}</span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-3 pb-3 border-b border-zinc-200 dark:border-zinc-800">
                          <div>
                            <span className="text-zinc-500 text-xs block">[DB: nationality] สัญชาติ:</span>
                            <span className="font-medium">{row.nationality || renderNull()}</span>
                          </div>
                          <div>
                            <span className="text-zinc-500 text-xs block">[DB: passport_id] พาสปอร์ต:</span>
                            <span className="font-mono font-medium">{row.passport_id || renderNull()}</span>
                          </div>
                          <div>
                            <span className="text-zinc-500 text-xs block">[DB: gender] เพศ (อัตโนมัติ):</span>
                            <span className="font-medium">{row.gender || renderNull()}</span>
                          </div>
                          <div>
                            <span className="text regular text-zinc-500 text-xs block">[DB: detected_date] วันที่ตรวจพบ:</span>
                            <span className="font-medium bg-amber-100 dark:bg-amber-900/50 px-1.5 rounded text-amber-800 dark:text-amber-200">
                              {row.detected_date || renderNull()}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-2 mb-3 pb-3 border-b border-zinc-200 dark:border-zinc-800">
                          <div>
                            <span className="text-zinc-500 text-xs block">[DB: detected_location] สถานที่ตรวจพบ:</span>
                            <span className="font-medium">{row.detected_location || renderNull()}</span>
                          </div>
                          <div className="bg-blue-50/50 dark:bg-blue-900/20 p-2 rounded-md border border-blue-100 dark:border-blue-900">
                            <span className="text-blue-600 dark:text-blue-400 text-xs font-semibold block">[DB: workplace] สถานที่ทำงาน:</span>
                            <span className="font-medium">{row.workplace || renderNull()}</span>
                          </div>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-3 border border-slate-200 dark:border-slate-800">
                          <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider block mb-2">หมวดหมู่ผลการคัดกรอง</span>
                          
                          <div className="mb-2">
                            <span className="text-zinc-500 text-xs mr-2">[DB: is_victim] Status:</span>
                            {row.is_victim ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-emerald-500 text-white">
                                TRUE (เป็นผู้เสียหาย)
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-zinc-400 text-white">
                                FALSE (ไม่เป็นผู้เสียหาย)
                              </span>
                            )}
                          </div>

                          <div>
                            <span className="text-purple-600 dark:text-purple-400 text-xs font-semibold block mb-1">
                              [DB: screening_details] รายละเอียดผลคัดกรอง:
                            </span>
                            <div className="text-sm font-medium text-blue-900 dark:text-blue-100 bg-white dark:bg-zinc-950 p-2 border border-zinc-200 dark:border-zinc-800 rounded-md min-h-10 whitespace-pre-wrap">
                              {row.screening_details || renderNull()}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 align-top bg-amber-50/10 dark:bg-amber-950/5">
                        <pre className="text-xs font-mono bg-slate-100 dark:bg-zinc-900 text-blue-900 dark:text-blue-100 p-3 border border-zinc-200 dark:border-zinc-800 rounded-lg max-h-screen overflow-y-auto shadow-inner whitespace-pre-wrap sticky top-4">
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