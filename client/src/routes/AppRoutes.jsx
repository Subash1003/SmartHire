import { Routes, Route } from 'react-router-dom';
import PublicLayout from '../layouts/PublicLayout';
import Home from '../pages/public/Home';

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
      </Route>
    </Routes>
  );
}
