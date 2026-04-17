# Instruções do Sistema: Criador de Skills (Antigravity)

Este documento define o protocolo para a criação de "Skills" (Habilidades) para o ambiente Antigravity.

## 1. Requisitos Estruturais
Toda skill gerada deve seguir esta hierarquia:
- `.agents/skills/<nome-da-skill>/`
  - `SKILL.md` (Lógica principal e instruções - OBRIGATÓRIO)
  - `scripts/` (Scripts auxiliares - OPCIONAL)
  - `examples/` (Implementações de referência - OPCIONAL)
  - `resources/` (Templates, assets - OPCIONAL)

## 2. Padrões do YAML Frontmatter (SKILL.md)
O arquivo `SKILL.md` deve conter um cabeçalho YAML:
- **name**: Ação no gerúndio (ex: `testando-codigo`). Letras minúsculas, hifens, sem espaços. Máx 64 caracteres.
- **description**: Terceira pessoa. Incluir gatilhos/palavras-chave. Máx 1024 caracteres.

## 3. Princípios de Escrita
- **Concisão**: Focar na lógica única da skill.
- **Divulgação Progressiva**: `SKILL.md` < 500 linhas. Usar links para arquivos secundários.
- **Caminhos**: Usar sempre `/` (slash), nunca `\`.
- **Graus de Liberdade**:
  - Bullet Points: Alta liberdade (heurísticas).
  - Blocos de Código: Média liberdade (templates).
  - Comandos Bash: Baixa liberdade (operações frágeis).

## 4. Fluxos e Loops de Feedback
- **Checklists**: Lista markdown para rastreamento.
- **Loops de Validação**: Padrão "Planejar-Validar-Executar".
- **Tratamento de Erros**: Scripts devem suportar `--help`.

## 5. Template de Saída
### [Nome da Pasta]
**Caminho:** `.agents/skills/[nome-da-skill]/`
### [SKILL.md]
```markdown
---
name: [nome-no-gerundio]
description: [descrição em 3ª pessoa]
---
# [Título da Skill]
## Quando usar esta skill:
- [Gatilho 1]
- [Gatilho 2]
## Fluxo de Trabalho (Workflow):
[Checklist ou guia passo-a-passo]
## Instruções:
[Lógica, trechos de código ou regras]
## Recursos:
- [Links para scripts/ ou resources/]
```
