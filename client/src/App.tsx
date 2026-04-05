import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import AlexandriaLayout from "./components/AlexandriaLayout";

// Alexandria Pages
import AlexandriaDashboard from "./pages/alexandria/Dashboard";
import PopsPortal from "./pages/alexandria/PopsPortal";
import ContextHub from "./pages/alexandria/ContextHub";
import SkillsCentral from "./pages/alexandria/SkillsCentral";
import OpenClawDashboard from "./pages/alexandria/OpenClawDashboard";

// Workspace Pages
import Tasks from "./pages/workspace/Tasks";
import Deployment from "./pages/workspace/Deployment";
import Clients from "./pages/workspace/Clients";

// Craudio IA Page
import CraudioCodete from "./pages/craudio/CraudioCodete";

// Settings Pages
import OperatorsSettings from "./pages/settings/Operators";

function Router() {
  return (
    <Switch>
      {/* Legacy Route - Redirect to new structure */}
      <Route path="/" component={() => <AlexandriaLayout><Home /></AlexandriaLayout>} />

      {/* Alexandria Section */}
      <Route path="/alexandria" component={() => <AlexandriaLayout><AlexandriaDashboard /></AlexandriaLayout>} />
      <Route path="/alexandria/pops" component={() => <AlexandriaLayout><PopsPortal /></AlexandriaLayout>} />
      <Route path="/alexandria/context" component={() => <AlexandriaLayout><ContextHub /></AlexandriaLayout>} />
      <Route path="/alexandria/skills" component={() => <AlexandriaLayout><SkillsCentral /></AlexandriaLayout>} />
      <Route path="/alexandria/openclaw" component={() => <AlexandriaLayout><OpenClawDashboard /></AlexandriaLayout>} />

      {/* Legacy redirects */}
      <Route path="/pops" component={() => <AlexandriaLayout><PopsPortal /></AlexandriaLayout>} />
      <Route path="/context" component={() => <AlexandriaLayout><ContextHub /></AlexandriaLayout>} />
      <Route path="/skills" component={() => <AlexandriaLayout><SkillsCentral /></AlexandriaLayout>} />
      <Route path="/openclaw" component={() => <AlexandriaLayout><OpenClawDashboard /></AlexandriaLayout>} />

      {/* Workspace Section */}
      <Route path="/workspace/tasks" component={() => <AlexandriaLayout><Tasks /></AlexandriaLayout>} />
      <Route path="/workspace/deployment" component={() => <AlexandriaLayout><Deployment /></AlexandriaLayout>} />
      <Route path="/workspace/clients" component={() => <AlexandriaLayout><Clients /></AlexandriaLayout>} />

      {/* Craudio IA */}
      <Route path="/craudio" component={() => <AlexandriaLayout><CraudioCodete /></AlexandriaLayout>} />

      {/* Settings */}
      <Route path="/settings/operators" component={() => <AlexandriaLayout><OperatorsSettings /></AlexandriaLayout>} />

      <Route path="/404" component={NotFound} />
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
