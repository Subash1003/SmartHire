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
import JobApply from '../pages/candidate/JobApply';
import CandidateApplications from '../pages/candidate/Applications';
import CandidateApplicationDetail from '../pages/candidate/ApplicationDetail';
import RecruiterDashboard from '../pages/recruiter/Dashboard';
import RecruiterJobs from '../pages/recruiter/Jobs';
import RecruiterJobForm from '../pages/recruiter/JobForm';
import RecruiterJobDetail from '../pages/recruiter/JobDetail';
import RecruiterApplications from '../pages/recruiter/Applications';
import RecruiterApplicationDetail from '../pages/recruiter/ApplicationDetail';
import RecruiterPipeline from '../pages/recruiter/Pipeline';
import RecruiterInterviews from '../pages/recruiter/Interviews';
import RecruiterInterviewForm from '../pages/recruiter/InterviewForm';
import InterviewerDashboard from '../pages/interviewer/Dashboard';
import InterviewerInterviews from '../pages/interviewer/Interviews';
import InterviewerInterviewDetail from '../pages/interviewer/InterviewDetail';
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
            <Route path="/candidate/jobs/:id/apply" element={<JobApply />} />
            <Route path="/candidate/applications" element={<CandidateApplications />} />
            <Route path="/candidate/applications/:id" element={<CandidateApplicationDetail />} />
          </Route>
          <Route element={<RoleRoute allow={['recruiter']} />}>
            <Route path="/recruiter/dashboard" element={<RecruiterDashboard />} />
            <Route path="/recruiter/jobs" element={<RecruiterJobs />} />
            <Route path="/recruiter/jobs/create" element={<RecruiterJobForm />} />
            <Route path="/recruiter/jobs/:id/edit" element={<RecruiterJobForm />} />
            <Route path="/recruiter/jobs/:id" element={<RecruiterJobDetail />} />
            <Route path="/recruiter/applications" element={<RecruiterApplications />} />
            <Route path="/recruiter/applications/:id" element={<RecruiterApplicationDetail />} />
            <Route path="/recruiter/candidates" element={<RecruiterPipeline />} />
            <Route path="/recruiter/interviews" element={<RecruiterInterviews />} />
            <Route path="/recruiter/interviews/schedule" element={<RecruiterInterviewForm />} />
            <Route path="/recruiter/interviews/:id/edit" element={<RecruiterInterviewForm />} />
          </Route>
          <Route element={<RoleRoute allow={['interviewer']} />}>
            <Route path="/interviewer/dashboard" element={<InterviewerDashboard />} />
            <Route path="/interviewer/interviews" element={<InterviewerInterviews />} />
            <Route path="/interviewer/interviews/:id" element={<InterviewerInterviewDetail />} />
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
