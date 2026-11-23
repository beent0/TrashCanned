# Architecture Pattern Selection

**Projeto:** TrashCanned – Monitorização inteligente de resíduos urbanos (Grupo G3)
**Fase:** Phase 2 – Requirement Analysis and Architecture
**Base:** slides "Software Architecture" e "Architecture Patterns" (ES 2026/2027) e Entrega 1.
**Diagrama:** `Architecture Diagram.excalidraw`

---

## 1. Proposta

A arquitetura proposta combina dois padrões:

| Padrão | Papel no sistema |
|---|---|
| **Layered Architecture (N-Tier)** | Organiza o sistema em 5 camadas com responsabilidades claras: Presentation, API, Event, Business e Data. |
| **Event-Driven Architecture** | Os serviços da camada Business comunicam entre si por eventos publicados num Event Broker (Pub/Sub). Não se chamam diretamente. |

O backend **não é uma única aplicação**. É composto por vários serviços pequenos, instalados de forma independente, ligados pelo Event Broker. Cada serviço publica eventos quando algo importante acontece. Outros serviços reagem a esses eventos de forma assíncrona, sem o produtor saber quem os consome.

---

## 2. Contexto e requisitos que guiam a decisão

"Choose architecture based on needs… not trends." A escolha parte dos requisitos da Entrega 1:

**Requisitos funcionais**
- RF1 – Receção de dados em tempo real (níveis de volume dos caixotes).
- RF2 – Geração automática de rotas de recolha otimizadas.
- RF3 – Alertas automáticos às entidades responsáveis.
- RF4 – Interfaces diferentes por perfil (Operadores, Técnicos, Supervisores, Admins).
- RF5 – Integração com aplicações de gestão municipal existentes.

**Requisitos não funcionais**
- Segurança (controlo de acessos rigoroso, proteção de dados).
- Privacidade by design (câmaras sem reconhecimento facial; guardar resultados, não imagens).
- Acessibilidade (web em telemóvel e computador).
- Conectividade (hardware envia dados por 4G, com zonas de cobertura fraca).

O sistema é, por natureza, orientado a eventos: um sensor reporta um nível, um contentor fica cheio, um alerta é criado, uma rota muda. A Event-Driven Architecture segue este fluxo real. A Layered Architecture dá-lhe uma estrutura clara e fácil de manter.

---

## 3. As camadas

```
 1 · Presentation   Plataforma Web (Admin · Operador · Técnico · Mapa)   Sistemas municipais
                              │ HTTPS / REST + WebSocket                      │ REST
 2 · API            API Gateway – REST · WebSocket · Autenticação e RBAC · API de integração
                              │ subscribe (push p/ dashboards)                │ REST síncrono
 3 · Event          Event Broker (Pub/Sub, MQTT para sensores)  ◀── Sensores IoT (simulador)
                              │ publish / subscribe                           │
 4 · Business       Ingestão · Alertas · Rotas                    Utilizadores e Permissões
                              │ SQL                                           │ SQL
 5 · Data           Base de Dados relacional (schema próprio por serviço)
```

| Camada | Componentes | Responsabilidade |
|---|---|---|
| **1. Presentation** | Plataforma Web; sistemas municipais (clientes externos) | Interface por perfil (RF4), mapa de rotas, dashboards. Acessível em telemóvel e PC. |
| **2. API** | API Gateway | Ponto de entrada único. Autenticação, autorização por role (RBAC), REST para pedidos síncronos, WebSocket para enviar alertas e rotas em tempo real, API de integração (RF5). |
| **3. Event** | Event Broker (ex.: RabbitMQ com plugin MQTT) | Recebe eventos dos sensores (MQTT) e dos serviços; entrega-os a quem os subscreve. |
| **4. Business** | Serviços de Ingestão, Alertas, Rotas, Utilizadores e Permissões | Regras de negócio. Cada serviço tem uma única responsabilidade. |
| **5. Data** | Base de dados relacional | Persistência. Cada serviço acede apenas ao seu próprio schema. |

**Regra das camadas:** cada camada só comunica com a camada adjacente. A Presentation nunca acede ao Broker nem à base de dados diretamente.

---

## 4. O fluxo de eventos

| Evento (tópico) | Produtor | Consumidores | Efeito |
|---|---|---|---|
| `bins/{id}/level` | Sensor IoT (MQTT) | Ingestão | Valida o payload JSON, descarta inválidos e guarda a leitura. |
| `leitura.recebida` | Ingestão | API Gateway | Atualiza o estado do contentor nos dashboards. |
| `contentor.cheio` | Ingestão (nível ≥ limite) | Alertas, Rotas | Cria um alerta e recalcula a rota. |
| `alerta.criado` | Alertas | API Gateway | Envia o alerta por WebSocket aos operadores responsáveis (RF3). |
| `rota.atualizada` | Rotas | API Gateway | Atualiza o mapa de rotas (RF2). |

Exemplo ponta a ponta:
1. O sensor do contentor 42 publica `bins/42/level = 92%`.
2. O serviço de Ingestão valida e guarda a leitura. Como 92% passa o limite, publica `contentor.cheio`.
3. Os serviços de Alertas e Rotas recebem o evento ao mesmo tempo, cada um de forma independente.
4. Alertas publica `alerta.criado`; Rotas publica `rota.atualizada`.
5. O API Gateway recebe os dois eventos e envia-os por WebSocket ao dashboard do operador.

Operações que precisam de resposta imediata (login, gestão de utilizadores, consultas) usam REST síncrono entre o API Gateway e o serviço respetivo. Não passam pelo Broker.

---

## 5. Justificação

### 5.1 Layered Architecture (N-Tier)
- **Porquê:** separa a apresentação, o acesso, a comunicação, a lógica e os dados. Cada parte pode ser alterada com impacto limitado nas restantes.
- **Vantagens no nosso caso:**
  - Separação clara de responsabilidades: segurança concentrada no API Gateway; regras de negócio nos serviços.
  - Mais fácil de testar: cada camada pode ser testada isoladamente (ex.: serviços testados com eventos simulados).
- **Desvantagens (slides):**
  - Uma alteração pode propagar-se por várias camadas.
  - Cada pedido atravessa várias camadas, o que acrescenta latência.
- **Mitigação:** contratos estáveis entre camadas (formato dos eventos e endpoints REST versionados). O caminho dos dados em tempo real é curto: sensor → Broker → Ingestão.

### 5.2 Event-Driven Architecture
- **Porquê:** os sensores produzem dados contínuos e assíncronos (RF1). A ligação 4G é instável em zonas de baixa cobertura (risco técnico "Falhas de conectividade", probabilidade Alta). Os alertas e as rotas são reações a eventos (RF2, RF3).
- **Vantagens no nosso caso:**
  - Baixo acoplamento: a Ingestão não sabe que existem Alertas ou Rotas. Um novo consumidor (ex.: relatórios para BI) é acrescentado sem alterar os produtores.
  - Escalabilidade para cargas assíncronas: o Broker absorve picos de leituras; cada serviço pode ter várias réplicas.
  - Tempo real: MQTT é leve e desenhado para dispositivos limitados e redes pouco fiáveis.
  - Isolamento de falhas: se o serviço de Alertas falhar, a Ingestão continua a guardar leituras. Os eventos ficam na fila até o serviço voltar.
- **Desvantagens (slides):**
  - Mais difícil depurar e seguir o fluxo de ponta a ponta.
  - Consistência eventual: o dashboard pode demorar alguns instantes a refletir uma leitura.
  - É preciso tratar mensagens duplicadas, fora de ordem ou perdidas.
  - Exige infraestrutura extra (Broker, monitorização).
- **Mitigação:**
  - Cada evento leva um `event_id`, o `sensor_id` e um `timestamp`. Os consumidores ignoram eventos já processados (idempotência).
  - QoS 1 no MQTT e filas persistentes no Broker.
  - Logs com `event_id` em todos os serviços, para seguir o fluxo de ponta a ponta.
  - Um único Broker para sensores e serviços (RabbitMQ com plugin MQTT), para reduzir infraestrutura.

---

## 6. Alternativas consideradas e rejeitadas

| Padrão | Motivo |
|---|---|
| **Monolithic** | Excluído para este projeto. Além disso, não permite escalar a ingestão de forma independente das restantes funcionalidades. |
| **Microservices puros (comunicação síncrona REST entre serviços)** | Cadeias de chamadas síncronas tornam o sistema frágil: se Alertas falhar, a Ingestão falha também. Os eventos evitam esta dependência. |
| **Serverless** | Dependência forte do fornecedor cloud. Cold starts atrasam alertas em tempo real. Não é adequado para ligações persistentes (subscrição MQTT, WebSocket). |
| **MVC como padrão principal** | Organiza apenas a interface. Fica usado dentro da Plataforma Web, mas não resolve a comunicação nem o processamento dos dados IoT. |

---

## 7. Avaliação face aos atributos de qualidade

| Atributo | Como a arquitetura responde |
|---|---|
| **Scalability** | O Broker absorve picos. Cada serviço escala sozinho (ex.: mais réplicas da Ingestão quando há mais sensores), com Docker/Kubernetes como no Exercício 2. |
| **Reliability** | Filas persistentes e reenvio; sensores com armazenamento local temporário; falha de um consumidor não perde eventos. |
| **Availability** | Dashboards e leituras guardadas continuam disponíveis mesmo que Alertas ou Rotas estejam em baixo. |
| **Security** | HTTPS; autenticação e RBAC centralizados no API Gateway; credenciais por sensor no Broker; rede IoT segmentada; Broker e base de dados sem acesso público. |
| **Privacy** | Câmaras publicam apenas resultados (ex.: "sujo/limpo"), nunca imagens nem dados pessoais. |
| **Performance** | Alertas e rotas chegam por WebSocket assim que são publicados. O cálculo de rotas corre em segundo plano, sem bloquear pedidos. |
| **Maintainability / Modularity** | Camadas com responsabilidades fixas; serviços com uma responsabilidade cada; novos consumidores sem alterar código existente. |

---

## 8. Evolução: de 1 000 para 1 000 000 de utilizadores/sensores

Resposta à pergunta do Exercício 4 dos slides. A arquitetura mantém-se; muda a infraestrutura:

1. **Protótipo (dados simulados):** 1 instância de cada serviço, 1 Broker, 1 base de dados.
2. **Crescimento moderado (vários concelhos):** várias réplicas dos serviços mais carregados (Ingestão, API Gateway) atrás de um load balancer; réplicas de leitura da base de dados.
3. **Grande escala (milhares de sensores):** Broker distribuído (ex.: Kafka) com tópicos particionados por zona; base de dados de séries temporais para as leituras; serviço de Rotas escalado à parte.

---

## 9. Conclusão

A arquitetura proposta é uma **Layered Architecture (N-Tier) com comunicação Event-Driven na camada de negócio**.

Esta escolha:
- cumpre os requisitos funcionais e não funcionais da Entrega 1;
- segue o fluxo natural do sistema: sensores e eventos em tempo real;
- equilibra escalabilidade, fiabilidade, segurança e desempenho;
- define fronteiras claras entre camadas e entre serviços;
- pode crescer mudando apenas a infraestrutura, sem redesenhar o sistema.
