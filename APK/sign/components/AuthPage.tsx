import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { AuthHeader } from './AuthHeader';
import { LoginForm } from './LoginForm';
import { SignupForm } from './SignupForm';
import { FeaturePreview } from './FeaturePreview';

export function AuthPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const location = useLocation();
  const navigate = useNavigate();
  
  // Set active tab based on URL path
  useEffect(() => {
    if (location.pathname === '/register') {
      setActiveTab('signup');
    } else {
      setActiveTab('login');
    }
  }, [location.pathname]);
  
  const headerContent = {
    login: {
      title: "Welcome Back",
      description: "Access your RedZone security dashboard"
    },
    signup: {
      title: "Create Your Account",
      description: "Join RedZone for advanced security protection"
    }
  };

  const handleSwitchToSignup = () => {
    setActiveTab('signup');
    navigate('/register');
  };

  const handleSwitchToLogin = () => {
    setActiveTab('login');
    navigate('/login');
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-sm sm:max-w-md lg:max-w-lg xl:max-w-xl">
        <AuthHeader />

        <Card className="bg-card border border-border shadow-xl backdrop-blur-sm overflow-hidden">
          <CardHeader className="text-center px-6 sm:px-8 pt-8 sm:pt-10 pb-2 transition-all duration-300">
            <CardTitle className="text-foreground transition-all duration-300">
              {headerContent[activeTab as keyof typeof headerContent].title}
            </CardTitle>
            <CardDescription className="text-muted-foreground transition-all duration-300">
              {headerContent[activeTab as keyof typeof headerContent].description}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="px-6 sm:px-8 pb-8 sm:pb-10">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="flex w-full bg-gray-100 rounded-lg p-1 mb-6 shadow-sm">
                <TabsTrigger 
                  value="login" 
                  className="flex-1 py-2 rounded-md transition-all font-semibold text-base
                    data-[state=active]:bg-white data-[state=active]:shadow data-[state=active]:text-black
                    data-[state=inactive]:text-gray-500"
                >
                  Sign In
                </TabsTrigger>
                <TabsTrigger 
                  value="signup" 
                  className="flex-1 py-2 rounded-md transition-all font-semibold text-base
                    data-[state=active]:bg-white data-[state=active]:shadow data-[state=active]:text-black
                    data-[state=inactive]:text-gray-500"
                >
                  Create Account
                </TabsTrigger>
              </TabsList>
              
              <div className="relative overflow-hidden">
                <TabsContent 
                  value="login" 
                  className="mt-6 data-[state=inactive]:absolute data-[state=inactive]:opacity-0 data-[state=inactive]:translate-y-4 data-[state=active]:opacity-100 data-[state=active]:translate-y-0 transition-all duration-300 ease-in-out"
                >
                  <LoginForm
                    showPassword={showPassword}
                    onTogglePassword={() => setShowPassword(!showPassword)}
                    onSwitchToSignup={handleSwitchToSignup}
                  />
                </TabsContent>
                
                <TabsContent 
                  value="signup" 
                  className="mt-6 data-[state=inactive]:absolute data-[state=inactive]:opacity-0 data-[state=inactive]:translate-y-4 data-[state=active]:opacity-100 data-[state=active]:translate-y-0 transition-all duration-300 ease-in-out"
                >
                  <SignupForm
                    showPassword={showPassword}
                    showConfirmPassword={showConfirmPassword}
                    onTogglePassword={() => setShowPassword(!showPassword)}
                    onToggleConfirmPassword={() => setShowConfirmPassword(!showConfirmPassword)}
                    onSwitchToLogin={handleSwitchToLogin}
                  />
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>

        <FeaturePreview />
      </div>
    </div>
  );
}