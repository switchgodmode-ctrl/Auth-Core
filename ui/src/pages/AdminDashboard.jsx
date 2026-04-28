import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Line, Bar, Pie } from 'react-chartjs-2';
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
} from 'chart.js';
import { fetchAdminStats } from '../api';
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
  Legend
);

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
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

  if (loading) return <div className="loading-screen">Loading Admin Insights...</div>;
  if (!stats) return <div className="error-screen">Failed to load admin data.</div>;

  const userGrowthData = {
    labels: stats.userGrowth.map(d => d._id),
    datasets: [
      {
        label: 'New Users',
        data: stats.userGrowth.map(d => d.count),
        fill: true,
        backgroundColor: 'rgba(56, 189, 248, 0.2)',
        borderColor: '#38bdf8',
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
        backgroundColor: '#10b981',
      },
    ],
  };

  const planData = {
    labels: stats.planStats.map(d => d._id),
    datasets: [
      {
        data: stats.planStats.map(d => d.count),
        backgroundColor: ['#38bdf8', '#8b5cf6', '#f43f5e'],
        borderWidth: 0,
      },
    ],
  };

  return (
    <div className="dashboard-content animate-fade-in">
      <header className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Admin Intelligence</h1>
          <p className="dashboard-subtitle">Monitor your platform's growth and financial performance.</p>
        </div>
      </header>

      <div className="stats-grid">
        <motion.div whileHover={{ y: -5 }} className="stat-card">
          <span className="stat-label">Total Users</span>
          <span className="stat-value">{stats.totals.users}</span>
          <div className="stat-trend positive">All Time</div>
        </motion.div>
        <motion.div whileHover={{ y: -5 }} className="stat-card">
          <span className="stat-label">Total Revenue</span>
          <span className="stat-value">₹{stats.totals.revenue / 100}</span>
          <div className="stat-trend positive">Paid</div>
        </motion.div>
      </div>

      <div className="admin-charts-grid">
        <div className="chart-container-card">
          <h3>User Growth (Last 7 Days)</h3>
          <Line data={userGrowthData} options={{ responsive: true, maintainAspectRatio: false }} />
        </div>
        <div className="chart-container-card">
          <h3>Revenue Trends</h3>
          <Bar data={revenueData} options={{ responsive: true, maintainAspectRatio: false }} />
        </div>
        <div className="chart-container-card">
          <h3>Plan Distribution</h3>
          <div style={{ height: '250px' }}>
            <Pie data={planData} options={{ responsive: true, maintainAspectRatio: false }} />
          </div>
        </div>
      </div>

      <section className="activity-section" style={{ marginTop: '30px' }}>
        <h2 className="section-title">System Insights</h2>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Plan Type</th>
                <th>Active Users</th>
              </tr>
            </thead>
            <tbody>
              {stats.planStats.map((item, idx) => (
                <tr key={idx}>
                  <td>{item._id}</td>
                  <td>{item.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;
