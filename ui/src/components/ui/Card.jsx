import React from 'react';
import './Card.css';

export default function Card({
  children,
  title,
  subtitle,
  className = '',
  glowing = false,
  ...props
}) {
  const classes = [
    'ui-card',
    glowing ? 'ui-card-glowing' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} {...props}>
      {glowing && <div className="ui-card-glow-bg" />}
      <div className="ui-card-content">
        {(title || subtitle) && (
          <div className="ui-card-header">
            {title && <h3 className="ui-card-title">{title}</h3>}
            {subtitle && <p className="ui-card-subtitle">{subtitle}</p>}
          </div>
        )}
        <div className="ui-card-body">
          {children}
        </div>
      </div>
    </div>
  );
}
