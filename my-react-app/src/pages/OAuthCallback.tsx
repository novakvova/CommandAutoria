import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const OAuthCallback: React.FC = () => {
  const { setToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');

    if (token) {
      setToken(token);
      // Прибрати токен з URL для безпеки/естетики
      window.history.replaceState({}, document.title, window.location.pathname);
      navigate('/profile', { replace: true });
    } else {
      navigate('/register', { replace: true });
    }
  }, [location.search, navigate, setToken]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-600">Авторизація через Google...</p>
    </div>
  );
};

export default OAuthCallback;
