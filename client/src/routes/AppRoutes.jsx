import { Routes, Route } from 'react-router-dom';
import PublicLayout from '../layouts/PublicLayout';
import DashboardLayout from '../layouts/DashboardLayout';
import Home from '../pages/public/Home';
import Login from '../pages/public/Login';
import Register from '../pages/public/Register';
import ForgotPassword from '../pages/public/ForgotPassword';
import ResetPassword from '../pages/public/ResetPassword';
import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';
import CandidateDashboard from '../pages/candidate/Dashboard';
import RecruiterDashboard from '../pages/recruiter/Dashboard';
import InterviewerDashboard from '../pages/interviewer/Dashboard';
import AdminDashboard from '../pages/admin/Dashboard';

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route element={<RoleRoute allow={['candidate']} />}>
            <Route path="/candidate/dashboard" element={<CandidateDashboard />} />
          </Route>
          <Route element={<RoleRoute allow={['recruiter']} />}>
            <Route path="/recruiter/dashboard" element={<RecruiterDashboard />} />
          </Route>
          <Route element={<RoleRoute allow={['interviewer']} />}>
            <Route path="/interviewer/dashboard" element={<InterviewerDashboard />} />
          </Route>
          <Route element={<RoleRoute allow={['admin']} />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}
