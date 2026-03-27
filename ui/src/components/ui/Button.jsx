import React from 'react';
import './Button.css';

export default function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  fullWidth = false, 
  className = '', 
  ...props 
}) {
  const classes = [
    'ui-btn',
    `ui-btn-${variant}`,
    `ui-btn-${size}`,
    fullWidth ? 'ui-btn-full' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}
