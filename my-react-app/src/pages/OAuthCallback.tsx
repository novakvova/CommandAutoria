// src/pages/OAuthCallback.tsx
import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const OAuthCallback: React.FC = () => {
  const { setToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");
    const redirect = params.get("redirect") || "/cars"; // -> куди повертати після авторизації

    if (token) {
      setToken(token);

      // Прибрати query з адреси (щоб не світити токен у URL)
      window.history.replaceState({}, document.title, window.location.pathname);

      navigate(redirect, { replace: true }); // ✅ повертаємо на /cars або на redirect
    } else {
      navigate("/login?error=oauth", { replace: true });
    }
  }, [location.search, navigate, setToken]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-600">Авторизація через Google…</p>
    </div>
  );
};

export default OAuthCallback;
