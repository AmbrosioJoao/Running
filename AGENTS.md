# AGENTS.md — Diário de Corrida (Running Tracker)

## 1. Visão Geral do Projeto
Aplicação web minimalista de uso pessoal para registro de treinos (corrida, tiros e calistenia), controle de quilometragem por tênis, histórico de corridas oficiais e análise gráfica contínua de evolução.

---

## 2. Arquitetura, Stack e Persistência
- **Hospedagem alvo:** GitHub Pages (`https://<usuario>.github.io/<repositorio>`).
- **Restrição importante de arquitetura:** Como o GitHub Pages hospeda apenas arquivos estáticos (HTML/CSS/JS), não é possível rodar um servidor PostgreSQL diretamente nele. Escolha **uma** das abordagens abaixo (priorize a Opção A se houver credenciais de BaaS configuradas; caso contrário, use a Opção B):
  - **Opção A (PostgreSQL gerenciado):** Frontend estático (React/Vite ou HTML/CSS/JS) conectado a um backend **Supabase** (PostgreSQL + REST API + Auth) via variáveis de ambiente.
  - **Opção B (100% estático / Zero-backend):** Frontend estático com persistência em `localStorage` / `IndexedDB` + função obrigatória de **Exportar/Importar Backup em JSON** (para evitar perda de dados entre dispositivos ou limpeza de cache).
- **Automação de datas:** Nunca criar meses ou anos manualmente no código. O calendário e os filtros de período devem ser gerados dinamicamente a partir da data atual do sistema (hoje em diante), funcionando de forma perpétua sem manutenção manual. Não é necessário programar datas anteriores ao dia atual.

---

## 3. Identidade Visual (Estilo Kindle / E-Ink)
A interface deve priorizar leitura confortável, simplicidade extrema e estética inspirada em telas E-Ink (Kindle), sem cores chamativas:
- **Paleta base (toda a aplicação):**
  - Fundo principal: off-white / papel (`#F6F4EF`)
  - Superfícies/cards: `#EFECE6` ou `#FFFFFF` com borda sutil (`#D5D1C8`)
  - Texto principal: grafite escuro (`#1C1C1C`)
  - Texto secundário: cinza médio (`#5F5D58`)
  - Sem gradientes, sombras pesadas ou cores vibrantes nos botões, abas e calendário.
- **Tipografia:** Limpa e legível; usar fonte monoespaçada para números, distâncias e pace (`05:15 /km`).
- **Regra de cores (exceção única):** Cores distintas só devem aparecer na **Aba de Gráficos**, exclusivamente para diferenciar séries/curvas quando o usuário comparar períodos diferentes (ex.: `Fev/2026` vs. `Mar/2026` ou `2026` vs. `2027`).

---

## 4. Autenticação
- A aplicação deve exigir login antes de exibir ou permitir edição dos dados.
- **Credenciais iniciais:** usuário `jambrosio`, senha `2454`.
- **Implementação:**
  - Se usar **Supabase**, configurar o login via Auth real.
  - Se for **100% estático (GitHub Pages)**, não deixar a senha em texto puro no código-fonte: validar comparando o hash **SHA-256** da entrada com o hash pré-calculado e manter a sessão em `sessionStorage`/`localStorage` com botão de Logout.

---

## 5. Funcionalidades e Abas

### Recurso Global: Gestão de Tênis
- Acessível globalmente (ex.: no cabeçalho ou modal/drawer rápido).
- Permitir cadastrar novos tênis (nome/modelo), definir um tênis como **padrão (ativo)** e arquivar tênis antigos.
- Exibir a **quilometragem acumulada (km)** de cada tênis automaticamente, somando as distâncias das corridas vinculadas a ele.

### Aba 1: Calendário de Treinos
- Exibição mensal dinâmica, iniciando na data atual do sistema e avançando indefinidamente.
- Ao clicar em um dia, abrir formulário para registrar/editar/excluir um **Treino** com seleção de tipo:
  1. **Corrida:**
     - `Distância` (em km, aceitando decimais, ex.: `8.5`)
     - `Pace` (formato `mm:ss` por km, ex.: `05:10`)
     - `Tênis` (pré-selecionado com o tênis ativo, podendo ser alterado)
  2. **Tiros:**
     - `Distância` (em km ou metros — deixar unidade clara no campo)
     - `Tênis` (opcional/padrão ativo para contabilizar desgaste)
  3. **Calistenia:**
     - Sem campos adicionais (apenas marcação do treino no dia).
- Indicadores visuais discretos (monocromáticos/ícones simples) nos dias do calendário mostrando qual treino foi realizado.

### Aba 2: Gráficos (Exclusivo para Corrida)
- **Filtro obrigatório:** Considerar **somente** registros do tipo `Corrida` (ignorar `Tiros` e `Calistenia`).
- **Dois gráficos independentes:**
  1. **Gráfico de Pace** (`mm:ss/km` — formatar tooltips e eixo Y como tempo, ex.: `05:20`, nunca como decimal puro).
  2. **Gráfico de Distância** (`km`).
- **Regra crítica — Gráficos Contínuos (Sem Gaps):**
  - O usuário costuma correr apenas de segunda a sexta (e pode faltar em alguns dias).
  - **NÃO** usar eixo X temporal com dias vazios que geram quebras/buracos na linha.
  - Plotar apenas os dias que possuem corrida registrada em sequência contínua (ex.: eixo categórico por ordem das corridas, exibindo a data exata no tooltip).
- **Filtros e Comparação de Períodos:**
  - Permitir visualizar por **Mês específico** (ex.: `Fev/2026`) ou **Ano inteiro** (ex.: `2027`).
  - Permitir selecionar **2 ou mais períodos simultaneamente** (ex.: comparar `Fev/2026` vs. `Mar/2026`, ou `2026` vs. `2027`) no mesmo gráfico, atribuindo uma cor distinta e legenda clara para cada curva.
  - Na comparação de períodos, alinhar as curvas por sequência de corridas (1ª corrida do período, 2ª corrida, etc.) para manter a continuidade sem gaps.

### Aba 3: Corridas Oficiais
- Lista e formulário para registrar provas oficiais com os campos obrigatórios:
  - `Nome da prova`
  - `Data`
  - `Distância` (km)
  - `Pace` (`mm:ss`)
- **Features simples adicionais (manter visual limpo e E-Ink):**
  - Cálculo automático do **Tempo Total** estimado (`Distância × Pace`).
  - Destaque discreto de **Recorde Pessoal (RP)** para distâncias clássicas (5 km, 10 km, 21,1 km, 42,2 km).
  - Seleção opcional do tênis utilizado na prova (somando na quilometragem do tênis).

---

## 6. Modelo de Dados Sugerido
```json
{
  "shoes": [
    { "id": "uuid", "name": "Olympikus Corre 3", "active": true, "archived": false }
  ],
  "workouts": [
    {
      "id": "uuid",
      "date": "2026-11-27",
      "type": "corrida | tiros | calistenia",
      "distanceKm": 10.0,
      "paceSeconds": 315,
      "shoeId": "uuid"
    }
  ],
  "officialRaces": [
    {
      "id": "uuid",
      "name": "Meia Maratona de Curitiba",
      "date": "2026-11-15",
      "distanceKm": 21.1,
      "paceSeconds": 310,
      "shoeId": "uuid"
    }
  ]
}
```
> **Nota técnica:** Armazenar `pace` internamente em **segundos inteiros** (`paceSeconds`, ex.: `05:15` = `315`) para facilitar cálculos, médias e plotagem nos gráficos, convertendo para `mm:ss` apenas na interface.

---

## 7. Git, Commits e Deploy no GitHub
- Utilizar o token/CLI do GitHub já configurado nesta máquina para criar o repositório remoto (se ainda não existir) e configurar a publicação via **GitHub Pages** (`https://<usuario>.github.io/<repositorio>`).
- **Regra obrigatória de versionamento (Commits Incrementais):**
  - **NUNCA** fazer um único commit gigante com todo o projeto de uma vez.
  - Fazer commits pequenos, frequentes e organizados por funcionalidade/etapa concluída, usando mensagens claras (padrão Conventional Commits, ex.: `feat:`, `fix:`, `style:`, `chore:`).
  - Ordem sugerida de commits:
    1. `chore: setup inicial do projeto e configuração do GitHub Pages`
    2. `style: estrutura base e tema visual estilo Kindle (E-Ink)`
    3. `feat: tela de login e controle de sessão`
    4. `feat: gestão global de tênis e cálculo de quilometragem`
    5. `feat: aba de calendário dinâmico e registro de treinos`
    6. `feat: aba de gráficos contínuos (pace e distância) com comparação de períodos`
    7. `feat: aba de corridas oficiais com tempo total e RP`
    8. `chore: validação de build de produção e ajustes finais de responsividade`
  - Realizar `git push` progressivamente ao concluir marcos importantes ou após validar cada bloco de commits.
- Antes do deploy final, validar o build de produção sem erros e testar a responsividade (desktop e mobile).