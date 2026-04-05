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
  BarChart3
} from 'lucide-react';

interface AlexandriaLayoutProps {
  children: React.ReactNode;
}

export default function AlexandriaLayout({ children }: AlexandriaLayoutProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navigationItems = [
    {
      label: 'Home',
      href: '/',
      icon: Home,
      description: 'Dashboard principal'
    },
    {
      label: 'Portal de POPs',
      href: '/pops',
      icon: FileText,
      description: 'Procedimentos operacionais'
    },
    {
      label: 'Context Hub',
      href: '/context',
      icon: BookOpen,
      description: 'Gerenciador de contextos'
    },
    {
      label: 'Central de Skills',
      href: '/skills',
      icon: Zap,
      description: 'Catálogo de habilidades'
    },
    {
      label: 'Dashboard OpenClaw',
      href: '/openclaw',
      icon: BarChart3,
      description: 'Monitoramento de gateway'
    }
  ];

  const isActive = (href: string) => location === href;

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
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
            const active = isActive(item.href);
            return (
              <button
                key={item.href}
                onClick={() => setLocation(item.href)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  active
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
                title={item.label}
              >
                <Icon size={20} className="flex-shrink-0" />
                {sidebarOpen && (
                  <div className="text-left">
                    <div className="text-sm font-medium">{item.label}</div>
                    <div className="text-xs text-slate-400">{item.description}</div>
                  </div>
                )}
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
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
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
