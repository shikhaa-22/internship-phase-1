const routes = [
  {
    path: '/',
    component: () => import('../layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('../pages/WelcomePage.vue') },
      { path: 'login', component: () => import('../pages/LoginPage.vue') },
      { path: 'register', component: () => import('../pages/LoginPage.vue') },
      {
        path: 'admin/dashboard',
        component: () => import('../pages/AdminDashboard.vue'),
      },
      {
        path: 'doctor/dashboard',
        component: () => import('../pages/DoctorDashboard.vue'),
      },
      {
        path: 'client/dashboard',
        component: () => import('../pages/ClientDashboard.vue'),
      },
    ],
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('../pages/ErrorNotFound.vue'),
  },
];

export default routes;
