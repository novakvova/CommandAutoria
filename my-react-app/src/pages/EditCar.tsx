import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";

type Photo = { id?: number; url: string };

type Car = {
  id: number;
  brand: string;
  model: string;
  year: number;
  price: number;
  condition?: string;
  mileage?: number;
  engineVolume?: number;
  engineType?: string;
  color?: string;
  fuelConsumptionCity?: string;
  fuelConsumptionHighway?: string;
  transmission?: string;
  driveType?: string;
  description?: string;
  number?: string;
  vin?: string;
  photo?: string;     // fallback зі старого поля
  photos?: Photo[];   // новий масив фото
};

const apiBase = "http://localhost:5128";

const EditCar: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const carId = Number(id);
  const navigate = useNavigate();
  const { token } = useAuth();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Зберігаємо числа як числа — інпути приймають number OK
  const [form, setForm] = useState<Omit<Car, "photos" | "photo">>({
    id: carId,
    brand: "",
    model: "",
    year: 0,
    price: 0,
    condition: "",
    mileage: 0,
    engineVolume: 0,
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

  const [photos, setPhotos] = useState<Photo[]>([{ url: "" }]);

  // Завантаження файлів
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const resolveUrl = (u: string) => (u?.startsWith("http") ? u : `${apiBase}${u}`);

  // Завантажити поточні дані авто
  useEffect(() => {
    const fetchCar = async () => {
      try {
        const res = await axios.get(`${apiBase}/api/cars/${carId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        const car: Car = res.data;

        setForm({
          id: car.id,
          brand: car.brand,
          model: car.model,
          year: car.year,
          price: car.price,
          condition: car.condition || "",
          mileage: car.mileage || 0,
          engineVolume: car.engineVolume || 0,
          engineType: car.engineType || "",
          color: car.color || "",
          fuelConsumptionCity: car.fuelConsumptionCity || "",
          fuelConsumptionHighway: car.fuelConsumptionHighway || "",
          transmission: car.transmission || "",
          driveType: car.driveType || "",
          description: car.description || "",
          number: car.number || "",
          vin: car.vin || "",
        });

        const initialPhotos: Photo[] = Array.isArray(car.photos) ? [...car.photos] : [];
        if (car.photo) initialPhotos.unshift({ url: car.photo }); // на випадок старих записів
        setPhotos(initialPhotos.length ? initialPhotos : [{ url: "" }]);
      } catch (e: any) {
        setError("Не вдалося завантажити авто для редагування");
      } finally {
        setLoading(false);
      }
    };
    fetchCar();
  }, [carId, token]);

  const onChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]:
        name === "year" || name === "price" || name === "mileage" || name === "engineVolume"
          ? Number(value)
          : value,
    }));
  };

  const onPhotoChange = (idx: number, value: string) => {
    setPhotos(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], url: value };
      return next;
    });
  };

  const addPhotoField = () => setPhotos(prev => [...prev, { url: "" }]);
  const removePhotoField = (idx: number) =>
    setPhotos(prev => prev.filter((_, i) => i !== idx));

  const movePhoto = (from: number, to: number) => {
    if (to < 0 || to >= photos.length) return;
    setPhotos(prev => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  };

  const handlePickFiles = () => fileInputRef.current?.click();

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    try {
      setUploading(true);
      setUploadProgress(0);

      const fd = new FormData();
      Array.from(fileList).forEach(f => fd.append("files", f));

      const res = await axios.post(`${apiBase}/api/uploads`, fd, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        onUploadProgress: (ev) => {
          if (!ev.total) return;
          setUploadProgress(Math.round((ev.loaded * 100) / ev.total));
        }
      });

      const urls: string[] = res.data?.urls || [];
      if (urls.length) {
        // Нові фото без id — бекенд створить
        setPhotos(prev => [...prev, ...urls.map(u => ({ url: u }))]);
      }
    } catch (err: any) {
      setError(err?.response?.data || "Помилка завантаження файлів");
    } finally {
      setUploading(false);
      setUploadProgress(0);
      e.target.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const payload = {
        ...form,
        // лишаємо тільки непорожні урли; існуючим фото передаємо id
        photos: photos
          .map(p => ({ id: p.id, url: (p.url || "").trim() }))
          .filter(p => p.url.length > 0),
        // старе поле не використовуємо
        photo: null as any,
      };

      await axios.put(`${apiBase}/api/cars/${carId}`, payload, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      navigate(`/cars/${carId}`);
    } catch (err: any) {
      setError(err?.response?.data?.title || "Не вдалося оновити авто");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center mt-10">Завантаження…</div>;
  if (error) return <div className="text-center text-red-600 mt-10">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Редагування авто</h1>
          <div className="flex gap-2">
            <button
              onClick={() => navigate(`/cars/${carId}`)}
              className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
            >
              Скасувати
            </button>
            <button
              form="edit-car-form"
              type="submit"
              className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700 disabled:opacity-60"
              disabled={submitting}
            >
              {submitting ? "Збереження…" : "Зберегти"}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 sm:p-6">
        <form id="edit-car-form" onSubmit={handleSubmit} className="bg-white p-4 sm:p-6 rounded-lg shadow space-y-4">
          {/* Основні поля */}
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
            <input name="number" placeholder="Держ. номер" value={form.number} onChange={onChange} className="border p-2 rounded" />
            <input name="vin" placeholder="VIN" value={form.vin} onChange={onChange} className="border p-2 rounded" />
          </div>

          <div>
            <label className="font-semibold block mb-2">Опис</label>
            <textarea
              name="description"
              placeholder="Опис"
              value={form.description}
              onChange={onChange}
              className="border p-2 rounded w-full min-h-[100px]"
            />
          </div>

          {/* Фото */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-semibold">Фото (можна завантажити або ввести URL):</div>
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
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => movePhoto(idx, idx - 1)}
                    className="px-2 py-2 rounded bg-gray-100 hover:bg-gray-200"
                    title="Вгору"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => movePhoto(idx, idx + 1)}
                    className="px-2 py-2 rounded bg-gray-100 hover:bg-gray-200"
                    title="Вниз"
                  >
                    ↓
                  </button>
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
        </form>
      </main>
    </div>
  );
};

export default EditCar;
