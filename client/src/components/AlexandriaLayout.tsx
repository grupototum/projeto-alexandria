import React, { useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import {
  BookOpen,
  FileText,
  Zap,
  Settings,
  LogOut,
  Menu,
  X,
  Home,
  Search,
  BarChart3,
  Briefcase,
  CheckSquare,
  Rocket,
  Building2,
  Bot,
  Users,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface AlexandriaLayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  description?: string;
  children?: { label: string; href: string; icon: React.ElementType }[];
}

export default function AlexandriaLayout({ children }: AlexandriaLayoutProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    alexandria: true,
    workspace: false,
    settings: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const navigationItems: NavItem[] = [
    {
      label: 'Home',
      href: '/',
      icon: Home,
      description: 'Dashboard principal'
    },
    {
      label: 'Alexandria',
      href: '/alexandria',
      icon: BookOpen,
      description: 'Central de conhecimento',
      children: [
        { label: 'Dashboard', href: '/alexandria', icon: BarChart3 },
        { label: 'Portal POPs', href: '/alexandria/pops', icon: FileText },
        { label: 'Context HUB', href: '/alexandria/context', icon: BookOpen },
        { label: 'Central Skills', href: '/alexandria/skills', icon: Zap },
        { label: 'OpenClaw', href: '/alexandria/openclaw', icon: BarChart3 },
      ]
    },
    {
      label: 'Workspace',
      href: '/workspace/tasks',
      icon: Briefcase,
      description: 'Área de trabalho',
      children: [
        { label: 'Tarefas', href: '/workspace/tasks', icon: CheckSquare },
        { label: 'Implantação', href: '/workspace/deployment', icon: Rocket },
        { label: 'Clientes', href: '/workspace/clients', icon: Building2 },
      ]
    },
    {
      label: 'Cráudio Codete',
      href: '/craudio',
      icon: Bot,
      description: 'IA Local com Ollama'
    },
    {
      label: 'Configurações',
      href: '/settings/operators',
      icon: Settings,
      description: 'Operadores e sistema',
      children: [
        { label: 'Operadores', href: '/settings/operators', icon: Users },
      ]
    },
  ];

  const isActive = (href: string) => {
    if (href === '/') return location === href;
    return location.startsWith(href);
  };

  const isSectionActive = (item: NavItem) => {
    if (!item.children) return isActive(item.href);
    return item.children.some(child => isActive(child.href));
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-72' : 'w-20'
        } bg-slate-900 text-white transition-all duration-300 flex flex-col border-r border-slate-800`}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center font-bold text-sm">
                A
              </div>
              <span className="font-bold text-lg">Alexandria</span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 hover:bg-slate-800 rounded-lg transition-colors"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const hasChildren = item.children && item.children.length > 0;
            const sectionKey = item.label.toLowerCase().replace(' ', '');
            const isExpanded = expandedSections[sectionKey];
            const sectionActive = isSectionActive(item);

            if (!sidebarOpen) {
              return (
                <button
                  key={item.href}
                  onClick={() => setLocation(item.href)}
                  className={`w-full flex items-center justify-center p-3 rounded-lg transition-colors ${
                    sectionActive
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                  title={item.label}
                >
                  <Icon size={22} />
                </button>
              );
            }

            if (hasChildren) {
              return (
                <div key={item.label} className="space-y-1">
                  <button
                    onClick={() => toggleSection(sectionKey)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                      sectionActive
                        ? 'bg-gradient-to-r from-purple-600/50 to-blue-600/50 text-white'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={20} />
                      <span className="font-medium">{item.label}</span>
                    </div>
                    {isExpanded ? (
                      <ChevronDown size={16} />
                    ) : (
                      <ChevronRight size={16} />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="ml-4 space-y-1">
                      {item.children?.map((child) => {
                        const ChildIcon = child.icon;
                        return (
                          <button
                            key={child.href}
                            onClick={() => setLocation(child.href)}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm ${
                              isActive(child.href)
                                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                            }`}
                          >
                            <ChildIcon size={16} />
                            <span>{child.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <button
                key={item.href}
                onClick={() => setLocation(item.href)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  sectionActive
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
                title={item.label}
              >
                <Icon size={20} />
                <div className="text-left">
                  <div className="text-sm font-medium">{item.label}</div>
                  <div className="text-xs text-slate-400">{item.description}</div>
                </div>
              </button>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-slate-800 space-y-2">
          {sidebarOpen && user && (
            <div className="px-3 py-2 text-sm">
              <div className="font-medium truncate">{user.name}</div>
              <div className="text-xs text-slate-400 truncate">{user.email}</div>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={logout}
            className="w-full text-slate-300 border-slate-700 hover:bg-slate-800"
          >
            {sidebarOpen ? (
              <>
                <LogOut size={16} className="mr-2" />
                Sair
              </>
            ) : (
              <LogOut size={16} />
            )}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Alexandria</h1>
          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Buscar..."
                className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Sistema Online
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto bg-slate-50">
          {children}
        </div>
      </main>
    </div>
  );
}
