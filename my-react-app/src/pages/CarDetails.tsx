// src/pages/CarDetails.tsx
import React, { useEffect, useState, useMemo } from "react";
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
  photo?: string;      // fallback (старе поле)
  photos?: Photo[];    // нове — масив фото
};

const CarDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [car, setCar] = useState<Car | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const apiBase = "http://localhost:5128";
  const resolveUrl = (u: string) => (u?.startsWith("http") ? u : `${apiBase}${u}`);

  useEffect(() => {
    const fetchCar = async () => {
      try {
        const res = await axios.get(`${apiBase}/api/cars/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        setCar(res.data);
      } catch {
        setError("Не вдалося завантажити авто");
      } finally {
        setLoading(false);
      }
    };
    fetchCar();
  }, [id, token]);

  // Гелерея: спочатку нові photos, далі — старе photo (якщо ще використовується)
  const gallery: string[] = useMemo(() => {
    const arr: string[] = [];
    if (Array.isArray(car?.photos)) {
      for (const p of car!.photos!) if (p?.url) arr.push(p.url);
    }
    if (car?.photo) arr.push(car.photo);
    return arr;
  }, [car]);

  const mainPhoto = gallery[0];

  const handleDelete = async () => {
    if (!car) return;
    if (!token) {
      alert("Потрібна авторизація, щоб видаляти авто.");
      return;
    }
    const ok = confirm(`Видалити авто: ${car.brand} ${car.model} (${car.year})? Цю дію не можна скасувати.`);
    if (!ok) return;

    try {
      setBusy(true);
      await axios.delete(`${apiBase}/api/cars/${car.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      navigate("/cars");
    } catch (e: any) {
      setError(e?.response?.data?.title || "Не вдалося видалити авто");
    } finally {
      setBusy(false);
    }
  };

  const swapMainPhoto = (idx: number) => {
    if (!car || !gallery[idx]) return;
    // Проста локальна перестановка: робимо вибране фото першим
    const reordered = [gallery[idx], ...gallery.filter((_, i) => i !== idx)];
    // Зберігаємо як photos (масив об’єктів) для відмальовки
    setCar(prev =>
      prev
        ? {
            ...prev,
            photos: reordered.map((u) => ({ url: u })),
            photo: undefined, // після взаємодії використовуємо тільки масив
          }
        : prev
    );
  };

  if (loading) return <div className="text-center mt-10">Завантаження…</div>;
  if (error) return <div className="text-center text-red-600 mt-10">{error}</div>;
  if (!car) return <div className="text-center mt-10">Авто не знайдено</div>;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Хедер з кнопками Редагувати / Видалити */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">
            {car.brand} {car.model} • {car.year}
          </h1>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/cars")}
              className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
            >
              Назад
            </button>

            <button
              onClick={() => navigate(`/cars/${car.id}/edit`)}
              className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
              disabled={busy}
              title="Редагувати авто"
            >
              Редагувати
            </button>

            <button
              onClick={handleDelete}
              className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
              disabled={busy}
              title="Видалити авто"
            >
              {busy ? "Видалення…" : "Видалити"}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Головне фото */}
        {mainPhoto ? (
          <img
            src={resolveUrl(mainPhoto)}
            alt={`${car.brand} ${car.model}`}
            className="w-full h-[360px] sm:h-[480px] object-cover rounded-lg shadow"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-[360px] bg-gray-200 rounded-lg flex items-center justify-center">
            Фото немає
          </div>
        )}

        {/* Прев’ю, якщо фото > 1 */}
        {gallery.length > 1 && (
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {gallery.map((u, i) => (
              <img
                key={`${u}-${i}`}
                src={resolveUrl(u)}
                alt={`photo-${i + 1}`}
                className={`w-full h-24 object-cover rounded cursor-pointer border ${i === 0 ? "ring-2 ring-blue-500" : ""}`}
                onClick={() => swapMainPhoto(i)}
                loading="lazy"
              />
            ))}
          </div>
        )}

        {/* Характеристики */}
        <section className="bg-white rounded-lg shadow p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="text-xl font-semibold text-gray-800">Характеристики</h2>
            <div className="text-2xl font-bold text-green-600">{car.price} $</div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3 mt-4 text-sm">
            <div><span className="text-gray-500">Стан:</span> {car.condition || "—"}</div>
            <div><span className="text-gray-500">Пробіг:</span> {car.mileage ? `${car.mileage} км` : "—"}</div>
            <div><span className="text-gray-500">Двигун:</span> {car.engineVolume ? `${car.engineVolume} л` : "—"}</div>
            <div><span className="text-gray-500">Тип двигуна:</span> {car.engineType || "—"}</div>
            <div><span className="text-gray-500">Коробка:</span> {car.transmission || "—"}</div>
            <div><span className="text-gray-500">Привід:</span> {car.driveType || "—"}</div>
            <div><span className="text-gray-500">Колір:</span> {car.color || "—"}</div>
            <div><span className="text-gray-500">Місто/траса:</span> {car.fuelConsumptionCity || "—"} / {car.fuelConsumptionHighway || "—"}</div>
            <div><span className="text-gray-500">Держ. номер:</span> {car.number || "—"}</div>
            <div><span className="text-gray-500">VIN:</span> {car.vin || "—"}</div>
          </div>

          {car.description && (
            <>
              <h3 className="text-lg font-semibold mt-6">Опис</h3>
              <p className="text-gray-700 mt-2 whitespace-pre-line">{car.description}</p>
            </>
          )}
        </section>
      </main>
    </div>
  );
};

export default CarDetails;
