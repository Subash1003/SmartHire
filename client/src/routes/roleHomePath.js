const ROLE_HOME_PATHS = {
  admin: '/admin/dashboard',
  recruiter: '/recruiter/dashboard',
  interviewer: '/interviewer/dashboard',
  candidate: '/candidate/dashboard',
};

export function roleHomePath(role) {
  return ROLE_HOME_PATHS[role] || '/';
}
