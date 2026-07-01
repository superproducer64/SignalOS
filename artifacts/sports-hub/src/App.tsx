import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Team from "@/pages/team";
import Onboarding from "@/pages/onboarding";
import Captures from "@/pages/captures";
import Auth from "@/pages/auth";
import { useCurrentUser } from "@/hooks/use-current-user";

const queryClient = new QueryClient();

function Router() {
  const { user, isLoading, isAuthenticated } = useCurrentUser();

  if (isLoading) {
    return <div className="min-h-[100dvh] bg-background" />;
  }

  if (!isAuthenticated) {
    return <Auth />;
  }

  if (!user?.onboardingComplete) {
    return (
      <Onboarding
        onComplete={() => {
          // Onboarding just marked onboarding_complete server-side. Use a real
          // browser navigation so the URL is definitively "/" on load, regardless
          // of whatever URL the tab was previously sitting at. replace() (not
          // href=) so the stale pre-onboarding /team/:id URL is not left in
          // history — otherwise browser Back could return to that card.
          window.location.replace("/");
        }}
      />
    );
  }

  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/captures" component={Captures} />
      <Route path="/team/:id" component={Team} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
