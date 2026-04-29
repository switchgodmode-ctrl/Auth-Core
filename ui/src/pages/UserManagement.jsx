import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { fetchAllUsers, toggleUserSdkAccess, toggleUserStatus } from '../api';
import Card from '../components/ui/Card';
import './dashboard.css';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const res = await fetchAllUsers();
      if (res.status) {
        setUsers(res.users);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSdk = async (id, currentStatus) => {
    try {
      const res = await toggleUserSdkAccess(id, !currentStatus);
      if (res.status) {
        setUsers(users.map(u => u._id === id ? { ...u, sdkAccess: !currentStatus } : u));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 1 ? 0 : 1;
    try {
      const res = await toggleUserStatus(id, newStatus);
      if (res.status) {
        setUsers(users.map(u => u._id === id ? { ...u, status: newStatus } : u));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredUsers = users.filter(u => 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="db-content animate-fade-in" style={{ padding: '0', maxWidth: '100%' }}>
      <header className="db-header-main" style={{ marginBottom: '32px' }}>
        <div>
          <h1 className="db-title" style={{ fontSize: '2.5rem', fontWeight: 800 }}>User Management</h1>
          <p className="db-subtitle">Advanced administrative controls for platform users and developers.</p>
        </div>
        <div className="db-actions">
          <div className="db-search-bar" style={{ background: 'var(--surface2)', borderRadius: '12px', padding: '10px 20px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', minWidth: '400px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--muted)', marginRight: '12px' }}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input 
              type="text" 
              placeholder="Search by email, username, or ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ background: 'none', border: 'none', color: 'var(--text)', outline: 'none', width: '100%', fontSize: '1rem' }}
            />
          </div>
        </div>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card noPadding style={{ border: 'none', background: 'var(--surface2)', overflow: 'hidden' }}>
          <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Player & Developer Directory</h2>
             <div style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>
                Showing <strong>{filteredUsers.length}</strong> users found in system
             </div>
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            <table className="db-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ padding: '20px 24px', textAlign: 'left', color: 'var(--muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ID</th>
                  <th style={{ padding: '20px 24px', textAlign: 'left', color: 'var(--muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>User Details</th>
                  <th style={{ padding: '20px 24px', textAlign: 'left', color: 'var(--muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Plan Status</th>
                  <th style={{ padding: '20px 24px', textAlign: 'left', color: 'var(--muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Account Status</th>
                  <th style={{ padding: '20px 24px', textAlign: 'left', color: 'var(--muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>User Since</th>
                  <th style={{ padding: '20px 24px', textAlign: 'left', color: 'var(--muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>SDK Access</th>
                  <th style={{ padding: '20px 24px', textAlign: 'right', color: 'var(--muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user._id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }} className="table-row-hover">
                    <td style={{ padding: '20px 24px', color: 'var(--muted)', fontSize: '0.85rem', fontFamily: 'monospace' }}>#{String(user._id || '').substring(0, 8)}</td>
                    <td style={{ padding: '20px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{ width: 42, height: 42, borderRadius: '12px', background: 'linear-gradient(135deg, var(--accent), var(--accent2))', color: '#fff', display: 'grid', placeItems: 'center', fontSize: '1rem', fontWeight: 700, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                          {user.username?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: '1rem' }}>{user.username || 'Anonymous'}</div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '20px 24px' }}>
                      <span style={{ 
                        padding: '6px 12px', 
                        borderRadius: '8px', 
                        fontSize: '0.75rem', 
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        background: user.plan === 'Premium' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                        color: user.plan === 'Premium' ? '#f59e0b' : '#64748b',
                        border: user.plan === 'Premium' ? '1px solid rgba(245, 158, 11, 0.2)' : '1px solid rgba(100, 116, 139, 0.2)'
                      }}>
                        {user.plan}
                      </span>
                    </td>
                    <td style={{ padding: '20px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: user.status === 1 ? '#10b981' : '#ef4444' }}></div>
                        <span style={{ fontWeight: 600, color: user.status === 1 ? '#10b981' : '#ef4444', fontSize: '0.9rem' }}>
                          {user.status === 1 ? 'Active' : 'Blocked'}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '20px 24px', color: 'var(--muted)', fontSize: '0.9rem' }}>
                      {user.info ? new Date(user.info).toLocaleDateString() : 'N/A'}
                    </td>
                    <td style={{ padding: '20px 24px' }}>
                       <span style={{ 
                         fontSize: '0.85rem', 
                         fontWeight: 600, 
                         color: user.sdkAccess ? 'var(--accent)' : 'var(--muted)' 
                       }}>
                         {user.sdkAccess ? 'Enabled' : 'Disabled'}
                       </span>
                    </td>
                    <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button 
                          onClick={() => handleToggleStatus(user._id, user.status)}
                          style={{ 
                            padding: '8px 16px', 
                            borderRadius: '8px', 
                            border: '1px solid var(--border)', 
                            background: 'transparent', 
                            color: 'var(--text)',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          className="btn-hover-surface"
                        >
                          {user.status === 1 ? 'Block' : 'Unblock'}
                        </button>
                        <button 
                          onClick={() => handleToggleSdk(user._id, user.sdkAccess)}
                          style={{ 
                            padding: '8px 16px', 
                            borderRadius: '8px', 
                            border: 'none', 
                            background: user.sdkAccess ? 'rgba(239, 68, 68, 0.1)' : 'rgba(99, 102, 241, 0.1)', 
                            color: user.sdkAccess ? '#ef4444' : 'var(--accent)',
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          {user.sdkAccess ? 'Revoke SDK' : 'Grant SDK'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default UserManagement;
