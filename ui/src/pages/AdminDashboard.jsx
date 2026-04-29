import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { fetchAdminStats, fetchAllUsers, toggleUserSdkAccess } from '../api';
import Card from '../components/ui/Card';
import './dashboard.css';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
    loadUsers();
  }, []);

  const loadStats = async () => {
    try {
      const res = await fetchAdminStats();
      if (res.status) {
        setStats(res.stats);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const res = await fetchAllUsers();
      if (res.status) {
        setUsers(res.users);
      }
    } catch (err) {
      console.error(err);
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

  if (loading) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', height: '80vh', color: 'var(--muted)' }}>
        <div className="loading-spinner"></div>
        <p style={{ marginTop: '16px', fontWeight: 600 }}>Analyzing Platform Intelligence...</p>
      </div>
    );
  }

  if (!stats) return <div className="error-screen">Failed to load admin data.</div>;

  // Chart Global Defaults
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#6b7280',
          font: { family: 'DM Sans', size: 12, weight: '500' },
          padding: 20,
          usePointStyle: true,
        },
      },
      tooltip: {
        backgroundColor: '#111827',
        titleColor: '#fff',
        bodyColor: '#e8eaf0',
        borderColor: 'rgba(99, 102, 241, 0.2)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        displayColors: false
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#6b7280', font: { size: 11 } }
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.03)' },
        ticks: { color: '#6b7280', font: { size: 11 } }
      }
    }
  };

  const userGrowthData = {
    labels: stats.userGrowth.map(d => d._id),
    datasets: [
      {
        label: 'New Users',
        data: stats.userGrowth.map(d => d.count),
        fill: true,
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        borderColor: '#6366f1',
        borderWidth: 2,
        pointBackgroundColor: '#6366f1',
        pointBorderColor: '#fff',
        pointHoverRadius: 6,
        tension: 0.4,
      },
    ],
  };

  const revenueData = {
    labels: stats.revenueGrowth.map(d => d._id),
    datasets: [
      {
        label: 'Revenue (INR)',
        data: stats.revenueGrowth.map(d => d.total / 100),
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderRadius: 6,
        hoverBackgroundColor: '#10b981',
      },
    ],
  };

  const planData = {
    labels: stats.planStats.map(d => d._id),
    datasets: [
      {
        data: stats.planStats.map(d => d.count),
        backgroundColor: ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'],
        borderWidth: 0,
        hoverOffset: 10
      },
    ],
  };

  return (
    <div className="db-content animate-fade-in">
      <header className="db-page-head">
        <div>
          <h1 className="db-page-title">Platform Intelligence</h1>
          <p className="db-page-sub">Comprehensive metrics and growth analytics for the entire infrastructure.</p>
        </div>
      </header>

      {/* Hero Stats */}
      <div className="db-stats">
        <div className="db-stat s-purple">
          <div className="db-stat-header">
            <span className="db-stat-label">Total Platform Users</span>
            <div className="db-stat-icon si-purple">👤</div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text)' }}>
            {stats.totals.users.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--green)', marginTop: '8px', fontWeight: 600 }}>+ All time growth</div>
        </div>

        <div className="db-stat s-green">
          <div className="db-stat-header">
            <span className="db-stat-label">Gross Revenue</span>
            <div className="db-stat-icon si-green">₹</div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text)' }}>
            ₹{(stats.totals.revenue / 100).toLocaleString()}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--green)', marginTop: '8px', fontWeight: 600 }}>+ Paid accounts</div>
        </div>

        <div className="db-stat s-cyan">
          <div className="db-stat-header">
            <span className="db-stat-label">Conversion Rate</span>
            <div className="db-stat-icon si-cyan">📈</div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text)' }}>
            {((stats.planStats.find(p => p._id !== 'Free')?.count || 0) / stats.totals.users * 100).toFixed(1)}%
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '8px' }}>Free to Paid ratio</div>
        </div>

        <div className="db-stat s-red">
          <div className="db-stat-header">
            <span className="db-stat-label">Avg. Revenue/User</span>
            <div className="db-stat-icon si-red">💎</div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text)' }}>
            ₹{(stats.totals.revenue / 100 / (stats.totals.users || 1)).toFixed(2)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '8px' }}>ARPU Metric</div>
        </div>
      </div>

      {/* Main Analytics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '24px', marginTop: '24px' }}>
        
        <Card title="User Acquisition" subtitle="New registrations over the last 30 days">
          <div style={{ height: '300px', marginTop: '20px' }}>
            <Line data={userGrowthData} options={chartOptions} />
          </div>
        </Card>

        <Card title="Revenue Growth" subtitle="Daily gross revenue breakdown (INR)">
          <div style={{ height: '300px', marginTop: '20px' }}>
            <Bar data={revenueData} options={chartOptions} />
          </div>
        </Card>

        <Card title="Market Share" subtitle="Distribution of user subscription plans">
          <div style={{ display: 'flex', alignItems: 'center', gap: '32px', height: '280px', marginTop: '10px' }}>
             <div style={{ width: '200px', height: '200px' }}>
                <Doughnut data={planData} options={{ ...chartOptions, cutout: '70%', plugins: { ...chartOptions.plugins, legend: { display: false } } }} />
             </div>
             <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {stats.planStats.map((item, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: 10, height: 10, borderRadius: '50%', background: planData.datasets[0].backgroundColor[i] }}></div>
                                <span style={{ fontSize: '0.9rem', color: 'var(--text)', fontWeight: 500 }}>{item._id}</span>
                            </div>
                            <span style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>{item.count} users</span>
                        </div>
                    ))}
                </div>
             </div>
          </div>
        </Card>

        <Card title="Recent Activity Insights" subtitle="Real-time system health and plan distribution">
            <div className="table-container" style={{ marginTop: '10px' }}>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Plan Level</th>
                            <th>Active Users</th>
                            <th>Percentage</th>
                        </tr>
                    </thead>
                    <tbody>
                        {stats.planStats.map((item, idx) => (
                            <tr key={idx}>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: planData.datasets[0].backgroundColor[idx] }}></div>
                                        {item._id}
                                    </div>
                                </td>
                                <td style={{ fontWeight: 600 }}>{item.count}</td>
                                <td style={{ color: 'var(--muted)' }}>{((item.count / stats.totals.users) * 100).toFixed(1)}%</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
      </div>

      {/* User Management Section */}
      <div style={{ marginTop: '24px' }}>
        <Card title="User Management" subtitle="Manage permissions and SDK access for all platform users">
            <div className="table-container" style={{ marginTop: '20px' }}>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Email</th>
                            <th>Username</th>
                            <th>Plan</th>
                            <th>Status</th>
                            <th>SDK Access</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user._id}>
                                <td style={{ color: 'var(--muted)' }}>#{user._id}</td>
                                <td style={{ fontWeight: 500 }}>{user.email}</td>
                                <td>{user.username}</td>
                                <td>
                                    <span style={{
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        backgroundColor: user.plan === 'Free' ? 'rgba(100,116,139,0.2)' : 'rgba(16,185,129,0.2)',
                                        color: user.plan === 'Free' ? '#cbd5e1' : '#10b981'
                                    }}>
                                        {user.plan}
                                    </span>
                                </td>
                                <td>{user.status === 1 ? 'Verified' : 'Pending'}</td>
                                <td>
                                    <button 
                                        onClick={() => handleToggleSdk(user._id, user.sdkAccess)}
                                        style={{
                                            padding: '6px 12px',
                                            borderRadius: '6px',
                                            fontSize: '0.8rem',
                                            fontWeight: 600,
                                            border: 'none',
                                            cursor: 'pointer',
                                            backgroundColor: user.sdkAccess ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                            color: user.sdkAccess ? '#10b981' : '#ef4444',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        {user.sdkAccess ? 'Access Granted' : 'Access Denied'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {users.length === 0 && (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: 'var(--muted)' }}>
                                    No users found in the system.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
