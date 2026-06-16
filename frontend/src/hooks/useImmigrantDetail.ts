import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export const getValidImageUrl = (url: string | null) => {
  if (!url) return null;
  if (url.startsWith("blob:")) return url;
  if (url.includes("drive.google.com/file/d/")) {
    const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w800`;
  } else if (url.includes("id=")) {
    const match = url.match(/id=([^&]+)/);
    if (match && match[1]) return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w800`;
  }
  if (url.startsWith("/")) {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
    return `${backendUrl}${url}`;
  }
  return url;
};

export function useImmigrantDetail(id: string) {
  const router = useRouter();
  const [person, setPerson] = useState<any | null>(null);
  const [personType, setPersonType] = useState<"deported" | "illegal" | null>(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const fetchData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

      let res = await fetch(`${backendUrl}/api/v1/immigrants/deported/${id}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setPerson(json.data); setPersonType("deported"); setNote(json.data.note || "");
          setFormData({ ...json.data, date_of_birth: json.data.date_of_birth?.split("T")[0] || "", return_date: json.data.return_date?.split("T")[0] || "" });
          setImagePreview(getValidImageUrl(json.data.photo_url)); return;
        }
      }

      res = await fetch(`${backendUrl}/api/v1/immigrants/illegal/${id}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setPerson(json.data); setPersonType("illegal"); setNote(json.data.note || "");
          setFormData({ ...json.data, detected_date: json.data.detected_date?.split("T")[0] || "" });
          setImagePreview(getValidImageUrl(json.data.photo_url)); return;
        }
      }
      setPerson(null); setPersonType(null);
    } catch (error) {
      console.error(error); setPerson(null); setPersonType(null);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [id]);

  const handleInputChange = (e: any) => setFormData((prev: any) => ({ ...prev, [e.target.name]: e.target.value }));
  const handleCheckboxChange = (e: any) => setFormData((prev: any) => ({ ...prev, [e.target.name]: e.target.checked }));
  const handleImageChange = (e: any) => {
    const file = e.target.files?.[0];
    if (file) { setSelectedImage(file); setImagePreview(URL.createObjectURL(file)); }
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
      Object.keys(payload).forEach(key => { if (payload[key] != null) submitData.append(key, payload[key]); });
      if (selectedImage) submitData.append("photo", selectedImage);

      const res = await fetch(`${backendUrl}/api/v1/immigrants/${endpoint}`, { method: "PUT", body: submitData });
      if (!res.ok) throw new Error("เกิดข้อผิดพลาดในการอัปเดตข้อมูล");
      
      alert("บันทึกการแก้ไขข้อมูลเรียบร้อยแล้ว!");
      setIsEditing(false); setSelectedImage(null); fetchData(); 
    } catch (error: any) { alert(error.message); } 
    finally { setIsSaving(false); }
  };

  return { 
    states: { person, personType, loading, note, isEditing, formData, isSaving, imagePreview }, 
    actions: { setNote, setIsEditing },
    handlers: { handleInputChange, handleCheckboxChange, handleImageChange, handleSave }
  };
}