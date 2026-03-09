import { Leaf } from 'lucide-react';

export default function Logo({ collapsed }) {
    return (
        <div className="logo">
            <div className="logo-icon">
                <img src="/logo.png" alt="HR System Logo" style={{ width: 32, height: 32, objectFit: 'contain' }} />
            </div>
            {!collapsed && (
                <div className="logo-text">
                    <span className="logo-hr">GEMINI</span>
                    <span className="logo-monitor">Agri Farm Solutions Corp.</span>
                </div>
            )}
        </div>
    );
}
