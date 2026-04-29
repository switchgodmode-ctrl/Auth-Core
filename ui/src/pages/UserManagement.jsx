import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { fetchAllUsers, toggleUserSdkAccess } from '../api';
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

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', height: '80vh', color: 'var(--muted)' }}>
        <div className="loading-spinner"></div>
        <p style={{ marginTop: '16px', fontWeight: 600 }}>Loading User Directory...</p>
      </div>
    );
  }

  return (
    <div className="db-content animate-fade-in">
      <header className="db-page-head">
        <div>
          <h1 className="db-page-title">User Management</h1>
          <p className="db-page-sub">Manage platform permissions, SDK access, and user accounts.</p>
        </div>
        <div className="dash-search" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </span>
          <input
            placeholder="Search by email or username..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </header>

      <div style={{ marginTop: '24px' }}>
        <Card title="Player & Developer Directory" subtitle={`${filteredUsers.length} users found in the system`}>
          <div className="table-container" style={{ marginTop: '20px' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>User Details</th>
                  <th>Plan Status</th>
                  <th>Verification</th>
                  <th>SDK Access</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user._id}>
                    <td style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>#{String(user._id || '').substring(0, 8)}...</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent2)', color: '#fff', display: 'grid', placeItems: 'center', fontSize: '0.8rem', fontWeight: 700 }}>
                          {user.username?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text)' }}>{user.username || 'Anonymous'}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.02em',
                        backgroundColor: user.plan === 'Free' ? 'rgba(100,116,139,0.15)' : 'rgba(99,102,241,0.15)',
                        color: user.plan === 'Free' ? '#94a3b8' : 'var(--accent)',
                        border: `1px solid ${user.plan === 'Free' ? 'rgba(100,116,139,0.1)' : 'rgba(99,102,241,0.2)'}`
                      }}>
                        {user.plan}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: user.status === 1 ? '#10b981' : '#f59e0b' }}></div>
                        {user.status === 1 ? 'Verified' : 'Pending'}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                         <span style={{ fontSize: '0.8rem', color: user.sdkAccess ? 'var(--green)' : 'var(--muted)' }}>
                            {user.sdkAccess ? 'Enabled' : 'Disabled'}
                         </span>
                      </div>
                    </td>
                    <td>
                      <button 
                        onClick={() => handleToggleSdk(user._id, user.sdkAccess)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '8px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          border: '1px solid var(--border)',
                          cursor: 'pointer',
                          backgroundColor: user.sdkAccess ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                          color: user.sdkAccess ? '#ef4444' : '#10b981',
                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}
                        onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
                        onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
                      >
                        {user.sdkAccess ? 'Revoke SDK' : 'Grant SDK'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default UserManagement;
