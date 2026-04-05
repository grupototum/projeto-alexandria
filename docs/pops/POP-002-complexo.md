# POP-002: Integração CRM

## Visão Geral
Configurar integração entre sistema e CRM.

## Configuração Técnica

### API Keys
Obter chaves em https://api.totum.com

### Webhooks
Configurar endpoint: https://webhook.totum.com/crm

### Mapeamento de Campos
| Campo Totum | Campo CRM |
|-------------|-----------|
| nome        | name      |
| email       | email     |

## Troubleshooting

### Erro 404
Verificar URL do endpoint.

### Erro 500
Verificar API Key.

## Código de Exemplo
```javascript
const response = await fetch('/api/crm', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer TOKEN' }
});
```

## Valores
- Setup: R$ 1.500,00
- Mensalidade: R$ 299,90
