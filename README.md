# 🤖 GMB Lead Capturer - Orquestração de Agentes e Automação de Leads

### Sistema inteligente de prospecção e curadoria de dados via n8n, Apify e Supabase.

Este repositório implementa um fluxo avançado de **Automação Agentica** para captura e qualificação de leads comerciais diretamente do Google Maps (GMB). O diferencial deste projeto é a sua arquitetura baseada em diretrizes para agentes de IA, garantindo previsibilidade e alta performance na extração e tratamento de dados.

---

### 🏗️ Arquitetura do Sistema

O projeto segue uma arquitetura de **3 camadas** para maximizar a confiabilidade:
1.  **Camada de Extração (Apify):** Mineração de dados brutos do Google Maps por nicho e localidade.
2.  **Camada de Orquestração (n8n):** Workflow engine que gerencia as chamadas de API, integrações e lógica de filtragem.
3.  **Camada de Inteligência e Persistência (Supabase + IA):** Armazenamento estruturado e curadoria de leads com base na presença digital (identificação de Site, WhatsApp e maturidade digital).

---

### 🚀 Funcionalidades Técnicas

- **Extração Customizada:** Busca por nichos específicos através de automação no Google Maps.
- **Curadoria Automática:** O sistema avalia quais empresas possuem presença digital ativa, filtrando apenas leads qualificados.
- **Protocolo Agentico:** Uso de arquivos `.md` (Directives) para guiar o comportamento de agentes de IA durante o processamento (ver pasta `directives/`).
- **Integração via n8n:** Centralização de toda a lógica de negócio em uma plataforma de baixo código e alto poder de escala.

---

### 🛠️ Stack Tecnológica

![n8n](https://img.shields.io/badge/n8n-FF6D5A?style=for-the-badge&logo=n8n&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)

---

### 🧠 Visão de Engenharia (Foco ServiceNow)

Este projeto demonstra competências essenciais para um **Consultor ServiceNow**, tais como:
- **Flow Designer & Workflows:** Capacidade de criar fluxos lógicos complexos (demonstrado no uso do n8n).
- **Integrações (Integration Hub):** Experiência em conectar APIs externas para enriquecimento de dados.
- **Cultura de Agentes (Agent Now):** Alinhamento com a nova fronteira de IA da ServiceNow, utilizando diretrizes estruturadas para automação inteligente.

---

### ⚙️ Como Usar

1. Configure as chaves de API no seu ambiente n8n (Apify e Supabase).
2. Importe o workflow (ver arquivos na pasta `src` ou `directives`).
3. Defina o nicho e a localidade desejada para iniciar a captura.

---

### 📫 Contato

[![LinkedIn](https://img.shields.io/badge/linkedin-%230077B5.svg?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/uiltemberg-duarte-61a057371)
