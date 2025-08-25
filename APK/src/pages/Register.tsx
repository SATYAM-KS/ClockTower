import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Register.css';
import { supabase } from '../supabaseClient';

// DEPRECATED: This file is no longer used for routing.
// The app now uses AuthPage from sign/components/AuthPage.tsx
// Original authentication logic is preserved below for reference.

/*
const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    username: '',
    phone: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          username: formData.username,
          phone: formData.phone,
        }
      }
    });

    if (error) {
      setError(error.message);
    } else if (data.user) {
      const { error: insertError } = await supabase.from('app_users').insert([{
        id: data.user.id,
        email: formData.email,
        username: formData.username,
        phone: formData.phone
      }]);

      if (insertError) {
        setError('Registration succeeded, but failed to save user details.');
      } else {
        navigate('/login');
      }
    }
  };

  const handleGoogleAuth = async () => {
    setError('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google'
    });

    if (error) {
      setError(error.message);
    }
    // No redirect needed here, Supabase handles it externally
  };

  return (
    <div className="register-page">
      <form className="register-form" onSubmit={handleRegister}>
        <h2>Register</h2>

        {error && <p className="register-error">{error}</p>}

        <input
          name="username"
          type="text"
          placeholder="Username"
          value={formData.username}
          onChange={handleChange}
          required
        />

        <input 
          name="phone"
          type="tel"
          placeholder="Phone Number"
          value={formData.phone}
          onChange={handleChange}
          required
        />

        <input
          name="email"
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
        />

        <input
          name="password"
          type="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
        />

        <button type="submit">Register</button>

        <div className="oauth-divider">or</div>

        <button
          type="button"
          onClick={handleGoogleAuth}
          className="google-auth-button"
        >
          Continue with Google
        </button>

        <p className="register-footer">
          Already have an account? <a href="/login">Login</a>
        </p>
      </form>
    </div>
  );
};

export default Register;
*/

// DEPRECATED: Using AuthPage wrapper instead
import { SignupForm } from '../../sign/components/SignupForm';

const SignupWrapper: React.FC = () => {
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  return (
    <SignupForm
      showPassword={showPassword}
      showConfirmPassword={showConfirmPassword}
      onTogglePassword={() => setShowPassword((v) => !v)}
      onToggleConfirmPassword={() => setShowConfirmPassword((v) => !v)}
    />
  );
};

export default SignupWrapper;
