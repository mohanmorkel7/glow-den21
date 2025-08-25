import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Building2, Lock, Mail } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const success = await login(email, password);
    if (success) {
      navigate('/dashboard');
    } else {
      setError('Invalid credentials. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <img
              src="https://cdn.builder.io/api/v1/image/assets%2F9f68bdced9274939b0bcd49e09efd146%2F9fe8c5272344441a957370f018a36cf2?format=webp&width=800"
              alt="Web Syntactic Solutions Logo"
              className="h-24 w-auto object-contain"
            />
          </div>
          <p className="text-muted-foreground mt-2">BPO Management Platform</p>
        </div>

        <Card className="shadow-xl border-0 bg-card/50 backdrop-blur">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Welcome Back</CardTitle>
            <CardDescription>
              Sign in to access your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-11" 
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>

              <div className="space-y-3 pt-4 border-t">
                <div className="text-sm font-medium text-center text-muted-foreground">
                  Demo Credentials
                </div>
                <div className="grid gap-2 text-xs">
                  <div className="flex justify-between items-center p-2 bg-blue-50 rounded border">
                    <div>
                      <div className="font-medium text-blue-800">Super Admin</div>
                      <div className="text-blue-600">admin@websyntactic.com / admin123</div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 text-xs"
                      onClick={() => {
                        setEmail('admin@websyntactic.com');
                        setPassword('admin123');
                      }}
                    >
                      Use
                    </Button>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-green-50 rounded border">
                    <div>
                      <div className="font-medium text-green-800">Project Manager</div>
                      <div className="text-green-600">pm@websyntactic.com / pm123</div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 text-xs"
                      onClick={() => {
                        setEmail('pm@websyntactic.com');
                        setPassword('pm123');
                      }}
                    >
                      Use
                    </Button>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-purple-50 rounded border">
                    <div>
                      <div className="font-medium text-purple-800">User</div>
                      <div className="text-purple-600">user@websyntactic.com / user123</div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 text-xs"
                      onClick={() => {
                        setEmail('user@websyntactic.com');
                        setPassword('user123');
                      }}
                    >
                      Use
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
