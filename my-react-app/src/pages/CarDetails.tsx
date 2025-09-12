// src/pages/CarDetails.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
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
  photo?: string;
  photos?: { id?: number; url: string }[];
  ownerId?: number;   // може прийти з бекенду
  userId?: number;    // або так (з Ad)
};

type JwtAny = Record<string, any>;

const parseAuth = (token?: string | null) => {
  if (!token) return { userId: 0, roles: [] as string[] };
  const p = jwtDecode<JwtAny>(token);
  const idRaw =
    p.sub ??
    p.nameid ??
    p["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] ??
    p.uid ??
    p.userId ??
    p.id ??
    0;
  const roleCandidate =
    p.role ??
    p.roles ??
    p["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ??
    [];
  let roles: string[] = [];
  if (Array.isArray(roleCandidate)) roles = roleCandidate as string[];
  else if (typeof roleCandidate === "string") roles = roleCandidate.split(",");
  roles = roles.map((r) => r.trim()).filter(Boolean);
  const userId = Number(idRaw) || 0;
  return { userId, roles };
};

const CarDetails: React.FC = () => {
  // Підтримуємо обидві назви параметра: :id або :carId
  const { id: idParam, carId } = useParams<{ id?: string; carId?: string }>();
  const idStr = idParam ?? carId ?? "";           // '' → означає "нема id"
  const carIdNum = Number(idStr);                 // NaN якщо не число

  const navigate = useNavigate();
  const { token } = useAuth();

  const [car, setCar] = useState<Car | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [ownerFromAd, setOwnerFromAd] = useState<number | undefined>(undefined);

  const apiBase = "http://localhost:5128";
  const resolveUrl = (u?: string | null) =>
    u ? (u.startsWith("http") ? u : `${apiBase}${u}`) : "";

  const { userId, roles } = useMemo(() => parseAuth(token), [token]);
  const isAdmin = roles.some((r) => r.toLowerCase() === "admin");

  const isDev =
    typeof import.meta !== "undefined" &&
    (import.meta as any).env &&
    !!(import.meta as any).env.DEV;

  // 1) Якщо id некоректний — не ходимо на API, показуємо помилку
  useEffect(() => {
    if (!idStr || Number.isNaN(carIdNum) || carIdNum <= 0) {
      setError("Авто не знайдено");
      setLoading(false);
    }
  }, [idStr, carIdNum]);

  // 2) Тягнемо авто тільки якщо id валідний
  useEffect(() => {
    if (!idStr || Number.isNaN(carIdNum) || carIdNum <= 0) return;
    const fetchCar = async () => {
      try {
        const res = await axios.get(`${apiBase}/api/cars/${carIdNum}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        setCar(res.data);
      } catch (e: any) {
        const s = e?.response?.status;
        if (s === 404) setError("Авто не знайдено");
        else setError("Не вдалося завантажити авто");
      } finally {
        setLoading(false);
      }
    };
    fetchCar();
  }, [idStr, carIdNum, token]);

  // 3) Якщо бекенд не віддав ownerId/userId — спробуємо дістати через Ads
  useEffect(() => {
    const fetchOwnerViaAds = async () => {
      if (!car || car.ownerId != null || car.userId != null) return;
      try {
        const tryFiltered = await axios.get(`${apiBase}/api/ads`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          params: { carId: car.id },
        });
        let ads: any[] = Array.isArray(tryFiltered.data) ? tryFiltered.data : [];
        if (ads.length === 0) {
          const all = await axios.get(`${apiBase}/api/ads`, {
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          });
          const list: any[] = Array.isArray(all.data) ? all.data : [];
          ads = list.filter((a) => a?.carId === car.id);
        }
        if (ads.length > 0) {
          ads.sort((a, b) => {
            const da = a?.createdAt ? Date.parse(a.createdAt) : 0;
            const db = b?.createdAt ? Date.parse(b.createdAt) : 0;
            return db - da;
          });
          const owner = Number(ads[0]?.userId);
          if (Number.isFinite(owner)) setOwnerFromAd(owner);
        }
      } catch {
        /* ignore */
      }
    };
    if (car) fetchOwnerViaAds();
  }, [car, token]);

  // Галерея
  const gallery: string[] = useMemo(() => {
    const arr: string[] = [];
    if (Array.isArray(car?.photos)) {
      for (const p of car!.photos!) if (p?.url) arr.push(p.url);
    }
    if (car?.photo) arr.push(car.photo);
    return arr;
  }, [car]);

  const mainPhoto = gallery[0];

  // Хто власник
  const effectiveOwnerId =
    car?.ownerId ?? car?.userId ?? ownerFromAd ?? undefined;
  const isOwner =
    typeof effectiveOwnerId === "number" && effectiveOwnerId === userId;
  const canEdit = isAdmin || isOwner;

  const handleDelete = async () => {
    if (!car) return;
    if (!token) {
      alert("Потрібна авторизація, щоб видаляти авто.");
      return;
    }
    const ok = confirm(
      `Видалити авто: ${car.brand} ${car.model} (${car.year})? Цю дію не можна скасувати.`
    );
    if (!ok) return;

    try {
      setBusy(true);
      await axios.delete(`${apiBase}/api/cars/${car.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      navigate("/cars");
    } catch (e: any) {
      const s = e?.response?.status;
      if (s === 401) return navigate("/login");
      if (s === 403) return setError("У вас немає прав на цю дію.");
      setError(e?.response?.data?.title || "Не вдалося видалити авто");
    } finally {
      setBusy(false);
    }
  };

  const handleGoEdit = () => {
    if (!car) return;
    if (!canEdit) {
      setError("У вас немає прав редагувати це авто.");
      return;
    }
    navigate(`/cars/${car.id}/edit`);
  };

  const swapMainPhoto = (idx: number) => {
    if (!car || !gallery[idx]) return;
    const reordered = [gallery[idx], ...gallery.filter((_, i) => i !== idx)];
    setCar((prev) =>
      prev
        ? { ...prev, photos: reordered.map((u) => ({ url: u })), photo: undefined }
        : prev
    );
  };

  if (loading) return <div className="text-center mt-10">Завантаження…</div>;
  if (error) return <div className="text-center text-red-600 mt-10">{error}</div>;
  if (!car) return <div className="text-center mt-10">Авто не знайдено</div>;

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {car.brand} {car.model} • {car.year}
            </h1>
            {isDev && (
              <div className="text-xs text-gray-500">
                debug: userId={userId} | roles=[{roles.join(", ")}] | ownerId=
                {String(effectiveOwnerId)} | param={idStr}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/cars")}
              className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
            >
              Назад
            </button>

            {canEdit && (
              <>
                <button
                  onClick={handleGoEdit}
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
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
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

        {gallery.length > 1 && (
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {gallery.map((u, i) => (
              <img
                key={`${u}-${i}`}
                src={resolveUrl(u)}
                alt={`photo-${i + 1}`}
                className={`w-full h-24 object-cover rounded cursor-pointer border ${
                  i === 0 ? "ring-2 ring-blue-500" : ""
                }`}
                onClick={() => swapMainPhoto(i)}
                loading="lazy"
              />
            ))}
          </div>
        )}

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
