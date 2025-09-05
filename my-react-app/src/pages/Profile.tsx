import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const Profile: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { token, logout } = useAuth();

  useEffect(() => {
    if (!token) {
      navigate('/');
      return;
    }

    const fetchProfile = async () => {
      try {
        const response = await axios.get('http://localhost:5128/api/account/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(response.data);
      } catch (err) {
        setError('Помилка завантаження профілю');
        logout();
        navigate('/');
      }
    };
    fetchProfile();
  }, [token, navigate, logout]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user) return <div className="text-center mt-10">Завантаження...</div>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-xl font-bold mb-4 text-center">Профіль</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Ім'я:</strong> {user.firstName}</p>
        <p><strong>Прізвище:</strong> {user.lastName}</p>
        <p><strong>Область:</strong> {user.region || 'Не вказано'}</p>
        <p><strong>Місто/село:</strong> {user.cityOrVillage || 'Не вказано'}</p>
        <p><strong>Номер телефону:</strong> {user.phoneNumber || 'Не вказано'}</p>
        <p><strong>Дата реєстрації:</strong> {new Date(user.registrationDate).toLocaleDateString()}</p>
        <p><strong>Фото профілю:</strong> {user.profilePhoto ? <img src={user.profilePhoto} alt="Profile" className="w-24 h-24 object-cover rounded-full mt-2" /> : 'Не завантажено'}</p>
        <p><strong>Ролі:</strong> {user.roles.join(', ')}</p>
        <button
          onClick={handleLogout}
          className="w-full bg-red-500 text-white p-2 rounded mt-4 hover:bg-red-600"
        >
          Вийти
        </button>
      </div>
    </div>
  );
};

export default Profile;