// src/pages/Home.tsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import CarCard, { type Car } from "../components/CarCard";
import { useAuth } from "../contexts/AuthContext"; // 👈

const apiBase = "http://localhost:5128";

type AuthCtx = {
  token?: string | null;
  logout?: () => void; // на випадок, якщо в контексті вже є logout
};

const Home: React.FC = () => {
  const [items, setItems] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const auth = useAuth() as AuthCtx;          // 👈 забираємо токен/методи із контексту
  const token = auth?.token ?? null;
  const isAuthed = !!token;

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get(`${apiBase}/api/cars`);
        setItems(res.data || []);
      } catch {
        setError("Не вдалося завантажити список авто");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const goDetails = (id?: number) => {
    if (!id || id <= 0) return;        // гард від undefined/0/NaN
    navigate(`/cars/${id}`);
  };

  const handleLogout = () => {
    // Якщо у твоєму AuthContext є метод logout — використай його
    if (typeof auth?.logout === "function") {
      auth.logout();
    } else {
      // fallback: прибрати токен з localStorage (залежить від твоєї реалізації)
      try { localStorage.removeItem("token"); } catch {}
      // редірект на логін
      navigate("/login");
      // оновити сторінку, щоб контекст підхопив відсутність токена
      window.location.reload();
    }
  };

  if (loading) return <div className="p-6">Завантаження…</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ---------- Header ---------- */}
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            className="text-xl font-bold"
            onClick={() => navigate("/")}
            title="На головну"
          >
            AutoMarket
          </button>

          <nav className="flex items-center gap-2">
            {!isAuthed ? (
              <>
                <button
                  onClick={() => navigate("/login")}
                  className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                >
                  Увійти
                </button>
                <button
                  onClick={() => navigate("/register")}
                  className="px-3 py-2 rounded border hover:bg-gray-100"
                >
                  Реєстрація
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate("/profile")}
                  className="px-3 py-2 rounded border hover:bg-gray-100"
                >
                  Профіль
                </button>
                <button
                  onClick={handleLogout}
                  className="px-3 py-2 rounded bg-red-600 text-white hover:bg-red-700"
                >
                  Вийти
                </button>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* ---------- Grid ---------- */}
      <main className="max-w-6xl mx-auto p-4">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((car) => (
            <CarCard key={car.id} car={car} onClick={() => goDetails(car.id)} />
          ))}
        </div>
      </main>
    </div>
  );
};

export default Home;
