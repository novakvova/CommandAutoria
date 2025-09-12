import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";

const EditProfile: React.FC = () => {
  const { token, logout } = useAuth();
  const [user, setUser] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await axios.get("http://localhost:5128/api/account/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(response.data);
        setFormData({
          firstName: response.data.firstName || "",
          lastName: response.data.lastName || "",
          region: response.data.region || "",
          cityOrVillage: response.data.cityOrVillage || "",
          phoneNumber: response.data.phoneNumber || "",
        });
        if (response.data.profilePhoto) {
          setPhotoPreview(`http://localhost:5128${response.data.profilePhoto}`);
        }
      } catch {
        logout();
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [token, navigate, logout]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      await axios.put(
        "http://localhost:5128/api/account/update-self",
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Зміни збережено ✅");
      navigate("/profile");
    } catch {
      alert("Помилка при збереженні ❌");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Ви впевнені, що хочете видалити акаунт?")) return;
    try {
      await axios.delete("http://localhost:5128/api/account/delete", {
        headers: { Authorization: `Bearer ${token}` },
      });
      logout();
      navigate("/");
    } catch {
      alert("Помилка при видаленні акаунту ❌");
    }
  };

  const onPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setPhotoFile(file || null);
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const uploadPhoto = async () => {
    if (!photoFile) {
      alert("Оберіть файл зображення.");
      return;
    }

    const fd = new FormData();
    fd.append("image", photoFile);

    try {
      const res = await axios.post(
        "http://localhost:5128/api/account/update-photo",
        fd,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            // НЕ ставимо Content-Type вручну — нехай це зробить браузер з boundary
          },
        }
      );
      // сервер повертає { profilePhoto: "/avatars/..." }
      const newPath = res.data?.profilePhoto;
      if (newPath) {
        setUser((u: any) => ({ ...u, profilePhoto: newPath }));
        setPhotoPreview(`http://localhost:5128${newPath}`);
      }
      alert("Фото оновлено ✅");
    } catch {
      alert("Не вдалося оновити фото ❌");
    }
  };

  if (loading) return <div className="text-center mt-10">Завантаження...</div>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-xl font-bold mb-4 text-center">Редагування профілю</h2>

        <div className="space-y-3">
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            placeholder="Ім'я"
            className="w-full border p-2 rounded"
          />
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            placeholder="Прізвище"
            className="w-full border p-2 rounded"
          />
          <input
            type="text"
            name="region"
            value={formData.region}
            onChange={handleChange}
            placeholder="Область"
            className="w-full border p-2 rounded"
          />
          <input
            type="text"
            name="cityOrVillage"
            value={formData.cityOrVillage}
            onChange={handleChange}
            placeholder="Місто/село"
            className="w-full border p-2 rounded"
          />
          <input
            type="text"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
            placeholder="Номер телефону"
            className="w-full border p-2 rounded"
          />
        </div>

        {/* Фото профілю */}
        <div className="mt-5 border-t pt-4">
          <h3 className="font-semibold mb-2">Фото профілю</h3>
          {photoPreview ? (
            <img
              src={photoPreview}
              alt="Profile preview"
              className="w-24 h-24 object-cover rounded-full mb-3 mx-auto"
            />
          ) : (
            <div className="text-center text-sm text-gray-500 mb-3">Немає фото</div>
          )}

          <input
            type="file"
            accept="image/*"
            onChange={onPhotoChange}
            className="w-full"
          />

          <button
            onClick={uploadPhoto}
            className="w-full bg-indigo-500 text-white p-2 rounded mt-3 hover:bg-indigo-600"
          >
            Оновити фото
          </button>
        </div>

        <button
          onClick={handleSave}
          className="w-full bg-blue-500 text-white p-2 rounded mt-4 hover:bg-blue-600"
        >
          Зберегти зміни
        </button>

        <button
          onClick={handleDelete}
          className="w-full bg-red-500 text-white p-2 rounded mt-4 hover:bg-red-600"
        >
          Видалити акаунт
        </button>
      </div>
    </div>
  );
};

export default EditProfile;
