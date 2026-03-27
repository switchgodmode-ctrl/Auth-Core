import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { applyBrand, initBrandFromStorage, saveBrand } from "../theme.js";
import { logout } from "../api.js";
import Button from "../components/ui/Button.jsx";
import Notifications from "../components/ui/Notifications.jsx";
import "../pages/dashboard.css";

export default function DashboardLayout() {
  const [brand, setBrand] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userAvatar, setUserAvatar] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    setUserAvatar(localStorage.getItem("userAvatar") || "");
    const handler = () => setUserAvatar(localStorage.getItem("userAvatar") || "");
    window.addEventListener('avatar-updated', handler);
    return () => window.removeEventListener('avatar-updated', handler);
  }, []);

  useEffect(() => {
    initBrandFromStorage();
    const saved = localStorage.getItem("themeBrand") || "";
    if (saved) setBrand(saved);
  }, []);

  function onPickColor(e) {
    const c = e.target.value;
    setBrand(c);
    applyBrand(c);
    saveBrand(c);
  }

  function toggleTheme() {
    const root = document.documentElement;
    if (root.classList.contains("light")) root.classList.remove("light");
    else root.classList.add("light");
  }

  async function handleLogout() {
    await logout();
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("email");
    localStorage.removeItem("userAvatar");
    navigate("/login");
  }

  return (
    <div className="dash-shell">
      
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div className="dash-sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>
      )}

      {/* Sidebar */}
      <aside className={`dash-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="dash-brand" style={{ justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div style={{ width: 24, height: 24, borderRadius: 6, background: 'linear-gradient(135deg, var(--accent), var(--accent2))' }}></div>
            <span style={{ fontWeight: 800, letterSpacing: '-0.02em', fontSize: '1.2rem', marginLeft: '10px', color: "var(--text)" }}>AuthCore</span>
          </div>
          <button className="dash-sidebar-close" onClick={() => setSidebarOpen(false)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        
        <nav className="dash-nav" style={{ flex: 1 }}>
          <div className="dash-nav-group">Overview</div>
          <NavLink to="/dashboard" onClick={() => setSidebarOpen(false)} className={({isActive}) => isActive ? "active" : ""}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg>
            Dashboard
          </NavLink>
          
          <div className="dash-nav-group">Core</div>
          <NavLink to="/applications" onClick={() => setSidebarOpen(false)} className={({isActive}) => isActive ? "active" : ""}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
            Applications
          </NavLink>
          <NavLink to="/licences" onClick={() => setSidebarOpen(false)} className={({isActive}) => isActive ? "active" : ""}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            Licences
          </NavLink>
          <NavLink to="/runtime" onClick={() => setSidebarOpen(false)} className={({isActive}) => isActive ? "active" : ""}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
            Runtime
          </NavLink>
          <NavLink to="/webhooks" onClick={() => setSidebarOpen(false)} className={({isActive}) => isActive ? "active" : ""}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
            Webhooks
          </NavLink>
          
          <div className="dash-nav-group">Account</div>
          <NavLink to="/payments" onClick={() => setSidebarOpen(false)} className={({isActive}) => isActive ? "active" : ""}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>
            Billing & Premium
          </NavLink>
          <NavLink to="/settings" onClick={() => setSidebarOpen(false)} className={({isActive}) => isActive ? "active" : ""}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
            Profile Settings
          </NavLink>
        </nav>
        
        <div style={{ padding: '24px', borderTop: '1px solid var(--border)', background: 'var(--surface2)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(99,102,241,0.1)', display: 'grid', placeItems: 'center', color: 'var(--accent)', overflow: 'hidden' }}>
              {userAvatar ? (
                <img src={userAvatar} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              )}
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>{localStorage.getItem("username") || localStorage.getItem("email")?.split("@")[0] || "Admin User"}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)', textOverflow: 'ellipsis', overflow: 'hidden' }}>{localStorage.getItem("email") || "admin@authcore.cloud"}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="dash-main">
        {/* Glassmorphism Header */}
        <header className="dash-header">
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <button className="dash-mobile-menu" onClick={() => setSidebarOpen(true)}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>
            <div className="dash-search">
              <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              </span>
              <input 
                placeholder="Search resources..." 
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <label title="Theme color" style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: brand || 'var(--accent)', border: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }} />
              <input type="color" value={brand || "#6366f1"} onChange={onPickColor} style={{ opacity: 0, width: 0, height: 0, padding: 0, border: 'none' }} />
            </label>
            
            <Notifications />

            <button 
              onClick={toggleTheme}
              className="dash-theme-btn"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
            </button>
            
            <Button variant="ghost" size="sm" onClick={handleLogout} style={{ padding: '8px 16px' }} className="dash-logout-btn">
              Sign Out
            </Button>
          </div>
        </header>
        
        {/* Scrollable View */}
        <div style={{ height: 'calc(100vh - 73px)', overflowY: 'auto', background: 'var(--bg)', position: 'relative' }}>
          <div style={{ padding: '0 32px' }} className="dash-outlet-container">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
