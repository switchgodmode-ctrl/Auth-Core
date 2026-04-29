import React from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { motion } from 'framer-motion';

export default function Sdk() {
  return (
    <div className="db-content animate-fade-in">
      <header className="db-page-head">
        <div>
          <h1 className="db-page-title">AuthCore SDKs</h1>
          <p className="db-page-sub">Integrate the AuthCore runtime validation engine natively into your applications.</p>
        </div>
      </header>
      
      <div style={{ marginTop: '24px' }}>
        <Card title="Native C# Console SDK" subtitle="Lightweight, dependency-free wrapper for .NET frameworks.">
          <div style={{ padding: '20px 0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ color: 'var(--text)', fontSize: '0.95rem', lineHeight: '1.6' }}>
              The C# SDK is a highly optimized integration for Windows applications. It features built-in Hardware ID (HWID) fingerprinting, automatic heartbeat timers to prevent tampering, and explicit TLS 1.2 support for secure communication with the Vercel backend.
            </p>
            
            <div style={{ background: 'var(--surface2)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <h4 style={{ color: 'var(--muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>Key Features</h4>
                <ul style={{ color: 'var(--text)', fontSize: '0.9rem', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <li><strong style={{ color: 'var(--accent)' }}>No External Dependencies:</strong> Uses native <code>System.Management</code> and <code>System.Net.Http</code>.</li>
                    <li><strong style={{ color: 'var(--accent)' }}>Native Compiler Support:</strong> Fully compatible with the older C# 5.0 compiler (csc.exe).</li>
                    <li><strong style={{ color: 'var(--accent)' }}>Secure Session Heartbeat:</strong> Background timer continuously pings the server to ensure active validation.</li>
                </ul>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
               <Button onClick={() => window.location.href = '/downloads/AuthCore_CSharp_SDK.zip'} variant="primary">
                   Download C# SDK (.zip)
               </Button>
               <Button onClick={() => alert("Opening documentation...")} variant="outline">
                   View Documentation
               </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
