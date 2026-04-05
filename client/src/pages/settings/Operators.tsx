import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  Mail,
  Shield,
  User,
  CheckCircle2,
  XCircle,
  Loader2
} from 'lucide-react';

interface Operador {
  id: string;
  nome: string;
  email: string;
  cargo: string;
  departamento: string;
  role: 'admin' | 'operador' | 'viewer';
  status: 'ativo' | 'inativo';
  data_criacao: string;
  ultimo_acesso?: string;
}

// Mock data - replace with Supabase connection
const mockOperadores: Operador[] = [
  {
    id: '1',
    nome: 'Israel',
    email: 'israel@grupototum.com',
    cargo: 'CEO',
    departamento: 'Diretoria',
    role: 'admin',
    status: 'ativo',
    data_criacao: '2025-01-15',
    ultimo_acesso: '2026-04-06',
  },
  {
    id: '2',
    nome: 'Liz',
    email: 'liz@grupototum.com',
    cargo: 'COO',
    departamento: 'Operações',
    role: 'admin',
    status: 'ativo',
    data_criacao: '2025-01-15',
    ultimo_acesso: '2026-04-05',
  },
  {
    id: '3',
    nome: 'Jarvis',
    email: 'jarvis@grupototum.com',
    cargo: 'Tech Lead',
    departamento: 'Tecnologia',
    role: 'admin',
    status: 'ativo',
    data_criacao: '2025-01-20',
    ultimo_acesso: '2026-04-06',
  },
];

const departamentos = ['Diretoria', 'Operações', 'Tecnologia', 'Marketing', 'Vendas', 'Suporte'];

const roleColors: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-700',
  operador: 'bg-blue-100 text-blue-700',
  viewer: 'bg-slate-100 text-slate-700',
};

const statusColors: Record<string, string> = {
  ativo: 'bg-green-100 text-green-700',
  inativo: 'bg-red-100 text-red-700',
};

export default function OperatorsSettings() {
  const [operadores, setOperadores] = useState<Operador[]>(mockOperadores);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOperador, setEditingOperador] = useState<Operador | null>(null);

  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    cargo: '',
    departamento: '',
    role: 'operador' as const,
    status: 'ativo' as const,
  });

  const filteredOperadores = operadores.filter(op =>
    op.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
    op.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    op.cargo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = () => {
    const novoOperador: Operador = {
      id: Math.random().toString(36).substring(2, 9),
      ...formData,
      data_criacao: new Date().toISOString().split('T')[0],
    };

    setOperadores([...operadores, novoOperador]);
    setIsDialogOpen(false);
    resetForm();
  };

  const handleUpdate = () => {
    if (!editingOperador) return;

    setOperadores(operadores.map(op =>
      op.id === editingOperador.id ? { ...op, ...formData } : op
    ));
    setIsDialogOpen(false);
    setEditingOperador(null);
    resetForm();
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este operador?')) {
      setOperadores(operadores.filter(op => op.id !== id));
    }
  };

  const openEditDialog = (operador: Operador) => {
    setEditingOperador(operador);
    setFormData({
      nome: operador.nome,
      email: operador.email,
      cargo: operador.cargo,
      departamento: operador.departamento,
      role: operador.role,
      status: operador.status,
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingOperador(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      email: '',
      cargo: '',
      departamento: '',
      role: 'operador',
      status: 'ativo',
    });
  };

  const ativosCount = operadores.filter(op => op.status === 'ativo').length;
  const adminsCount = operadores.filter(op => op.role === 'admin').length;

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Operadores</h1>
          <p className="text-slate-600 mt-1">
            Gerenciamento de usuários e permissões
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus size={18} className="mr-2" />
          Novo Operador
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total</p>
                <p className="text-2xl font-bold">{operadores.length}</p>
              </div>
              <Users className="text-slate-400" size={24} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Ativos</p>
                <p className="text-2xl font-bold text-green-600">{ativosCount}</p>
              </div>
              <CheckCircle2 className="text-green-400" size={24} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Admins</p>
                <p className="text-2xl font-bold text-purple-600">{adminsCount}</p>
              </div>
              <Shield className="text-purple-400" size={24} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Inativos</p>
                <p className="text-2xl font-bold text-red-600">
                  {operadores.length - ativosCount}
                </p>
              </div>
              <XCircle className="text-red-400" size={24} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
            <Input
              placeholder="Buscar operadores..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Operador</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Departamento</TableHead>
                <TableHead>Permissão</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOperadores.map((operador) => (
                <TableRow key={operador.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                        <User size={18} className="text-slate-600" />
                      </div>
                      <div>
                        <p className="font-medium">{operador.nome}</p>
                        <p className="text-sm text-slate-500">{operador.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{operador.cargo}</TableCell>
                  <TableCell>{operador.departamento}</TableCell>
                  <TableCell>
                    <Badge className={roleColors[operador.role]}>
                      {operador.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[operador.status]}>
                      {operador.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(operador)}
                      >
                        <Edit size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600"
                        onClick={() => handleDelete(operador.id)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingOperador ? 'Editar Operador' : 'Novo Operador'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            <div>
              <Label>Nome</Label>
              <Input
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Nome completo"
              />
            </div>

            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@grupototum.com"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Cargo</Label>
                <Input
                  value={formData.cargo}
                  onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                  placeholder="Cargo"
                />
              </div>

              <div>
                <Label>Departamento</Label>
                <Select
                  value={formData.departamento}
                  onValueChange={(value) => setFormData({ ...formData, departamento: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {departamentos.map((dept) => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Permissão</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: 'admin' | 'operador' | 'viewer') =>
                    setFormData({ ...formData, role: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="operador">Operador</SelectItem>
                    <SelectItem value="viewer">Visualizador</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: 'ativo' | 'inativo') =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              onClick={editingOperador ? handleUpdate : handleCreate}
              className="w-full"
              disabled={!formData.nome || !formData.email}
            >
              {editingOperador ? 'Salvar Alterações' : 'Criar Operador'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
