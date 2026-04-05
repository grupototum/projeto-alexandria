import { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/lib/trpc';
import {
  FileText,
  BookOpen,
  Zap,
  BarChart3,
  ArrowRight,
  Search,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  TrendingUp,
  Users,
  Layers
} from 'lucide-react';

export default function AlexandriaDashboard() {
  const [, setLocation] = useLocation();
  const healthCheck = trpc.alexandria.healthCheck.useQuery();
  const popsStats = trpc.alexandria.pops.getStats.useQuery();
  const contextStats = trpc.alexandria.context.getStats.useQuery();
  const skillsStats = trpc.alexandria.skills.getStats.useQuery();

  const modules = [
    {
      title: 'Portal de POPs',
      description: 'Procedimentos Operacionais Padrão com busca semântica',
      icon: FileText,
      href: '/alexandria/pops',
      color: 'from-blue-500 to-cyan-500',
      stats: popsStats.data
    },
    {
      title: 'Context Hub',
      description: 'Gerenciador de contextos para agentes IA',
      icon: BookOpen,
      href: '/alexandria/context',
      color: 'from-purple-500 to-pink-500',
      stats: contextStats.data
    },
    {
      title: 'Central de Skills',
      description: 'Catálogo de habilidades com recomendações',
      icon: Zap,
      href: '/alexandria/skills',
      color: 'from-orange-500 to-red-500',
      stats: skillsStats.data
    },
    {
      title: 'Dashboard OpenClaw',
      description: 'Monitoramento do gateway e skills',
      icon: BarChart3,
      href: '/alexandria/openclaw',
      color: 'from-green-500 to-emerald-500'
    }
  ];

  const isLoading = healthCheck.isLoading || popsStats.isLoading || 
                    contextStats.isLoading || skillsStats.isLoading;

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Alexandria</h1>
          <p className="text-slate-600 mt-1">
            Central de Conhecimento Integrada com IA
          </p>
        </div>
        <div className="flex items-center gap-4">
          {isLoading ? (
            <div className="flex items-center gap-2 text-slate-500">
              <Loader2 size={18} className="animate-spin" />
              Carregando...
            </div>
          ) : healthCheck.data?.status === 'ok' ? (
            <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-full">
              <CheckCircle size={18} />
              <span className="font-medium">Sistema Online</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-2 rounded-full">
              <AlertCircle size={18} />
              <span className="font-medium">Sistema Offline</span>
            </div>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <Card className="border-slate-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="Buscar em toda a base de conhecimento..."
                className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-lg"
              />
            </div>
            <Button size="lg" className="px-8">
              Buscar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Total POPs</p>
                <p className="text-2xl font-bold text-blue-900">
                  {popsStats.data?.total ?? '-'}
                </p>
              </div>
              <FileText className="text-blue-400" size={24} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">Contextos</p>
                <p className="text-2xl font-bold text-purple-900">
                  {contextStats.data?.total ?? '-'}
                </p>
              </div>
              <BookOpen className="text-purple-400" size={24} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 font-medium">Skills</p>
                <p className="text-2xl font-bold text-orange-900">
                  {skillsStats.data?.total ?? '-'}
                </p>
              </div>
              <Zap className="text-orange-400" size={24} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Documentos</p>
                <p className="text-2xl font-bold text-green-900">
                  {healthCheck.data?.knowledge?.total ?? '-'}
                </p>
              </div>
              <Layers className="text-green-400" size={24} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Module Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {modules.map((module) => {
          const Icon = module.icon;
          return (
            <Card
              key={module.href}
              className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group"
              onClick={() => setLocation(module.href)}
            >
              <div className={`bg-gradient-to-r ${module.color} h-24 flex items-center px-6`}>
                <Icon size={32} className="text-white" />
                <div className="ml-4 text-white">
                  <h3 className="text-xl font-bold">{module.title}</h3>
                </div>
              </div>
              <CardContent className="p-6">
                <p className="text-slate-600 mb-4">{module.description}</p>
                {module.stats && (
                  <div className="flex gap-4 mb-4 text-sm">
                    <span className="text-slate-500">
                      Total: <strong className="text-slate-900">{module.stats.total}</strong>
                    </span>
                  </div>
                )}
                <Button variant="outline" className="w-full group/btn">
                  Acessar
                  <ArrowRight size={16} className="ml-2 group-hover/btn:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock size={20} />
            Atividade Recente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <FileText className="text-blue-600" size={18} />
              </div>
              <div className="flex-1">
                <p className="font-medium text-slate-900">POP atualizado</p>
                <p className="text-sm text-slate-500">Procedimento de Onboarding</p>
              </div>
              <span className="text-sm text-slate-400">Há 2 horas</span>
            </div>
            <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <BookOpen className="text-purple-600" size={18} />
              </div>
              <div className="flex-1">
                <p className="font-medium text-slate-900">Novo contexto criado</p>
                <p className="text-sm text-slate-500">Agente: Pablo</p>
              </div>
              <span className="text-sm text-slate-400">Há 5 horas</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
