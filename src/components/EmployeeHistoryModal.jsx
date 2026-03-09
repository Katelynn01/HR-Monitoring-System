import { useState, useEffect } from 'react';
import { X, HeartPulse, Phone, Sunrise, Clock } from 'lucide-react';
import { db } from '../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

export default function EmployeeHistoryModal({ isOpen, onClose, employee }) {
    const [earlyBirds, setEarlyBirds] = useState([]);
    const [overtimes, setOvertimes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && employee) {
            fetchData();
        }
    }, [isOpen, employee]);

    async function fetchData() {
        setLoading(true);
        try {
            // Fetch Attendance
            const attQ = query(collection(db, 'attendance'), where('userId', '==', employee.id));
            const attSnap = await getDocs(attQ);

            const WORK_HOUR = 8, WORK_MINUTE = 30;
            const OUT_HOUR = 17, OUT_MINUTE = 30;
            const earlyList = [];
            const overtimeList = [];

            attSnap.forEach(d => {
                const data = d.data();
                if (data.timeIn) {
                    const timeInDate = data.timeIn?.toDate?.() || new Date(data.timeIn);
                    const h = timeInDate.getHours();
                    const m = timeInDate.getMinutes();
                    const isEarly = h < WORK_HOUR || (h === WORK_HOUR && m < WORK_MINUTE);

                    if (isEarly) {
                        const minsEarly = (WORK_HOUR * 60 + WORK_MINUTE) - (h * 60 + m);
                        earlyList.push({
                            id: d.id,
                            date: data.date?.toDate?.() || null,
                            dateStr: data.date?.toDate?.()?.toLocaleDateString() || '—',
                            timeIn: timeInDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                            minsEarly
                        });
                    }
                }

                if (data.timeOut && data.timeOut !== 'Active') {
                    const timeOutDate = data.timeOut?.toDate?.() || new Date(data.timeOut);
                    const hOut = timeOutDate.getHours();
                    const mOut = timeOutDate.getMinutes();
                    const isOvertime = hOut > OUT_HOUR || (hOut === OUT_HOUR && mOut > OUT_MINUTE);

                    if (isOvertime) {
                        const minsOvertime = (hOut * 60 + mOut) - (OUT_HOUR * 60 + OUT_MINUTE);
                        overtimeList.push({
                            id: `${d.id}_ot`,
                            date: data.date?.toDate?.() || null,
                            dateStr: data.date?.toDate?.()?.toLocaleDateString() || '—',
                            timeOut: timeOutDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                            minsOvertime
                        });
                    }
                }
            });

            earlyList.sort((a, b) => (b.date || 0) - (a.date || 0));
            overtimeList.sort((a, b) => (b.date || 0) - (a.date || 0));

            setEarlyBirds(earlyList);
            setOvertimes(overtimeList);
        } catch (err) {
            console.error('Error fetching history:', err);
        }
        setLoading(false);
    }

    if (!isOpen || !employee) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
        }}>
            <div style={{
                backgroundColor: '#ffffff',
                border: '4px solid #22c55e',
                borderRadius: '12px',
                width: '95%',
                maxWidth: '700px',
                height: '85vh',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '20px 24px',
                    borderBottom: '1px solid #e5e7eb',
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px 8px 0 0'
                }}>
                    <div>
                        <h2 style={{ color: '#166534', margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>{employee.name}</h2>
                        <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>{employee.department || '—'}</span>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: '#6b7280',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content Area */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#6b7280' }}>
                            Loading data...
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                            {/* Emergency Contact Section */}
                            <div>
                                <h3 style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '8px', color: '#374151', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    Emergency Contact
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', backgroundColor: '#f0fdf4', padding: '16px', borderRadius: '8px', border: '1px solid #dcfce7' }}>
                                    <div>
                                        <p style={{ margin: '0 0 4px', fontSize: '0.875rem', color: '#166534', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                                            <HeartPulse size={14} /> Contact Name
                                        </p>
                                        <p style={{ margin: 0, fontWeight: 500, color: employee.emergencyContactName ? '#111827' : '#9ca3af', fontStyle: employee.emergencyContactName ? 'normal' : 'italic', fontSize: '1rem' }}>
                                            {employee.emergencyContactName || 'Not Set'}
                                        </p>
                                    </div>
                                    <div>
                                        <p style={{ margin: '0 0 4px', fontSize: '0.875rem', color: '#166534', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                                            <Phone size={14} /> Contact Number
                                        </p>
                                        <p style={{ margin: 0, fontWeight: 500, color: employee.emergencyContactNumber ? '#111827' : '#9ca3af', fontStyle: employee.emergencyContactNumber ? 'normal' : 'italic', fontSize: '1rem' }}>
                                            {employee.emergencyContactNumber || 'Not Set'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Early Bird Log Section */}
                            <div>
                                <h3 style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '8px', color: '#374151', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Sunrise size={18} color="#eab308" /> Early Bird Records
                                </h3>
                                {earlyBirds.length === 0 ? (
                                    <div style={{ textAlign: 'center', color: '#6b7280', padding: '32px 0', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px dashed #d1d5db' }}>
                                        <Sunrise size={32} style={{ color: '#d1d5db', marginBottom: '8px' }} />
                                        <p style={{ margin: 0 }}>No early arrival records found.</p>
                                    </div>
                                ) : (
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>Date</th>
                                                <th>Time In</th>
                                                <th>Mins Early (Before 8:30)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {earlyBirds.map(record => (
                                                <tr key={record.id}>
                                                    <td style={{ fontWeight: 500 }}>{record.dateStr}</td>
                                                    <td><span className="badge badge-success">{record.timeIn}</span></td>
                                                    <td style={{ color: '#16a34a', fontWeight: 600 }}>
                                                        {record.minsEarly >= 60
                                                            ? `${Math.floor(record.minsEarly / 60)}h ${record.minsEarly % 60}m`
                                                            : `${record.minsEarly}m`}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>

                            {/* Overtime Log Section */}
                            <div>
                                <h3 style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '8px', color: '#374151', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Clock size={18} color="#f97316" /> Overtime Records
                                </h3>
                                {overtimes.length === 0 ? (
                                    <div style={{ textAlign: 'center', color: '#6b7280', padding: '32px 0', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px dashed #d1d5db' }}>
                                        <Clock size={32} style={{ color: '#d1d5db', marginBottom: '8px' }} />
                                        <p style={{ margin: 0 }}>No overtime records found.</p>
                                    </div>
                                ) : (
                                    <table className="data-table">
                                        <thead>
                                            <tr>
                                                <th>Date</th>
                                                <th>Time Out</th>
                                                <th>Mins Overtime (After 5:30 PM)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {overtimes.map(record => (
                                                <tr key={record.id}>
                                                    <td style={{ fontWeight: 500 }}>{record.dateStr}</td>
                                                    <td><span className="badge badge-warning">{record.timeOut}</span></td>
                                                    <td style={{ color: '#ea580c', fontWeight: 600 }}>
                                                        {record.minsOvertime >= 60
                                                            ? `${Math.floor(record.minsOvertime / 60)}h ${record.minsOvertime % 60}m`
                                                            : `${record.minsOvertime}m`}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
