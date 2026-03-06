import { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';
import { Users, Search, Edit3, X, Save, Leaf } from 'lucide-react';
import EmployeeHistoryModal from '../../components/EmployeeHistoryModal';

export default function Employees() {
    const [employees, setEmployees] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [editData, setEditData] = useState({});
    const [selectedHistoryUser, setSelectedHistoryUser] = useState(null);

    useEffect(() => { fetchEmployees(); }, []);

    async function fetchEmployees() {
        try {
            const snap = await getDocs(query(collection(db, 'users'), where('role', '==', 'employee')));
            const list = [];
            snap.forEach(d => list.push({ id: d.id, ...d.data() }));
            setEmployees(list);
        } catch (err) {
            console.error('Error fetching employees:', err);
        }
        setLoading(false);
    }

    function startEdit(emp) {
        setEditingId(emp.id);
        setEditData({
            name: emp.name,
            department: emp.department,
            vacation: emp.leaveCredits?.vacation ?? 15,
            sick: emp.leaveCredits?.sick ?? 10,
            personal: emp.leaveCredits?.personal ?? 5
        });
    }

    async function saveEdit() {
        try {
            await updateDoc(doc(db, 'users', editingId), {
                name: editData.name,
                department: editData.department,
                leaveCredits: {
                    vacation: Number(editData.vacation),
                    sick: Number(editData.sick),
                    personal: Number(editData.personal)
                }
            });
            setEditingId(null);
            fetchEmployees();
        } catch (err) {
            console.error('Error updating employee:', err);
        }
    }

    const filtered = employees.filter(e =>
        e.name?.toLowerCase().includes(search.toLowerCase()) ||
        e.email?.toLowerCase().includes(search.toLowerCase()) ||
        e.department?.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return <div className="loading-screen"><div className="loading-spinner"></div><p>Loading employees...</p></div>;
    }

    return (
        <div>
            <div className="section-header">
                <div>
                    <h1 className="page-title"><Users size={28} /> Employees</h1>
                    <p className="page-subtitle">Manage employee profiles and leave credits</p>
                </div>
            </div>

            <div className="filters-bar">
                <div className="header-search" style={{ flex: 1, maxWidth: 400 }}>
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Search employees..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                <span className="badge badge-info">{filtered.length} employees</span>
            </div>

            <div className="content-card">
                <div className="card-body-flush">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Department</th>
                                <th>Vacation</th>
                                <th>Sick</th>
                                <th>Personal</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr><td colSpan={7}>
                                    <div className="empty-state"><Leaf size={40} /><p>No employees found</p></div>
                                </td></tr>
                            ) : (
                                filtered.map(emp => (
                                    <tr key={emp.id}>
                                        {editingId === emp.id ? (
                                            <>
                                                <td><input className="filter-input" value={editData.name} onChange={e => setEditData({ ...editData, name: e.target.value })} /></td>
                                                <td>{emp.email}</td>
                                                <td><input className="filter-input" value={editData.department} onChange={e => setEditData({ ...editData, department: e.target.value })} /></td>
                                                <td><input className="filter-input" type="number" style={{ width: 60 }} value={editData.vacation} onChange={e => setEditData({ ...editData, vacation: e.target.value })} /></td>
                                                <td><input className="filter-input" type="number" style={{ width: 60 }} value={editData.sick} onChange={e => setEditData({ ...editData, sick: e.target.value })} /></td>
                                                <td><input className="filter-input" type="number" style={{ width: 60 }} value={editData.personal} onChange={e => setEditData({ ...editData, personal: e.target.value })} /></td>
                                                <td>
                                                    <div style={{ display: 'flex', gap: 8 }}>
                                                        <button className="btn btn-primary btn-sm" onClick={saveEdit}><Save size={14} /> Save</button>
                                                        <button className="btn btn-secondary btn-sm" onClick={() => setEditingId(null)}><X size={14} /></button>
                                                    </div>
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                <td
                                                    style={{ fontWeight: 600, cursor: 'pointer', color: 'var(--green-600)', textDecoration: 'underline' }}
                                                    onClick={() => setSelectedHistoryUser(emp)}
                                                    title="Click to view history"
                                                >
                                                    {emp.name}
                                                </td>
                                                <td>{emp.email}</td>
                                                <td><span className="badge badge-success">{emp.department || '—'}</span></td>
                                                <td>{emp.leaveCredits?.vacation ?? 15}</td>
                                                <td>{emp.leaveCredits?.sick ?? 10}</td>
                                                <td>{emp.leaveCredits?.personal ?? 5}</td>
                                                <td>
                                                    <button className="btn btn-secondary btn-sm" onClick={() => startEdit(emp)}><Edit3 size={14} /> Edit</button>
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <EmployeeHistoryModal
                isOpen={!!selectedHistoryUser}
                onClose={() => setSelectedHistoryUser(null)}
                employee={selectedHistoryUser}
            />
        </div>
    );
}
