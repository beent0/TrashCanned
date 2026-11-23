# TrashCanned — Decisões da Fase 3

Só regista o que muda em relação ao SDD da Fase 2. Quando não coincidem, prevalece este documento.

## 1. Só MQTT, com o Eclipse Mosquitto

*KAN-44 · 2026-11-23*

**Porquê:** um só protocolo e um só cliente (MQTT.js) para sensores e serviços, um broker leve que corre igual no docker-compose e no Kubernetes, e credenciais por sensor criadas em tempo de execução; as subscrições partilhadas e as sessões persistentes cobrem o que o AMQP fazia neste projeto.

- Todas as mensagens assíncronas são MQTT: leituras dos sensores e eventos entre serviços. O RabbitMQ e o AMQP saem da arquitetura.
- Broker: **Eclipse Mosquitto 2**, com o plugin **dynamic security** para autenticação e controlo de acessos.
- Todas as publicações usam **QoS 1**. Os consumidores usam **sessões persistentes** (clean start = false, session expiry de 24 h) e o Mosquitto tem persistence true num volume persistente.
- Os nomes lógicos dos eventos mantêm-se no OpenAPI (x-eventos-publicados); cada um corresponde a um tópico MQTT.

### Tópicos

| Evento | Tópico | Publicado por | Subscrito por (filtro) |
|----|----|----|----|
| leitura.recebida | sensores/{sensor_id}/leitura | Sensor / simulador | Monitorização: \$share/monitorizacao/sensores/+/leitura |
| contentor.atualizado | eventos/contentor/atualizado | Inventário (core) | Monitorização: \$share/monitorizacao/eventos/contentor/# |
| recolha.registada | eventos/recolha/registada | Rotas (core) | Monitorização (\$share) e WebSocket gateway |
| nivel.atualizado | eventos/nivel/atualizado | Monitorização | WebSocket gateway |
| alerta.criado / alerta.atualizado | eventos/alerta/criado, eventos/alerta/atualizado | Monitorização | WebSocket gateway: eventos/alerta/# |
| rota.gerada / rota.atualizada | eventos/rota/gerada, eventos/rota/atualizada | Rotas (core) | WebSocket gateway: eventos/rota/# |
| leitura inválida | erros/leituras | Monitorização | Registo e observação (substitui a DLQ) |

- A Monitorização usa **subscrições partilhadas** (\$share/monitorizacao/…): cada mensagem vai para uma só réplica.
- Cada réplica do WebSocket gateway subscreve sem \$share e recebe todos os eventos, porque cada uma tem os seus browsers ligados. Não se usa o adaptador Redis do Socket.IO.
- A Monitorização consome as leituras em modo de confirmação manual (customHandleAcks): o PUBACK só é enviado depois do COMMIT, para que nenhuma leitura se perca se o pod cair.
- Leituras repetidas são detetadas pela chave (sensor_id, data_hora) e ignoradas, porque QoS 1 pode entregar duas vezes.
- Uma leitura inválida é confirmada, registada no log em JSON e publicada em erros/leituras com o motivo. Não há reprocessamento, porque uma leitura inválida não tem conserto.
- Observação do broker pelos tópicos \$SYS/#.

### Segurança

- **Sensores:** MQTT sobre TLS na porta 8883, exposta por um Service próprio (não passa pelo Ingress). Cada sensor é um cliente do dynamic security que só pode publicar em sensores/{o seu id}/leitura.
- **Serviços:** porta 1883 só dentro do cluster, com NetworkPolicy. Um cliente por deployment (svc-core, svc-monitorizacao, svc-experience), cada um só com os tópicos de que precisa.
- Só o svc-core (Inventário) publica em \$CONTROL/dynamic-security/v1, para criar e revogar as credenciais dos sensores (FR-04).
- Palavras-passe em Secrets do Kubernetes. Ligações anónimas desativadas.

## 2. Três deployments no Kubernetes

*KAN-33 · 2026-11-23*

**Porquê:** a Monitorização recebe a maior parte das mensagens e tem de escalar sozinha; a System API só é chamada pela Process API, por isso separá-las não dá ganho de escala e custa mais uma imagem para uma equipa de cinco em quatro semanas.

| Deployment | Contém | Réplicas |
|----|----|----|
| experience | Web Experience API, WebSocket gateway (Socket.IO) e o build do React, servido como estático pelo NestJS | 2 |
| core | Process APIs (Contas e acessos, Inventário, Rotas com o cron das 06:00, Relatórios) e System APIs (incluindo o adaptador do OpenRouteService) | 2 |
| monitorizacao | Monitorização e Alertas: leituras, limiares, alertas e deteção de sensores sem comunicação | 2 ou mais (HPA) |

- Mosquitto e PostgreSQL correm como **StatefulSets** com volumes persistentes. O simulador corre fora do cluster, como os sensores reais.
- No core, Process e System continuam módulos NestJS separados (/api/v1/process, /api/v1/system). A Process API chama a System API por HTTP, com o token de serviço, para manter o padrão API-led e poder voltar a separá-las sem mudar código.
- Tarefas agendadas (geração das 06:00, verificação de sensores sem comunicação) usam pg_try_advisory_lock, para que só uma réplica as execute.
- Ingress NGINX: /api/v1/exp, /ws e / vão para o experience. É o único ponto de entrada HTTP.
- A porta 8883 do Mosquitto é exposta por um Service LoadBalancer (NodePort no cluster local).
- As Process APIs da Monitorização são chamadas pelo experience e pelo core através do Service interno do monitorizacao.

## 3. Integração com a Câmara Municipal continua PINNED

*KAN-64 · 2026-11-23*

**Porquê:** a equipa ainda não decidiu que dados expõe nem como os demonstra.

- Fora do âmbito da Fase 3. /exp/parceiro/contentores e /exp/parceiro/indicadores ficam no OpenAPI com x-pinned: true, sem implementação.
- UC05, FR-13 e NFR-20 ficam fora da Fase 3. A X-API-Key fica reservada a esta integração.

## 4. Sensor de volume: mensagem, contentor e calibração

*KAN-47 · 2026-11-23*

**Porquê:** fecha o retorno da Entrega 1 (como os sensores são instalados e que dados produzem) e os pontos que a secção "Sensores e dados recolhidos" do SDD deixou em aberto.

- **Transporte:** Mosquitto (não RabbitMQ, como diz o SDD), por 4G (LTE-M), MQTT sobre TLS na porta 8883, QoS 1. Porquê: segue a decisão 1.
- **A mensagem não leva o contentor:** `{"sensor_id", "nivel_enchimento", "data_hora"}`. A Monitorização obtém o contentor pela associação sensor–contentor (UC04). Porquê: o contentor é um dado do registo, não do dispositivo; mudar o sensor de contentor não obriga a reconfigurá-lo.
- **sensor_id da mensagem diferente do do tópico:** leitura inválida, publicada em erros/leituras. Porquê: o tópico é o que o broker autentica (NFR-34).
- **A Leitura guarda contentor_id e nivel_medido:** contentor_id é resolvido na receção; nivel_medido é o valor enviado pelo sensor, e nivel_enchimento o valor corrigido. Porquê: o histórico de um contentor não muda quando o sensor muda de contentor ou é substituído, e a recalibração precisa do valor bruto.
- **Mudança de contentor:** o sensor pode mudar de contentor. O Sensor guarda associado_em, atualizado quando contentor_id muda. Leituras com data_hora anterior a associado_em são descartadas e publicadas em erros/leituras. Porquê: leituras guardadas no sensor antes da mudança pertencem ao contentor antigo; descartá-las evita guardar o histórico de associações.
- **Sensor avariado:** o substituto é registado com um novo sensor_id no mesmo contentor e o antigo é desativado. Porquê: as credenciais e a calibração pertencem ao dispositivo físico, e o UC04 já cria as credenciais no registo.
- **A correção de calibração é aplicada pela Monitorização, não pelo sensor:** `nivel_enchimento = min(100, max(0, nivel_medido + correcao_pp))`, com a correcao_pp da última calibração conhecida no momento do processamento, também para leituras reenviadas. Substitui a fórmula do SDD. Porquê: os sensores só publicam (NFR-34), não há forma de lhes enviar configuração; usar a última calibração evita guardar o histórico de calibrações na Monitorização.
- **A calibração chega à Monitorização pelo evento contentor.atualizado**, com sensor_id e correcao_pp. Porquê: a Monitorização já mantém a cópia local com esse evento; não é preciso um tópico novo.
- **Calibração (UC16):** com o contentor vazio, leitura_referencia = último nivel_medido do sensor e correcao_pp = −leitura_referencia. O técnico confirma que a leitura seguinte aparece a 0 %. Porquê: partir do valor bruto torna a recalibração independente da correção anterior.
- **Recalibração obrigatória:** depois de instalar, mudar de contentor ou reparar o sensor; a cada 6 meses; quando um contentor esvaziado continua acima de 5 % depois da recolha. O técnico verifica manualmente (ultima_calibracao, níveis depois da recolha); não há alerta automático na Fase 3. Porquê: um alerta novo (tipo, enum e ecrã) não cabe no Sprint 1.

## 5. Stack local de desenvolvimento

*KAN-53 · 2026-11-23*

**Porquê:** arrancar o sistema inteiro com um comando antes de haver Kubernetes; uma só imagem mantém um único build do backend e do frontend.

- `docker compose up --build` em `main/`: postgres 16, mosquitto 2, core, monitorizacao, experience (http://localhost:8080) e o simulador.
- Uma imagem (`main/Dockerfile`) com os targets core, monitorizacao e experience.
- Mosquitto em desenvolvimento: porta 1883, ligações anónimas, sem TLS nem dynamic security, persistence true. Fica assim até à KAN-56.
- O simulador corre dentro do compose (no Kubernetes corre fora do cluster).

## 6. Requisitos não funcionais alterados

*KAN-44, KAN-33 · 2026-11-23*

**Porquê:** estes requisitos referiam o RabbitMQ ou os quatro deployments.

| ID | Texto da Fase 3 |
|----|----|
| NFR-05 | Nenhuma leitura confirmada pelo broker se perde num reinício do Mosquitto ou da Monitorização. Leituras repetidas não criam alertas duplicados. Leituras inválidas são registadas e publicadas em erros/leituras. |
| NFR-09 | 50 leituras/s durante 5 min sem crescimento contínuo das mensagens guardadas no Mosquitto (\$SYS/broker/store/messages/count). A Monitorização escala para 2 ou mais réplicas sem alterações de código. |
| NFR-13 | Substituir o OpenRouteService obriga a alterar só o adaptador de otimização. Cada um dos três deployments tem a sua imagem Docker. |
| NFR-34 (novo) | Cada sensor só consegue publicar no seu tópico sensores/{sensor_id}/leitura; o broker recusa publicações noutros tópicos. |
