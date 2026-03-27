import { NavLink, Outlet, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { applyBrand, initBrandFromStorage, saveBrand } from "../theme.js";
import "../pages/Landing.css";

export default function LandingLayout() {
  const [brand, setBrand] = useState("");
  
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

  return (
    <>
      <nav className="rt-nav">
        <Link to="/" className="rt-nav-logo">
          <span />
          AuthCore
        </Link>
        <div className="rt-nav-links">
          <NavLink to="/pricing" className="rt-nav-link" style={{ marginRight: '8px' }}>Pricing</NavLink>
          <NavLink to="/support" className="rt-nav-link" style={{ marginRight: '16px' }}>Support</NavLink>
          <label title="Theme color" style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', marginRight: '8px' }}>
            <div style={{ width: 18, height: 18, borderRadius: '50%', background: brand || 'var(--accent)', border: '1px solid var(--border)' }} />
            <input type="color" value={brand || "#6366f1"} onChange={onPickColor} style={{ opacity: 0, width: 0, height: 0, padding: 0, border: 'none' }} />
          </label>
          <ThemeToggle onClick={toggleTheme} />
          <NavLink to="/login" className="rt-nav-link">Login</NavLink>
          <NavLink to="/register" className="rt-nav-cta">Register</NavLink>
        </div>
      </nav>
      <main>
        <Outlet />
      </main>
    </>
  );
}

// Simple moon/sun icon wrapper for the theme toggle
function ThemeToggle({ onClick }) {
  return (
    <button 
      onClick={onClick}
      style={{
        background: 'transparent',
        border: 'none',
        color: 'var(--muted)',
        cursor: 'pointer',
        padding: '6px',
        marginRight: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'color 0.2s'
      }}
      title="Toggle Dark/Light Theme"
      onMouseOver={(e) => e.currentTarget.style.color = 'var(--text)'}
      onMouseOut={(e) => e.currentTarget.style.color = 'var(--muted)'}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
      </svg>
    </button>
  );
}
