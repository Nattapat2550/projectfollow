"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Save, X, Image as ImageIcon } from "lucide-react";
import { useAddressOptions } from "@/hooks/useAddressOptions";
import AutocompleteInput from "@/components/ui/AutocompleteInput";
import { ALL_NATIONALITIES } from "@/constants/nationalities";

interface ImmigrantEditFormProps {
  id: string;
  personType: "illegal" | "repatriated";
}

export default function ImmigrantEditForm({ id, personType }: ImmigrantEditFormProps) {
  const router = useRouter();

  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [passportImagePreview, setPassportImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [passportFile, setPassportFile] = useState<File | null>(null);

  // กำหนดรูป Default ตามประเภท (คุณสามารถปรับ Path รูปให้ตรงกับในโฟลเดอร์ public ของคุณได้)
  const defaultImage = personType === "illegal" ? "/enter.png" : "/return.png";

  // 🟢 ปรับลดขนาดฟอนต์ด้วย text-sm
  const inputClass = "w-full border p-2 text-sm rounded bg-background !text-black dark:!text-white border-(--wrapper)";
  const labelClass = "block text-xs font-bold mb-2 !text-black dark:!text-white";

  // Address Hooks สำหรับฟอร์มทั้ง 2 แบบ
  const { provinces, districtOptions, subDistrictOptions } = useAddressOptions(formData.province || "", formData.district || "");
  const { provinces: detProvinces, districtOptions: detDistrictOptions, subDistrictOptions: detSubDistrictOptions } = useAddressOptions(formData.detected_location_province || "", formData.detected_location_district || "");

  // 1. Fetch Existing Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
        const res = await fetch(`${backendUrl}/api/v1/immigrants/${personType}/${id}`);
        if (!res.ok) throw new Error("ไม่สามารถโหลดข้อมูลได้");
        const json = await res.json();
        
        // ฟอร์แมตวันที่ให้รองรับ input type="date" (YYYY-MM-DD)
        if (json.detected_date) json.detected_date = new Date(json.detected_date).toISOString().split('T')[0];
        if (json.date_of_birth) json.date_of_birth = new Date(json.date_of_birth).toISOString().split('T')[0];
        if (json.return_date) json.return_date = new Date(json.return_date).toISOString().split('T')[0];
        
        setFormData(json);
        if (json.photo_url) setImagePreview(json.photo_url);
        if (json.passport_photo_url) setPassportImagePreview(json.passport_photo_url);
      } catch (error) {
        console.error(error);
        alert("เกิดข้อผิดพลาดในการดึงข้อมูล");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
  }, [id, personType]);

  // 2. Handlers
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

  // 3. Save Data
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
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
      router.push(`/immigrants/${personType}`);
      router.refresh();
    } catch (error) {
      console.error(error);
      alert("เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="p-10 text-center">กำลังโหลดข้อมูล...</div>;

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
            {/* ---------------- รูปภาพ (แชร์ร่วมกัน) ---------------- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6 bg-background p-6 rounded-xl border border-(--wrapper)">
              <div>
                <h3 className="text-lg font-bold text-(--header) mb-4">รูปภาพประจำตัว</h3>
                <div className="flex flex-col items-start gap-4">
                  {/* 🟢 แสดงรูป Default หากไม่มีรูป */}
                  <img src={imagePreview || defaultImage} alt="Preview" referrerPolicy="no-referrer" className="h-40 w-40 object-cover rounded-xl border border-(--wrapper) shadow-sm bg-stone-100 dark:bg-stone-800" />
                  <label className="flex items-center gap-2 px-4 py-2 bg-slate-800 dark:bg-slate-600 text-white rounded-md cursor-pointer hover:opacity-90 text-sm">
                    <ImageIcon size={16} /> {imagePreview ? "แก้ไขรูปประจำตัว" : "อัปโหลดรูปประจำตัว"}
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-(--header) mb-4">รูปถ่ายพาสปอร์ต</h3>
                <div className="flex flex-col items-start gap-4">
                  {/* 🟢 แสดงรูป Default หากไม่มีรูป */}
                  <img src={passportImagePreview || defaultImage} alt="Passport Preview" referrerPolicy="no-referrer" className="h-40 w-40 object-cover rounded-xl border border-(--wrapper) shadow-sm bg-stone-100 dark:bg-stone-800" />
                  <label className="flex items-center gap-2 px-4 py-2 bg-slate-800 dark:bg-slate-600 text-white rounded-md cursor-pointer hover:opacity-90 text-sm">
                    <ImageIcon size={16} /> {passportImagePreview ? "แก้ไขรูปพาสปอร์ต" : "อัปโหลดรูปพาสปอร์ต"}
                    <input type="file" accept="image/*" onChange={handlePassportImageChange} className="hidden" />
                  </label>
                </div>
              </div>
            </div>

            {/* ---------------- ข้อมูลส่วนบุคคล (แชร์ร่วมกัน) ---------------- */}
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
                {/* ---------- ฟอร์มลอบเข้าเมือง ---------- */}
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
                  <input type="checkbox" id="is_victim_illegal" name="is_victim" checked={formData.is_victim === true || formData.is_victim === "true"} onChange={handleCheckboxChange} className="w-4 h-4 cursor-pointer" />
                  <label htmlFor="is_victim_illegal" className="text-sm font-bold cursor-pointer text-black! dark:text-white!">เข้าข่ายเป็นผู้เสียหายตกเป็นเหยื่อจากการค้ามนุษย์</label>
                </div>

                <div className="mb-5">
                  <label className={labelClass}>บันทึกรายละเอียดผลการคัดกรอง</label>
                  <textarea name="screening_details" value={formData.screening_details || ""} onChange={handleInputChange} rows={3} className={inputClass} />
                </div>
              </>
            ) : (
              <>
                {/* ---------- ฟอร์มผู้ถูกส่งกลับ ---------- */}
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

            {/* ---------------- หมายเหตุและปุ่มกด (แชร์ร่วมกัน) ---------------- */}
            <div className="mb-5 mt-8">
              <label className={labelClass}>หมายเหตุเพิ่มเติม (Note)</label>
              <textarea name="note" value={formData.note || ""} onChange={handleInputChange} rows={3} className={inputClass} />
            </div>

            <div className="flex justify-end gap-3 border-t border-(--wrapper) pt-6 mt-8">
              <button type="button" onClick={() => router.back()} className="flex items-center gap-1.5 px-4 py-2 bg-stone-200 dark:bg-stone-800 text-slate-800 dark:text-slate-200 font-bold rounded-lg hover:opacity-90 transition text-sm cursor-pointer"><X size={16} /> ยกเลิก</button>
              <button type="submit" disabled={isSaving} className="flex items-center gap-1.5 px-4 py-2 bg-(--header) text-background font-bold rounded-lg hover:opacity-90 transition text-sm cursor-pointer disabled:opacity-50"><Save size={16} /> {isSaving ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}</button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}