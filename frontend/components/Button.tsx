import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'white';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ variant = 'primary', size = 'md', className = '', children, ...props }) => {
  const baseStyles = "inline-flex items-center justify-center border font-medium rounded-md transition-all duration-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2";
  
  const sizes = {
    sm: "px-3 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg"
  };

  const variants = {
    primary: "border-transparent text-white bg-corporate-red hover:bg-red-700 focus:ring-corporate-red",
    secondary: "border-transparent text-white bg-corporate-blue hover:bg-blue-900 focus:ring-corporate-blue",
    outline: "border-corporate-blue text-corporate-blue bg-transparent hover:bg-corporate-blue hover:text-white",
    white: "border-transparent text-corporate-blue bg-white hover:bg-gray-50",
  };

  return (
    <button className={`${baseStyles} ${sizes[size]} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};