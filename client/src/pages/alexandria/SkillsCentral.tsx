import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/lib/trpc';
import {
  Zap,
  Search,
  Plus,
  Settings,
  BarChart3,
  Puzzle,
  Workflow,
  Shield,
  ChevronRight,
  Loader2,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle
} from 'lucide-react';

const categoriaIcons: Record<string, React.ElementType> = {
  automacao: Workflow,
  analise: BarChart3,
  criacao: Puzzle,
  integracao: Settings,
  validacao: Shield
};

const categoriaLabels: Record<string, string> = {
  automacao: 'Automação',
  analise: 'Análise',
  criacao: 'Criação',
  integracao: 'Integração',
  validacao: 'Validação'
};

const categoriaColors: Record<string, string> = {
  automacao: 'bg-blue-100 text-blue-700 border-blue-200',
  analise: 'bg-purple-100 text-purple-700 border-purple-200',
  criacao: 'bg-orange-100 text-orange-700 border-orange-200',
  integracao: 'bg-green-100 text-green-700 border-green-200',
  validacao: 'bg-red-100 text-red-700 border-red-200'
};

export default function SkillsCentral() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  const categorias = trpc.alexandria.skills.getCategories.useQuery();
  const agents = trpc.alexandria.skills.getAgents.useQuery();
  const skills = trpc.alexandria.skills.search.useQuery({
    query: searchQuery || '*',
    categoria: selectedCategoria as any,
    agente: selectedAgent || undefined,
    limit: 50
  });
  const stats = trpc.alexandria.skills.getStats.useQuery();

  const isLoading = skills.isLoading;

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Central de Skills</h1>
          <p className="text-slate-600 mt-1">
            Catálogo de habilidades com recomendações inteligentes
          </p>
        </div>
        <Button>
          <Plus size={18} className="mr-2" />
          Nova Skill
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {['automacao', 'analise', 'criacao', 'integracao', 'validacao'].map((cat) => {
          const Icon = categoriaIcons[cat];
          const count = stats.data?.byCategory?.[cat] || 0;
          return (
            <Card
              key={cat}
              className={`cursor-pointer transition-all ${
                selectedCategoria === cat ? 'ring-2 ring-purple-500' : ''
              }`}
              onClick={() => setSelectedCategoria(selectedCategoria === cat ? null : cat)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <Icon size={20} className="text-slate-400" />
                  <span className="text-2xl font-bold">{count}</span>
                </div>
                <p className="text-sm text-slate-600 mt-2">{categoriaLabels[cat]}</p>
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
              placeholder="Buscar skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Tabs defaultValue="departamentos" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="departamentos">Departamentos</TabsTrigger>
          <TabsTrigger value="tarefas">Tarefas</TabsTrigger>
          <TabsTrigger value="clientes">Clientes</TabsTrigger>
        </TabsList>

        <TabsContent value="departamentos" className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {categorias.data?.map((cat) => (
              <Button
                key={cat}
                variant={selectedCategoria === cat ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategoria(selectedCategoria === cat ? null : cat)}
              >
                {categoriaLabels[cat] || cat}
              </Button>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="tarefas">
          <Card>
            <CardContent className="p-6">
              <p className="text-slate-500">Filtros por tipo de tarefa serão implementados aqui.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clientes">
          <Card>
            <CardContent className="p-6">
              <p className="text-slate-500">Filtros por cliente serão implementados aqui.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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

      {/* Skills List */}
      <Card>
        <CardHeader>
          <CardTitle>Skills</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin mr-2" />
              Carregando...
            </div>
          ) : skills.data?.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Zap size={48} className="mx-auto mb-4 text-slate-300" />
              <p>Nenhuma skill encontrada</p>
            </div>
          ) : (
            <div className="space-y-3">
              {skills.data?.map((skill: any) => {
                const Icon = categoriaIcons[skill.categoria] || Zap;
                return (
                  <div
                    key={skill.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        categoriaColors[skill.categoria]?.split(' ')[0] || 'bg-slate-100'
                      }`}>
                        <Icon className={categoriaColors[skill.categoria]?.split(' ')[1] || 'text-slate-600'} size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-slate-900">{skill.nome}</h4>
                          {skill.ativa ? (
                            <CheckCircle2 size={16} className="text-green-500" />
                          ) : (
                            <XCircle size={16} className="text-red-500" />
                          )}
                        </div>
                        <p className="text-sm text-slate-500">{skill.descricao}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" size="sm">{skill.agente}</Badge>
                          <Badge className={categoriaColors[skill.categoria] || 'bg-slate-100'}>
                            {categoriaLabels[skill.categoria] || skill.categoria}
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
