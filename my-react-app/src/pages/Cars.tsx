// Updated Cars.tsx with favorite button (heart icon) on each card, toggle add/remove
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const Cars: React.FC = () => {
  const [cars, setCars] = useState<any[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const carsPerPage = 15;
  const { token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCars = async () => {
      try {
        const response = await axios.get("http://localhost:5128/api/cars", {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        setCars(response.data || []);
      } catch (err) {
        setError("Не вдалося завантажити автомобілі");
      } finally {
        setLoading(false);
      }
    };
    fetchCars();
  }, [token]);

  useEffect(() => {
  const fetchFavorites = async () => {
    if (token) {
      try {
        const response = await axios.get("http://localhost:5128/api/favorites", {
          headers: { Authorization: `Bearer ${token}` },
        });
            const ids = new Set<number>(response.data.map((fav: any) => fav.id as number));
            setFavoriteIds(ids);
      } catch (err) {
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
          const newSet = new Set(prev);
          newSet.delete(carId);
          return newSet;
        });
      } else {
        await axios.post(`http://localhost:5128/api/favorites/${carId}`, {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setFavoriteIds((prev) => new Set([...prev, carId]));
      }
    } catch (err) {
      console.error("Помилка оновлення улюблених");
    }
  };

  const totalPages = Math.max(1, Math.ceil(cars.length / carsPerPage));

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  if (loading) return <div className="text-center mt-10">Завантаження...</div>;
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

    if (currentPage <= 3) {
      pages.push(1, 2, 3, 4, "...", totalPages);
      return pages;
    }

    if (currentPage >= totalPages - 2) {
      pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      return pages;
    }

    pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
    return pages;
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* Хедер */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Автомобілі</h1>
          <button
            onClick={() => navigate("/profile")}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition duration-200 text-sm sm:text-base"
          >
            Профіль
          </button>
        </div>
      </header>

      {/* Основний вміст */}
      <main className="flex-grow p-4 sm:p-6 max-w-7xl mx-auto w-full">
        {/* Сітка авто */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {currentCars.map((car) => {
            const isFavorite = favoriteIds.has(car.id);
            return (
              <div
                key={car.id}
                className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition"
              >
                {/* Фото */}
                {typeof car.photo === "string" && car.photo ? (
                  <img
                    src={car.photo.startsWith("http") ? car.photo : `http://localhost:5128${car.photo}`}
                    alt={`${car.brand} ${car.model}`}
                    className="w-full h-56 object-cover"
                  />
                ) : (
                  <div className="w-full h-56 bg-gray-200 flex items-center justify-center">
                    Фото немає
                  </div>
                )}

                {/* Інформація */}
                <div className="p-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-bold text-green-600">
                      {car.price} $
                    </h3>
                    <button
                      onClick={() => handleToggleFavorite(car.id, isFavorite)}
                      className="text-2xl"
                      disabled={!token}
                    >
                      {isFavorite ? "❤️" : "♡"}
                    </button>
                  </div>
                  <p className="text-gray-800 text-lg font-medium">
                    {car.brand} {car.model}, {car.year}
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mt-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">📍</span>
                      {car.mileage ? `${car.mileage} км` : "—"}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">⚙️</span>
                      {car.transmission || "—"}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">🚗</span>
                      {car.engineVolume ? `${car.engineVolume} л` : "—"}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">⛽</span>
                      {car.engineType || "—"}
                    </div>
                  </div>

                  <p className="text-gray-500 text-sm mt-2">Колір: {car.color || "—"}</p>

                  {car.description && (
                    <p className="text-gray-700 text-sm mt-3 line-clamp-3">
                      {car.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Пагінація */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-8 items-center space-x-2 flex-wrap">
            {getPageNumbers().map((p, i) =>
              p === "..." ? (
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

      {/* Футер */}
      <footer className="bg-white shadow-sm mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-center text-gray-600 text-sm">
          <p>&copy; {new Date().getFullYear()} Car Marketplace. Усі права захищено.</p>
          <p className="mt-1">Контакти: support@carmarketplace.com</p>
        </div>
      </footer>
    </div>
  );
};

export default Cars;