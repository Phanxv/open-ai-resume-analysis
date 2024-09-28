import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './Components/Login';
import Register from './Components/Register';
import DragDropFileUpload from './Components/DragDropFileUpload';
import ProtectedRoute from './Components/ProtectedRoute';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/upload" element={<ProtectedRoute><DragDropFileUpload /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
};

export default App;