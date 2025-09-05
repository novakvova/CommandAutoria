import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { token, logout } = useAuth();

  useEffect(() => {
    if (token) {
      navigate('/profile');
    }
  }, [token, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-4 text-center">Welcome</h1>
        {!token ? (
          <>
            <button
              onClick={() => navigate('/register')}
              className="w-full bg-blue-500 text-white p-2 rounded mb-2 hover:bg-blue-600"
            >
              Зареєструватися
            </button>
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-green-500 text-white p-2 rounded mb-2 hover:bg-green-600"
            >
              Логін
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => navigate('/profile')}
              className="w-full bg-purple-500 text-white p-2 rounded mb-2 hover:bg-purple-600"
            >
              Профіль
            </button>
            <button
              onClick={handleLogout}
              className="w-full bg-red-500 text-white p-2 rounded hover:bg-red-600"
            >
              Вийти
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Home;