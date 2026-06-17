"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Save, X, FileSpreadsheet } from "lucide-react";

export default function CreateDeportedImmigrant() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    first_name_th: "", middle_name_th: "", last_name_th: "",
    first_name_en: "", middle_name_en: "", last_name_en: "",
    passport_id: "", nationality: "", national_id: "",
    date_of_birth: "", age: "", return_date: "",
    number_of_case: "", number_of_warrant: "", channel: "",
    result: "PENDING", address: "", photo_url: "",
  });

  // States สำหรับจัดการไฟล์รูปภาพและการพรีวิว
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file)); 
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
      
      // แปลงข้อมูลเป็น FormData เพื่อรองรับไฟล์รูป
      const submitData = new FormData();
      Object.keys(formData).forEach((key) => {
        const val = (formData as any)[key];
        if (val !== null && val !== undefined && val !== "") {
          submitData.append(key, String(val));
        }
      });

      // ถ้ามีการเลือกไฟล์ ให้เพิ่มเข้าไปใน FormData
      if (selectedImage) {
        submitData.append("photo", selectedImage);
      }

      const res = await fetch(`${backendUrl}/api/v1/immigrants/deported`, {
        method: "POST", 
        body: submitData, // ส่งเป็น FormData
      });

      if (!res.ok) throw new Error("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      alert("เพิ่มข้อมูลผู้ถูกส่งตัวกลับสำเร็จ!");
      router.push("/immigrants/deported"); 
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full bg-background border border-(--wrapper) text-foreground rounded-md p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-(--header)/40";
  const labelClass = "block text-xs font-bold mb-2 text-[var(--header)] opacity-70";

  return (
    <div className="min-h-screen bg-background p-6 text-foreground transition-colors duration-200">
      <div className="max-w-4xl mx-auto mb-6">
        <button onClick={() => router.push("/immigrants/deported")} className="flex items-center gap-1 text-2xl font-bold text-(--header) hover:opacity-80 transition cursor-pointer">
          <ChevronLeft size={32} />
          <span>เพิ่มข้อมูลใหม่ (ผู้ถูกส่งตัวกลับ)</span>
        </button>
      <Link href="/test-upload2">
          <button className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-600 border border-emerald-500/50 rounded-lg hover:bg-emerald-500/20 font-bold transition text-sm cursor-pointer">
            <FileSpreadsheet size={18} /> อัพโหลดจากไฟล์ Excel
          </button>
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto bg-(--container) border border-(--wrapper) rounded-2xl p-6 md:p-8 shadow-sm transition-colors mb-12">
        
        {error && <div className="mb-6 rounded-md border border-red-500 bg-red-100 dark:bg-red-900/30 p-4 text-sm text-red-600 dark:text-red-400 font-medium">{error}</div>}

        <h3 className="text-xl font-bold text-(--header) mb-6 border-b border-(--wrapper) pb-3">รูปภาพประจำตัว</h3>
        <div className="mb-6 flex flex-col items-start gap-4">
          {imagePreview && (
            <img 
              src={imagePreview} 
              alt="Preview" 
              className="h-40 w-40 object-cover rounded-xl border border-(--wrapper) shadow-sm" 
            />
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            // แก้สี text ของปุ่มอัพโหลดไฟล์ให้ชัดเจนขึ้น
            className="w-full bg-background border border-(--wrapper) text-foreground rounded-md p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-(--header)/40 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-stone-200 dark:file:bg-stone-800 file:text-slate-800 dark:file:text-slate-200 hover:file:opacity-80 cursor-pointer"
          />
        </div>

        <h3 className="text-xl font-bold text-(--header) mb-6 border-b border-(--wrapper) pb-3 mt-8">ข้อมูลส่วนบุคคลและชื่อ-นามสกุล</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
          <div><label className={labelClass}>ชื่อต้นภาษาไทย *</label><input required type="text" name="first_name_th" value={formData.first_name_th} onChange={handleInputChange} className={inputClass} /></div>
          <div><label className={labelClass}>ชื่อกลางภาษาไทย</label><input type="text" name="middle_name_th" value={formData.middle_name_th} onChange={handleInputChange} className={inputClass} /></div>
          <div><label className={labelClass}>นามสกุลภาษาไทย *</label><input required type="text" name="last_name_th" value={formData.last_name_th} onChange={handleInputChange} className={inputClass} /></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
          <div><label className={labelClass}>ชื่อต้นภาษาอังกฤษ (First Name)</label><input type="text" name="first_name_en" value={formData.first_name_en} onChange={handleInputChange} className={inputClass} /></div>
          <div><label className={labelClass}>ชื่อกลางภาษาอังกฤษ (Middle Name)</label><input type="text" name="middle_name_en" value={formData.middle_name_en} onChange={handleInputChange} className={inputClass} /></div>
          <div><label className={labelClass}>นามสกุลภาษาอังกฤษ (Last Name)</label><input type="text" name="last_name_en" value={formData.last_name_en} onChange={handleInputChange} className={inputClass} /></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
          <div><label className={labelClass}>เลขหนังสือเดินทาง (Passport ID)</label><input type="text" name="passport_id" value={formData.passport_id} onChange={handleInputChange} className={inputClass} /></div>
          <div><label className={labelClass}>สัญชาติ (Nationality)</label><input type="text" name="nationality" value={formData.nationality} onChange={handleInputChange} className={inputClass} /></div>
        </div>

        <h3 className="text-xl font-bold text-(--header) mb-6 border-b border-(--wrapper) pb-3 mt-8">รายละเอียดการส่งตัวและคดีความ</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
          <div><label className={labelClass}>เลขประจำตัวประชาชน (National ID) *</label><input required type="text" name="national_id" value={formData.national_id} onChange={handleInputChange} className={inputClass} /></div>
          <div><label className={labelClass}>วันเดือนปีเกิด</label><input type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleInputChange} className={inputClass} /></div>
          <div><label className={labelClass}>อายุปัจจุบัน (ปี)</label><input type="number" name="age" value={formData.age} onChange={handleInputChange} className={inputClass} /></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
          <div><label className={labelClass}>วันที่ส่งกลับประเทศ</label><input type="date" name="return_date" value={formData.return_date} onChange={handleInputChange} className={inputClass} /></div>
          <div><label className={labelClass}>จำนวนเคสคดี (Case ID)</label><input type="number" name="number_of_case" value={formData.number_of_case} onChange={handleInputChange} className={inputClass} /></div>
          <div><label className={labelClass}>จำนวนหมายจับ</label><input type="number" name="number_of_warrant" value={formData.number_of_warrant} onChange={handleInputChange} className={inputClass} /></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
          <div><label className={labelClass}>ช่องทางส่งกลับ</label><input type="text" name="channel" value={formData.channel} onChange={handleInputChange} className={inputClass} /></div>
          <div><label className={labelClass}>สถานะผลลัพธ์คดี</label>
            <select name="result" value={formData.result} onChange={handleInputChange} className={inputClass}>
              <option value="PENDING">PENDING</option><option value="SUCCESS">SUCCESS</option><option value="FAILED">FAILED</option>
            </select>
          </div>
        </div>

        <div className="mb-5">
          <label className={labelClass}>ภูมิลำเนา / ที่อยู่</label>
          <textarea name="address" value={formData.address} onChange={handleInputChange} rows={3} className={inputClass} />
        </div>

        <div className="flex justify-end gap-3 border-t border-(--wrapper) pt-6 mt-8">
          <Link href="/immigrants/deported">
            <button type="button" className="flex items-center gap-1.5 px-4 py-2 bg-stone-200 dark:bg-stone-800 text-slate-800 dark:text-slate-200 font-bold rounded-lg hover:opacity-90 active:scale-[0.98] transition text-sm cursor-pointer">
              <X size={16} /><span>ยกเลิก</span>
            </button>
          </Link>
          <button type="submit" disabled={loading} className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:opacity-90 active:scale-[0.98] transition text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
            <Save size={16} /><span>{loading ? "กำลังบันทึก..." : "บันทึกข้อมูล"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}