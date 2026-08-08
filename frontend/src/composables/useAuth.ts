import { ref } from 'vue';
import { useRouter } from 'vue-router';

export function useAuth() {
  const router = useRouter();
  const email = ref('');
  const password = ref('');
  const regName = ref('');
  const regEmail = ref('');
  const regPassword = ref('');
  const regConfirmPassword = ref('');
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

      const data = await response.json();

      if (!response.ok) {
        errorMessage.value = data.error || 'Invalid email or password';
        return;
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.role);
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      if (data.role === 'admin') {
        void router.push('/admin/dashboard');
      } else if (data.role === 'doctor' || data.role === 'provider') {
        void router.push('/doctor/dashboard');
      } else {
        void router.push('/client/dashboard');
      }
    } catch (err) {
      console.error('Login request error:', err);
      const message = err instanceof Error ? err.message : 'Unable to connect to login server';
      errorMessage.value = message;
    } finally {
      loading.value = false;
    }
  };

  const handleClientRegister = async () => {
    if (!regName.value.trim()) {
      errorMessage.value = 'Full name is required';
      return;
    }
    if (!regEmail.value.trim()) {
      errorMessage.value = 'Email address is required';
      return;
    }
    if (regPassword.value.length < 4) {
      errorMessage.value = 'Password must be at least 4 characters long';
      return;
    }
    if (regPassword.value !== regConfirmPassword.value) {
      errorMessage.value = 'Passwords do not match';
      return;
    }

    loading.value = true;
    errorMessage.value = '';

    try {
      const API_BASE = import.meta.env.API_URL || 'http://localhost:5001/api';
      const response = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName.value.trim(),
          email: regEmail.value.trim(),
          password: regPassword.value,
          role: 'client'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        errorMessage.value = data.error || 'Registration failed';
        return;
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('role', 'client');
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      void router.push('/client/dashboard');
    } catch (err) {
      console.error('Registration request error:', err);
      const message = err instanceof Error ? err.message : 'Unable to connect to server';
      errorMessage.value = message;
    } finally {
      loading.value = false;
    }
  };

  return {
    email,
    password,
    regName,
    regEmail,
    regPassword,
    regConfirmPassword,
    loading,
    errorMessage,
    handleLogin,
    handleClientRegister,
  };
}
