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
    const fetchProfile = async () => {
      try {
        const response = await axios.get('/api/account/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(response.data);
      } catch (err) {
        setError('Помилка завантаження профілю');
        logout();
        navigate('/login');
      }
    };
    fetchProfile();
  }, [token, navigate, logout]);

  if (!user) return <div className="text-center mt-10">Завантаження...</div>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-xl font-bold mb-4 text-center">Профіль</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Ім'я:</strong> {user.firstName}</p>
        <p><strong>Прізвище:</strong> {user.lastName}</p>
        <p><strong>Ролі:</strong> {user.roles.join(', ')}</p>
        <button
          onClick={logout}
          className="w-full bg-red-500 text-white p-2 rounded mt-4 hover:bg-red-600"
        >
          Вийти
        </button>
      </div>
    </div>
  );
};

export default Profile;