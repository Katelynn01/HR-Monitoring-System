import { useState, useEffect } from 'react';
import { X, Clock, CalendarCheck, Check, AlertCircle, Download } from 'lucide-react';
import { db } from '../firebase';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';

export default function EmployeeHistoryModal({ isOpen, onClose, employee }) {
    const [attendance, setAttendance] = useState([]);
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('attendance'); // 'attendance' or 'leaves'

    useEffect(() => {
        if (isOpen && employee) {
            setTab('attendance');
            fetchData();
        }
    }, [isOpen, employee]);

    async function fetchData() {
        setLoading(true);
        try {
            // Fetch Attendance
            const attQ = query(collection(db, 'attendance'), where('userId', '==', employee.id));
            const attSnap = await getDocs(attQ);
            const attList = [];
            attSnap.forEach(d => {
                const data = d.data();
                attList.push({
                    id: d.id,
                    date: data.date?.toDate?.() || null,
                    dateStr: data.date?.toDate?.()?.toLocaleDateString() || '—',
                    timeIn: data.timeIn?.toDate?.()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || '—',
                    timeOut: data.timeOut?.toDate?.()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || 'Active',
                    totalHours: data.totalHours != null ? data.totalHours.toFixed(1) : '—'
                });
            });
            attList.sort((a, b) => (b.date || 0) - (a.date || 0));
            setAttendance(attList);

            // Fetch Leaves
            const leaveQ = query(collection(db, 'leaveRequests'), where('userId', '==', employee.id));
            const leaveSnap = await getDocs(leaveQ);
            const leaveList = [];
            leaveSnap.forEach(d => {
                const data = d.data();
                leaveList.push({
                    id: d.id,
                    type: data.type,
                    status: data.status,
                    createdAt: data.createdAt?.toDate?.() || new Date(0),
                    startDateStr: data.startDate?.toDate?.()?.toLocaleDateString() || data.startDate,
                    endDateStr: data.endDate?.toDate?.()?.toLocaleDateString() || data.endDate,
                    reason: data.reason
                });
            });
            leaveList.sort((a, b) => b.createdAt - a.createdAt);
            setLeaves(leaveList);
        } catch (err) {
            console.error('Error fetching history:', err);
        }
        setLoading(false);
    }

    function handleExportCSV() {
        let csvContent = "data:text/csv;charset=utf-8,";
        if (tab === 'attendance') {
            csvContent += "Date,Time In,Time Out,Total Hours\n";
            attendance.forEach(a => {
                const row = [`"${a.dateStr}"`, `"${a.timeIn}"`, `"${a.timeOut}"`, `"${a.totalHours}"`].join(",");
                csvContent += row + "\n";
            });
        } else {
            csvContent += "Type,Start Date,End Date,Status,Reason\n";
            leaves.forEach(l => {
                const row = [`"${l.type}"`, `"${l.startDateStr}"`, `"${l.endDateStr}"`, `"${l.status}"`, `"${(l.reason || '').replace(/"/g, '""')}"`].join(",");
                csvContent += row + "\n";
            });
        }

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${employee.name.replace(/\s+/g, '_')}_${tab}_history.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
                border: '4px solid #22c55e', // green border
                borderRadius: '12px',
                width: '95%',
                maxWidth: '700px',
                height: '80vh',
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
                    borderBottom: '1px solid #e5e7eb'
                }}>
                    <div>
                        <h2 style={{ color: '#166534', margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>{employee.name}</h2>
                        <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>{employee.department} • History</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button
                            onClick={handleExportCSV}
                            style={{
                                background: '#f0fdf4',
                                border: '1px solid #bbf7d0',
                                cursor: 'pointer',
                                color: '#166534',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                transition: 'background 0.2s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.background = '#dcfce7'}
                            onMouseOut={(e) => e.currentTarget.style.background = '#f0fdf4'}
                        >
                            <Download size={16} /> Export CSV
                        </button>
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
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
                    <button
                        onClick={() => setTab('attendance')}
                        style={{
                            flex: 1,
                            padding: '12px',
                            background: tab === 'attendance' ? '#ffffff' : 'transparent',
                            border: 'none',
                            borderBottom: tab === 'attendance' ? '3px solid #22c55e' : '3px solid transparent',
                            color: tab === 'attendance' ? '#166534' : '#6b7280',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px'
                        }}
                    >
                        <Clock size={16} /> Attendance Log
                    </button>
                    <button
                        onClick={() => setTab('leaves')}
                        style={{
                            flex: 1,
                            padding: '12px',
                            background: tab === 'leaves' ? '#ffffff' : 'transparent',
                            border: 'none',
                            borderBottom: tab === 'leaves' ? '3px solid #facc15' : '3px solid transparent',
                            color: tab === 'leaves' ? '#ca8a04' : '#6b7280',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px'
                        }}
                    >
                        <CalendarCheck size={16} /> Leave Requests
                    </button>
                </div>

                {/* Content Area */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#6b7280' }}>
                            Loading data...
                        </div>
                    ) : tab === 'attendance' ? (
                        <div>
                            {attendance.length === 0 ? (
                                <p style={{ textAlign: 'center', color: '#6b7280', marginTop: '40px' }}>No attendance records found.</p>
                            ) : (
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Time In</th>
                                            <th>Time Out</th>
                                            <th>Hours</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {attendance.map(a => (
                                            <tr key={a.id}>
                                                <td>{a.dateStr}</td>
                                                <td><span className="badge badge-success">{a.timeIn}</span></td>
                                                <td><span className={`badge ${a.timeOut === 'Active' ? 'badge-warning' : 'badge-info'}`}>{a.timeOut}</span></td>
                                                <td style={{ fontWeight: 600 }}>{a.totalHours}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    ) : (
                        <div>
                            {leaves.length === 0 ? (
                                <p style={{ textAlign: 'center', color: '#6b7280', marginTop: '40px' }}>No leave requests found.</p>
                            ) : (
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Type</th>
                                            <th>From</th>
                                            <th>To</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {leaves.map(r => (
                                            <tr key={r.id}>
                                                <td><span className="badge badge-info" style={{ textTransform: 'capitalize' }}>{r.type}</span></td>
                                                <td>{r.startDateStr}</td>
                                                <td>{r.endDateStr}</td>
                                                <td>
                                                    <span className={`badge ${r.status === 'approved' ? 'badge-success' : r.status === 'rejected' ? 'badge-danger' : 'badge-warning'}`}>
                                                        {r.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
