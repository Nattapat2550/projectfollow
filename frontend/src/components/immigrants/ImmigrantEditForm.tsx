"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save, X, Camera as ImageIcon } from "lucide-react"; // เปลี่ยนเป็น Camera ป้องกัน Error เวอร์ชัน
import { useAddressOptions } from "@/hooks/useAddressOptions";
import AutocompleteInput from "@/components/ui/AutocompleteInput";
import { ALL_NATIONALITIES } from "@/constants/nationalities";

interface ImmigrantEditFormProps {
  id: string;
  personType: "illegal" | "repatriated";
  initialData?: any; 
  onCancel?: () => void;
}

const formatDateForInput = (dateString: string) => {
  if (!dateString) return "";
  try {
    return new Date(dateString).toISOString().split('T')[0];
  } catch (e) {
    return "";
  }
};

export default function ImmigrantEditForm({ id, personType, initialData, onCancel }: ImmigrantEditFormProps) {
  const router = useRouter();
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

  // 🟢 ฟังก์ชันแปลงลิงก์อัจฉริยะ (ดึงมาจากหน้าการ์ดที่แสดงผลได้สำเร็จ)
  const getFullImageUrl = (url: string) => {
    if (!url) return null;
    if (url.startsWith("blob:")) return url; // ถ้าเป็นรูปที่เพิ่งกดเลือกจากเครื่อง ให้โชว์ตรงๆ

    let driveId = "";
    
    // ดักจับและแกะ ID ของ Google Drive
    const matchFileD = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (matchFileD && matchFileD[1]) {
      driveId = matchFileD[1];
    } else {
      const matchId = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      if (matchId && matchId[1]) {
        driveId = matchId[1];
      }
    }

    // ถ้าเป็น Google Drive ให้แปลงเป็น Thumbnail + ผ่าน Proxy แก้ CORS
    if (driveId) {
      const thumbnailUrl = `https://drive.google.com/thumbnail?id=${driveId}&sz=w800`;
      return `https://wsrv.nl/?url=${encodeURIComponent(thumbnailUrl)}`;
    }
    
    // ถ้าเป็นลิงก์ภายนอกอื่นๆ ให้ผ่าน Proxy แก้ CORS
    if (url.startsWith("http")) {
      return `https://wsrv.nl/?url=${encodeURIComponent(url)}`;
    }
    
    // ถ้าเป็น Path รูปในระบบ Backend ของเราเอง
    const fullUrl = `${backendUrl}${url.startsWith("/") ? "" : "/"}${url}`;
    return `https://wsrv.nl/?url=${encodeURIComponent(fullUrl)}`;
  };

  const [formData, setFormData] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);
  
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [passportImagePreview, setPassportImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [passportFile, setPassportFile] = useState<File | null>(null);

  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      const startingData = { ...initialData };
      
      if (startingData.detected_date) startingData.detected_date = formatDateForInput(startingData.detected_date);
      if (startingData.date_of_birth) startingData.date_of_birth = formatDateForInput(startingData.date_of_birth);
      if (startingData.return_date) startingData.return_date = formatDateForInput(startingData.return_date);

      setFormData(startingData);
      
      // เรียกใช้ฟังก์ชันแปลงลิงก์ใหม่ตอนดึงข้อมูลเก่ามาใส่ฟอร์ม
      if (startingData.photo_url) setImagePreview(getFullImageUrl(startingData.photo_url));
      if (startingData.passport_photo_url) setPassportImagePreview(getFullImageUrl(startingData.passport_photo_url));
    }
  }, [initialData]);

  const defaultImage = personType === "illegal" ? "/enter.png" : "/return.png";
  const inputClass = "w-full border px-3 py-1.5 text-sm rounded-sm bg-background !text-black dark:!text-white border-(--wrapper) focus:outline-none transition-all";
  const labelClass = "block text-xs font-semibold mb-1.5 !text-black dark:!text-white opacity-80";

  const { provinces, districtOptions, subDistrictOptions } = useAddressOptions(formData.province || "", formData.district || "");
  const { provinces: detProvinces, districtOptions: detDistrictOptions, subDistrictOptions: detSubDistrictOptions } = useAddressOptions(formData.detected_location_province || "", formData.detected_location_district || "");

  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: any) => {
    const { name, checked } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: checked }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
      setImagePreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handlePassportImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPassportFile(e.target.files[0]);
      setPassportImagePreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleSelectDistrict = (opt: any) => {
    const { district, province } = opt.extra;
    setFormData((prev: any) => ({ ...prev, district, province }));
  };

  const handleSelectSubDistrict = (opt: any) => {
    const { subDistrict, district, province } = opt.extra;
    setFormData((prev: any) => ({ ...prev, sub_district: subDistrict, district, province }));
  };

  const handleSelectDetDistrict = (opt: any) => {
    const { district, province } = opt.extra;
    setFormData((prev: any) => ({ ...prev, detected_location_district: district, detected_location_province: province }));
  };

  const handleSelectDetSubDistrict = (opt: any) => {
    const { subDistrict, district, province } = opt.extra;
    setFormData((prev: any) => ({ ...prev, detected_location_sub_district: subDistrict, detected_location_district: district, detected_location_province: province }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const submitData = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null && formData[key] !== undefined) {
          submitData.append(key, formData[key]);
        }
      });
      if (imageFile) submitData.append("photo", imageFile);
      if (passportFile) submitData.append("passport_photo", passportFile);

      const res = await fetch(`${backendUrl}/api/v1/immigrants/${personType}/${id}`, {
        method: "PUT",
        body: submitData,
      });

      if (!res.ok) throw new Error("บันทึกข้อมูลไม่สำเร็จ");
      
      router.refresh(); 
      if (onCancel) onCancel();
      else router.back();
    } catch (error) {
      console.error(error);
      alert("เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setIsSaving(false);
    }
  };

  if (!formData || Object.keys(formData).length === 0) {
    return <div className="p-10 text-center">กำลังดึงข้อมูลเก่า...</div>;
  }

  return (
    <div className="w-full p-4 sm:p-6 text-foreground" style={{ backgroundColor: "var(--wrapper)", minHeight: "calc(100vh - 80px)" }}>
      <div className="w-full" style={{ backgroundColor: "var(--wrapper)", borderRadius: "0.2rem", boxShadow: "4px 4px 0px rgba(0, 0, 0, 0.25)", overflow: "hidden" }}>
        <div className="p-5 sm:p-6" style={{ backgroundColor: "var(--container)", minHeight: "calc(100vh - 120px)" }}>
          
          <div className="flex justify-between items-center mb-6 border-b border-(--wrapper) pb-4">
            <h1 className="text-2xl font-bold text-(--header)">
              {personType === "illegal" ? "แก้ไขข้อมูลผู้ลักลอบเข้าเมือง" : "แก้ไขข้อมูลผู้ถูกส่งกลับ"}
            </h1>
          </div>

          <form onSubmit={handleSave} className="max-w-5xl mx-auto">
            {/* ---------------- รูปภาพ ---------------- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6 bg-background p-6 rounded-xl border border-(--wrapper)">
              <div>
                <h3 className="text-lg font-bold text-(--header) mb-4">รูปภาพประจำตัว</h3>
                <div className="flex flex-col items-start gap-4">
                  {/* 🟢 เพิ่ม onError ดักจับถ้ารูปพังให้สลับไปใช้รูป Default อัตโนมัติ */}
                  <img 
                    src={imagePreview || defaultImage} 
                    alt="Preview" 
                    referrerPolicy="no-referrer" 
                    onError={(e) => { e.currentTarget.src = defaultImage; }}
                    className="h-40 w-40 object-cover rounded-xl shadow-sm bg-transparent" 
                  />
                  <label className="flex items-center gap-2 px-4 py-2 bg-slate-800 dark:bg-slate-600 text-white rounded-md cursor-pointer hover:opacity-90 text-sm">
                    <ImageIcon size={16} /> {imagePreview ? "แก้ไขรูปประจำตัว" : "อัปโหลดรูปประจำตัว"}
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-(--header) mb-4">รูปถ่ายพาสปอร์ต</h3>
                <div className="flex flex-col items-start gap-4">
                  {/* 🟢 เพิ่ม onError ดักจับถ้ารูปพังให้สลับไปใช้รูป Default อัตโนมัติ */}
                  <img 
                    src={passportImagePreview || defaultImage} 
                    alt="Passport Preview" 
                    referrerPolicy="no-referrer" 
                    onError={(e) => { e.currentTarget.src = defaultImage; }}
                    className="h-40 w-40 object-cover rounded-xl shadow-sm bg-transparent" 
                  />
                  <label className="flex items-center gap-2 px-4 py-2 bg-slate-800 dark:bg-slate-600 text-white rounded-md cursor-pointer hover:opacity-90 text-sm">
                    <ImageIcon size={16} /> {passportImagePreview ? "แก้ไขรูปพาสปอร์ต" : "อัปโหลดรูปพาสปอร์ต"}
                    <input type="file" accept="image/*" onChange={handlePassportImageChange} className="hidden" />
                  </label>
                </div>
              </div>
            </div>

            {/* ---------------- ข้อมูลส่วนบุคคล ---------------- */}
            <h3 className="text-xl font-bold text-(--header) mb-4 mt-8">ข้อมูลส่วนบุคคลและชื่อ-นามสกุล</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
              <div><label className={labelClass}>ชื่อต้นภาษาไทย *</label><input type="text" name="first_name_th" value={formData.first_name_th || ""} onChange={handleInputChange} required className={inputClass} /></div>
              <div><label className={labelClass}>ชื่อกลางภาษาไทย</label><input type="text" name="middle_name_th" value={formData.middle_name_th || ""} onChange={handleInputChange} className={inputClass} /></div>
              <div><label className={labelClass}>นามสกุลภาษาไทย *</label><input type="text" name="last_name_th" value={formData.last_name_th || ""} onChange={handleInputChange} required className={inputClass} /></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
              <div><label className={labelClass}>ชื่อต้นภาษาอังกฤษ</label><input type="text" name="first_name_en" value={formData.first_name_en || ""} onChange={handleInputChange} className={inputClass} /></div>
              <div><label className={labelClass}>ชื่อกลางภาษาอังกฤษ</label><input type="text" name="middle_name_en" value={formData.middle_name_en || ""} onChange={handleInputChange} className={inputClass} /></div>
              <div><label className={labelClass}>นามสกุลภาษาอังกฤษ</label><input type="text" name="last_name_en" value={formData.last_name_en || ""} onChange={handleInputChange} className={inputClass} /></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
              <div><label className={labelClass}>เลขหนังสือเดินทาง</label><input type="text" name="passport_id" value={formData.passport_id || ""} onChange={handleInputChange} className={inputClass} /></div>
              <div><label className={labelClass}>สัญชาติ</label><AutocompleteInput name="nationality" value={formData.nationality || ""} options={ALL_NATIONALITIES} onChange={handleInputChange} className={inputClass} /></div>
              <div><label className={labelClass}>เพศ</label>
                  <select name="gender" value={formData.gender || ""} onChange={handleInputChange} className={inputClass}>
                    <option value="">ไม่ระบุ</option><option value="ชาย">ชาย</option><option value="หญิง">หญิง</option>
                  </select>
              </div>
            </div>

            {/* ---------------- แยกฝั่งตามประเภท (Illegal vs Repatriated) ---------------- */}
            {personType === "illegal" ? (
              <>
                <h3 className="text-xl font-bold text-(--header) mb-4 mt-8">รายละเอียดจุดตรวจเจอและการคัดกรอง</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                   <div><label className={labelClass}>วันที่ตรวจพบ</label><input type="date" name="detected_date" value={formData.detected_date || ""} onChange={handleInputChange} className={inputClass} /></div>
                   <div><label className={labelClass}>สถานที่ทำงานปลายทาง</label><input type="text" name="workplace" value={formData.workplace || ""} onChange={handleInputChange} className={inputClass} /></div>
                </div>
                <div className="mb-5">
                  <label className={labelClass}>รายละเอียดที่อยู่ (บ้านเลขที่, ถนน, หมู่ ฯลฯ) *</label>
                  <textarea name="detected_location_details" value={formData.detected_location_details || ""} onChange={handleInputChange} required rows={2} className={inputClass} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
                  <div><label className={labelClass}>จังหวัด</label><AutocompleteInput name="detected_location_province" value={formData.detected_location_province || ""} options={detProvinces} onChange={handleInputChange} className={inputClass} /></div>
                  <div><label className={labelClass}>เขต/อำเภอ</label><AutocompleteInput name="detected_location_district" value={formData.detected_location_district || ""} options={detDistrictOptions} onChange={handleInputChange} onSelectOption={handleSelectDetDistrict} className={inputClass} /></div>
                  <div><label className={labelClass}>แขวง/ตำบล</label><AutocompleteInput name="detected_location_sub_district" value={formData.detected_location_sub_district || ""} options={detSubDistrictOptions} onChange={handleInputChange} onSelectOption={handleSelectDetSubDistrict} className={inputClass} /></div>
                </div>
                
                <div className="mb-5 flex items-center gap-2 bg-background p-4 rounded-xl border border-(--wrapper)">
                  <input type="checkbox" id="is_victim" name="is_victim" checked={formData.is_victim === true || formData.is_victim === "true"} onChange={handleCheckboxChange} className="w-4 h-4 cursor-pointer" />
                  <label htmlFor="is_victim" className="text-sm font-bold cursor-pointer !text-black dark:!text-white">เข้าข่ายเป็นผู้เสียหายตกเป็นเหยื่อจากการค้ามนุษย์</label>
                </div>

                <div className="mb-5">
                  <label className={labelClass}>บันทึกรายละเอียดผลการคัดกรอง</label>
                  <textarea name="screening_details" value={formData.screening_details || ""} onChange={handleInputChange} rows={3} className={inputClass} />
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
                  <div><label className={labelClass}>วันเดือนปีเกิด</label><input type="date" name="date_of_birth" value={formData.date_of_birth || ""} onChange={handleInputChange} className={inputClass} /></div>
                  <div><label className={labelClass}>อายุปัจจุบัน (ปี)</label><input type="number" name="age" value={formData.age || ""} onChange={handleInputChange} className={inputClass} /></div>
                  <div><label className={labelClass}>เลขประจำตัวประชาชน *</label><input type="text" name="national_id" value={formData.national_id || ""} onChange={handleInputChange} required className={inputClass} /></div>
                </div>

                <h3 className="text-xl font-bold text-(--header) mb-4 mt-8">รายละเอียดที่อยู่และการทำงาน</h3>
                <div className="mb-5">
                  <label className={labelClass}>รายละเอียดที่อยู่ (บ้านเลขที่, ถนน, หมู่ ฯลฯ) *</label>
                  <textarea name="address_details" value={formData.address_details || ""} onChange={handleInputChange} required rows={2} className={inputClass} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
                  <div><label className={labelClass}>จังหวัด</label><AutocompleteInput name="province" value={formData.province || ""} options={provinces} onChange={handleInputChange} className={inputClass} /></div>
                  <div><label className={labelClass}>เขต/อำเภอ</label><AutocompleteInput name="district" value={formData.district || ""} options={districtOptions} onChange={handleInputChange} onSelectOption={handleSelectDistrict} className={inputClass} /></div>
                  <div><label className={labelClass}>แขวง/ตำบล</label><AutocompleteInput name="sub_district" value={formData.sub_district || ""} options={subDistrictOptions} onChange={handleInputChange} onSelectOption={handleSelectSubDistrict} className={inputClass} /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
                  <div><label className={labelClass}>อาคาร (Building)</label><input type="text" name="building" value={formData.building || ""} onChange={handleInputChange} className={inputClass} /></div>
                  <div><label className={labelClass}>ชั้น (Floor)</label><input type="text" name="floor" value={formData.floor || ""} onChange={handleInputChange} className={inputClass} /></div>
                  <div><label className={labelClass}>ห้อง (Room)</label><input type="text" name="room" value={formData.room || ""} onChange={handleInputChange} className={inputClass} /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                  <div><label className={labelClass}>ประเภทงาน (Job Type)</label><input type="text" name="job_type" value={formData.job_type || ""} onChange={handleInputChange} className={inputClass} /></div>
                  <div><label className={labelClass}>หน้าที่ (Role)</label><input type="text" name="role" value={formData.role || ""} onChange={handleInputChange} className={inputClass} /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
                  <div><label className={labelClass}>เงินเดือน (Salary)</label><input type="number" name="salary" value={formData.salary || ""} onChange={handleInputChange} className={inputClass} /></div>
                  <div><label className={labelClass}>จ่ายโดย (Paid By)</label><input type="text" name="paid_by" value={formData.paid_by || ""} onChange={handleInputChange} className={inputClass} /></div>
                  <div><label className={labelClass}>วิธีชำระเงิน (Payment Method)</label><input type="text" name="payment_method" value={formData.payment_method || ""} onChange={handleInputChange} className={inputClass} /></div>
                </div>

                <h3 className="text-xl font-bold text-(--header) mb-4 mt-8">รายละเอียดการส่งตัวและคดีความ</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
                  <div><label className={labelClass}>วันที่ส่งกลับประเทศ</label><input type="date" name="return_date" value={formData.return_date || ""} onChange={handleInputChange} className={inputClass} /></div>
                  <div><label className={labelClass}>จำนวนเคสคดี</label><input type="number" name="number_of_case" value={formData.number_of_case || ""} onChange={handleInputChange} className={inputClass} /></div>
                  <div><label className={labelClass}>จำนวนหมายจับ</label><input type="number" name="number_of_warrant" value={formData.number_of_warrant || ""} onChange={handleInputChange} className={inputClass} /></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                  <div><label className={labelClass}>ช่องทางส่งกลับ</label><input type="text" name="channel" value={formData.channel || ""} onChange={handleInputChange} className={inputClass} /></div>
                  <div><label className={labelClass}>หน่วยงานที่รับผิดชอบ</label><input type="text" name="responsible_agency" value={formData.responsible_agency || ""} onChange={handleInputChange} className={inputClass} /></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-1 gap-5 mb-5">
                  <div><label className={labelClass}>สถานะผู้เสียหาย (Victim Status)</label>
                     <select name="is_victim" value={formData.is_victim || "PENDING"} onChange={handleInputChange} className={inputClass}>
                       <option value="PENDING">PENDING</option><option value="YES">YES</option><option value="NO">NO</option>
                     </select>
                   </div>
                </div>
              </>
            )}

            {/* ---------------- หมายเหตุและปุ่มกด ---------------- */}
            <div className="mb-5 mt-8">
              <label className={labelClass}>หมายเหตุเพิ่มเติม (Note)</label>
              <textarea name="note" value={formData.note || ""} onChange={handleInputChange} rows={3} className={inputClass} />
            </div>

            <div className="flex justify-end gap-3 border-t border-(--wrapper) pt-6 mt-8">
              <button type="button" onClick={() => onCancel ? onCancel() : router.back()} className="flex items-center gap-1.5 px-4 py-2 bg-stone-200 dark:bg-stone-800 text-slate-800 dark:text-slate-200 font-bold rounded-lg hover:opacity-90 transition text-sm cursor-pointer"><X size={16} /> ยกเลิก</button>
              <button type="submit" disabled={isSaving} className="flex items-center gap-1.5 px-4 py-2 bg-(--header) text-background font-bold rounded-lg hover:opacity-90 transition text-sm cursor-pointer disabled:opacity-50"><Save size={16} /> {isSaving ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}</button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}