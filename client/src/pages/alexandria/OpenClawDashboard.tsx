import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc';
import {
  BarChart3,
  Activity,
  Server,
  Cpu,
  HardDrive,
  Wifi,
  CheckCircle,
  AlertCircle,
  XCircle,
  RefreshCw,
  Terminal,
  Settings,
  Shield
} from 'lucide-react';

// Mock data for OpenClaw dashboard
const mockSkills = [
  { name: 'feishu-calendar', status: 'active', version: '1.2.0' },
  { name: 'feishu-bitable', status: 'active', version: '1.0.5' },
  { name: 'feishu-task', status: 'active', version: '0.9.2' },
  { name: 'wecom-schedule', status: 'inactive', version: '1.1.0' },
  { name: 'wecom-todo', status: 'active', version: '1.0.0' },
  { name: 'healthcheck', status: 'active', version: '2.0.1' },
];

const mockLogs = [
  { time: '10:42:15', level: 'info', message: 'Gateway iniciado com sucesso' },
  { time: '10:42:18', level: 'info', message: 'Conectado ao Supabase' },
  { time: '10:45:32', level: 'warn', message: 'Rate limit approaching for Gemini API' },
  { time: '10:52:01', level: 'info', message: 'Ingestão completa: POP-001' },
  { time: '11:15:45', level: 'error', message: 'Falha na conexão com wecom-mcp' },
];

export default function OpenClawDashboard() {
  const [refreshing, setRefreshing] = useState(false);
  const healthCheck = trpc.alexandria.healthCheck.useQuery();

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const activeSkills = mockSkills.filter(s => s.status === 'active').length;
  const totalSkills = mockSkills.length;

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Dashboard OpenClaw</h1>
          <p className="text-slate-600 mt-1">
            Monitoramento do gateway e skills instaladas
          </p>
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw size={18} className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Server className="text-green-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-green-600 font-medium">Gateway</p>
                <p className="text-xl font-bold text-green-900">Online</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Activity className="text-blue-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-blue-600 font-medium">Skills Ativas</p>
                <p className="text-xl font-bold text-blue-900">{activeSkills}/{totalSkills}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Cpu className="text-purple-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-purple-600 font-medium">CPU Usage</p>
                <p className="text-xl font-bold text-purple-900">23%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <HardDrive className="text-orange-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-orange-600 font-medium">Memória</p>
                <p className="text-xl font-bold text-orange-900">4.2GB</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Skills Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Installed Skills */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Settings size={20} />
              Skills Instaladas
            </CardTitle>
            <Badge variant="outline">{activeSkills} ativas</Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {mockSkills.map((skill) => (
                <div
                  key={skill.name}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50"
                >
                  <div className="flex items-center gap-3">
                    {skill.status === 'active' ? (
                      <CheckCircle size={18} className="text-green-500" />
                    ) : skill.status === 'error' ? (
                      <XCircle size={18} className="text-red-500" />
                    ) : (
                      <AlertCircle size={18} className="text-yellow-500" />
                    )}
                    <span className="font-medium">{skill.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" size="sm">v{skill.version}</Badge>
                    <Badge
                      className={
                        skill.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-slate-100 text-slate-700'
                      }
                    >
                      {skill.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Logs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Terminal size={20} />
              Logs em Tempo Real
            </CardTitle>
            <Button variant="ghost" size="sm">Ver todos</Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 font-mono text-sm">
              {mockLogs.map((log, index) => (
                <div key={index} className="flex gap-3 p-2 rounded hover:bg-slate-50">
                  <span className="text-slate-400">{log.time}</span>
                  <Badge
                    size="sm"
                    className={
                      log.level === 'error'
                        ? 'bg-red-100 text-red-700'
                        : log.level === 'warn'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-blue-100 text-blue-700'
                    }
                  >
                    {log.level}
                  </Badge>
                  <span className="text-slate-700">{log.message}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi size={20} />
            Status de Conexões
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-4 border rounded-lg">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="text-green-600" size={20} />
              </div>
              <div>
                <p className="font-medium">Supabase</p>
                <p className="text-sm text-slate-500">Conectado</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 border rounded-lg">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="text-green-600" size={20} />
              </div>
              <div>
                <p className="font-medium">Google Gemini</p>
                <p className="text-sm text-slate-500">Disponível</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 border rounded-lg">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Shield className="text-green-600" size={20} />
              </div>
              <div>
                <p className="font-medium">Gateway</p>
                <p className="text-sm text-slate-500">Protegido</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
