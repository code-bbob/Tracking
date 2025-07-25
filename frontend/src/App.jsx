import { useState } from 'react';
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './Home';
import AddShipment from './AddShipment';
import Login from './pages/login';
import IssueBarcodes from './IssueBarcodes';
import ProtectedRoute from './redux/protectedRoute';
import { useSelector } from 'react-redux';
function App() {

  const { isAuthenticated } = useSelector((state) => state.root);
  // useGlobalKeyPress();

  return (
    <BrowserRouter>
      <Routes>

      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute isAuthenticated={isAuthenticated} />}>
      
        <Route path="/" element={<Home />} />
        <Route path="/add-shipment" element={<AddShipment />} />
        <Route path="/issue-barcodes" element={<IssueBarcodes />} />
        <Route path="/about" element={<h1>About Page</h1>} />
        <Route path="/contact" element={<h1>Contact Page</h1>} />
        </Route>
        <Route path="*" element={<h1>404 Not Found</h1>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
