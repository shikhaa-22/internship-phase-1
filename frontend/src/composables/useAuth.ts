import { ref } from 'vue';
import { useRouter } from 'vue-router';

export function useAuth() {
  const router = useRouter();
  const email = ref('');
  const password = ref('');
  const loading = ref(false);
  const errorMessage = ref('');

  const handleLogin = async () => {
    loading.value = true;
    errorMessage.value = '';

    try {
        const API_BASE = import.meta.env.API_URL || 'http://localhost:5001/api';
        const response = await fetch(`${API_BASE}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.value, password: password.value }),
        });

      if (!response.ok) {
        throw new Error('Invalid email or password');
      }

      const data = await response.json();
      
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.role); // 'client', 'doctor', or 'admin'

      if (data.role === 'admin') {
        void router.push('/admin/dashboard');
      } else if (data.role === 'doctor') {
        void router.push('/doctor/dashboard');
      } else {
        void router.push('/client/dashboard');
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        errorMessage.value = err.message;
      } else {
        errorMessage.value = 'Login failed';
      }
    } finally {
      loading.value = false;
    }
  };

  return {
    email,
    password,
    loading,
    errorMessage,
    handleLogin,
  };
}