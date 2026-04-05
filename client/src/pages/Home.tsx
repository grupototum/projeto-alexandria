import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { trpc } from '@/lib/trpc';
import { useLocation } from 'wouter';
import {
  FileText,
  BookOpen,
  Zap,
  BarChart3,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2
} from 'lucide-react';

export default function Home() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const healthCheck = trpc.alexandria.healthCheck.useQuery();

  const modules = [
    {
      title: 'Portal de POPs',
      description: 'Procedimentos Operacionais Padrão com busca semântica e versionamento',
      icon: FileText,
      href: '/pops',
      color: 'from-blue-500 to-cyan-500',
      features: ['CRUD completo', 'Busca híbrida', 'Versionamento', 'Recomendações']
    },
    {
      title: 'Context Hub',
      description: 'Gerenciador de contextos para agentes IA com transformação de formatos',
      icon: BookOpen,
      href: '/context',
      color: 'from-purple-500 to-pink-500',
      features: ['5 tipos de contexto', 'Transformação de formato', 'Consolidação', 'Histórico']
    },
    {
      title: 'Central de Skills',
      description: 'Catálogo de habilidades com recomendações inteligentes baseadas em contexto',
      icon: Zap,
      href: '/skills',
      color: 'from-orange-500 to-red-500',
      features: ['5 categorias', 'Busca semântica', 'Recomendações', 'Dependências']
    },
    {
      title: 'Dashboard OpenClaw',
      description: 'Monitoramento em tempo real do gateway e status de skills instaladas',
      icon: BarChart3,
      href: '/openclaw',
      color: 'from-green-500 to-emerald-500',
      features: ['Status do gateway', 'Métricas', 'Logs em tempo real', 'Alertas']
    }
  ];

  const stats = [
    { label: 'Base de Conhecimento', value: healthCheck.data?.knowledge?.total ?? 0, icon: BookOpen },
    { label: 'Status', value: healthCheck.data?.status === 'ok' ? 'Online' : 'Offline', icon: CheckCircle }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 text-white py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-3">
              Bem-vindo ao Alexandria
            </h1>
            <p className="text-lg text-slate-300 max-w-2xl">
              Central de Conhecimento Integrada com Busca Semântica, Gerenciamento de Contextos e Recomendações Inteligentes
            </p>
          </div>

          {/* Status Bar */}
          <div className="flex items-center gap-4 flex-wrap">
            {healthCheck.isLoading ? (
              <div className="flex items-center gap-2 text-slate-300">
                <Loader2 size={18} className="animate-spin" />
                Verificando sistema...
              </div>
            ) : healthCheck.data?.status === 'ok' ? (
              <div className="flex items-center gap-2 text-green-400">
                <CheckCircle size={18} />
                Sistema Online
              </div>
            ) : (
              <div className="flex items-center gap-2 text-red-400">
                <AlertCircle size={18} />
                Sistema Offline
              </div>
            )}

            {stats.map((stat) => (
              <div key={stat.label} className="flex items-center gap-2 text-slate-300 border-l border-slate-700 pl-4">
                <stat.icon size={16} />
                <span className="text-sm">{stat.label}: <strong>{stat.value}</strong></span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Welcome Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Olá, {user?.name || 'Usuário'}! 👋
          </h2>
          <p className="text-slate-600">
            Explore os módulos abaixo para gerenciar conhecimento, contextos e skills de seus agentes IA.
          </p>
        </div>

        {/* Module Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <Card
                key={module.href}
                className="overflow-hidden hover:shadow-lg transition-all duration-300 border-0 group cursor-pointer"
                onClick={() => setLocation(module.href)}
              >
                {/* Card Header with Gradient */}
                <div className={`bg-gradient-to-r ${module.color} h-32 flex items-center justify-center relative overflow-hidden`}>
                  <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Icon size={120} className="absolute -right-10 -bottom-10 opacity-20" />
                  </div>
                  <Icon size={48} className="text-white relative z-10" />
                </div>

                {/* Card Body */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">
                    {module.title}
                  </h3>
                  <p className="text-slate-600 text-sm mb-4">
                    {module.description}
                  </p>

                  {/* Features */}
                  <div className="mb-6 space-y-2">
                    {module.features.map((feature) => (
                      <div key={feature} className="flex items-center gap-2 text-sm text-slate-700">
                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full"></div>
                        {feature}
                      </div>
                    ))}
                  </div>

                  {/* Button */}
                  <Button
                    className="w-full group/btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLocation(module.href);
                    }}
                  >
                    Acessar Módulo
                    <ArrowRight size={16} className="ml-2 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Info Sections */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Quick Stats */}
          <Card className="p-6 border-slate-200">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <BookOpen className="text-blue-600" size={24} />
              </div>
              <h3 className="font-bold text-slate-900">Base de Conhecimento</h3>
            </div>
            <p className="text-3xl font-bold text-slate-900 mb-2">
              {healthCheck.data?.knowledge?.total ?? 0}
            </p>
            <p className="text-sm text-slate-600">
              Documentos e chunks armazenados
            </p>
          </Card>

          {/* Features */}
          <Card className="p-6 border-slate-200">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Zap className="text-purple-600" size={24} />
              </div>
              <h3 className="font-bold text-slate-900">Recursos</h3>
            </div>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-600" />
                Busca Semântica Híbrida
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-600" />
                Transformação de Formatos
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-600" />
                Recomendações Inteligentes
              </li>
            </ul>
          </Card>

          {/* System Info */}
          <Card className="p-6 border-slate-200">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="text-green-600" size={24} />
              </div>
              <h3 className="font-bold text-slate-900">Status do Sistema</h3>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-slate-600 mb-1">Supabase</p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-slate-900">Conectado</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-600 mb-1">Google Gemini</p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium text-slate-900">Disponível</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-slate-200 text-center text-slate-600">
          <p className="text-sm">
            Alexandria v1.0.0 • Plataforma de Gerenciamento de Conhecimento com IA
          </p>
        </div>
      </div>
    </div>
  );
}
