import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import AlexandriaLayout from "./components/AlexandriaLayout";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={() => <AlexandriaLayout><Home /></AlexandriaLayout>} />
      <Route path={"/pops"} component={() => <AlexandriaLayout><div className="p-8"><h1 className="text-3xl font-bold">Portal de POPs</h1><p className="text-slate-600 mt-2">Em desenvolvimento...</p></div></AlexandriaLayout>} />
      <Route path={"/context"} component={() => <AlexandriaLayout><div className="p-8"><h1 className="text-3xl font-bold">Context Hub</h1><p className="text-slate-600 mt-2">Em desenvolvimento...</p></div></AlexandriaLayout>} />
      <Route path={"/skills"} component={() => <AlexandriaLayout><div className="p-8"><h1 className="text-3xl font-bold">Central de Skills</h1><p className="text-slate-600 mt-2">Em desenvolvimento...</p></div></AlexandriaLayout>} />
      <Route path={"/openclaw"} component={() => <AlexandriaLayout><div className="p-8"><h1 className="text-3xl font-bold">Dashboard OpenClaw</h1><p className="text-slate-600 mt-2">Em desenvolvimento...</p></div></AlexandriaLayout>} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
