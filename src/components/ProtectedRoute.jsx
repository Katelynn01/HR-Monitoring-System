import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children, requiredRole }) {
    const { user, userProfile, loading } = useAuth();

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="loading-spinner"></div>
                <p>Loading...</p>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" />;
    }

    if (requiredRole) {
        const currentRole = userProfile?.role || 'employee'; // default to employee if db doc missing
        if (currentRole !== requiredRole) {
            return <Navigate to={currentRole === 'admin' ? '/admin' : '/employee'} replace />;
        }
    }

    return children;
}
