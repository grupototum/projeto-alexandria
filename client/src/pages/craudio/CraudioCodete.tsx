import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Send,
  Bot,
  User,
  Cpu,
  Sparkles,
  Trash2,
  Copy,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Terminal,
  Settings
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  tokens?: number;
}

const OLLAMA_URL = 'http://localhost:11434/api/generate';
const DEFAULT_MODEL = 'qwen3-coder';

export default function CraudioCodete() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'system',
      content: '👋 Olá! Sou o Cráudio Codete, seu assistente de código local. Estou rodando via Ollama com o modelo qwen3-coder. Como posso ajudar?',
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [ollamaStatus, setOllamaStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Check Ollama status
  useEffect(() => {
    checkOllamaStatus();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const checkOllamaStatus = async () => {
    try {
      const response = await fetch('http://localhost:11434/api/tags', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      setOllamaStatus(response.ok ? 'online' : 'offline');
    } catch {
      setOllamaStatus('offline');
    }
  };

  const generateId = () => Math.random().toString(36).substring(2, 9);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(OLLAMA_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: DEFAULT_MODEL,
          prompt: input,
          stream: false,
          options: {
            temperature: 0.7,
            num_ctx: 4096,
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: data.response || 'Sem resposta',
        timestamp: new Date(),
        tokens: data.eval_count,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: generateId(),
        role: 'system',
        content: `❌ Erro: ${error instanceof Error ? error.message : 'Falha na conexão com Ollama'}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSend();
    }
  };

  const copyToClipboard = async (content: string, id: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const clearChat = () => {
    setMessages([
      {
        id: generateId(),
        role: 'system',
        content: '👋 Chat limpo! Como posso ajudar?',
        timestamp: new Date(),
      }
    ]);
  };

  return (
    <div className="p-8 space-y-6 h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
            <Bot className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Cráudio Codete</h1>
            <p className="text-slate-600">
              IA Local via Ollama • Modelo: {DEFAULT_MODEL}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              ollamaStatus === 'online' ? 'bg-green-500 animate-pulse' :
              ollamaStatus === 'offline' ? 'bg-red-500' : 'bg-yellow-500'
            }`} />
            <span className="text-sm text-slate-600">
              Ollama {ollamaStatus === 'online' ? 'Online' : 
                      ollamaStatus === 'offline' ? 'Offline' : 'Verificando...'}
            </span>
          </div>

          <Button variant="outline" size="sm" onClick={checkOllamaStatus}>
            <Cpu size={16} className="mr-2" />
            Verificar
          </Button>

          <Button variant="outline" size="sm" onClick={clearChat}>
            <Trash2 size={16} className="mr-2" />
            Limpar
          </Button>
        </div>
      </div>

      {/* Status Alert */}
      {ollamaStatus === 'offline' && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="text-red-600" size={20} />
            <div>
              <p className="font-medium text-red-900">Ollama não está rodando</p>
              <p className="text-sm text-red-700">
                Execute <code className="bg-red-100 px-1 rounded">ollama serve</code> no terminal
                e certifique-se de que o modelo <code className="bg-red-100 px-1 rounded">{DEFAULT_MODEL}</code> está instalado.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100%-8rem)]">
        {/* Main Chat Area */}
        <Card className="lg:col-span-3 flex flex-col">
          <CardContent className="flex-1 flex flex-col p-0">
            {/* Messages */}
            <ScrollArea className="flex-1 p-6" ref={scrollRef}>
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-4 ${
                      message.role === 'user' ? 'flex-row-reverse' : ''
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.role === 'user' 
                        ? 'bg-blue-100' 
                        : message.role === 'assistant'
                        ? 'bg-purple-100'
                        : 'bg-slate-100'
                    }`}>
                      {message.role === 'user' ? (
                        <User size={20} className="text-blue-600" />
                      ) : message.role === 'assistant' ? (
                        <Sparkles size={20} className="text-purple-600" />
                      ) : (
                        <Terminal size={20} className="text-slate-600" />
                      )}
                    </div>

                    <div className={`flex-1 max-w-[80%] ${
                      message.role === 'user' ? 'text-right' : ''
                    }`}>
                      <div className={`inline-block p-4 rounded-2xl text-left ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : message.role === 'assistant'
                          ? 'bg-slate-100 text-slate-900'
                          : 'bg-yellow-50 text-slate-900 border border-yellow-200'
                      }`}>
                        <pre className="whitespace-pre-wrap font-sans text-sm">
                          {message.content}
                        </pre>
                      </div>

                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                        <span>
                          {message.timestamp.toLocaleTimeString('pt-BR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                        {message.tokens && (
                          <span>{message.tokens} tokens</span>
                        )}
                        {message.role === 'assistant' && (
                          <button
                            onClick={() => copyToClipboard(message.content, message.id)}
                            className="hover:text-slate-700"
                          >
                            {copiedId === message.id ? (
                              <CheckCircle2 size={14} className="text-green-500" />
                            ) : (
                              <Copy size={14} />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                      <Sparkles size={20} className="text-purple-600" />
                    </div>
                    <div className="flex items-center gap-2 p-4 bg-slate-100 rounded-2xl">
                      <Loader2 className="animate-spin" size={18} />
                      <span className="text-slate-600">Pensando...</span>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Textarea
                  placeholder="Digite sua mensagem... (Ctrl+Enter para enviar)"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 min-h-[80px] resize-none"
                  disabled={ollamaStatus !== 'online'}
                />
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading || ollamaStatus !== 'online'}
                  className="px-6"
                >
                  {isLoading ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <Send size={20} />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Settings size={16} />
                Configurações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-slate-500">Modelo</label>
                <Badge variant="secondary" className="mt-1">
                  {DEFAULT_MODEL}
                </Badge>
              </div>

              <div>
                <label className="text-sm text-slate-500">Endpoint</label>
                <code className="block mt-1 text-xs bg-slate-100 p-2 rounded">
                  {OLLAMA_URL}
                </code>
              </div>

              <div>
                <label className="text-sm text-slate-500">Temperatura</label>
                <p className="text-sm font-medium">0.7</p>
              </div>

              <div>
                <label className="text-sm text-slate-500">Contexto</label>
                <p className="text-sm font-medium">4096 tokens</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dicas</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>• Use Ctrl+Enter para enviar</li>
                <li>• Código é formatado automaticamente</li>
                <li>• Clique no ícone de copiar para copiar respostas</li>
                <li>• O modelo roda localmente, sem custos</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <p className="text-sm text-blue-800">
                💡 Para instalar o modelo qwen3-coder, execute:
              </p>
              <code className="block mt-2 text-xs bg-blue-100 p-2 rounded text-blue-900">
                ollama pull qwen3-coder
              </code>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
