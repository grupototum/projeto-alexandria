import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/lib/trpc';
import {
  BookOpen,
  Search,
  Plus,
  User,
  Brain,
  FileText,
  Settings,
  Users,
  ChevronRight,
  Loader2,
  Edit,
  Trash2
} from 'lucide-react';

const tipoIcons: Record<string, React.ElementType> = {
  personality: User,
  memory: Brain,
  knowledge: FileText,
  process: Settings,
  client: Users
};

const tipoLabels: Record<string, string> = {
  personality: 'Personalidade',
  memory: 'Memória',
  knowledge: 'Conhecimento',
  process: 'Processo',
  client: 'Cliente'
};

const tipoColors: Record<string, string> = {
  personality: 'bg-purple-100 text-purple-700 border-purple-200',
  memory: 'bg-blue-100 text-blue-700 border-blue-200',
  knowledge: 'bg-green-100 text-green-700 border-green-200',
  process: 'bg-orange-100 text-orange-700 border-orange-200',
  client: 'bg-pink-100 text-pink-700 border-pink-200'
};

export default function ContextHub() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [selectedTipo, setSelectedTipo] = useState<string | null>(null);

  const agents = trpc.alexandria.context.getAgents.useQuery();
  const contexts = trpc.alexandria.context.search.useQuery({
    query: searchQuery || '*',
    agente: selectedAgent || undefined,
    tipo: selectedTipo as any,
    limit: 50
  });
  const stats = trpc.alexandria.context.getStats.useQuery();

  const isLoading = agents.isLoading || contexts.isLoading;

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Context HUB</h1>
          <p className="text-slate-600 mt-1">
            Gerenciador de contextos para agentes IA
          </p>
        </div>
        <Button>
          <Plus size={18} className="mr-2" />
          Novo Contexto
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {['personality', 'memory', 'knowledge', 'process', 'client'].map((tipo) => {
          const Icon = tipoIcons[tipo];
          const count = stats.data?.byType?.[tipo] || 0;
          return (
            <Card
              key={tipo}
              className={`cursor-pointer transition-all ${
                selectedTipo === tipo ? 'ring-2 ring-purple-500' : ''
              }`}
              onClick={() => setSelectedTipo(selectedTipo === tipo ? null : tipo)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <Icon size={20} className="text-slate-400" />
                  <span className="text-2xl font-bold">{count}</span>
                </div>
                <p className="text-sm text-slate-600 mt-2">{tipoLabels[tipo]}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
            <Input
              placeholder="Buscar contextos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Agent Filter */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={selectedAgent === null ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedAgent(null)}
        >
          Todos Agentes
        </Button>
        {agents.data?.map((agent) => (
          <Button
            key={agent}
            variant={selectedAgent === agent ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedAgent(agent)}
          >
            {agent}
          </Button>
        ))}
      </div>

      {/* Contexts List */}
      <Card>
        <CardHeader>
          <CardTitle>Contextos</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin mr-2" />
              Carregando...
            </div>
          ) : contexts.data?.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <BookOpen size={48} className="mx-auto mb-4 text-slate-300" />
              <p>Nenhum contexto encontrado</p>
            </div>
          ) : (
            <div className="space-y-3">
              {contexts.data?.map((ctx: any) => {
                const Icon = tipoIcons[ctx.tipo] || FileText;
                return (
                  <div
                    key={ctx.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        tipoColors[ctx.tipo]?.split(' ')[0] || 'bg-slate-100'
                      }`}>
                        <Icon className={tipoColors[ctx.tipo]?.split(' ')[1] || 'text-slate-600'} size={20} />
                      </div>
                      <div>
                        <h4 className="font-medium text-slate-900">{ctx.titulo}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" size="sm">{ctx.agente}</Badge>
                          <Badge className={tipoColors[ctx.tipo] || 'bg-slate-100'}>
                            {tipoLabels[ctx.tipo] || ctx.tipo}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Edit size={16} />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-600">
                        <Trash2 size={16} />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <ChevronRight size={18} />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
