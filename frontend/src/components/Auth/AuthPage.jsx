import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handle = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      if (isLogin) await login(form.email, form.password);
      else await register(form.username, form.email, form.password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-board-deco">
        {Array(64).fill(null).map((_, i) => (
          <div key={i} className={`auth-cell ${(Math.floor(i/8)+i)%2===0?'light':'dark'}`} />
        ))}
      </div>
      <div className="auth-card">
        <div className="auth-logo">♛</div>
        <h1 className="auth-title">Chess Master</h1>
        <p className="auth-subtitle">{isLogin ? 'Welcome back, grandmaster' : 'Begin your journey'}</p>

        <div className="auth-tabs">
          <button className={`auth-tab ${isLogin?'active':''}`} onClick={() => { setIsLogin(true); setError(''); }}>Sign In</button>
          <button className={`auth-tab ${!isLogin?'active':''}`} onClick={() => { setIsLogin(false); setError(''); }}>Register</button>
        </div>

        <form onSubmit={handle} className="auth-form">
          {!isLogin && (
            <div className="form-group">
              <label>Username</label>
              <input type="text" placeholder="e.g. GrandMaster99" value={form.username}
                onChange={e => setForm({...form, username: e.target.value})} required />
            </div>
          )}
          <div className="form-group">
            <label>Email</label>
            <input type="email" placeholder="you@example.com" value={form.email}
              onChange={e => setForm({...form, email: e.target.value})} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" placeholder="••••••••" value={form.password}
              onChange={e => setForm({...form, password: e.target.value})} required />
          </div>
          {error && <div className="auth-error">⚠ {error}</div>}
          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? '...' : isLogin ? 'Enter the Board' : 'Create Account'}
          </button>
        </form>

        <div className="auth-pieces-row">♔ ♕ ♗ ♘ ♖ ♙</div>
      </div>
    </div>
  );
};

export default AuthPage;
