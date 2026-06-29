import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Team from "@/pages/team";
import Onboarding from "@/pages/onboarding";

const queryClient = new QueryClient();

function Router() {
  const [, navigate] = useLocation();
  const isOnboarded = !!localStorage.getItem("signalos_onboarding_complete");

  if (!isOnboarded) {
    return (
      <Onboarding
        onComplete={() => {
          // Force a re-render by navigating — queryClient stays warm
          navigate("/");
          window.location.reload();
        }}
      />
    );
  }

  return (
    <Switch>
      <Route path="/" component={Home} />
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
