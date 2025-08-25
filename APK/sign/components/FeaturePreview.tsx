import React from 'react';
import { MapPin, AlertTriangle, Shield, Zap } from 'lucide-react';

export function FeaturePreview() {
  const features = [
    {
      icon: MapPin,
      title: 'Smart Routing',
      description: 'AI-powered safe routes'
    },
    {
      icon: AlertTriangle,
      title: 'Real-time Alerts',
      description: 'Instant crime notifications'
    },
    {
      icon: Shield,
      title: 'Emergency SOS',
      description: '24/7 emergency response'
    },
    {
      icon: Zap,
      title: 'Live Monitoring',
      description: 'Continuous area surveillance'
    }
  ];

  return (
    <div className="mt-8 sm:mt-10">
      <div className="text-center mb-6">
        <h3 className="text-foreground font-medium mb-2">Trusted by Users</h3>
        <p className="text-muted-foreground text-sm">Advanced security features at your fingertips</p>
      </div>
      
      <div className="grid grid-cols-2 gap-4 sm:gap-6">
        {features.map((feature, index) => {
          const IconComponent = feature.icon;
          return (
            <div key={index} className="text-center p-4 rounded-lg bg-card/50 border border-border/50 backdrop-blur-sm">
              <div className="inline-flex items-center justify-center w-10 h-10 bg-red-50 rounded-lg mb-3">
                <IconComponent className="w-5 h-5 text-red-600" />
              </div>
              <h4 className="font-medium text-foreground text-sm mb-1">{feature.title}</h4>
              <p className="text-muted-foreground text-xs">{feature.description}</p>
            </div>
          );
        })}
      </div>
      
      <div className="text-center mt-6 py-4 border-t border-border">
        <p className="text-xs text-muted-foreground">
          Enterprise-grade security • End-to-end encryption • GDPR compliant
        </p>
      </div>
    </div>
  );
}