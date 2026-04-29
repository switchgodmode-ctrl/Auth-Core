import React, { useState } from 'react';
import { motion } from 'framer-motion';

const sdks = [
  {
    id: 'csharp',
    lang: 'C#',
    color: '#7B68EE',
    icon: '⬡',
    title: 'Native C# Console SDK',
    subtitle: 'Lightweight, dependency-free wrapper for .NET frameworks.',
    description: 'Highly optimized integration for Windows using native System.Management and System.Net.Http. Includes HWID fingerprinting, TLS 1.2, heartbeat, and real-time admin MessageBox alerts.',
    features: ['No External Dependencies', 'HWID Fingerprinting', 'Secure Session Heartbeat', 'Real-Time Admin Alerts'],
    download: '/downloads/AuthCore_CSharp_SDK.zip',
    ext: '.zip',
  },
  {
    id: 'cpp',
    lang: 'C++',
    color: '#00BFFF',
    icon: '⬡',
    title: 'Native C++ Console SDK',
    subtitle: 'Performance-focused, zero-dependency C++17 client.',
    description: 'Uses native WinHttp for networking with built-in real-time admin broadcasts via native Windows MessageBox. Compatible with MSVC and MinGW/g++.',
    features: ['Zero Dependencies', 'WinHttp Networking', 'Real-Time MessageBox', 'MSVC & MinGW Support'],
    download: '/downloads/AuthCore_CPP_SDK.zip',
    ext: '.zip',
  },
  {
    id: 'python',
    lang: 'Python',
    color: '#FFD43B',
    icon: '⬡',
    title: 'Python SDK',
    subtitle: 'Zero-dependency Python 3 security client.',
    description: 'Built on urllib and ctypes — no pip install required. Includes native Windows MessageBox alerts via ctypes.windll for real-time admin broadcasts.',
    features: ['No pip Required', 'Native ctypes Alerts', 'Cross-Platform HWID', 'Background Heartbeat'],
    download: '/downloads/AuthCore_Python_SDK.zip',
    ext: '.zip',
  },
  {
    id: 'java',
    lang: 'Java',
    color: '#FF6B35',
    icon: '⬡',
    title: 'Java SDK',
    subtitle: 'Pure Java, zero-dependency security client.',
    description: 'Uses HttpURLConnection and JOptionPane for native dialog alerts. Features WMIC-based HWID and scheduled heartbeat via ScheduledExecutorService.',
    features: ['No Maven Required', 'JOptionPane Alerts', 'WMIC HWID', 'Scheduled Heartbeat'],
    download: '/downloads/AuthCore_Java_SDK.zip',
    ext: '.zip',
  },
  {
    id: 'nodejs',
    lang: 'Node.js',
    color: '#68A063',
    icon: '⬡',
    title: 'Node.js / TypeScript SDK',
    subtitle: 'Modern JavaScript security client for CLI apps.',
    description: 'Built on Node\'s native https module. Triggers Windows MessageBox via PowerShell for real-time admin broadcasts. No npm dependencies required.',
    features: ['No npm Install', 'Native https Module', 'PowerShell MessageBox', 'Background Heartbeat'],
    download: '/downloads/AuthCore_NodeJS_SDK.zip',
    ext: '.zip',
  },
  {
    id: 'php',
    lang: 'PHP',
    color: '#777BB3',
    icon: '⬡',
    title: 'PHP SDK',
    subtitle: 'CLI-ready PHP security client using cURL.',
    description: 'Native cURL for all HTTP operations with PowerShell-triggered Windows MessageBox for admin broadcasts. Ideal for CLI tools and automation scripts.',
    features: ['Native cURL', 'PowerShell Alerts', 'CLI Optimized', 'Session Heartbeat'],
    download: '/downloads/AuthCore_PHP_SDK.zip',
    ext: '.zip',
  },
  {
    id: 'go',
    lang: 'Go',
    color: '#00ADD8',
    icon: '⬡',
    title: 'Go (Golang) SDK',
    subtitle: 'High-performance, concurrent Go security client.',
    description: 'Uses Go\'s native net/http with goroutines for non-blocking heartbeat. Native Windows MessageBox via syscall for instant admin broadcasts.',
    features: ['Goroutine Heartbeat', 'syscall MessageBox', 'Zero Dependencies', 'Native net/http'],
    download: '/downloads/AuthCore_Go_SDK.zip',
    ext: '.zip',
  },
  {
    id: 'rust',
    lang: 'Rust',
    color: '#CE422B',
    icon: '⬡',
    title: 'Rust SDK',
    subtitle: 'Memory-safe, blazingly fast security client.',
    description: 'Built with ureq and serde for clean JSON handling. Features conditional Windows API compilation via winapi crate and thread-safe heartbeat.',
    features: ['Memory Safe', 'winapi Integration', 'ureq + serde', 'Threaded Heartbeat'],
    download: '/downloads/AuthCore_Rust_SDK.zip',
    ext: '.zip',
  },
  {
    id: 'lua',
    lang: 'Lua',
    color: '#00007C',
    icon: '⬡',
    title: 'Lua SDK',
    subtitle: 'Lightweight Lua client for games and scripts.',
    description: 'Fully dependency-free using PowerShell for both HTTP and MessageBox alerts. Designed as an embeddable module for Lua 5.1+, LuaJIT, and scripting engines.',
    features: ['No Dependencies', 'PowerShell Alerts', 'Embeddable Module', 'Lua 5.1+ & LuaJIT'],
    download: '/downloads/AuthCore_Lua_SDK.zip',
    ext: '.zip',
  },
  {
    id: 'ruby',
    lang: 'Ruby',
    color: '#CC342D',
    icon: '⬡',
    title: 'Ruby SDK',
    subtitle: 'Elegant Ruby security client using Net::HTTP.',
    description: 'Uses Ruby\'s built-in Net::HTTP and JSON stdlib. Spawns a PowerShell MessageBox in a background thread for admin broadcasts without blocking the main process.',
    features: ['No gem Required', 'Net::HTTP Native', 'Threaded Alerts', 'Background Heartbeat'],
    download: '/downloads/AuthCore_Ruby_SDK.zip',
    ext: '.zip',
  },
  {
    id: 'perl',
    lang: 'Perl',
    color: '#39457E',
    icon: '⬡',
    title: 'Perl SDK',
    subtitle: 'Battle-tested Perl security client.',
    description: 'Uses LWP::UserAgent for HTTP and detached threads for heartbeat monitoring. Admin broadcasts delivered via PowerShell MessageBox with zero runtime blocking.',
    features: ['LWP::UserAgent', 'Detached Threads', 'PowerShell Alerts', 'Session Heartbeat'],
    download: '/downloads/AuthCore_Perl_SDK.zip',
    ext: '.zip',
  },
  {
    id: 'vbnet',
    lang: 'VB.NET',
    color: '#512BD4',
    icon: '⬡',
    title: 'VB.NET SDK',
    subtitle: 'Native Windows VB.NET security client.',
    description: 'Uses HttpClient and P/Invoke to call user32.dll MessageBoxW directly — no WinForms dependency. Fully native Windows integration with background heartbeat thread.',
    features: ['P/Invoke MessageBox', 'No WinForms Needed', 'HttpClient Native', 'Background Thread'],
    download: '/downloads/AuthCore_VBNet_SDK.zip',
    ext: '.zip',
  },
];

export default function Sdk() {
  const [selected, setSelected] = useState(null);

  return (
    <div className="db-content animate-fade-in">
      <header className="db-page-head">
        <div>
          <h1 className="db-page-title">AuthCore SDK Downloads</h1>
          <p className="db-page-sub">Integrate the AuthCore runtime validation engine natively — available in 12 languages.</p>
        </div>
      </header>

      {/* Stats bar */}
      <div style={{ display: 'flex', gap: '24px', marginTop: '24px', flexWrap: 'wrap' }}>
        {[['12', 'Languages Supported'], ['100%', 'Zero-Dependency'], ['Real-Time', 'Admin Broadcasts'], ['All Platforms', 'Windows Native']].map(([val, label]) => (
          <div key={label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px 24px', flex: '1', minWidth: '140px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: '700', color: 'var(--accent)' }}>{val}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '4px' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* SDK Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px', marginTop: '28px' }}>
        {sdks.map((sdk, i) => (
          <motion.div
            key={sdk.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            style={{
              background: 'var(--surface)',
              border: `1px solid ${selected === sdk.id ? sdk.color : 'var(--border)'}`,
              borderRadius: '14px',
              padding: '24px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: selected === sdk.id ? `0 0 0 1px ${sdk.color}33, 0 8px 24px ${sdk.color}22` : 'none',
            }}
            onClick={() => setSelected(selected === sdk.id ? null : sdk.id)}
            whileHover={{ translateY: -3, boxShadow: `0 8px 24px ${sdk.color}22` }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: `${sdk.color}22`, border: `1px solid ${sdk.color}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', fontWeight: '800', color: sdk.color, flexShrink: 0 }}>
                {sdk.lang.substring(0, 2)}
              </div>
              <div>
                <div style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--text)' }}>{sdk.title}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: '2px' }}>{sdk.subtitle}</div>
              </div>
            </div>

            {/* Description */}
            <p style={{ fontSize: '0.85rem', color: 'var(--text)', lineHeight: '1.6', marginBottom: '14px', opacity: 0.85 }}>{sdk.description}</p>

            {/* Feature tags */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '18px' }}>
              {sdk.features.map(f => (
                <span key={f} style={{ background: `${sdk.color}18`, border: `1px solid ${sdk.color}44`, color: sdk.color, fontSize: '0.72rem', padding: '3px 10px', borderRadius: '20px', fontWeight: '600' }}>
                  {f}
                </span>
              ))}
            </div>

            {/* Download button */}
            <a
              href={sdk.download}
              download
              onClick={e => e.stopPropagation()}
              style={{
                display: 'block', textAlign: 'center', padding: '10px 0',
                background: `linear-gradient(135deg, ${sdk.color}dd, ${sdk.color}99)`,
                color: '#fff', borderRadius: '8px', fontWeight: '700',
                fontSize: '0.88rem', textDecoration: 'none',
                transition: 'opacity 0.2s',
              }}
              onMouseOver={e => e.target.style.opacity = '0.85'}
              onMouseOut={e => e.target.style.opacity = '1'}
            >
              ⬇ Download {sdk.lang} SDK (.zip)
            </a>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
