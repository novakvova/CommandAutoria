import React from "react";

const API_BASE = "http://localhost:5128";

export type CarPhoto = { id?: number; url: string };
export type Car = {
  id: number;
  brand: string;
  model: string;
  year: number;
  price: number;
  mileage?: number;
  transmission?: string;
  engineVolume?: number;
  engineType?: string;
  color?: string;
  description?: string;
  photo?: string;      // старе поле
  photos?: CarPhoto[]; // нове поле
};

type CarCardProps = {
  car: Car;
  onClick: () => void;            // клік по картці -> перехід у деталі
  actionRight?: React.ReactNode;  // кнопка праворуч від ціни (серце або "Видалити")
};

const getPrimaryPhotoUrl = (car: Car): string | null => {
  const fromArray =
    Array.isArray(car.photos) && car.photos.length > 0
      ? car.photos[0]?.url
      : null;

  if (fromArray && typeof fromArray === "string" && fromArray.length > 0) {
    return fromArray;
  }
  return typeof car.photo === "string" ? car.photo : null;
};

const resolveUrl = (u: string) => (u?.startsWith("http") ? u : `${API_BASE}${u}`);

const CarCard: React.FC<CarCardProps> = ({ car, onClick, actionRight }) => {
  const primaryPhotoUrl = getPrimaryPhotoUrl(car);
  const src = primaryPhotoUrl ? resolveUrl(primaryPhotoUrl) : null;

  return (
    <div
      className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition cursor-pointer"
      onClick={onClick}
    >
      {/* Фото */}
      {src ? (
        <img
          src={src}
          alt={`${car.brand} ${car.model}`}
          className="w-full h-56 object-cover"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-56 bg-gray-200 flex items-center justify-center">
          Фото немає
        </div>
      )}

      {/* Інформація */}
      <div className="p-4">
        <div className="flex justify-between items-center">
          <h3 className="text-2xl font-bold text-green-600">{car.price} $</h3>

          {/* Будь-яка ваша кнопка (серце або "Видалити").
              ВАЖЛИВО: усередині цієї кнопки викликайте e.stopPropagation(),
              щоб не спрацьовував клік по картці. */}
          {actionRight}
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
          <p className="text-gray-700 text-sm mt-3 line-clamp-3">{car.description}</p>
        )}
      </div>
    </div>
  );
};

export default CarCard;
