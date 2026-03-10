import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../api/client';

export function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await apiClient.post('/auth/signup', { email, password });
      navigate('/login', { state: { message: 'Account created successfully. Please log in.' } });
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { status: number; data?: { message?: string } } };
        if (axiosErr.response?.status === 409) {
          setError('Email already exists');
        } else if (axiosErr.response?.status === 400) {
          setError('Please check your input and try again.');
        } else {
          setError('An error occurred. Please try again.');
        }
      } else {
        setError('An error occurred. Please try again.');
      }
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px' }}>
      <h1>Sign Up</h1>
      {error && <p style={{ color: 'red' }} data-testid="error-message">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '10px' }}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ display: 'block', width: '100%', padding: '8px' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            style={{ display: 'block', width: '100%', padding: '8px' }}
          />
        </div>
        <button type="submit" style={{ padding: '8px 16px' }}>Sign Up</button>
      </form>
      <p>
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </div>
  );
}
