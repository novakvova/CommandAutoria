import React from 'react';
import { Route, Routes } from 'react-router-dom';
import Home from '../pages/Home';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Profile from '../pages/Profile';
import OAuthCallback from '../pages/OAuthCallback';
import ForgotPassword from '../pages/ForgotPassword';
import ResetPassword from '../pages/ResetPassword';
import Favorites from '../pages/Favorites';
import Cars from '../pages/Cars';
import CreateCar from '../pages/CreateCar';
import CarDetails from '../pages/CarDetails';
import EditCar from '../pages/EditCar';


const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/home" element={<Home />} />
      <Route path="/oauth-callback" element={<OAuthCallback />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/cars" element={<Cars />} />
      <Route path="/cars/create" element={<CreateCar />} />
      <Route path="/cars/:id/edit" element={<EditCar />} />
      <Route path="/cars/:id" element={<CarDetails />} />
      <Route path="/favorites" element={<Favorites />} />
    </Routes>
  );
};

export default AppRoutes;