import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "./lib/auth-context";
import { ThemeProvider } from "./lib/theme-provider";
import { Navbar } from "./components/navbar";
import Landing from "./pages/landing";
import Login from "./pages/login";
import UserDashboard from "./pages/user-dashboard";
import AdminDashboard from "./pages/admin-dashboard";
import VerifierDashboard from "./pages/verifier-dashboard";
import Marketplace from "./pages/marketplace";
import Explorer from "./pages/explorer";
import NotFound from "./pages/not-found";

function ProtectedRoute({
  component: Component,
  allowedRoles,
}: {
  component: React.ComponentType;
  allowedRoles?: string[];
}) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Redirect to="/" />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    const roleRedirects: Record<string, string> = {
      admin: '/admin',
      verifier: '/verifier',
      contributor: '/dashboard',
      buyer: '/marketplace',
    };
    return <Redirect to={roleRedirects[user.role] || '/dashboard'} />;
  }

  return <Component />;
}

function Router() {
  const { isAuthenticated } = useAuth();

  return (
    <>
      <Navbar />
      <Switch>
        <Route path="/">
          {() => (isAuthenticated ? <Redirect to="/dashboard" /> : <Landing />)}
        </Route>
        <Route path="/login" component={Login} />
        <Route path="/dashboard">
          {() => <ProtectedRoute component={UserDashboard} allowedRoles={['contributor']} />}
        </Route>
        <Route path="/marketplace">
          {() => <ProtectedRoute component={Marketplace} allowedRoles={['buyer']} />}
        </Route>
        <Route path="/admin">
          {() => <ProtectedRoute component={AdminDashboard} allowedRoles={['admin']} />}
        </Route>
        <Route path="/verifier">
          {() => <ProtectedRoute component={VerifierDashboard} allowedRoles={['verifier']} />}
        </Route>
        <Route path="/explorer" component={Explorer} />
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
