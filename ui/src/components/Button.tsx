import React from 'react';
import './Button.css';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  size?: 'small' | 'medium' | 'large';
  title?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  type = 'button',
  size = 'medium',
  title,
}) => {
  return (
    <button
      type={type}
      className={`button button-${variant} button-${size}`}
      onClick={onClick}
      disabled={disabled}
      title={title || `Button component (${variant}, ${size})`}
    >
      {children}
    </button>
  );
};

