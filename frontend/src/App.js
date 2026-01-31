/**
 * Main App Component
 * Sets up routing and layout
 */

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Pages
import Dashboard from './Pages/Dashboard';
import DataSourcesPage from './Pages/DataSourcesPage';
import ForgotPassword from './Pages/ForgotPassword';
import Login from './Pages/Login';
import PipelineBuilder from './Pages/PipelineBuilder';
import PipelineList from './Pages/PipelineList';
import Profile from './Pages/Profile';
import Register from './Pages/Register';
import ResetPassword from './Pages/ResetPassword';

// Components
import Header from './components/common/Header';
import Sidebar from './components/common/Sidebar';

function App() {
  const { isAuthenticated } = useSelector((state) => state.auth);

  return (
    <div className="App">
      <ToastContainer 
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={
          isAuthenticated ? <Navigate to="/dashboard" /> : <Login />
        } />
        <Route path="/register" element={
          isAuthenticated ? <Navigate to="/dashboard" /> : <Register />
        } />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Protected Routes */}
        <Route path="/*" element={
          isAuthenticated ? <ProtectedLayout /> : <Navigate to="/login" />
        } />
      </Routes>
    </div>
  );
}

/**
 * Layout for protected Pages (with Header and Sidebar)
 */
function ProtectedLayout() {
  return (
    <div className="d-flex">
      <Sidebar />
      <div className="flex-grow-1">
        <Header />
        <main className="p-4">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/data-sources" element={<DataSourcesPage />} />
            <Route path="/pipelines" element={<PipelineList />} />
            <Route path="/pipelines/new" element={<PipelineBuilder />} />
            <Route path="/pipelines/:id" element={<PipelineBuilder />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;