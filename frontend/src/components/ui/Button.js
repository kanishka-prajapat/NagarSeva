import React from 'react';
import { motion } from 'framer-motion';
import { cn } from './GlassCard';

export function Button({ 
  children, 
  variant = 'primary', 
  className, 
  icon: Icon,
  disabled,
  isLoading,
  ...props 
}) {
  const baseStyles = "px-6 py-3 rounded-2xl font-bold text-sm tracking-wide transition-all shadow-xl flex items-center justify-center gap-2 relative overflow-hidden outline-none";
  
  const variants = {
    primary: "bg-gradient-to-r from-primary-600 to-purple-600 hover:from-primary-500 hover:to-purple-500 text-white border border-white/10 shadow-primary-500/20",
    secondary: "bg-white/5 hover:bg-white/10 text-white border border-white/10",
    danger: "bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20",
    outline: "bg-transparent border-2 border-primary-500/50 hover:border-primary-500 text-primary-400 hover:text-primary-300"
  };

  return (
    <motion.button
      whileHover={disabled || isLoading ? {} : { scale: 1.02 }}
      whileTap={disabled || isLoading ? {} : { scale: 0.98 }}
      className={cn(
        baseStyles,
        variants[variant],
        (disabled || isLoading) && "opacity-50 cursor-not-allowed",
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {/* Shimmer effect on primary button */}
      {variant === 'primary' && !disabled && (
        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
      )}
      
      {isLoading ? (
        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : Icon && (
        <Icon className="w-5 h-5" />
      )}
      <span>{children}</span>
    </motion.button>
  );
}
