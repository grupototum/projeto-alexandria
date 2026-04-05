import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/lib/trpc';
import {
  FileText,
  Search,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Plus,
  Filter,
  ChevronRight,
  BookOpen
} from 'lucide-react';

const statusColors: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-700',
  review: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  deprecated: 'bg-red-100 text-red-700'
};

const statusLabels: Record<string, string> = {
  draft: 'Rascunho',
  review: 'Revisão',
  approved: 'Aprovado',
  deprecated: 'Descontinuado'
};

export default function PopsPortal() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartamento, setSelectedDepartamento] = useState<string | null>(null);
  
  const departamentos = trpc.alexandria.pops.getDepartamentos.useQuery();
  const pops = trpc.alexandria.pops.search.useQuery({
    query: searchQuery || '*',
    departamento: selectedDepartamento || undefined,
    limit: 50
  });

  const isLoading = departamentos.isLoading || pops.isLoading;

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Portal de POPs SLA</h1>
          <p className="text-slate-600 mt-1">
            Procedimentos Operacionais Padrão com SLAs
          </p>
        </div>
        <Button>
          <Plus size={18} className="mr-2" />
          Novo POP
        </Button>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
              <Input
                placeholder="Buscar POPs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter size={18} className="mr-2" />
              Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Departments */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={selectedDepartamento === null ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedDepartamento(null)}
        >
          Todos
        </Button>
        {departamentos.data?.map((dept) => (
          <Button
            key={dept}
            variant={selectedDepartamento === dept ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedDepartamento(dept)}
          >
            {dept}
          </Button>
        ))}
      </div>

      {/* POPs List */}
      <Card>
        <CardHeader>
          <CardTitle>Procedimentos</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin mr-2" />
              Carregando...
            </div>
          ) : pops.data?.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <FileText size={48} className="mx-auto mb-4 text-slate-300" />
              <p>Nenhum POP encontrado</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pops.data?.map((pop: any) => (
                <div
                  key={pop.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FileText className="text-blue-600" size={20} />
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-900">{pop.titulo}</h4>
                      <p className="text-sm text-slate-500">{pop.departamento}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge className={statusColors[pop.status] || 'bg-slate-100'}>
                      {statusLabels[pop.status] || pop.status}
                    </Badge>
                    <Button variant="ghost" size="sm">
                      <ChevronRight size={18} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* SLA Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="text-blue-600" size={24} />
              <div>
                <p className="text-sm text-blue-600 font-medium">SLA Médio</p>
                <p className="text-2xl font-bold text-blue-900">4h</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="text-green-600" size={24} />
              <div>
                <p className="text-sm text-green-600 font-medium">Aprovados</p>
                <p className="text-2xl font-bold text-green-900">{departamentos.data?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <BookOpen className="text-purple-600" size={24} />
              <div>
                <p className="text-sm text-purple-600 font-medium">Departamentos</p>
                <p className="text-2xl font-bold text-purple-900">{departamentos.data?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
