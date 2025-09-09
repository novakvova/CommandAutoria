// Cars.tsx — оновлена версія з кнопкою "Додати авто" і підтримкою масиву photos
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
  const { token } = useAuth();
  const navigate = useNavigate();

  // Хелпер: пріоритетне фото
  const getPrimaryPhotoUrl = (car: any): string | null => {
    const fromArray =
      Array.isArray(car.photos) && car.photos.length > 0
        ? car.photos[0]?.url
        : null;

    if (fromArray && typeof fromArray === "string" && fromArray.length > 0) {
      return fromArray;
    }
    return typeof car.photo === "string" ? car.photo : null;
  };

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
    } catch (err) {
      console.error("Помилка оновлення улюблених");
    }
  };

  const totalPages = Math.max(1, Math.ceil(cars.length / carsPerPage));

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  if (loading) return <div className="text-center mt-10">Завантаження.</div>;
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
      pages.push(1, 2, 3, 4, ".", totalPages);
      return pages;
    }
    if (currentPage >= totalPages - 2) {
      pages.push(1, ".", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      return pages;
    }
    pages.push(1, ".", currentPage - 1, currentPage, currentPage + 1, ".", totalPages);
    return pages;
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* Хедер */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Автомобілі</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/cars/create")}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition duration-200 text-sm sm:text-base"
            >
              Додати авто
            </button>
            <button
              onClick={() => navigate("/profile")}
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition duration-200 text-sm sm:text-base"
            >
              Профіль
            </button>
          </div>
        </div>
      </header>

      {/* Основний вміст */}
      <main className="flex-grow p-4 sm:p-6 max-w-7xl mx-auto w-full">
        {/* Сітка авто */}
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
                      e.stopPropagation(); // не переходимо в деталі при кліку по серцю
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
                    currentPage === p ? "bg-green-600 text-white" : "bg-gray-200 hover:bg-gray-300"
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
