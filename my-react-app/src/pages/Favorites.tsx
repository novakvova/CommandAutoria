// src/pages/Favorites.tsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import CarCard from "../components/CarCard";

const API_BASE = "http://localhost:5128";

const Favorites: React.FC = () => {
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { token } = useAuth();
  const navigate = useNavigate();

  // як у Cars.tsx: пріоритетне фото → перше в photos, далі fallback на photo
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
    const fetchFavorites = async () => {
      try {
        const response = await axios.get(`${API_BASE}/api/favorites`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setFavorites(response.data || []);
      } catch {
        setError("Не вдалося завантажити улюблені автомобілі");
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchFavorites();
    } else {
      setError("Будь ласка, увійдіть для перегляду улюблених");
      setLoading(false);
    }
  }, [token]);

  const handleRemoveFavorite = async (carId: number) => {
    try {
      await axios.delete(`${API_BASE}/api/favorites/${carId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFavorites((prev) => prev.filter((fav: any) => fav.id !== carId));
    } catch {
      console.error("Помилка видалення з улюблених");
    }
  };

  if (loading) return <div className="text-center mt-10">Завантаження...</div>;
  if (error) return <div className="text-center text-red-500 mt-10">{error}</div>;

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* Хедер */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Улюблені автомобілі</h1>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {favorites.map((car: any) => (
            <CarCard
              key={car.id}
              car={car}
              onClick={() => navigate(`/cars/${car.id}`)}
              actionRight={
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // щоб клік по кнопці не відкрив деталі
                    handleRemoveFavorite(car.id);
                  }}
                  className="text-sm px-3 py-2 rounded bg-red-500 text-white hover:bg-red-600"
                  title="Видалити з улюблених"
                >
                  Видалити
                </button>
              }
            />
          ))}
        </div>
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

export default Favorites;
