import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Logo from '../components/Logo';
import { Mail, Lock, LogIn, AlertCircle, Eye, EyeOff, CheckCircle } from 'lucide-react';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, resetPassword } = useAuth();
    const navigate = useNavigate();

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const result = await login(email, password);
            // Get user profile to determine redirect
            const { getDoc, doc } = await import('firebase/firestore');
            const { db } = await import('../firebase');
            const profileDoc = await getDoc(doc(db, 'users', result.user.uid));
            const role = profileDoc.data()?.role;
            navigate(role === 'admin' ? '/admin' : '/employee');
        } catch (err) {
            setError(
                err.code === 'auth/invalid-credential'
                    ? 'Invalid email or password'
                    : err.code === 'auth/too-many-requests'
                        ? 'Too many attempts. Please try again later.'
                        : 'Failed to sign in. Please try again.'
            );
        }
        setLoading(false);
    }

    async function handleForgotPassword() {
        if (!email) {
            return setError('Please enter your email address first.');
        }
        try {
            setMessage('');
            setError('');
            setLoading(true);
            await resetPassword(email);
            setMessage('Check your inbox for password reset instructions.');
        } catch (err) {
            setError('Failed to reset password. Please check your email address.');
        }
        setLoading(false);
    }

    return (
        <div className="auth-page">
            <div className="auth-card">
                <Logo />
                <h1 className="auth-title">Welcome Back</h1>
                <p className="auth-subtitle">Sign in to your HR monitoring dashboard</p>

                {error && (
                    <div className="auth-error">
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}

                {message && (
                    <div className="auth-message" style={{
                        backgroundColor: '#f0fdf4',
                        color: '#166534',
                        padding: '12px',
                        borderRadius: '8px',
                        marginBottom: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '0.875rem',
                        border: '1px solid #bbf7d0'
                    }}>
                        <CheckCircle size={16} />
                        {message}
                    </div>
                )}

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label><Mail size={14} /> Email Address</label>
                        <input
                            type="email"
                            className="form-input"
                            placeholder="you@company.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <label><Lock size={14} /> Password</label>
                            <button
                                type="button"
                                onClick={handleForgotPassword}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--green-600)',
                                    fontSize: '0.75rem',
                                    cursor: 'pointer',
                                    fontWeight: 600,
                                    padding: 0
                                }}
                            >
                                Forgot Password?
                            </button>
                        </div>
                        <div style={{ position: 'relative', width: '100%' }}>
                            <input
                                type={showPassword ? "text" : "password"}
                                className="form-input"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                style={{ paddingRight: '40px', width: '100%' }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute',
                                    right: '12px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--gray-400)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '4px'
                                }}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>
                    <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                        <LogIn size={18} />
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <p className="auth-link">
                    Don't have an account? <Link to="/register">Register here</Link>
                </p>
            </div>
        </div>
    );
}
