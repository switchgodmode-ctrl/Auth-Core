import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import { fetchAdminStats } from '../api';
import Card from '../components/ui/Card';
import './dashboard.css';

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    Filler
} from 'chart.js';

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

    if (loading) {
        return (
            <div className="db-loading-full">
                <div className="spinner"></div>
                <p>Synchronizing Platform Intelligence...</p>
            </div>
        );
    }

    if (!stats) return <div className="db-error-full">Failed to load platform data.</div>;

    const userGrowthData = {
        labels: stats.userGrowth.map(d => d._id),
        datasets: [{
            label: 'New Registrations',
            data: stats.userGrowth.map(d => d.count),
            borderColor: '#6366f1',
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6
        }]
    };

    const revenueData = {
        labels: stats.revenueGrowth.map(d => d._id),
        datasets: [{
            label: 'Revenue (INR)',
            data: stats.revenueGrowth.map(d => d.total / 100),
            backgroundColor: '#10b981',
            borderRadius: 8
        }]
    };

    const planData = {
        labels: stats.planStats.map(d => d._id),
        datasets: [{
            data: stats.planStats.map(d => d.count),
            backgroundColor: ['#6366f1', '#10b981', '#f59e0b', '#ef4444'],
            borderWidth: 0,
            hoverOffset: 15
        }]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false }
        },
        scales: {
            y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: 'var(--muted)' } },
            x: { grid: { display: false }, ticks: { color: 'var(--muted)' } }
        }
    };

    return (
        <div className="db-content animate-fade-in" style={{ padding: '0', maxWidth: '100%' }}>
            <header className="db-header-main" style={{ marginBottom: '32px' }}>
                <div>
                    <h1 className="db-title" style={{ fontSize: '2.5rem', fontWeight: 800 }}>Platform Intelligence</h1>
                    <p className="db-subtitle">Global infrastructure overview and real-time network intelligence suite.</p>
                </div>
                <div className="db-actions" style={{ display: 'flex', gap: '12px' }}>
                    <div className="status-badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '8px 16px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }}></div>
                        SYSTEMS OPERATIONAL
                    </div>
                </div>
            </header>

            {/* High-Level KPIs */}
            <div className="db-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '32px' }}>
                <Card glowing className="stat-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <span style={{ color: 'var(--muted)', fontSize: '0.9rem', fontWeight: 600 }}>Total Platform Users</span>
                        <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent)' }}>
                             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                        </div>
                    </div>
                    <div style={{ fontSize: '2.25rem', fontWeight: 800 }}>{stats.totals.users}</div>
                    <div style={{ fontSize: '0.85rem', color: '#10b981', marginTop: '8px', fontWeight: 600 }}>+ All time growth</div>
                </Card>

                <Card glowing className="stat-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <span style={{ color: 'var(--muted)', fontSize: '0.9rem', fontWeight: 600 }}>Gross Revenue</span>
                        <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                        </div>
                    </div>
                    <div style={{ fontSize: '2.25rem', fontWeight: 800 }}>₹{stats.totals.revenue / 100}</div>
                    <div style={{ fontSize: '0.85rem', color: '#10b981', marginTop: '8px', fontWeight: 600 }}>+ Paid accounts</div>
                </Card>

                <Card glowing className="stat-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <span style={{ color: 'var(--muted)', fontSize: '0.9rem', fontWeight: 600 }}>Conversion Rate</span>
                        <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
                        </div>
                    </div>
                    <div style={{ fontSize: '2.25rem', fontWeight: 800 }}>{((stats.planStats.find(p => p._id === 'Premium')?.count || 0) / stats.totals.users * 100).toFixed(1)}%</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: '8px', fontWeight: 600 }}>Free to Paid ratio</div>
                </Card>

                <Card glowing className="stat-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <span style={{ color: 'var(--muted)', fontSize: '0.9rem', fontWeight: 600 }}>Avg. Revenue/User</span>
                        <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent)' }}>
                             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path><path d="M3 6h18"></path><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
                        </div>
                    </div>
                    <div style={{ fontSize: '2.25rem', fontWeight: 800 }}>₹{(stats.totals.revenue / 100 / stats.totals.users).toFixed(2)}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: '8px', fontWeight: 600 }}>ARPU Metric</div>
                </Card>
            </div>

            {/* Charts Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1.2fr 1.2fr', gap: '24px', marginBottom: '32px' }}>
                <Card style={{ padding: '24px' }}>
                    <div style={{ marginBottom: '20px' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>User Acquisition</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--muted)', margin: '4px 0 0 0' }}>New registrations over the last 30 days</p>
                    </div>
                    <div style={{ height: '300px' }}>
                        <Line data={userGrowthData} options={chartOptions} />
                    </div>
                </Card>

                <Card style={{ padding: '24px' }}>
                    <div style={{ marginBottom: '20px' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Revenue Growth</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--muted)', margin: '4px 0 0 0' }}>Daily gross revenue breakdown (INR)</p>
                    </div>
                    <div style={{ height: '300px' }}>
                        <Bar data={revenueData} options={chartOptions} />
                    </div>
                </Card>

                <Card style={{ padding: '24px' }}>
                    <div style={{ marginBottom: '20px' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Market Share</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--muted)', margin: '4px 0 0 0' }}>Distribution of user subscription plans</p>
                    </div>
                    <div style={{ height: '260px', position: 'relative' }}>
                        <Doughnut data={planData} options={{ ...chartOptions, cutout: '75%' }} />
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{stats.totals.users}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total</div>
                        </div>
                    </div>
                    <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        {stats.planStats.map((p, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: 8, height: 8, borderRadius: '2px', background: planData.datasets[0].backgroundColor[i] }}></div>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text)', fontWeight: 600 }}>{p._id}: {p.count}</span>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            {/* Bottom Row: System Health & Network Insights */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.6fr 1.2fr', gap: '24px' }}>
                <Card style={{ padding: '24px' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '20px' }}>System Health</h3>
                    <div style={{ display: 'grid', gap: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>API Gateway</span>
                            <span style={{ color: '#10b981', fontWeight: 700, fontSize: '0.9rem' }}>99.9% UP</span>
                        </div>
                        <div style={{ height: '4px', background: 'var(--surface3)', borderRadius: '2px' }}>
                            <div style={{ width: '99.9%', height: '100%', background: '#10b981', borderRadius: '2px' }}></div>
                        </div>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                            <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>DB Latency</span>
                            <span style={{ color: '#10b981', fontWeight: 700, fontSize: '0.9rem' }}>14ms</span>
                        </div>
                        <div style={{ height: '4px', background: 'var(--surface3)', borderRadius: '2px' }}>
                            <div style={{ width: '15%', height: '100%', background: '#10b981', borderRadius: '2px' }}></div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                            <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Storage Usage</span>
                            <span style={{ color: '#f59e0b', fontWeight: 700, fontSize: '0.9rem' }}>62%</span>
                        </div>
                        <div style={{ height: '4px', background: 'var(--surface3)', borderRadius: '2px' }}>
                            <div style={{ width: '62%', height: '100%', background: '#f59e0b', borderRadius: '2px' }}></div>
                        </div>
                    </div>
                </Card>

                <Card style={{ padding: '24px' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '20px' }}>Global Network Activity</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                         <div style={{ background: 'var(--surface3)', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
                            <div style={{ color: 'var(--muted)', fontSize: '0.75rem', fontWeight: 600, marginBottom: '8px', textTransform: 'uppercase' }}>Active Sessions</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent)' }}>124</div>
                         </div>
                         <div style={{ background: 'var(--surface3)', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
                            <div style={{ color: 'var(--muted)', fontSize: '0.75rem', fontWeight: 600, marginBottom: '8px', textTransform: 'uppercase' }}>API Requests/s</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10b981' }}>42.8</div>
                         </div>
                         <div style={{ background: 'var(--surface3)', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
                            <div style={{ color: 'var(--muted)', fontSize: '0.75rem', fontWeight: 600, marginBottom: '8px', textTransform: 'uppercase' }}>Auth Success</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#6366f1' }}>98%</div>
                         </div>
                    </div>
                    <div style={{ marginTop: '20px', height: '100px', background: 'rgba(99,102,241,0.05)', borderRadius: '12px', overflow: 'hidden' }}>
                        {/* Mock mini activity graph */}
                        <svg width="100%" height="100%" viewBox="0 0 100 20" preserveAspectRatio="none">
                            <path d="M0,10 Q10,2 20,12 T40,8 T60,15 T80,5 T100,10 V20 H0 Z" fill="rgba(99,102,241,0.2)" />
                            <path d="M0,10 Q10,2 20,12 T40,8 T60,15 T80,5 T100,10" stroke="var(--accent)" strokeWidth="0.5" fill="none" />
                        </svg>
                    </div>
                </Card>

                <Card style={{ padding: '24px', background: 'linear-gradient(135deg, var(--accent), var(--accent2))', border: 'none' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '12px' }}>Premium Intelligence</h3>
                    <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)', marginBottom: '20px' }}>Advanced predictive analytics and growth forecasting tools are now active.</p>
                    <button style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>
                        Download Report
                    </button>
                    <div style={{ marginTop: '24px', fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>
                         NEXT SYNC IN 4m 32s
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default AdminDashboard;
