import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  CheckSquare,
  Plus,
  Search,
  Calendar,
  User,
  Repeat,
  Clock,
  AlertCircle,
  CheckCircle2,
  Loader2
} from 'lucide-react';

// Mock data - will be replaced with Supabase connection
const mockTasks = [
  {
    id: '1',
    titulo: 'Revisar POP de Onboarding',
    descricao: 'Atualizar o procedimento de onboarding com novos passos',
    status: 'pendente',
    prioridade: 'alta',
    responsavel: 'Israel',
    recorrencia: 'mensal',
    data_vencimento: '2026-04-10',
    checklist: [
      { id: '1', texto: 'Ler POP atual', concluido: true },
      { id: '2', texto: 'Identificar gaps', concluido: false },
      { id: '3', texto: 'Atualizar documento', concluido: false },
    ]
  },
  {
    id: '2',
    titulo: 'Configurar monitoramento',
    descricao: 'Setup de alertas para o servidor',
    status: 'em_andamento',
    prioridade: 'media',
    responsavel: 'Jarvis',
    recorrencia: 'unica',
    data_vencimento: '2026-04-08',
    checklist: [
      { id: '1', texto: 'Instalar agente', concluido: true },
      { id: '2', texto: 'Configurar thresholds', concluido: true },
      { id: '3', texto: 'Testar alertas', concluido: false },
    ]
  },
];

const mockResponsaveis = ['Israel', 'Liz', 'Jarvis', 'Pablo', 'Chandler'];

const statusColors: Record<string, string> = {
  pendente: 'bg-slate-100 text-slate-700',
  em_andamento: 'bg-blue-100 text-blue-700',
  concluida: 'bg-green-100 text-green-700',
  bloqueada: 'bg-red-100 text-red-700',
};

const prioridadeColors: Record<string, string> = {
  baixa: 'bg-green-100 text-green-700',
  media: 'bg-yellow-100 text-yellow-700',
  alta: 'bg-orange-100 text-orange-700',
  urgente: 'bg-red-100 text-red-700',
};

export default function Tasks() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [newTask, setNewTask] = useState({
    titulo: '',
    descricao: '',
    responsavel: '',
    recorrencia: 'unica',
    prioridade: 'media',
    data_vencimento: '',
  });

  const filteredTasks = mockTasks.filter(task => {
    const matchesSearch = task.titulo.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus ? task.status === selectedStatus : true;
    return matchesSearch && matchesStatus;
  });

  const handleCreateTask = () => {
    // TODO: Connect to Supabase
    console.log('Creating task:', newTask);
    setIsDialogOpen(false);
    setNewTask({
      titulo: '',
      descricao: '',
      responsavel: '',
      recorrencia: 'unica',
      prioridade: 'media',
      data_vencimento: '',
    });
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Tarefas</h1>
          <p className="text-slate-600 mt-1">
            Gerenciamento de tarefas com recorrência e responsáveis
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus size={18} className="mr-2" />
              Nova Tarefa
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Nova Tarefa</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label>Título</Label>
                <Input
                  value={newTask.titulo}
                  onChange={(e) => setNewTask({ ...newTask, titulo: e.target.value })}
                  placeholder="Nome da tarefa"
                />
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea
                  value={newTask.descricao}
                  onChange={(e) => setNewTask({ ...newTask, descricao: e.target.value })}
                  placeholder="Descrição detalhada"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Responsável</Label>
                  <Select
                    value={newTask.responsavel}
                    onValueChange={(value) => setNewTask({ ...newTask, responsavel: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockResponsaveis.map((resp) => (
                        <SelectItem key={resp} value={resp}>{resp}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Recorrência</Label>
                  <Select
                    value={newTask.recorrencia}
                    onValueChange={(value) => setNewTask({ ...newTask, recorrencia: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unica">Única</SelectItem>
                      <SelectItem value="diaria">Diária</SelectItem>
                      <SelectItem value="semanal">Semanal</SelectItem>
                      <SelectItem value="mensal">Mensal</SelectItem>
                      <SelectItem value="anual">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Prioridade</Label>
                  <Select
                    value={newTask.prioridade}
                    onValueChange={(value) => setNewTask({ ...newTask, prioridade: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baixa">Baixa</SelectItem>
                      <SelectItem value="media">Média</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="urgente">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Data de Vencimento</Label>
                  <Input
                    type="date"
                    value={newTask.data_vencimento}
                    onChange={(e) => setNewTask({ ...newTask, data_vencimento: e.target.value })}
                  />
                </div>
              </div>
              <Button onClick={handleCreateTask} className="w-full">
                Criar Tarefa
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
              <Input
                placeholder="Buscar tarefas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={selectedStatus === null ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedStatus(null)}
              >
                Todas
              </Button>
              <Button
                variant={selectedStatus === 'pendente' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedStatus('pendente')}
              >
                Pendentes
              </Button>
              <Button
                variant={selectedStatus === 'em_andamento' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedStatus('em_andamento')}
              >
                Em Andamento
              </Button>
              <Button
                variant={selectedStatus === 'concluida' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedStatus('concluida')}
              >
                Concluídas
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tasks List */}
      <div className="space-y-4">
        {filteredTasks.map((task) => (
          <Card key={task.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="mt-1">
                    <Checkbox />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-slate-900">{task.titulo}</h3>
                    <p className="text-slate-600 mt-1">{task.descricao}</p>
                    <div className="flex items-center gap-3 mt-3">
                      <Badge className={statusColors[task.status]}>
                        {task.status.replace('_', ' ')}
                      </Badge>
                      <Badge className={prioridadeColors[task.prioridade]}>
                        {task.prioridade}
                      </Badge>
                      <span className="flex items-center gap-1 text-sm text-slate-500">
                        <User size={14} />
                        {task.responsavel}
                      </span>
                      <span className="flex items-center gap-1 text-sm text-slate-500">
                        <Repeat size={14} />
                        {task.recorrencia}
                      </span>
                      <span className="flex items-center gap-1 text-sm text-slate-500">
                        <Calendar size={14} />
                        {new Date(task.data_vencimento).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Checklist */}
              <div className="mt-4 pl-8">
                <Accordion type="single" collapsible>
                  <AccordionItem value="checklist">
                    <AccordionTrigger className="text-sm">
                      Checklist ({task.checklist.filter(c => c.concluido).length}/{task.checklist.length})
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 pt-2">
                        {task.checklist.map((item) => (
                          <div key={item.id} className="flex items-center gap-2">
                            <Checkbox checked={item.concluido} />
                            <span className={item.concluido ? 'line-through text-slate-400' : ''}>
                              {item.texto}
                            </span>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredTasks.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          <CheckSquare size={48} className="mx-auto mb-4 text-slate-300" />
          <p>Nenhuma tarefa encontrada</p>
        </div>
      )}
    </div>
  );
}
