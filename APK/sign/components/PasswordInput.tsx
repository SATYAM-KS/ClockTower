import React from 'react';
import { Input } from './ui/input';
import { Eye, EyeOff } from 'lucide-react';

interface PasswordInputProps {
  id: string;
  placeholder: string;
  showPassword: boolean;
  onTogglePassword: () => void;
  className?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function PasswordInput({ 
  id, 
  placeholder, 
  showPassword, 
  onTogglePassword,
  className = '',
  value,
  onChange
}: PasswordInputProps) {
  return (
    <div className="relative">
      <Input
        id={id}
        type={showPassword ? "text" : "password"}
        placeholder={placeholder}
        className={`bg-input-background border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary pr-10 h-11 sm:h-12 ${className}`}
        value={value}
        onChange={onChange}
      />
      <button
        type="button"
        onClick={onTogglePassword}
        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted/50 transition-colors"
      >
        {showPassword ? 
          <EyeOff className="w-4 h-4" /> : 
          <Eye className="w-4 h-4" />
        }
      </button>
    </div>
  );
}