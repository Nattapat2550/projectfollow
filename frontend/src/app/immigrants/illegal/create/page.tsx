"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Save, X } from "lucide-react";

export default function CreateIllegalImmigrant() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    first_name_th: "", middle_name_th: "", last_name_th: "",
    first_name_en: "", middle_name_en: "", last_name_en: "",
    passport_id: "", gender: "", nationality: "",
    detected_date: "", detected_location: "", is_victim: false,
    warrant: "", workplace: "", screening_details: "", photo_url: "",
  });

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value }));
  };

  // 🛠️ ส่วนนี้คือการโชว์รูปพรีวิว "โดยยังไม่อัพโหลดขึ้น Drive"
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file); // 1. เก็บไฟล์รูปไว้ใน State ของบราวเซอร์ (ยังไม่ส่งไปเซิร์ฟเวอร์)
      setImagePreview(URL.createObjectURL(file)); // 2. สร้าง Blob URL จำลองเพื่อโชว์พรีวิวบนหน้าจอเท่านั้น
    }
  };

  // 🛠️ ส่วนนี้คือการอัพโหลดขึ้น Drive "เมื่อกดปุ่มบันทึกข้อมูลเท่านั้น"
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
      const submitData = new FormData();
      
      Object.keys(formData).forEach((key) => {
        const val = (formData as any)[key];
        if (val !== null && val !== undefined && val !== "") {
          submitData.append(key, String(val));
        }
      });

      // 3. แนบไฟล์รูปภาพของจริงเข้าไปกับข้อมูลฟอร์ม
      if (selectedImage) {
        submitData.append("photo", selectedImage);
      }

      // 4. ยิง API ไปที่ Backend เพื่อบันทึกข้อมูลและอัพรูปลง Drive พร้อมกัน
      const res = await fetch(`${backendUrl}/api/v1/immigrants/illegal`, {
        method: "POST", 
        body: submitData,
      });

      if (!res.ok) throw new Error("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      alert("เพิ่มข้อมูลแอบเข้าเมืองสำเร็จ!");
      router.push("/immigrants/illegal"); 
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full bg-background border border-(--wrapper) text-foreground rounded-md p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-(--header)/40";
  const labelClass = "block text-xs font-bold mb-2 text-stone-600 dark:text-slate-300";

  return (
    <div className="min-h-screen bg-background p-6 text-foreground transition-colors duration-200">
      <div className="max-w-4xl mx-auto mb-6">
        <button onClick={() => router.push("/immigrants/illegal")} className="flex items-center gap-1 text-2xl font-bold text-(--header) hover:opacity-80 transition cursor-pointer">
          <ChevronLeft size={32} />
          <span>เพิ่มข้อมูลใหม่ (ผู้แอบเข้าประเทศ)</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto bg-(--container) border border-(--wrapper) rounded-2xl p-6 md:p-8 shadow-sm transition-colors mb-12">
        {error && <div className="mb-6 rounded-md border border-red-500 bg-red-100 dark:bg-red-900/30 p-4 text-sm text-red-600 dark:text-red-400 font-medium">{error}</div>}

        <h3 className="text-xl font-bold text-(--header) mb-6 border-b border-(--wrapper) pb-3">รูปภาพประจำตัว</h3>
        <div className="mb-6 flex flex-col items-start gap-4">
          {imagePreview && (
            <img src={imagePreview} alt="Preview" className="h-40 w-40 object-cover rounded-xl border border-(--wrapper) shadow-sm" />
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
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

        <h3 className="text-xl font-bold text-(--header) mb-6 border-b border-(--wrapper) pb-3 mt-8">รายละเอียดจุดตรวจเจอและการคัดกรอง</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
          <div><label className={labelClass}>เพศ</label>
            <select name="gender" value={formData.gender} onChange={handleInputChange} className={inputClass}>
              <option value="">ไม่ระบุ</option><option value="ชาย">ชาย</option><option value="หญิง">หญิง</option>
            </select>
          </div>
          <div><label className={labelClass}>วันที่ตรวจพบการแอบเข้าประเทศ</label><input type="date" name="detected_date" value={formData.detected_date} onChange={handleInputChange} className={inputClass} /></div>
          <div><label className={labelClass}>สถานที่ตรวจเจอพิกัด *</label><input required type="text" name="detected_location" value={formData.detected_location} onChange={handleInputChange} className={inputClass} /></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
          <div><label className={labelClass}>สถานที่ทำงานปลายทาง</label><input type="text" name="workplace" value={formData.workplace} onChange={handleInputChange} className={inputClass} /></div>
          <div><label className={labelClass}>ข้อมูลหมายจับเคสเดิม</label><input type="text" name="warrant" value={formData.warrant} onChange={handleInputChange} className={inputClass} /></div>
        </div>

        <div className="mb-5 flex items-center gap-2 bg-background p-4 rounded-xl border border-(--wrapper)">
          <input type="checkbox" id="is_victim" name="is_victim" checked={formData.is_victim} onChange={handleInputChange} className="w-4 h-4 text-(--header) focus:ring-(--header) border-gray-300 rounded cursor-pointer" />
          <label htmlFor="is_victim" className="text-sm font-bold cursor-pointer select-none">เข้าข่ายเป็นผู้เสียหายตกเป็นเหยื่อจากการค้ามนุษย์</label>
        </div>

        <div className="mb-5">
          <label className={labelClass}>บันทึกรายละเอียดผลการคัดกรอง</label>
          <textarea name="screening_details" value={formData.screening_details} onChange={handleInputChange} rows={4} className={inputClass} />
        </div>

        <div className="flex justify-end gap-3 border-t border-(--wrapper) pt-6 mt-8">
          <Link href="/immigrants/illegal">
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