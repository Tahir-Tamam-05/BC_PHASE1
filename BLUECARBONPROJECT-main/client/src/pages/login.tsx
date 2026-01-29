import { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Waves, LogIn, UserPlus, Building2, ShoppingCart } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, signupSchema, type LoginInput, type SignupInput } from '@shared/schema';
import { useAuth } from '@/lib/auth-context';
import { OceanBackground } from '@/components/ocean-background';
import { HowItWorksModal } from '@/components/how-it-works-modal';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

const demoCredentials = [
  { email: 'admin@bluecarbon.com', password: 'admin123', role: 'Admin' },
  { email: 'verifier1@bluecarbon.com', password: 'verifier123', role: 'Verifier' },
  { email: 'alice@bluecarbon.com', password: 'password123', role: 'Contributor' },
  { email: 'bob@bluecarbon.com', password: 'password123', role: 'Buyer' },
];

export default function Login() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');

  const loginForm = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const signupForm = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: '', email: '', password: '', role: 'contributor' },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginInput) => {
      const res = await apiRequest('POST', '/api/auth/login', data);
      return await res.json();
    },
    onSuccess: (data: any) => {
      login(data.user, data.token);
      const redirectMap = { admin: '/admin', verifier: '/verifier', contributor: '/dashboard', buyer: '/marketplace' };
      setLocation(redirectMap[data.user.role as keyof typeof redirectMap] || '/dashboard');
      toast({ title: data.message || 'Welcome back!', description: `Logged in as ${data.user.name}` });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Login failed',
        description: error.message || 'Invalid credentials',
      });
    },
  });

  const signupMutation = useMutation({
    mutationFn: async (data: SignupInput) => {
      const res = await apiRequest('POST', '/api/auth/signup', data);
      return await res.json();
    },
    onSuccess: (data: any) => {
      login(data.user, data.token);
      const redirectMap = { contributor: '/dashboard', buyer: '/marketplace' };
      setLocation(redirectMap[data.user.role as keyof typeof redirectMap] || '/dashboard');
      toast({ title: data.message || 'Account created!', description: 'Welcome to BlueCarbon Ledger' });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Signup failed',
        description: error.message || 'Could not create account',
      });
    },
  });

  const handleLogin = (data: LoginInput) => {
    loginMutation.mutate(data);
  };

  const handleSignup = (data: SignupInput) => {
    signupMutation.mutate(data);
  };

  const fillDemoCredentials = (email: string, password: string) => {
    loginForm.setValue('email', email);
    loginForm.setValue('password', password);
    setActiveTab('login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <OceanBackground />

      <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8 items-center">
        <div className="text-center md:text-left space-y-6 text-white">
          <div className="flex items-center justify-center md:justify-start gap-3">
            <Waves className="w-12 h-12" />
            <h1 className="text-4xl md:text-5xl font-heading font-bold">BlueCarbon Ledger</h1>
          </div>
          <p className="text-xl md:text-2xl text-white/90">
            Blockchain-based Blue Carbon Credit Registry
          </p>
          <p className="text-white/80 text-lg">
            Transparent, verifiable, and immutable tracking of CO₂ absorption through blockchain technology
          </p>
          <HowItWorksModal>
            <Button variant="outline" size="lg" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
              <Waves className="w-5 h-5 mr-2" />
              Learn How It Works
            </Button>
          </HowItWorksModal>
        </div>

        <Card className="w-full backdrop-blur-sm bg-card/95">
          <CardHeader>
            <CardTitle className="text-2xl font-heading">Welcome</CardTitle>
            <CardDescription>Login or create an account to get started</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login" data-testid="tab-login">Login</TabsTrigger>
                <TabsTrigger value="signup" data-testid="tab-signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-4">
                <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      {...loginForm.register('email')}
                      data-testid="input-email"
                      placeholder="your.email@example.com"
                    />
                    {loginForm.formState.errors.email && (
                      <p className="text-sm text-destructive">{loginForm.formState.errors.email.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      {...loginForm.register('password')}
                      data-testid="input-password"
                    />
                    {loginForm.formState.errors.password && (
                      <p className="text-sm text-destructive">{loginForm.formState.errors.password.message}</p>
                    )}
                  </div>
                  <Button type="submit" className="w-full" disabled={loginMutation.isPending} data-testid="button-login">
                    {loginMutation.isPending ? 'Logging in...' : (
                      <>
                        <LogIn className="w-4 h-4 mr-2" />
                        Login
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="space-y-4">
                <div className="mb-4 p-3 bg-primary/10 border border-primary/20 rounded-md">
                  <p className="text-sm text-primary font-medium">
                    ✉️ Gmail Required: Please use your Gmail address to create an account
                  </p>
                </div>
                <form onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Input
                      id="signup-name"
                      {...signupForm.register('name')}
                      data-testid="input-signup-name"
                      placeholder="John Doe"
                    />
                    {signupForm.formState.errors.name && (
                      <p className="text-sm text-destructive">{signupForm.formState.errors.name.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-role">Account Type</Label>
                    <Select
                      value={signupForm.watch('role')}
                      onValueChange={(value) => signupForm.setValue('role', value as 'contributor' | 'buyer')}
                    >
                      <SelectTrigger id="signup-role" data-testid="select-role">
                        <SelectValue placeholder="Select your account type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="contributor" data-testid="option-contributor">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4" />
                            <div>
                              <div className="font-medium">Contributor</div>
                              <div className="text-xs text-muted-foreground">Submit blue carbon projects</div>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="buyer" data-testid="option-buyer">
                          <div className="flex items-center gap-2">
                            <ShoppingCart className="w-4 h-4" />
                            <div>
                              <div className="font-medium">Buyer</div>
                              <div className="text-xs text-muted-foreground">Purchase carbon credits</div>
                            </div>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {signupForm.formState.errors.role && (
                      <p className="text-sm text-destructive">{signupForm.formState.errors.role.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Gmail Address</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      {...signupForm.register('email')}
                      data-testid="input-signup-email"
                      placeholder="yourname@gmail.com"
                    />
                    {signupForm.formState.errors.email && (
                      <p className="text-sm text-destructive">{signupForm.formState.errors.email.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password (min 8 characters)</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      {...signupForm.register('password')}
                      data-testid="input-signup-password"
                      placeholder="••••••••"
                    />
                    {signupForm.formState.errors.password && (
                      <p className="text-sm text-destructive">{signupForm.formState.errors.password.message}</p>
                    )}
                  </div>
                  <Button type="submit" className="w-full" disabled={signupMutation.isPending} data-testid="button-signup">
                    {signupMutation.isPending ? 'Creating account...' : (
                      <>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Create Account
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-6 pt-6 border-t">
              <p className="text-sm text-muted-foreground mb-3 text-center">Demo Accounts (For Testing Only):</p>
              <div className="grid gap-2">
                {demoCredentials.map((cred) => (
                  <Button
                    key={cred.email}
                    variant="outline"
                    size="sm"
                    className="justify-between"
                    onClick={() => fillDemoCredentials(cred.email, cred.password)}
                    data-testid={`button-demo-${cred.role.toLowerCase()}`}
                  >
                    <span className="font-medium">{cred.role}</span>
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {cred.email.split('@')[0]} / {cred.password}
                    </code>
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3 text-center">
                Regular users: Please create an account with your Gmail address
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
