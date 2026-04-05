import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Building2,
  Search,
  Plus,
  Mail,
  Phone,
  MapPin,
  Users,
  TrendingUp,
  Calendar,
  ChevronRight,
  Edit,
  Trash2
} from 'lucide-react';

// Apenas Totum Digital - como solicitado
const initialClient = {
  id: '1',
  nome: 'Totum Digital',
  email: 'contato@grupototum.com',
  telefone: '+55 31 99999-9999',
  endereco: 'Governador Valadares, MG',
  segmento: 'Tecnologia',
  status: 'ativo',
  data_cadastro: '2025-01-15',
  responsavel: 'Israel',
  projetos_ativos: 3,
  mrr: 25000,
  logo: null,
  contatos: [
    { nome: 'Israel', cargo: 'CEO', email: 'israel@grupototum.com' },
    { nome: 'Liz', cargo: 'COO', email: 'liz@grupototum.com' },
    { nome: 'Jarvis', cargo: 'Tech Lead', email: 'jarvis@grupototum.com' },
  ]
};

const statusColors: Record<string, string> = {
  ativo: 'bg-green-100 text-green-700',
  inativo: 'bg-slate-100 text-slate-700',
  prospecto: 'bg-blue-100 text-blue-700',
  cancelado: 'bg-red-100 text-red-700',
};

export default function Clients() {
  const [client, setClient] = useState(initialClient);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(client);

  const handleSave = () => {
    setClient(editData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData(client);
    setIsEditing(false);
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Clientes</h1>
          <p className="text-slate-600 mt-1">
            Gestão de clientes Totum
          </p>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={handleCancel}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>
                Salvar
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>
              <Edit size={18} className="mr-2" />
              Editar
            </Button>
          )}
        </div>
      </div>

      {/* Client Card */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 text-white p-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-6">
              <Avatar className="w-24 h-24 border-4 border-white/20">
                <AvatarFallback className="text-3xl bg-white/20 text-white">
                  {client.nome.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              
              <div>
                {isEditing ? (
                  <Input
                    value={editData.nome}
                    onChange={(e) => setEditData({ ...editData, nome: e.target.value })}
                    className="text-2xl font-bold bg-white/10 border-white/20 text-white mb-2"
                  />
                ) : (
                  <h2 className="text-3xl font-bold">{client.nome}</h2>
                )}
                <div className="flex items-center gap-3 mt-2">
                  <Badge className="bg-white/20 text-white">
                    {client.segmento}
                  </Badge>
                  <Badge className={statusColors[client.status]}>
                    {client.status}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-sm text-slate-300">MRR</p>
              <p className="text-3xl font-bold">
                R$ {client.mrr.toLocaleString('pt-BR')}
              </p>
            </div>
          </div>
        </div>

        <CardContent className="p-8">
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="info">Informações</TabsTrigger>
              <TabsTrigger value="contatos">Contatos</TabsTrigger>
              <TabsTrigger value="metricas">Métricas</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm text-slate-500 flex items-center gap-2">
                    <Mail size={16} /> Email
                  </label>
                  {isEditing ? (
                    <Input
                      value={editData.email}
                      onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                      className="mt-1"
                    />
                  ) : (
                    <p className="font-medium mt-1">{client.email}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm text-slate-500 flex items-center gap-2">
                    <Phone size={16} /> Telefone
                  </label>
                  {isEditing ? (
                    <Input
                      value={editData.telefone}
                      onChange={(e) => setEditData({ ...editData, telefone: e.target.value })}
                      className="mt-1"
                    />
                  ) : (
                    <p className="font-medium mt-1">{client.telefone}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm text-slate-500 flex items-center gap-2">
                    <MapPin size={16} /> Endereço
                  </label>
                  {isEditing ? (
                    <Input
                      value={editData.endereco}
                      onChange={(e) => setEditData({ ...editData, endereco: e.target.value })}
                      className="mt-1"
                    />
                  ) : (
                    <p className="font-medium mt-1">{client.endereco}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm text-slate-500 flex items-center gap-2">
                    <Users size={16} /> Responsável Interno
                  </label>
                  {isEditing ? (
                    <Input
                      value={editData.responsavel}
                      onChange={(e) => setEditData({ ...editData, responsavel: e.target.value })}
                      className="mt-1"
                    />
                  ) : (
                    <p className="font-medium mt-1">{client.responsavel}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm text-slate-500 flex items-center gap-2">
                    <Calendar size={16} /> Data de Cadastro
                  </label>
                  <p className="font-medium mt-1">
                    {new Date(client.data_cadastro).toLocaleDateString('pt-BR')}
                  </p>
                </div>

                <div>
                  <label className="text-sm text-slate-500 flex items-center gap-2">
                    <TrendingUp size={16} /> Segmento
                  </label>
                  {isEditing ? (
                    <Input
                      value={editData.segmento}
                      onChange={(e) => setEditData({ ...editData, segmento: e.target.value })}
                      className="mt-1"
                    />
                  ) : (
                    <p className="font-medium mt-1">{client.segmento}</p>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="contatos">
              <div className="space-y-4">
                {client.contatos.map((contato, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Avatar>
                            <AvatarFallback>
                              {contato.nome.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{contato.nome}</p>
                            <p className="text-sm text-slate-500">{contato.cargo}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm">
                            <Mail size={16} className="mr-2" />
                            {contato.email}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                <Button variant="outline" className="w-full">
                  <Plus size={18} className="mr-2" />
                  Adicionar Contato
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="metricas">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-6">
                    <div className="text-center">
                      <p className="text-sm text-blue-600 font-medium">Projetos Ativos</p>
                      <p className="text-4xl font-bold text-blue-900 mt-2">
                        {client.projetos_ativos}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-6">
                    <div className="text-center">
                      <p className="text-sm text-green-600 font-medium">MRR</p>
                      <p className="text-4xl font-bold text-green-900 mt-2">
                        R$ {client.mrr.toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-purple-50 border-purple-200">
                  <CardContent className="p-6">
                    <div className="text-center">
                      <p className="text-sm text-purple-600 font-medium">Ticket Médio</p>
                      <p className="text-4xl font-bold text-purple-900 mt-2">
                        R$ {(client.mrr / client.projetos_ativos).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
