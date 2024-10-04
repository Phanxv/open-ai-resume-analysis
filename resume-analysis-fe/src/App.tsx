import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './Components/Login';
import Register from './Components/Register';
import DragDropFileUpload from './Components/DragDropFileUpload';
import ProtectedRoute from './Components/ProtectedRoute';
import Layout from './Components/Layout';
import DisplayFiles from './Components/DisplayFiles';
import SearchField from './Components/SearchField';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route element={<Layout />}>
          <Route path="/upload" element={<ProtectedRoute><DragDropFileUpload /></ProtectedRoute>} />
          <Route path="/search" element={<ProtectedRoute><SearchField/></ProtectedRoute>}/>
          <Route path="/files" element={<ProtectedRoute><DisplayFiles/></ProtectedRoute>}/>
        </Route>
      </Routes>
    </Router>
  );
};

export default App;