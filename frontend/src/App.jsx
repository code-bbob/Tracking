import { useState } from 'react';
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './Home';
import AddShipment from './AddShipment';
import Login from './pages/login';
import IssueBarcodes from './IssueBarcodes';
import Records from './Records';
import ProtectedRoute from './redux/protectedRoute';
import AppLayout from './components/AppLayout';
import { useSelector } from 'react-redux';

function App() {
  const { isAuthenticated } = useSelector((state) => state.root);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute isAuthenticated={isAuthenticated} />}>
          <Route path="/" element={
            <AppLayout>
              <Home />
            </AppLayout>
          } />
          <Route path="/add-shipment" element={
            <AppLayout>
              <AddShipment />
            </AppLayout>
          } />
          <Route path="/issue-barcodes" element={
            <AppLayout>
              <IssueBarcodes />
            </AppLayout>
          } />
          <Route path="/records" element={
            <AppLayout>
              <Records />
            </AppLayout>
          } />
          <Route path="/about" element={
            <AppLayout>
              <h1>About Page</h1>
            </AppLayout>
          } />
          <Route path="/contact" element={
            <AppLayout>
              <h1>Contact Page</h1>
            </AppLayout>
          } />
        </Route>
        <Route path="*" element={<h1>404 Not Found</h1>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
