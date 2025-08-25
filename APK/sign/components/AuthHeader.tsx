import React from 'react';
import { Shield, AlertTriangle } from 'lucide-react';

export function AuthHeader() {
  return (
    <div className="text-center mb-8 sm:mb-10">
      <div className="relative inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl mb-4 sm:mb-6 shadow-lg">
        <Shield className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
        <AlertTriangle className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 text-red-500 bg-white rounded-full p-1" />
      </div>
      <div className="space-y-2">
        <h1 className="text-foreground mb-2">
          <span className="text-red-600">Red</span>Zone
        </h1>
        <p className="text-muted-foreground">
          Advanced Crime Detection & Safety Platform
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span>Secure & Trusted</span>
        </div>
      </div>
    </div>
  );
}