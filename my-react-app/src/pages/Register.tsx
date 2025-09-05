import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
const BACKEND_URL = 'http://localhost:5128';
const OAUTH_RETURN_URL = `${window.location.origin}/oauth-callback`;

function handleGoogleSignIn() {
  // Робимо редірект на бек: він піде в Google і потім поверне нас на OAUTH_RETURN_URL з ?token=...
  const url = `${BACKEND_URL}/api/account/external-login/google?returnUrl=${encodeURIComponent(OAUTH_RETURN_URL)}`;
  window.location.href = url;
}

const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [region, setRegion] = useState('');
  const [cityOrVillage, setCityOrVillage] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { setToken, token } = useAuth();

  useEffect(() => {
    if (token) {
      navigate('/profile');
    }
  }, [token, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Паролі не співпадають');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('Email', email);
      formData.append('Password', password);
      formData.append('ConfirmPassword', confirmPassword);
      formData.append('FirstName', firstName);
      formData.append('LastName', lastName);
      formData.append('Region', region);
      formData.append('CityOrVillage', cityOrVillage);
      formData.append('PhoneNumber', phoneNumber);
      if (birthDate) formData.append('BirthDate', birthDate);
      if (imageFile) formData.append('ImageFile', imageFile);

      const response = await axios.post('http://localhost:5128/api/account/register', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setToken(response.data.token);
      navigate('/profile');
    } catch (err) {
      setError('Помилка реєстрації');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Реєстрація</h2>
        {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
        <form onSubmit={handleSubmit} encType="multipart/form-data">
          <div className="mb-4">
            <label className="block mb-1 text-sm font-medium">Ім'я</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block mb-1 text-sm font-medium">Прізвище</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block mb-1 text-sm font-medium">Область</label>
            <input
              type="text"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block mb-1 text-sm font-medium">Місто/село</label>
            <input
              type="text"
              value={cityOrVillage}
              onChange={(e) => setCityOrVillage(e.target.value)}
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block mb-1 text-sm font-medium">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block mb-1 text-sm font-medium">Номер телефону</label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block mb-1 text-sm font-medium">Дата народження</label>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="mb-4">
            <label className="block mb-1 text-sm font-medium">Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block mb-1 text-sm font-medium">Підтвердження пароля</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block mb-1 text-sm font-medium">Фото профілю</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 transition duration-200"
          >
            Зареєструватися
          </button>
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-gray-500">або</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="mt-4 w-full border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition rounded-md p-2 flex items-center justify-center gap-2"
            >
              {/* Простий SVG-логотип Google, щоб не тягнути бібліотеки */}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-5 w-5">
                <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.2 36 24 36c-6.6 0-12-5.4-12-12S17.4 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 5.5 29.6 3.5 24 3.5 12.1 3.5 2.5 13.1 2.5 25S12.1 46.5 24 46.5 45.5 36.9 45.5 25c0-1.5-.2-3-.6-4.5z"/>
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 5.5 29.6 3.5 24 3.5 15.4 3.5 8.1 8.7 6.3 14.7z"/>
                <path fill="#4CAF50" d="M24 46.5c5 0 9.6-1.9 13.1-5l-6.1-5c-1.9 1.3-4.3 2.1-7 2.1-5.2 0-9.7-3.6-11.3-8.5l-6.6 5C8.1 41.3 15.4 46.5 24 46.5z"/>
                <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.3-3.5 5.9-6.4 7.5l6.1 5c3.6-3.3 5.9-8.2 5.9-14 0-1.5-.2-3-.6-4.5z"/>
              </svg>
              Увійти з Google
            </button>
          </div>

        </form>
        
      </div>
    </div>
  );
};

export default Register;