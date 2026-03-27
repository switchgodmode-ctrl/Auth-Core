import React from 'react';
import './Input.css';

export default function Input({
  label,
  error,
  id,
  className = '',
  fullWidth = true,
  ...props
}) {
  const inputId = id || label?.replace(/\s+/g, '-').toLowerCase();

  return (
    <div className={`ui-input-wrapper ${fullWidth ? 'ui-input-full' : ''} ${className}`}>
      {label && <label htmlFor={inputId} className="ui-input-label">{label}</label>}
      <input
        id={inputId}
        className={`ui-input ${error ? 'ui-input-error' : ''}`}
        {...props}
      />
      {error && <span className="ui-input-error-msg">{error}</span>}
    </div>
  );
}
