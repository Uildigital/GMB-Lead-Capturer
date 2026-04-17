---
name: gerenciando-n8n
description: Gerencia fluxos de trabalho e nós do n8n utilizando o n8n-mcp. Use quando o usuário mencionar automação, criação de workflows no n8n ou integração de ferramentas via n8n.
---
# Gerenciando n8n com MCP

## Quando usar esta skill:
- Criação de novos workflows no n8n.
- Consulta de documentação de nós específicos.
- Validação de configurações de nós para evitar falhas em tempo de execução.
- Busca de templates prontos no n8n.io.

## Fluxo de Trabalho (Workflow):
1.  [ ] **Descoberta de Contexto**: Identificar se o objetivo pode ser resolvido com um template existente (`search_templates`).
2.  [ ] **Seleção de Nós**: Encontrar os nós necessários (`search_nodes`) e obter suas configurações detalhadas (`get_node`).
3.  [ ] **Validação Progressiva**: Validar cada nó individualmente (`validate_node`) antes de montar o workflow.
4.  [ ] **Montagem do JSON**: Construir o JSON do workflow seguindo a estrutura do n8n.
5.  [ ] **Validação Final**: Validar a integridade das conexões e expressões (`validate_workflow`).

## Instruções:
- **Silêncio de Execução**: Não comente durante a chamada de ferramentas. Responda apenas após completar o plano.
- **Paralelismo**: Execute buscas e validações de múltiplos nós simultaneamente para ganhar tempo.
- **Configuração Explícita**: NUNCA confie em valores padrão. Configure todos os parâmetros críticos (ex: `resource`, `operation`, `channelId`).
- **Atribuição**: Se usar um template, cite o autor e o link original.

## Recursos:
- [Guia de Configuração MCP](../../../mcp_config.json)
- [Diretrizes de Agente Expert](../../AGENTS.md)
