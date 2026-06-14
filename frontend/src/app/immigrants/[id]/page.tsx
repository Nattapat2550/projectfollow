"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChevronLeft, Save, X } from "lucide-react";

import DeportedCard from "@/components/immigrants/DeportedCard";
import IllegalCard from "@/components/immigrants/IllegalCard";
import RightPanel from "@/components/immigrants/RightPanel";

export default function ImmigrantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [person, setPerson] = useState<any | null>(null);
  const [personType, setPersonType] = useState<"deported" | "illegal" | null>(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");

  // States สำหรับโหมดแก้ไขข้อมูล
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);

  // States สำหรับจัดการไฟล์รูปภาพและการพรีวิว
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // 🛠️ แก้ไข fetchData ให้ยิงหา API แบบรายคนโดยตรง
  const fetchData = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

      // 1. ลองค้นหาในฝั่งผู้ถูกส่งกลับ (Deported) ก่อน
      let res = await fetch(`${backendUrl}/api/v1/immigrants/deported/${id}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const foundDep = json.data;
          setPerson(foundDep);
          setPersonType("deported");
          setNote(foundDep.note || "");
          setFormData({
            ...foundDep,
            date_of_birth: foundDep.date_of_birth ? foundDep.date_of_birth.split("T")[0] : "",
            return_date: foundDep.return_date ? foundDep.return_date.split("T")[0] : "",
          });
          setImagePreview(foundDep.photo_url || null);
          return; // เจอแล้ว หยุดการทำงานเลย
        }
      }

      // 2. ถ้าไม่เจอในฝั่งส่งกลับ ให้ลองค้นหาในฝั่งลอบเข้าเมือง (Illegal)
      res = await fetch(`${backendUrl}/api/v1/immigrants/illegal/${id}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const foundIll = json.data;
          setPerson(foundIll);
          setPersonType("illegal");
          setNote(foundIll.note || "");
          setFormData({
            ...foundIll,
            detected_date: foundIll.detected_date ? foundIll.detected_date.split("T")[0] : "",
          });
          setImagePreview(foundIll.photo_url || null);
          return; // เจอแล้ว หยุดการทำงานเลย
        }
      }

      // 3. ถ้าหาไม่เจอทั้งสองฝั่ง
      setPerson(null);
      setPersonType(null);

    } catch (error) {
      console.error("Error fetching details:", error);
      setPerson(null);
      setPersonType(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: checked }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file)); 
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
      const endpoint = personType === "deported" ? `deported/${id}` : `illegal/${id}`;

      const payload = { ...formData };
      if (personType === "deported") {
        payload.number_of_case = parseInt(payload.number_of_case) || 0;
        payload.number_of_warrant = parseInt(payload.number_of_warrant) || 0;
        payload.age = parseInt(payload.age) || null;
      }

      const submitData = new FormData();
      
      Object.keys(payload).forEach((key) => {
        if (payload[key] !== null && payload[key] !== undefined) {
          submitData.append(key, payload[key]);
        }
      });

      if (selectedImage) {
        submitData.append("photo", selectedImage);
      }

      const res = await fetch(`${backendUrl}/api/v1/immigrants/${endpoint}`, {
        method: "PUT",
        body: submitData, 
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || errorData.message || "เกิดข้อผิดพลาดในการอัปเดตข้อมูล");
      }

      alert("บันทึกการแก้ไขข้อมูลเรียบร้อยแล้ว!");
      setIsEditing(false);
      setSelectedImage(null); 
      fetchData(); 
    } catch (error: any) {
      console.error("Error updating data:", error);
      alert(error.message || "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์เพื่อบันทึกข้อมูลได้");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-foreground">
        กำลังโหลดข้อมูล...
      </div>
    );
  }

  if (!person || !personType) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background text-foreground gap-4">
        <p className="text-xl font-bold text-red-500">ไม่พบข้อมูล ID: "{id}" ในฐานข้อมูล</p>
        <button 
          onClick={() => router.back()}
          className="px-4 py-2 bg-slate-200 text-slate-800 border border-slate-300 rounded-md hover:opacity-80 cursor-pointer"
        >
          ย้อนกลับ
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 text-foreground transition-colors duration-200">
      <div className="max-w-7xl mx-auto mb-6">
        <button
          onClick={() => isEditing ? setIsEditing(false) : router.back()}
          className="flex items-center gap-1 text-2xl font-bold text-(--header) hover:opacity-80 transition cursor-pointer"
        >
          <ChevronLeft size={32} />
          <span>
            {isEditing 
              ? `แก้ไขฟอร์ม (${personType === "deported" ? "ผู้ถูกส่งตัวกลับ" : "ผู้แอบเข้าประเทศ"})` 
              : `รายละเอียด (${personType === "deported" ? "ผู้ถูกส่งตัวกลับ" : "ผู้แอบเข้าประเทศ"})`
            }
          </span>
        </button>
      </div>

      {isEditing ? (
        /* ==================== โหมดแบบฟอร์มการแก้ไขข้อมูลความละเอียดสูง ==================== */
        <form onSubmit={handleSave} className="max-w-4xl mx-auto bg-(--container) border border-(--wrapper) rounded-2xl p-6 md:p-8 shadow-sm transition-colors mb-12">
          
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
              className="w-full bg-background border border-(--wrapper) text-foreground rounded-md p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-(--header)/40 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-stone-200 dark:file:bg-stone-800 file:text-foreground hover:file:opacity-80 cursor-pointer"
            />
          </div>

          <h3 className="text-xl font-bold text-(--header) mb-6 border-b border-(--wrapper) pb-3 mt-8">ข้อมูลส่วนบุคคลและชื่อ-นามสกุล</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
            <div>
              <label className="block text-xs font-bold mb-2 text-stone-600 dark:text-slate-300">ชื่อต้นภาษาไทย *</label>
              <input
                type="text"
                name="first_name_th"
                value={formData.first_name_th || ""}
                onChange={handleInputChange}
                required
                className="w-full bg-background border border-(--wrapper) text-foreground rounded-md p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-(--header)/40"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-2 text-stone-600 dark:text-slate-300">ชื่อกลางภาษาไทย (ถ้ามี)</label>
              <input
                type="text"
                name="middle_name_th"
                value={formData.middle_name_th || ""}
                onChange={handleInputChange}
                className="w-full bg-background border border-(--wrapper) text-foreground rounded-md p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-(--header)/40"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-2 text-stone-600 dark:text-slate-300">นามสกุลภาษาไทย *</label>
              <input
                type="text"
                name="last_name_th"
                value={formData.last_name_th || ""}
                onChange={handleInputChange}
                required
                className="w-full bg-background border border-(--wrapper) text-foreground rounded-md p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-(--header)/40"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
            <div>
              <label className="block text-xs font-bold mb-2 text-stone-600 dark:text-slate-300">ชื่อต้นภาษาอังกฤษ (First Name)</label>
              <input
                type="text"
                name="first_name_en"
                value={formData.first_name_en || ""}
                onChange={handleInputChange}
                className="w-full bg-background border border-(--wrapper) text-foreground rounded-md p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-(--header)/40"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-2 text-stone-600 dark:text-slate-300">ชื่อกลางภาษาอังกฤษ (Middle Name)</label>
              <input
                type="text"
                name="middle_name_en"
                value={formData.middle_name_en || ""}
                onChange={handleInputChange}
                className="w-full bg-background border border-(--wrapper) text-foreground rounded-md p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-(--header)/40"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-2 text-stone-600 dark:text-slate-300">นามสกุลภาษาอังกฤษ (Last Name)</label>
              <input
                type="text"
                name="last_name_en"
                value={formData.last_name_en || ""}
                onChange={handleInputChange}
                className="w-full bg-background border border-(--wrapper) text-foreground rounded-md p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-(--header)/40"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
            <div>
              <label className="block text-xs font-bold mb-2 text-stone-600 dark:text-slate-300">เลขหนังสือเดินทาง (Passport ID)</label>
              <input
                type="text"
                name="passport_id"
                value={formData.passport_id || ""}
                onChange={handleInputChange}
                className="w-full bg-background border border-(--wrapper) text-foreground rounded-md p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-(--header)/40"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-2 text-stone-600 dark:text-slate-300">สัญชาติ (Nationality)</label>
              <input
                type="text"
                name="nationality"
                value={formData.nationality || ""}
                onChange={handleInputChange}
                className="w-full bg-background border border-(--wrapper) text-foreground rounded-md p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-(--header)/40"
              />
            </div>
          </div>

          {personType === "deported" ? (
            /* ================= ฟิลด์เฉพาะของบุคคลส่งกลับ ================= */
            <>
              <h3 className="text-xl font-bold text-(--header) mb-6 border-b border-(--wrapper) pb-3 mt-8">รายละเอียดการส่งตัวและคดีความ</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
                <div>
                  <label className="block text-xs font-bold mb-2 text-stone-600 dark:text-slate-300">เลขประจำตัวประชาชน (National ID) *</label>
                  <input
                    type="text"
                    name="national_id"
                    value={formData.national_id || ""}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-background border border-(--wrapper) text-foreground rounded-md p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-(--header)/40"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-2 text-stone-600 dark:text-slate-300">วันเดือนปีเกิด</label>
                  <input
                    type="date"
                    name="date_of_birth"
                    value={formData.date_of_birth || ""}
                    onChange={handleInputChange}
                    className="w-full bg-background border border-(--wrapper) text-foreground rounded-md p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-(--header)/40"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-2 text-stone-600 dark:text-slate-300">อายุปัจจุบัน (ปี)</label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age || ""}
                    onChange={handleInputChange}
                    className="w-full bg-background border border-(--wrapper) text-foreground rounded-md p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-(--header)/40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
                <div>
                  <label className="block text-xs font-bold mb-2 text-stone-600 dark:text-slate-300">วันที่ส่งกลับประเทศ</label>
                  <input
                    type="date"
                    name="return_date"
                    value={formData.return_date || ""}
                    onChange={handleInputChange}
                    className="w-full bg-background border border-(--wrapper) text-foreground rounded-md p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-(--header)/40"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-2 text-stone-600 dark:text-slate-300">จำนวนเคสคดี (Case ID)</label>
                  <input
                    type="number"
                    name="number_of_case"
                    value={formData.number_of_case ?? 0}
                    onChange={handleInputChange}
                    className="w-full bg-background border border-(--wrapper) text-foreground rounded-md p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-(--header)/40"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-2 text-stone-600 dark:text-slate-300">จำนวนหมายจับ</label>
                  <input
                    type="number"
                    name="number_of_warrant"
                    value={formData.number_of_warrant ?? 0}
                    onChange={handleInputChange}
                    className="w-full bg-background border border-(--wrapper) text-foreground rounded-md p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-(--header)/40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                <div>
                  <label className="block text-xs font-bold mb-2 text-stone-600 dark:text-slate-300">ช่องทางส่งกลับ</label>
                  <input
                    type="text"
                    name="channel"
                    value={formData.channel || ""}
                    onChange={handleInputChange}
                    className="w-full bg-background border border-(--wrapper) text-foreground rounded-md p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-(--header)/40"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-2 text-stone-600 dark:text-slate-300">สถานะผลลัพธ์คดี</label>
                  <select
                    name="result"
                    value={formData.result || "PENDING"}
                    onChange={handleInputChange}
                    className="w-full bg-background border border-(--wrapper) text-foreground rounded-md p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-(--header)/40"
                  >
                    <option value="PENDING">PENDING</option>
                    <option value="SUCCESS">SUCCESS</option>
                    <option value="FAILED">FAILED</option>
                  </select>
                </div>
              </div>

              <div className="mb-5">
                <label className="block text-xs font-bold mb-2 text-stone-600 dark:text-slate-300">ภูมิลำเนา / ที่อยู่</label>
                <textarea
                  name="address"
                  value={formData.address || ""}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full bg-background border border-(--wrapper) text-foreground rounded-md p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-(--header)/40"
                />
              </div>
            </>
          ) : (
            /* ================= ฟิลด์เฉพาะของบุคคลแอบเข้าเมือง ================= */
            <>
              <h3 className="text-xl font-bold text-(--header) mb-6 border-b border-(--wrapper) pb-3 mt-8">รายละเอียดจุดตรวจเจอและการคัดกรอง</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
                <div>
                  <label className="block text-xs font-bold mb-2 text-stone-600 dark:text-slate-300">เพศ</label>
                  <select
                    name="gender"
                    value={formData.gender || ""}
                    onChange={handleInputChange}
                    className="w-full bg-background border border-(--wrapper) text-foreground rounded-md p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-(--header)/40"
                  >
                    <option value="">ไม่ระบุ</option>
                    <option value="ชาย">ชาย</option>
                    <option value="หญิง">หญิง</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold mb-2 text-stone-600 dark:text-slate-300">วันที่ตรวจพบการแอบเข้าประเทศ</label>
                  <input
                    type="date"
                    name="detected_date"
                    value={formData.detected_date || ""}
                    onChange={handleInputChange}
                    className="w-full bg-background border border-(--wrapper) text-foreground rounded-md p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-(--header)/40"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-2 text-stone-600 dark:text-slate-300">สถานที่ตรวจเจอพิกัด</label>
                  <input
                    type="text"
                    name="detected_location"
                    value={formData.detected_location || ""}
                    onChange={handleInputChange}
                    className="w-full bg-background border border-(--wrapper) text-foreground rounded-md p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-(--header)/40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                <div>
                  <label className="block text-xs font-bold mb-2 text-stone-600 dark:text-slate-300">สถานที่ทำงานปลายทาง</label>
                  <input
                    type="text"
                    name="workplace"
                    value={formData.workplace || ""}
                    onChange={handleInputChange}
                    className="w-full bg-background border border-(--wrapper) text-foreground rounded-md p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-(--header)/40"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-2 text-stone-600 dark:text-slate-300">ข้อมูลหมายจับเคสเดิม</label>
                  <input
                    type="text"
                    name="warrant"
                    value={formData.warrant || ""}
                    onChange={handleInputChange}
                    className="w-full bg-background border border-(--wrapper) text-foreground rounded-md p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-(--header)/40"
                  />
                </div>
              </div>

              <div className="mb-5 flex items-center gap-2 bg-background p-4 rounded-xl border border-(--wrapper)">
                <input
                  type="checkbox"
                  id="is_victim"
                  name="is_victim"
                  checked={formData.is_victim === true || formData.is_victim === "true"}
                  onChange={handleCheckboxChange}
                  className="w-4 h-4 text-(--header) focus:ring-(--header) border-gray-300 rounded cursor-pointer"
                />
                <label htmlFor="is_victim" className="text-sm font-bold cursor-pointer select-none">
                  เข้าข่ายเป็นผู้เสียหายตกเป็นเหยื่อจากการค้ามนุษย์
                </label>
              </div>

              <div className="mb-5">
                <label className="block text-xs font-bold mb-2 text-stone-600 dark:text-slate-300">บันทึกรายละเอียดผลการคัดกรอง</label>
                <textarea
                  name="screening_details"
                  value={formData.screening_details || ""}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full bg-background border border-(--wrapper) text-foreground rounded-md p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-(--header)/40"
                />
              </div>
            </>
          )}

          {/* ปุ่มควบคุมส่วนล่างของหน้าฟอร์ม */}
          <div className="flex justify-end gap-3 border-t border-(--wrapper) pt-6 mt-8">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="flex items-center gap-1.5 px-4 py-2 bg-stone-200 dark:bg-stone-800 text-foreground font-bold rounded-lg hover:opacity-90 active:scale-[0.98] transition text-sm cursor-pointer"
            >
              <X size={16} />
              <span>ยกเลิก</span>
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:opacity-90 active:scale-[0.98] transition text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={16} />
              <span>{isSaving ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}</span>
            </button>
          </div>
        </form>
      ) : (
        /* ==================== โหมดหน้าจอแดชบอร์ดแสดงผลปกติ ==================== */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-7xl mx-auto items-start">
          <div className="lg:col-span-7 xl:col-span-8 w-full">
            {personType === "deported" ? (
              <DeportedCard data={person} />
            ) : (
              <IllegalCard data={person} />
            )}
          </div>

          <div className="lg:col-span-5 xl:col-span-4 w-full">
            <RightPanel 
              type={personType} 
              data={person} 
              note={note} 
              setNote={setNote} 
              onEditClick={() => setIsEditing(true)} 
            />
          </div>
        </div>
      )}
    </div>
  );
}