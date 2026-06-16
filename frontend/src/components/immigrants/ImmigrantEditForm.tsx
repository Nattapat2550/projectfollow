import React from "react";
import { Save, X } from "lucide-react";

export default function ImmigrantEditForm({ 
  personType, formData, isSaving, imagePreview, 
  handlers, onCancel 
}: any) {
  const { handleInputChange, handleCheckboxChange, handleImageChange, handleSave } = handlers;
  
  return (
    <form onSubmit={handleSave} className="max-w-4xl mx-auto bg-(--container) border border-(--wrapper) rounded-2xl p-6 md:p-8 shadow-sm transition-colors mb-12">
      <h3 className="text-xl font-bold text-(--header) mb-6 border-b border-(--wrapper) pb-3">รูปภาพประจำตัว</h3>
      <div className="mb-6 flex flex-col items-start gap-4">
        {imagePreview && <img src={imagePreview} alt="Preview" referrerPolicy="no-referrer" className="h-40 w-40 object-cover rounded-xl border border-(--wrapper) shadow-sm" />}
        <input type="file" accept="image/*" onChange={handleImageChange} className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-stone-200 dark:file:bg-stone-800 cursor-pointer" />
      </div>

      <h3 className="text-xl font-bold text-(--header) mb-6 border-b border-(--wrapper) pb-3 mt-8">ข้อมูลส่วนบุคคลและชื่อ-นามสกุล</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
        <div><label className="block text-xs font-bold mb-2">ชื่อต้นภาษาไทย *</label><input type="text" name="first_name_th" value={formData.first_name_th || ""} onChange={handleInputChange} required className="w-full border p-2 rounded" /></div>
        <div><label className="block text-xs font-bold mb-2">ชื่อกลางภาษาไทย</label><input type="text" name="middle_name_th" value={formData.middle_name_th || ""} onChange={handleInputChange} className="w-full border p-2 rounded" /></div>
        <div><label className="block text-xs font-bold mb-2">นามสกุลภาษาไทย *</label><input type="text" name="last_name_th" value={formData.last_name_th || ""} onChange={handleInputChange} required className="w-full border p-2 rounded" /></div>
      </div>
      
      {personType === "deported" ? (
        <>
          <h3 className="text-xl font-bold text-(--header) mb-6 border-b border-(--wrapper) pb-3 mt-8">รายละเอียดการส่งตัวและคดีความ</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
             <div><label className="block text-xs font-bold mb-2">เลขบัตรประชาชน *</label><input type="text" name="national_id" value={formData.national_id || ""} onChange={handleInputChange} required className="w-full border p-2 rounded" /></div>
             <div><label className="block text-xs font-bold mb-2">วันที่ส่งกลับ</label><input type="date" name="return_date" value={formData.return_date || ""} onChange={handleInputChange} className="w-full border p-2 rounded" /></div>
             <div><label className="block text-xs font-bold mb-2">สถานะผลลัพธ์คดี</label>
               <select name="result" value={formData.result || "PENDING"} onChange={handleInputChange} className="w-full border p-2 rounded">
                 <option value="PENDING">PENDING</option><option value="SUCCESS">SUCCESS</option><option value="FAILED">FAILED</option>
               </select>
             </div>
          </div>
        </>
      ) : (
        <>
          <h3 className="text-xl font-bold text-(--header) mb-6 border-b border-(--wrapper) pb-3 mt-8">รายละเอียดจุดตรวจเจอและการคัดกรอง</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
             <div><label className="block text-xs font-bold mb-2">วันที่ตรวจพบ</label><input type="date" name="detected_date" value={formData.detected_date || ""} onChange={handleInputChange} className="w-full border p-2 rounded" /></div>
             <div><label className="block text-xs font-bold mb-2">สถานที่ตรวจเจอ</label><input type="text" name="detected_location" value={formData.detected_location || ""} onChange={handleInputChange} className="w-full border p-2 rounded" /></div>
          </div>
          <div className="mb-5 flex items-center gap-2 bg-background p-4 rounded-xl border border-(--wrapper)">
            <input type="checkbox" id="is_victim" name="is_victim" checked={formData.is_victim === true || formData.is_victim === "true"} onChange={handleCheckboxChange} className="w-4 h-4 cursor-pointer" />
            <label htmlFor="is_victim" className="text-sm font-bold cursor-pointer">เข้าข่ายเป็นผู้เสียหายตกเป็นเหยื่อจากการค้ามนุษย์</label>
          </div>
        </>
      )}

      <div className="flex justify-end gap-3 border-t border-(--wrapper) pt-6 mt-8">
        <button type="button" onClick={onCancel} className="flex items-center gap-1.5 px-4 py-2 bg-stone-200 text-slate-800 font-bold rounded-lg hover:opacity-90 transition text-sm cursor-pointer"><X size={16} /> ยกเลิก</button>
        <button type="submit" disabled={isSaving} className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:opacity-90 transition text-sm cursor-pointer disabled:opacity-50"><Save size={16} /> {isSaving ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}</button>
      </div>
    </form>
  );
}