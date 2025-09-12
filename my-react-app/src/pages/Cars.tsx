import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import CarCard from "../components/CarCard";

const Cars: React.FC = () => {
  const [cars, setCars] = useState<any[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const carsPerPage = 15;

  const navigate = useNavigate();
  const auth = useAuth();
  const token = auth?.token ?? null;
  const isAuthed = !!token;
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (!token) return;

    const fetchProfile = async () => {
      try {
        const res = await axios.get("http://localhost:5128/api/account/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfile(res.data);
      } catch {
        console.error("Не вдалося завантажити профіль");
      }
    };

    fetchProfile();
  }, [token]);
  // завантаження авто
  useEffect(() => {
    const fetchCars = async () => {
      try {
        const response = await axios.get("http://localhost:5128/api/cars", {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        setCars(response.data || []);
      } catch {
        setError("Не вдалося завантажити автомобілі");
      } finally {
        setLoading(false);
      }
    };
    fetchCars();
  }, [token]);

  // завантаження обраних
  useEffect(() => {
    const fetchFavorites = async () => {
      if (token) {
        try {
          const response = await axios.get("http://localhost:5128/api/favorites", {
            headers: { Authorization: `Bearer ${token}` },
          });
          const ids = new Set<number>(
            response.data.map((fav: any) => fav.id as number)
          );
          setFavoriteIds(ids);
        } catch {
          console.error("Помилка завантаження улюблених");
        }
      }
    };
    fetchFavorites();
  }, [token]);

  const handleToggleFavorite = async (carId: number, isFavorite: boolean) => {
    try {
      if (isFavorite) {
        await axios.delete(`http://localhost:5128/api/favorites/${carId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          next.delete(carId);
          return next;
        });
      } else {
        await axios.post(
          `http://localhost:5128/api/favorites/${carId}`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          next.add(carId);
          return next;
        });
      }
    } catch {
      console.error("Помилка оновлення улюблених");
    }
  };

  const handleLogout = () => {
    if (typeof auth?.logout === "function") {
      auth.logout();
    } else {
      try {
        localStorage.removeItem("token");
      } catch {}
      navigate("/login");
      window.location.reload();
    }
  };

  const totalPages = Math.max(1, Math.ceil(cars.length / carsPerPage));
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  if (loading) return <div className="text-center mt-10">Завантаження…</div>;
  if (error) return <div className="text-center text-red-500 mt-10">{error}</div>;

  const indexOfLastCar = currentPage * carsPerPage;
  const indexOfFirstCar = indexOfLastCar - carsPerPage;
  const currentCars = cars.slice(indexOfFirstCar, indexOfLastCar);

  const getPageNumbers = (): (number | string)[] => {
    const pages: (number | string)[] = [];
    if (totalPages <= 6) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }
    if (currentPage <= 3) return [1, 2, 3, 4, ".", totalPages];
    if (currentPage >= totalPages - 2)
      return [1, ".", totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, ".", currentPage - 1, currentPage, currentPage + 1, ".", totalPages];
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
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
                  onClick={() => navigate("/cars/create")}
                  className="px-3 py-2 rounded bg-green-600 text-white hover:bg-green-700"
                >
                  Додати авто
                </button>
                {profile?.profilePhoto ? (
                  <img
                    src={`http://localhost:5128${profile.profilePhoto}`}
                    alt="avatar"
                    onClick={() => navigate("/profile")}
                    className="w-10 h-10 rounded-full object-cover cursor-pointer border hover:scale-105 transition"
                    title="Профіль"
                  />
                ) : (
                  <button
                    onClick={() => navigate("/profile")}
                    className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-700 hover:bg-gray-400 transition"
                    title="Профіль"
                  >
                    👤
                  </button>
                )}

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

      {/* ---------- Cars Grid ---------- */}
      <main className="flex-grow p-4 sm:p-6 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {currentCars.map((car) => {
            const isFavorite = favoriteIds.has(car.id);
            return (
              <CarCard
                key={car.id}
                car={car}
                onClick={() => navigate(`/cars/${car.id}`)}
                actionRight={
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleFavorite(car.id, isFavorite);
                    }}
                    className="text-2xl"
                    disabled={!token}
                    aria-label={isFavorite ? "Прибрати з обраних" : "Додати в обрані"}
                    title={isFavorite ? "Прибрати з обраних" : "Додати в обрані"}
                  >
                    {isFavorite ? "❤️" : "♡"}
                  </button>
                }
              />
            );
          })}
        </div>

        {/* Пагінація */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-8 items-center space-x-2 flex-wrap">
            {getPageNumbers().map((p, i) =>
              p === "." ? (
                <span key={i} className="px-3 py-2 text-gray-500">
                  ...
                </span>
              ) : (
                <button
                  key={i}
                  onClick={() => setCurrentPage(Number(p))}
                  aria-current={currentPage === p ? "page" : undefined}
                  className={`px-4 py-2 rounded-lg text-sm sm:text-base ${
                    currentPage === p
                      ? "bg-green-600 text-white"
                      : "bg-gray-200 hover:bg-gray-300"
                  }`}
                >
                  {p}
                </button>
              )
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Cars;
