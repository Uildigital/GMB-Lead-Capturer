# 🦾 DOE Framework - Agente Antigravity

Este repositório é um **Workflow Global** projetado para maximizar a confiabilidade do agente Antigravity através de uma arquitetura de 3 camadas.

## 📂 Estrutura do Projeto
- `directives/`: Contém os arquivos Markdown (POPs) que guiam o agente.
- `execution/`: Scripts Python/JS que realizam o trabalho pesado de forma determinística.
- `.tmp/`: Pasta para processamento de arquivos intermediários.
- `.env`: Configurações e chaves de API (não versionado).

## 🚀 Como usar em novos projetos
1. Copie as pastas `directives/` e `execution/` para seu novo projeto.
2. Certifique-se de que a `MASTER_DIRECTIVE.md` esteja presente.
3. Ao iniciar uma tarefa, aponte o agente para a diretriz correspondente.

## 📜 Diretriz Principal
Veja [MASTER_DIRECTIVE.md](directives/MASTER_DIRECTIVE.md) para o protocolo detalhado.
