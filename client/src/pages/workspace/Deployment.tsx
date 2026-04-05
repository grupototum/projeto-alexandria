import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Rocket,
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Save
} from 'lucide-react';

// Mock data for deployment checklist
const mockDeployment = {
  id: '1',
  cliente: 'Totum Digital',
  projeto: 'Implantação Alexandria',
  status: 'em_andamento',
  data_inicio: '2026-04-01',
  data_prevista: '2026-04-15',
  checklist: [
    {
      id: '1',
      categoria: 'Infraestrutura',
      items: [
        { id: '1-1', texto: 'Configurar VPS na Alibaba Cloud', concluido: true, responsavel: 'Jarvis' },
        { id: '1-2', texto: 'Instalar CyberPanel', concluido: true, responsavel: 'Jarvis' },
        { id: '1-3', texto: 'Configurar SSL', concluido: true, responsavel: 'Jarvis' },
        { id: '1-4', texto: 'Setup de backups automáticos', concluido: false, responsavel: 'Jarvis' },
      ]
    },
    {
      id: '2',
      categoria: 'Supabase',
      items: [
        { id: '2-1', texto: 'Criar projeto', concluido: true, responsavel: 'Israel' },
        { id: '2-2', texto: 'Configurar tabelas', concluido: true, responsavel: 'Israel' },
        { id: '2-3', texto: 'Setup RLS policies', concluido: true, responsavel: 'Israel' },
        { id: '2-4', texto: 'Configurar embeddings', concluido: true, responsavel: 'Israel' },
      ]
    },
    {
      id: '3',
      categoria: 'Alexandria',
      items: [
        { id: '3-1', texto: 'Deploy do frontend', concluido: true, responsavel: 'Jarvis' },
        { id: '3-2', texto: 'Configurar API', concluido: true, responsavel: 'Jarvis' },
        { id: '3-3', texto: 'Ingestão de POPs', concluido: true, responsavel: 'Israel' },
        { id: '3-4', texto: 'Testes de busca semântica', concluido: false, responsavel: 'Israel' },
      ]
    },
    {
      id: '4',
      categoria: 'Integrações',
      items: [
        { id: '4-1', texto: 'Configurar Feishu', concluido: false, responsavel: 'Liz' },
        { id: '4-2', texto: 'Configurar WeCom', concluido: false, responsavel: 'Liz' },
        { id: '4-3', texto: 'Testar webhooks', concluido: false, responsavel: 'Jarvis' },
      ]
    },
  ]
};

export default function Deployment() {
  const [deployment, setDeployment] = useState(mockDeployment);
  const [newItemText, setNewItemText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('1');
  const [noteText, setNoteText] = useState('');

  const toggleItem = (categoryId: string, itemId: string) => {
    setDeployment(prev => ({
      ...prev,
      checklist: prev.checklist.map(cat => {
        if (cat.id !== categoryId) return cat;
        return {
          ...cat,
          items: cat.items.map(item => {
            if (item.id !== itemId) return item;
            return { ...item, concluido: !item.concluido };
          })
        };
      })
    }));
  };

  const addItem = () => {
    if (!newItemText.trim()) return;
    
    setDeployment(prev => ({
      ...prev,
      checklist: prev.checklist.map(cat => {
        if (cat.id !== selectedCategory) return cat;
        return {
          ...cat,
          items: [
            ...cat.items,
            {
              id: `${cat.id}-${cat.items.length + 1}`,
              texto: newItemText,
              concluido: false,
              responsavel: 'Não atribuído'
            }
          ]
        };
      })
    }));
    setNewItemText('');
  };

  const totalItems = deployment.checklist.reduce((acc, cat) => acc + cat.items.length, 0);
  const completedItems = deployment.checklist.reduce(
    (acc, cat) => acc + cat.items.filter(item => item.concluido).length,
    0
  );
  const progress = Math.round((completedItems / totalItems) * 100);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'concluido':
        return <Badge className="bg-green-100 text-green-700">Concluído</Badge>;
      case 'em_andamento':
        return <Badge className="bg-blue-100 text-blue-700">Em Andamento</Badge>;
      case 'pendente':
        return <Badge className="bg-slate-100 text-slate-700">Pendente</Badge>;
      case 'atrasado':
        return <Badge className="bg-red-100 text-red-700">Atrasado</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Implantação</h1>
          <p className="text-slate-600 mt-1">
            Checklist de implantação - {deployment.projeto}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {getStatusBadge(deployment.status)}
          <Button variant="outline">
            <Save size={18} className="mr-2" />
            Salvar
          </Button>
        </div>
      </div>

      {/* Project Info Card */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-slate-500">Cliente</p>
              <p className="font-semibold text-lg">{deployment.cliente}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Data de Início</p>
              <p className="font-semibold text-lg">
                {new Date(deployment.data_inicio).toLocaleDateString('pt-BR')}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Data Prevista</p>
              <p className="font-semibold text-lg">
                {new Date(deployment.data_prevista).toLocaleDateString('pt-BR')}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Progresso</p>
              <div className="flex items-center gap-2">
                <Progress value={progress} className="w-24" />
                <span className="font-semibold">{progress}%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add New Item */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Adicionar Item</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <select
              className="border rounded-md px-3 py-2"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {deployment.checklist.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.categoria}</option>
              ))}
            </select>
            <Input
              placeholder="Novo item do checklist..."
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addItem()}
              className="flex-1"
            />
            <Button onClick={addItem}>
              <Plus size={18} className="mr-2" />
              Adicionar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Checklist Accordion */}
      <div className="space-y-4">
        {deployment.checklist.map((category) => {
          const completedCount = category.items.filter(item => item.concluido).length;
          const totalCount = category.items.length;
          const categoryProgress = Math.round((completedCount / totalCount) * 100);

          return (
            <Card key={category.id}>
              <Accordion type="single" collapsible defaultValue={category.id}>
                <AccordionItem value={category.id} className="border-0">
                  <AccordionTrigger className="px-6 py-4 hover:no-underline">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <Rocket className="text-purple-600" size={20} />
                      </div>
                      <div className="flex-1 text-left">
                        <h3 className="font-semibold text-lg">{category.categoria}</h3>
                        <p className="text-sm text-slate-500">
                          {completedCount} de {totalCount} itens concluídos
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <Progress value={categoryProgress} className="w-24" />
                        <span className="text-sm font-medium w-12">{categoryProgress}%</span>
                      </div>
                    </div>
                  </AccordionTrigger>
                  
                  <AccordionContent className="px-6 pb-6">
                    <div className="space-y-2">
                      {category.items.map((item) => (
                        <div
                          key={item.id}
                          className={`flex items-center gap-4 p-3 rounded-lg border transition-colors ${
                            item.concluido ? 'bg-green-50 border-green-200' : 'bg-white border-slate-200'
                          }`}
                        >
                          <Checkbox
                            checked={item.concluido}
                            onCheckedChange={() => toggleItem(category.id, item.id)}
                          />
                          
                          <div className="flex-1">
                            <span className={item.concluido ? 'line-through text-slate-400' : ''}>
                              {item.texto}
                            </span>
                          </div>
                          
                          <Badge variant="outline" size="sm">{item.responsavel}</Badge>
                          
                          {item.concluido ? (
                            <CheckCircle2 size={18} className="text-green-500" />
                          ) : (
                            <Circle size={18} className="text-slate-300" />
                          )}
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </Card>
          );
        })}
      </div>

      {/* Notes Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle size={20} />
            Anotações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Adicione anotações sobre a implantação..."
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            rows={4}
          />
        </CardContent>
      </Card>
    </div>
  );
}
