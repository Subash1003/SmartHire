import { Routes, Route } from 'react-router-dom';
import PublicLayout from '../layouts/PublicLayout';
import DashboardLayout from '../layouts/DashboardLayout';
import Home from '../pages/public/Home';
import Login from '../pages/public/Login';
import Register from '../pages/public/Register';
import ForgotPassword from '../pages/public/ForgotPassword';
import ResetPassword from '../pages/public/ResetPassword';
import Jobs from '../pages/public/Jobs';
import JobDetail from '../pages/public/JobDetail';
import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';
import CandidateDashboard from '../pages/candidate/Dashboard';
import CandidateProfile from '../pages/candidate/Profile';
import RecruiterDashboard from '../pages/recruiter/Dashboard';
import RecruiterJobs from '../pages/recruiter/Jobs';
import RecruiterJobForm from '../pages/recruiter/JobForm';
import RecruiterJobDetail from '../pages/recruiter/JobDetail';
import InterviewerDashboard from '../pages/interviewer/Dashboard';
import AdminDashboard from '../pages/admin/Dashboard';
import AdminUsers from '../pages/admin/Users';
import AdminSettings from '../pages/admin/Settings';

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/jobs/:id" element={<JobDetail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route element={<RoleRoute allow={['candidate']} />}>
            <Route path="/candidate/dashboard" element={<CandidateDashboard />} />
            <Route path="/candidate/profile" element={<CandidateProfile />} />
          </Route>
          <Route element={<RoleRoute allow={['recruiter']} />}>
            <Route path="/recruiter/dashboard" element={<RecruiterDashboard />} />
            <Route path="/recruiter/jobs" element={<RecruiterJobs />} />
            <Route path="/recruiter/jobs/create" element={<RecruiterJobForm />} />
            <Route path="/recruiter/jobs/:id/edit" element={<RecruiterJobForm />} />
            <Route path="/recruiter/jobs/:id" element={<RecruiterJobDetail />} />
          </Route>
          <Route element={<RoleRoute allow={['interviewer']} />}>
            <Route path="/interviewer/dashboard" element={<InterviewerDashboard />} />
          </Route>
          <Route element={<RoleRoute allow={['admin']} />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}
