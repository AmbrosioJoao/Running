# history.md — Histórico e Handoff do Projeto Diário de Corrida

> **Propósito:** Este arquivo registrа todo o conteúdo de `AGENTS.md` e o progresso da implementação, para permitir retomar o trabalho em outra sessão caso os tokens acabem.
>
> **Atualizado em:** 2026-11-27

---

## 1. Estado Atual do Workspace

- Diretório: `/home/jambrosio/Documents/Projects/Running`
- Repositório Git local: sim, branch `main`, remote `origin` → `https://github.com/AmbrosioJoao/Running`
- GitHub Pages habilitado: **https://ambrosiojoao.github.io/Running/**
- Ambiente: `git 2.47.3`, `gh 2.46.0` autenticado como `AmbrosioJoao`, `python3 3.13.5`, Firefox disponível.
- **Node/npm/Não há BaaS:** não há Node.js, npm, bun ou deno instalados; não há credenciais Supabase/Postgres no ambiente.
- **Decisão arquitetural (2026-11-27): Opção B — 100% estático, zero dependências.** Motivo: ausência de credenciais BaaS e de runtime Node. Stack: HTML + CSS + JavaScript clássico (sem build), persistência em `localStorage` e backup JSON. Gráficos SVG desenhados à mão (sem bibliotecas externas).
- Convenção de código: scripts clássicos carregados em ordem (sem ES modules) para funcionar também via `file://`; sem comentários no código-fonte.

---

## 2. Visão Geral do Projeto

Aplicação web minimalista de uso pessoal para:
- Registro de treinos (corrida, tiros e calistenia)
- Controle de quilometragem por tênis
- Histórico de corridas oficiais
- Análise gráfica contínua de evolução

---

## 3. Arquitetura, Stack e Persistência

- **Hospedagem alvo:** GitHub Pages (`https://<usuario>.github.io/<repositorio>`).
- **Restrição:** GitHub Pages serve apenas arquivos estáticos (HTML/CSS/JS). Não é possível rodar PostgreSQL diretamente nele. Escolher **uma** das opções:
  - **Opção A (PostgreSQL gerenciado):** Frontend estático (React/Vite ou HTML/CSS/JS) + backend **Supabase** (PostgreSQL + REST API + Auth) via variáveis de ambiente.
  - **Opção B (100% estático / Zero-backend):** Frontend estático com persistência em `localStorage` / `IndexedDB` + **Exportar/Importar Backup em JSON** obrigatório (evita perda de dados entre dispositivos/limpeza de cache).
  - **Regra:** priorizar Opção A **se** houver credenciais de BaaS configuradas; caso contrário, usar Opção B.
- **Automação de datas (crítico):**
  - Nunca criar meses ou anos manualmente no código.
  - Calendário e filtros de período devem ser gerados dinamicamente a partir da data atual do sistema (hoje em diante).
  - Funcionar de forma perpétua, sem manutenção manual.
  - Não é necessário programar datas anteriores ao dia atual.

---

## 4. Identidade Visual (Estilo Kindle / E-Ink)

Priorizar leitura confortável, simplicidade extrema e estética de tela E-Ink, sem cores chamativas.

### Paleta base (toda a aplicação)
| Elemento | Cor |
|---|---|
| Fundo principal (papel) | `#F6F4EF` |
| Superfícies/cards | `#EFECE6` ou `#FFFFFF` |
| Borda sutil | `#D5D1C8` |
| Texto principal (grafite) | `#1C1C1C` |
| Texto secundário (cinza) | `#5F5D58` |

- **Sem** gradientes, sombras pesadas ou cores vibrantes em botões, abas e calendário.
- **Tipografia:** limpa e legível; fonte monoespaçada para números, distâncias e pace (`05:15 /km`).
- **Exceção única de cor:** cores distintas apenas na **Aba de Gráficos**, exclusivamente para diferenciar séries/curvas ao comparar períodos (ex.: `Fev/2026` vs. `Mar/2026`, `2026` vs. `2027`).

---

## 5. Autenticação

- Exigir login antes de exibir ou editar dados.
- **Credenciais iniciais:** usuário `jambrosio`, senha `2454`.
- **Implementação:**
  - Com Supabase: login via Auth real.
  - Com 100% estático: **não** deixar a senha em texto puro no código-fonte. Validar comparando o hash **SHA-256** da entrada com o hash pré-calculado. Manter sessão em `sessionStorage`/`localStorage` com botão de **Logout**.
  - Hash SHA-256 de `2454` (calculado em 2026-11-27 com `printf '2454' | sha256sum`): `6ee1f58e7b08b04e58109a89bc575651338419dc646b9d660ff95f81ec594299`.

---

## 6. Funcionalidades e Abas

### Recurso Global: Gestão de Tênis
- Acessível globalmente (cabeçalho ou modal/drawer rápido).
- Cadastrar novos tênis (nome/modelo).
- Definir um tênis como **padrão (ativo)**.
- Arquivar tênis antigos.
- Exibir **quilometragem acumulada (km)** automaticamente, somando distâncias das corridas vinculadas a ele.

### Aba 1: Calendário de Treinos
- Exibição mensal dinâmica, iniciando na data atual do sistema e avançando indefinidamente.
- Ao clicar em um dia: formulário para **registrar/editar/excluir** um Treino com tipo:
  1. **Corrida**
     - `Distância` em km, decimais aceitos (ex.: `8.5`)
     - `Pace` em `mm:ss` por km (ex.: `05:10`)
     - `Tênis` pré-selecionado com o ativo, podendo ser alterado
  2. **Tiros**
     - `Distância` em km ou metros (deixar unidade clara no campo)
     - `Tênis` opcional/padrão ativo para contabilizar desgaste
  3. **Calistenia**
     - Sem campos adicionais (apenas marcação do treino no dia)
- Indicadores visuais discretos (monocromáticos/ícones simples) nos dias com treino.

### Aba 2: Gráficos (somente Corrida)
- **Filtro obrigatório:** considerar **apenas** registros do tipo `Corrida` (ignorar `Tiros` e `Calistenia`).
- **Dois gráficos independentes:**
  1. **Pace** (`mm:ss/km`) — tooltips e eixo Y formatados como tempo (`05:20`), **nunca** decimal puro.
  2. **Distância** (`km`).
- **Regra crítica — gráficos contínuos sem gaps:**
  - O usuário corre apenas de segunda a sexta (e pode faltar).
  - **NÃO** usar eixo X temporal com dias vazios (gera quebras na linha).
  - Plotar apenas dias com corrida registrada, em sequência contínua (eixo categórico por ordem das corridas; data exata no tooltip).
- **Filtros e comparação:**
  - Visualizar por **Mês específico** (ex.: `Fev/2026`) ou **Ano inteiro** (ex.: `2027`).
  - Selecionar **2 ou mais períodos simultaneamente** (ex.: `Fev/2026` vs. `Mar/2026`, `2026` vs. `2027`) no mesmo gráfico, com cor distinta e legenda clara por curva.
  - Na comparação, alinhar curvas por sequência de corridas (1ª, 2ª, ...) para manter continuidade sem gaps.

### Aba 3: Corridas Oficiais
- Lista + formulário com campos obrigatórios:
  - `Nome da prova`
  - `Data`
  - `Distância` (km)
  - `Pace` (`mm:ss`)
- Features adicionais (visual limpo E-Ink):
  - Cálculo automático do **Tempo Total estimado** = `Distância × Pace`.
  - Destaque discreto de **Recorde Pessoal (RP)** para distâncias clássicas: 5 km, 10 km, 21,1 km, 42,2 km.
  - Seleção opcional do tênis usado na prova (soma na quilometragem do tênis).

---

## 7. Modelo de Dados Sugerido

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

> **Nota técnica:** armazenar `pace` internamente em **segundos inteiros** (`paceSeconds`, ex.: `05:15` = `315`) para facilitar cálculos, médias e plotagem. Converter para `mm:ss` apenas na interface.

---

## 8. Git, Commits e Deploy

- Usar token/CLI do GitHub já configurado na máquina para criar o repositório remoto (se não existir) e configurar GitHub Pages.
- **Commits incrementais obrigatórios — NUNCA um commit gigante único.** Commits pequenos, frequentes, organizados por funcionalidade/etapa, padrão Conventional Commits (`feat:`, `fix:`, `style:`, `chore:`).
- Ordem sugerida:
  1. `chore: setup inicial do projeto e configuração do GitHub Pages`
  2. `style: estrutura base e tema visual estilo Kindle (E-Ink)`
  3. `feat: tela de login e controle de sessão`
  4. `feat: gestão global de tênis e cálculo de quilometragem`
  5. `feat: aba de calendário dinâmico e registro de treinos`
  6. `feat: aba de gráficos contínuos (pace e distância) com comparação de períodos`
  7. `feat: aba de corridas oficiais com tempo total e RP`
  8. `chore: validação de build de produção e ajustes finais de responsividade`
- Fazer `git push` progressivamente ao concluir marcos ou validar blocos de commits.
- Antes do deploy final: validar build de produção sem erros e testar responsividade (desktop e mobile).

---

## 9. Checklist de Progresso

### Concluído
- [x] Decisão: Opção B (estático + backup JSON)
- [x] `chore: setup inicial do projeto e configuração do GitHub Pages` — commit `da26bef`, push feito, Pages ativo
- [x] `style: estrutura base e tema visual estilo Kindle (E-Ink)` — commit `e0a2d0f`, `index.html` + `styles.css`
- [x] `feat: tela de login e controle de sessão` — commit `10e44d9`, `js/utils.js`, `js/auth.js`, `js/app.js`
- [x] `feat: gestão global de tênis e cálculo de quilometragem` — commit `9531ed1`, `js/store.js`, `js/shoes.js`, `js/backup.js`
- [x] `feat: aba de calendário dinâmico e registro de treinos` — commit `b51deed`, `js/calendar.js`, grade no `styles.css`
- [x] `feat: aba de gráficos contínuos (pace e distância) com comparação de períodos` — commit `50db06f`, `js/charts.js`
- [x] `feat: aba de corridas oficiais com tempo total e RP` — commit `ebb5ba6`, `js/races.js`
- [x] Exportar/Importar backup JSON (obrigatório se Opção B) — incluído no commit `9531ed1`
- [x] `chore: validação de build de produção e ajustes finais de responsividade` — commit `0e6bb63`, sintaxe, 3 smoke tests, Pages HTTP 200 e status `built` com CSS final publicado, ajustes mobile
- [x] `chore: registra status final do deploy no history.md` — commit `5e65b64`
- [x] `feat: adiciona ícone do Snoopy no topo e favicon PNG transparente` — `assets/snoopy.png`, `favicon.png`, `index.html`, `styles.css`

### Pendente
- Nenhum item funcional pendente.
- Próximos passos opcionais: validar visualmente em dispositivos reais e, se desejar, migrar para Supabase (Opção A).

### Convenções a seguir
- Stack sem build/lint configurado. Validação adotada: Node portátil em `/tmp/opencode/node-v26.13.1-linux-x64/bin/node` (fora do repo) executando `node --check js/*.js` e testes pontuais de funções puras.
- Firefox headless deste ambiente falha com `RenderCompositorSWGL failed mapping default framebuffer` — não usar para smoke tests; usar Node + servidor HTTP local.
- Commits e pushes incrementais estão sendo feitos porque o usuário pediu explicitamente a execução de `AGENTS.md` (seção 7 exige commits e push progressivo).
- Servir localmente com `python3 -m http.server 8765` na pasta do projeto e acessar `http://localhost:8765`.
- Arquivos JS atuais: `js/utils.js` (datas, pace, distância, escape, SHA-256 puro + WebCrypto), `js/store.js` (estado/persistência), `js/auth.js` (login hash, sessão, logout), `js/backup.js` (exportar/importar JSON), `js/shoes.js` (gestão de tênis), `js/calendar.js` (calendário/treinos), `js/charts.js` (gráficos SVG), `js/races.js` (provas oficiais), `js/app.js` (tabs, modal, toast, bootstrap).
- Ordem de carregamento dos scripts em `index.html`: utils → store → auth → backup → shoes → calendar → charts → races → app.
- Chave de persistência: `running.data.v1` (`localStorage`), com `{ shoes, workouts, officialRaces }`. Sessão em `sessionStorage` (`running.session`).
- Quilometragem do tênis soma: corridas + tiros + provas oficiais vinculadas (tiros entram por "desgaste", conforme seção 5).
- Tênis inicial criado automaticamente: "Tênis padrão" (ativo); usuário pode renomear, criar outros, ativar e arquivar.
- Exclusão de tênis é bloqueada se houver registros vinculados; use arquivamento nesse caso.
- Backup JSON: botões no rodapé; exporta `{version, exportedAt, data}` e importa com confirmação de substituição.
- Calendário: começa sempre no mês atual; botão "anterior" desabilitado no mês atual; dias passados aparecem acinzentados e não clicáveis. Indicadores: `C` corrida, `T` tiros, `F` calistenia.
- Um dia pode ter vários treinos; modal do dia lista, edita e exclui cada um, com botão "Novo treino".
- Distância de tiros é informada em **km** (campo rotulado "Distância (km)"); pace apenas para corrida; tênis obrigatório na corrida e opcional em tiros; calistenia sem campos extras.
- Gráficos: SVG puro (sem libs), eixo X categórico pela sequência de corridas (sem gaps), tooltip `<title>` com data exata, eixo Y do pace em `mm:ss`. Períodos (meses e anos) gerados a partir dos registros + mês/ano atuais; múltiplas caixas de seleção; cores distintas apenas nesta aba; legenda por período.
- Na comparação, curvas são alinhadas por índice (1ª, 2ª, ... corrida de cada período). Tooltip inclui período + data + valor.
- Corridas oficiais: lista ordenada por data (mais recente primeiro), tempo total = distância × pace formatado `mm:ss`/`hh:mm:ss`, RP calculado como menor pace entre provas de mesma distância clássica (5/10/21,1/42,2 km). Tênis opcional entra na quilometragem.
- Testes automatizados temporários (fora do repo): `/tmp/opencode/smoke-dom.js` (login → calendário → treino → indicador → tênis), `/tmp/opencode/smoke-charts.js` (filtro corrida, eixo tempo, sem gaps, 2 períodos, cores e legenda) e `/tmp/opencode/smoke-races.js` (tempo total, RP, formulário, tênis). Comando: `PATH=/tmp/opencode/node-v26.13.1-linux-x64/bin:$PATH node /tmp/opencode/smoke-<nome>.js` com `python3 -m http.server 8765` ativo. jsdom instalado em `/tmp/opencode/testenv`.

---

## 10. Instruções para Retomada

1. Ler `AGENTS.md` e este `history.md`.
2. Verificar `git status` e a lista de arquivos para confirmar o ponto exato de parada.
3. Atualizar o checklist da seção 9 com o que foi feito.
4. Manter este arquivo atualizado a cada marco concluído.
5. Em caso de dúvida sobre arquitetura, seguir a regra da seção 3 (priorizar Supabase se houver credenciais; senão estático).
6. Aplicação acessível em https://ambrosiojoao.github.io/Running/ — login `jambrosio` / senha `2454`.
7. Histórico de commits: `da26bef`, `e0a2d0f`, `10e44d9`, `9531ed1`, `b51deed`, `50db06f`, `ebb5ba6`, `0e6bb63`, `5e65b64` e o commit do ícone Snoopy. Todos com push para `origin/main`.
8. Ícones: Snoopy estilizado desenhado com Pillow (script temporário `/tmp/opencode/draw_snoopy.py`) em `assets/snoopy.png` (512 px) e `favicon.png` (128 px), ambos com fundo transparente (RGBA, alpha 0 nas bordas). Usado no cartão de login, no cabeçalho e como favicon.
