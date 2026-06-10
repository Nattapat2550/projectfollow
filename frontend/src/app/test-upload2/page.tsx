'use client';

import { useState } from 'react';

export default function TestUpload2Page() {
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
      const response = await fetch('http://localhost:8000/api/test-upload2/upload-excel', {
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

  const renderNull = (text = "null") => (
    <span className="text-zinc-400 italic font-normal text-xs">{text}</span>
  );

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen bg-background text-foreground">
      <div className="mb-8 border-b pb-4">
        <h1 className="text-3xl font-extrabold tracking-tight text-blue-600 dark:text-blue-400">
          ระบบพรีวิวข้อมูล Excel (ข้อมูลบุคคลส่งกลับ)
        </h1>
        <p className="text-muted-foreground mt-2">
          ตรวจสอบความถูกต้องของการ Map ข้อมูลบุคคลส่งกลับก่อนนำเข้าฐานข้อมูล
        </p>
      </div>

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
            {loading ? 'กำลังประมวลผลและอ่านไฟล์...' : 'เช็คความถูกต้องของข้อมูล (Preview)'}
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
          <div className="p-5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900 flex justify-between items-center shadow-sm">
            <div>
              <p className="font-bold text-lg text-emerald-700 dark:text-emerald-400">✨ {result.message}</p>
              <p className="text-sm mt-1">ข้อมูลพร้อมสำหรับนำเข้าฐานข้อมูลจริง</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black">{result.total_rows}</span>
              <p className="text-xs opacity-80">แถวที่อ่านได้</p>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-xl mb-4 text-zinc-800 dark:text-zinc-200">
              🔍 ตารางพรีวิวข้อมูล (Mapped DB Fields)
            </h3>
            <div className="overflow-x-auto border rounded-xl shadow-md bg-white dark:bg-zinc-950">
              <table className="w-full text-sm text-left border-collapse min-w-250">
                <thead className="bg-zinc-100 dark:bg-zinc-900 font-bold border-b text-xs text-zinc-700 dark:text-zinc-300 uppercase">
                  <tr>
                    <th className="p-4 border-r w-16 text-center">แถวที่</th>
                    <th className="p-4 border-r bg-blue-50/50 dark:bg-blue-950/10 text-blue-700 dark:text-blue-400 w-3/5">
                      ข้อมูลที่จะถูกบันทึกลงฐานข้อมูล (จำแนกตามโครงสร้าง)
                    </th>
                    <th className="p-4 text-amber-700 dark:text-amber-400 bg-amber-50/30 dark:bg-amber-950/5 w-2/5">
                      ข้อมูลดิบจาก Excel (Raw Excel Data)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {result.preview_data?.map((row: any, idx: number) => (
                    <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition">
                      
                      <td className="p-4 font-bold border-r text-center align-top text-zinc-500">
                        {row.ลำดับที่อ่านได้}
                      </td>
                      
                      <td className="p-4 border-r bg-blue-50/10 dark:bg-blue-950/5 align-top">
                        
                        {/* หมวดหมู่ชื่อภาษาไทย และ อังกฤษ */}
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

                        {/* หมวดหมู่ 1: ข้อมูลบุคคลพื้นฐาน */}
                        <div className="grid grid-cols-2 gap-4 mb-3 pb-3 border-b border-zinc-200 dark:border-zinc-800">
                          <div>
                            <span className="text-[10px] font-semibold text-zinc-400 uppercase block mb-1">อายุและวันเกิด</span>
                            <div className="text-sm"><span className="text-zinc-500 mr-1">[DB: age]</span> <span className="font-medium">{row.age || renderNull()}</span></div>
                            <div className="text-sm"><span className="text-zinc-500 mr-1">[DB: dob]</span> <span className="font-medium">{row.dob || renderNull()}</span></div>
                          </div>
                          <div>
                            <span className="text-[10px] font-semibold text-zinc-400 uppercase block mb-1">เอกสารและที่อยู่</span>
                            <div className="text-sm"><span className="text-zinc-500 mr-1">[DB: id_card]</span> <span className="font-mono">{row.id_card || renderNull()}</span></div>
                            <div className="text-sm"><span className="text-zinc-500 mr-1">[DB: passport]</span> <span className="font-mono">{row.passport || renderNull()}</span></div>
                            <div className="text-sm"><span className="text-zinc-500 mr-1">[DB: address]</span> <span className="font-medium truncate block" title={row.address}>{row.address || renderNull()}</span></div>
                          </div>
                        </div>

                        {/* หมวดหมู่ 2: ข้อมูลการทำงาน */}
                        <div className="grid grid-cols-2 gap-4 mb-3 pb-3 border-b border-zinc-200 dark:border-zinc-800">
                          <div>
                            <span className="text-[10px] font-semibold text-zinc-400 uppercase block mb-1">สถานที่และรูปแบบงาน</span>
                            <div className="text-sm"><span className="text-zinc-500 mr-1">[DB: building]</span> <span className="font-medium">{row.building || renderNull()}</span></div>
                            <div className="text-sm"><span className="text-zinc-500 mr-1">[DB: floor]</span> <span className="font-medium">{row.floor || renderNull()}</span></div>
                            <div className="text-sm"><span className="text-zinc-500 mr-1">[DB: room]</span> <span className="font-medium">{row.room || renderNull()}</span></div>
                            <div className="text-sm"><span className="text-zinc-500 mr-1">[DB: job_type]</span> <span className="font-medium">{row.job_type || renderNull()}</span></div>
                            <div className="text-sm"><span className="text-zinc-500 mr-1">[DB: role]</span> <span className="font-medium">{row.role || renderNull()}</span></div>
                          </div>
                          <div>
                            <span className="text-[10px] font-semibold text-zinc-400 uppercase block mb-1">การเงิน</span>
                            <div className="text-sm"><span className="text-zinc-500 mr-1">[DB: salary]</span> <span className="font-medium">{row.salary || renderNull()}</span></div>
                            <div className="text-sm"><span className="text-zinc-500 mr-1">[DB: paid_by]</span> <span className="font-medium">{row.paid_by || renderNull()}</span></div>
                            <div className="text-sm"><span className="text-zinc-500 mr-1">[DB: payment_method]</span> <span className="font-medium">{row.payment_method || renderNull()}</span></div>
                          </div>
                        </div>

                        {/* หมวดหมู่ 3: ข้อมูลทางคดีและหน่วยงาน */}
                        <div className="grid grid-cols-2 gap-4">
                           <div>
                            <span className="text-[10px] font-semibold text-zinc-400 uppercase block mb-1">สถานะคดี</span>
                            <div className="text-sm"><span className="text-zinc-500 mr-1">[DB: warrant]</span> 
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${row.warrant && row.warrant !== 'ไม่มี' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                {row.warrant || renderNull()}
                              </span>
                            </div>
                            <div className="text-sm"><span className="text-zinc-500 mr-1">[DB: case_id_count]</span> <span className="font-medium">{row.case_id_count || renderNull()}</span></div>
                            <div className="text-sm mt-1"><span className="text-zinc-500 mr-1">[DB: victim_indicator]</span> 
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${row.victim_indicator?.includes('มีข้อบ่งชี้') && !row.victim_indicator?.includes('ไม่มี') ? 'bg-amber-100 text-amber-700' : 'bg-zinc-100 text-zinc-700'}`}>
                                  {row.victim_indicator || renderNull()}
                                </span>
                            </div>
                          </div>
                          <div>
                            <span className="text-[10px] font-semibold text-zinc-400 uppercase block mb-1">อื่นๆ</span>
                            <div className="text-sm"><span className="text-zinc-500 mr-1">[DB: responsible_agency]</span> <span className="font-medium">{row.responsible_agency || renderNull()}</span></div>
                            <div className="text-sm"><span className="text-zinc-500 mr-1">[DB: note]</span> <span className="font-medium text-xs text-zinc-500">{row.note || renderNull()}</span></div>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 align-top bg-amber-50/10 dark:bg-amber-950/5">
                        <pre className="text-xs font-mono bg-zinc-950 text-zinc-200 p-3 border rounded-lg max-h-screen overflow-y-auto shadow-inner whitespace-pre-wrap sticky top-4">
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