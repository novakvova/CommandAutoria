// src/pages/CreateCar.tsx (або src/components/CreateCar.tsx)
import React, { useState, useRef } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

type PhotoInput = { url: string };

const apiBase = "http://localhost:5128";

const CreateCar: React.FC = () => {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    brand: "",
    model: "",
    year: "",
    price: "",
    condition: "",
    mileage: "",
    engineVolume: "",
    engineType: "",
    color: "",
    fuelConsumptionCity: "",
    fuelConsumptionHighway: "",
    transmission: "",
    driveType: "",
    description: "",
    number: "",
    vin: "",
  });

  const [photos, setPhotos] = useState<PhotoInput[]>([{ url: "" }]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>("");

  // ====== файловий пікер / завантаження на сервер ======
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const handlePickFiles = () => fileInputRef.current?.click();

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    try {
      setUploading(true);
      setUploadProgress(0);

      const fd = new FormData();
      Array.from(fileList).forEach((f) => fd.append("files", f));

      const res = await axios.post(`${apiBase}/api/uploads`, fd, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        onUploadProgress: (ev) => {
          if (!ev.total) return;
          setUploadProgress(Math.round((ev.loaded * 100) / ev.total));
        },
      });

      const urls: string[] = res.data?.urls || [];
      if (urls.length) {
        setPhotos((prev) => [...prev, ...urls.map((u) => ({ url: u }))]);
      }
    } catch (err: any) {
      setError(err?.response?.data || "Помилка завантаження файлів");
    } finally {
      setUploading(false);
      setUploadProgress(0);
      e.target.value = ""; // дозволяє обрати ті самі файли знову
    }
  };
  // ======================================================

  const resolveUrl = (u: string) => (u?.startsWith("http") ? u : `${apiBase}${u}`);

  const onChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onPhotoChange = (idx: number, value: string) => {
    setPhotos((prev) => {
      const next = [...prev];
      next[idx] = { url: value };
      return next;
    });
  };

  const addPhotoField = () => setPhotos((prev) => [...prev, { url: "" }]);
  const removePhotoField = (idx: number) =>
    setPhotos((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const payload = {
        brand: form.brand || null,
        model: form.model || null,
        year: Number(form.year) || 0,
        price: Number(form.price) || 0,
        condition: form.condition || null,
        mileage: Number(form.mileage) || 0,
        engineVolume: Number(form.engineVolume) || 0,
        engineType: form.engineType || null,
        color: form.color || null,
        fuelConsumptionCity: form.fuelConsumptionCity || null,
        fuelConsumptionHighway: form.fuelConsumptionHighway || null,
        transmission: form.transmission || null,
        driveType: form.driveType || null,
        description: form.description || null,
        number: form.number || null,
        vin: form.vin || null,
        photos: photos
          .map((p) => (p.url || "").trim())
          .filter((u) => u.length > 0)
          .map((u) => ({ url: u })),
      };

      await axios.post(`${apiBase}/api/cars`, payload, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      navigate("/cars");
    } catch (err: any) {
      const api = err?.response?.data;
      setError(api?.title || api || "Не вдалося створити авто");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Створення авто</h1>
          <button
            onClick={() => navigate("/cars")}
            className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
          >
            Назад
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 sm:p-6">
        <form onSubmit={handleSubmit} className="bg-white p-4 sm:p-6 rounded-lg shadow space-y-4">
          {error && <div className="text-red-600 whitespace-pre-line">{error}</div>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input name="brand" placeholder="Марка*" value={form.brand} onChange={onChange} className="border p-2 rounded" required />
            <input name="model" placeholder="Модель*" value={form.model} onChange={onChange} className="border p-2 rounded" required />
            <input name="year" placeholder="Рік*" value={form.year} onChange={onChange} className="border p-2 rounded" type="number" required />
            <input name="price" placeholder="Ціна, $" value={form.price} onChange={onChange} className="border p-2 rounded" type="number" />
            <input name="condition" placeholder="Стан (новий/б/в)" value={form.condition} onChange={onChange} className="border p-2 rounded" />
            <input name="mileage" placeholder="Пробіг, км" value={form.mileage} onChange={onChange} className="border p-2 rounded" type="number" />
            <input name="engineVolume" placeholder="Обʼєм двигуна, л" value={form.engineVolume} onChange={onChange} className="border p-2 rounded" type="number" step="0.1" />
            <input name="engineType" placeholder="Тип двигуна" value={form.engineType} onChange={onChange} className="border p-2 rounded" />
            <input name="color" placeholder="Колір" value={form.color} onChange={onChange} className="border p-2 rounded" />
            <input name="fuelConsumptionCity" placeholder="Витрата (місто)" value={form.fuelConsumptionCity} onChange={onChange} className="border p-2 rounded" />
            <input name="fuelConsumptionHighway" placeholder="Витрата (траса)" value={form.fuelConsumptionHighway} onChange={onChange} className="border p-2 rounded" />
            <input name="transmission" placeholder="Коробка передач" value={form.transmission} onChange={onChange} className="border p-2 rounded" />
            <input name="driveType" placeholder="Привід" value={form.driveType} onChange={onChange} className="border p-2 rounded" />
            <input name="number" placeholder="Номер" value={form.number} onChange={onChange} className="border p-2 rounded" />
            <input name="vin" placeholder="VIN" value={form.vin} onChange={onChange} className="border p-2 rounded" />
          </div>

          {/* Фото: URL + завантаження файлів */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-semibold">Фото (URL або завантаження):</div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePickFiles}
                  className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200"
                  disabled={uploading}
                >
                  {uploading ? `Завантаження… ${uploadProgress}%` : "Завантажити з комп’ютера"}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFilesSelected}
                />
              </div>
            </div>

            {photos.map((p, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <input
                  value={p.url}
                  onChange={(e) => onPhotoChange(idx, e.target.value)}
                  placeholder={`https://.../photo-${idx + 1}.jpg`}
                  className="border p-2 rounded flex-1"
                />
                {p.url && (
                  <img
                    src={resolveUrl(p.url)}
                    alt={`preview-${idx + 1}`}
                    className="w-16 h-16 object-cover rounded border"
                  />
                )}
                {photos.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePhotoField(idx)}
                    className="px-3 py-2 rounded bg-red-100 text-red-600 hover:bg-red-200"
                    title="Прибрати"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}

            <button
              type="button"
              onClick={addPhotoField}
              className="px-4 py-2 rounded bg-gray-100 hover:bg-gray-200"
            >
              Додати ще фото (URL)
            </button>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 disabled:opacity-60"
            >
              {submitting ? "Збереження..." : "Створити авто"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default CreateCar;
