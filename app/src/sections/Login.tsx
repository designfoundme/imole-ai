import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, Loader2, Mail, Lock, Building2, Stethoscope, Shield } from 'lucide-react';
import type { UserRole } from '@/types';

const ROLE_CONFIG: Record<UserRole, { label: string; icon: React.ElementType; color: string }> = {
  admin: { label: 'Administrator', icon: Shield, color: 'text-purple-600' },
  diagnostic_center: { label: 'Diagnostic Center', icon: Building2, color: 'text-blue-600' },
  radiologist: { label: 'Radiologist', icon: Stethoscope, color: 'text-green-600' },
};

export function Login() {
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('diagnostic_center');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, password, selectedRole);
  };

  const setDemoCredentials = (role: UserRole) => {
    setSelectedRole(role);
    const emails: Record<UserRole, string> = {
      admin: 'admin@imole.ai',
      diagnostic_center: 'center@imole.ai',
      radiologist: 'radio@imole.ai',
    };
    setEmail(emails[role]);
    setPassword('password');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 mb-4 shadow-lg">
            <Activity className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Imole AI</h1>
          <p className="text-slate-500 mt-1">AI-Powered Teleradiology Reporting Platform</p>
          <p className="text-xs text-slate-400 mt-1">by Health Intelligence Labs</p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Welcome Back</CardTitle>
            <CardDescription>Sign in to access your dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedRole} onValueChange={(v) => setSelectedRole(v as UserRole)}>
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="diagnostic_center" className="text-xs">
                  <Building2 className="w-3 h-3 mr-1" />
                  Center
                </TabsTrigger>
                <TabsTrigger value="radiologist" className="text-xs">
                  <Stethoscope className="w-3 h-3 mr-1" />
                  Radiologist
                </TabsTrigger>
                <TabsTrigger value="admin" className="text-xs">
                  <Shield className="w-3 h-3 mr-1" />
                  Admin
                </TabsTrigger>
              </TabsList>

              {(['diagnostic_center', 'radiologist', 'admin'] as UserRole[]).map((role) => (
                <TabsContent key={role} value={role}>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="Enter your email"
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
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
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
                      className="w-full"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        <>Sign In as {ROLE_CONFIG[role].label}</>
                      )}
                    </Button>
                  </form>
                </TabsContent>
              ))}
            </Tabs>

            {/* Demo credentials */}
            <div className="mt-6 pt-4 border-t border-slate-100">
              <p className="text-xs text-slate-500 mb-3">Quick login with demo accounts:</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => setDemoCredentials('diagnostic_center')}
                >
                  <Building2 className="w-3 h-3 mr-1" />
                  Center
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => setDemoCredentials('radiologist')}
                >
                  <Stethoscope className="w-3 h-3 mr-1" />
                  Radiologist
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => setDemoCredentials('admin')}
                >
                  <Shield className="w-3 h-3 mr-1" />
                  Admin
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-slate-400 mt-6">
          © 2024 Health Intelligence Labs. Imole AI - Secure medical imaging platform.
        </p>
      </div>
    </div>
  );
}
