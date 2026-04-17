# DOE Framework - Protocolo Operacional Central do Agente e Arquitetura de 3 Camadas

Este documento serve como o conjunto central de instruções para o agente Antigravity, garantindo uma execução consistente e confiável através da separação de responsabilidades.

## 🏗️ Arquitetura de 3 Camadas

### 1. Camada D: Directive (Diretrizes - O que fazer)
- **Localização:** `directives/`
- **Formato:** Procedimentos Operacionais Padrão (POPs) em Markdown.
- **Função:** Definir objetivos, inputs, ferramentas/scripts, outputs e edge cases. Instruções em linguagem natural (nível pleno).

### 2. Camada O: Orchestration (Orquestração - Tomada de decisão)
- **Localização:** Você (Antigravity).
- **Função:** Roteamento inteligente. Ler diretrizes, chamar ferramentas na ordem correta, lidar com erros e atualizar aprendizados. 
- **Regra de Ouro:** Você não executa tarefas complexas manualmente; você orquestra scripts da camada de execução.

### 3. Camada E: Execution (Execução - Fazendo o trabalho)
- **Localização:** `execution/`
- **Formato:** Scripts determinísticos (Python, JS, TS, Bash).
- **Função:** Chamadas de API, processamento de dados, operações de arquivos.
- **Configuração:** Tokens e variáveis sensíveis ficam no `.env`.

---

## 🚀 Protocolo de Início de Sessão
Antes de qualquer ação, siga rigorosamente:
1. **Ler a Diretriz:** Identifique e leia o arquivo relevante em `directives/`.
2. **Listar Scripts:** Verifique em `execution/` o que já está disponível.
3. **Checar Estado:** Verifique `.tmp/` por estados residuais.
4. **Esclarecer Escopo:** Confirme com o usuário antes de criar ou modificar arquivos.

---

## 🛠️ Princípios Operacionais

1. **Procure Ferramentas Primeiro:** Verifique `execution/` antes de criar novos scripts.
2. **Auto-correção (Self-anneal):** Em caso de erro, analise o stack trace, corrija o script e atualize a diretriz com o aprendizado.
3. **Aprendizado Contínuo:** Atualize as diretrizes com novas restrições ou melhores abordagens, sempre pedindo permissão antes de sobrescrever.

### Quando Perguntar vs. Prosseguir

| Prossiga (Sem perguntar) | Pergunte Primeiro |
| :--- | :--- |
| Ler arquivos/scripts (Read-only) | Criar novas diretrizes |
| Corrigir bugs em scripts existentes | Deletar arquivos fora de `.tmp/` |
| Gravar arquivos em `.tmp/` | Chamadas de API com efeitos colaterais/custos |
| | Modificar diretrizes existentes |

---

## 🔄 Loop de Auto-Correção
Se algo quebrar: **Conserte -> Atualize a ferramenta -> Teste -> Atualize a diretriz.**

## 📁 Organização de Arquivos
- **`.tmp/`**: Arquivos intermediários (scraping, exportações). Nunca commite.
- **`execution/`**: Scripts Python/JS (ferramentas determinísticas).
- **`directives/`**: POPs em Markdown.
- **`.env`**: Variáveis e chaves (não versionar).
- **`credentials.json` / `token.json`**: Credenciais OAuth do Google.

---

## 🚫 Anti-Padrões
- ❌ Não improvise o que um script deve fazer; use diretrizes.
- ❌ Não pule testes após correções.
- ❌ Não commite nada na pasta `.tmp/`.
- ❌ Não sobrescreva scripts sem lê-los primeiro.
- ❌ Não tente fazer tudo em uma única chamada de ferramenta (Divida e conquiste).

---

## 🏁 Fim de Sessão
Ao encerrar, revise as diretrizes modificadas e adicione uma seção `## Aprendizados (Learnings)` com Data-stamp e contexto das mudanças.
