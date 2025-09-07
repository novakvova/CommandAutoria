// New file: Favorites.tsx - Similar to Cars.tsx but for favorites, with remove button on each card
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const Favorites: React.FC = () => {
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const response = await axios.get("http://localhost:5128/api/favorites", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setFavorites(response.data);
      } catch (err) {
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
      await axios.delete(`http://localhost:5128/api/favorites/${carId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFavorites(favorites.filter((fav: any) => fav.id !== carId));
    } catch (err) {
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
                <h3 className="text-2xl font-bold text-green-600">
                  {car.price} $
                </h3>
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

                {/* Кнопка видалення з улюблених */}
                <button
                  onClick={() => handleRemoveFavorite(car.id)}
                  className="mt-4 w-full bg-red-500 text-white p-2 rounded hover:bg-red-600"
                >
                  Видалити з улюблених
                </button>
              </div>
            </div>
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