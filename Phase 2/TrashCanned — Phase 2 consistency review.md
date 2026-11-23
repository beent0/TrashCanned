# TrashCanned — Phase 2 consistency review

Nov 19, 2026 · @Joao

Architecture v4 is right and fixes the professor's feedback, but the OpenAPI file, the endpoint spreadsheet, the UC17 sequence diagram, the ERD and most of the report still describe the old v3 design, and two required report sections are empty. Reviewed against the Phase 2 brief and the v4 diagram: openapi.yaml, TrashCanned\_Endpoints\_API.xlsx, UC03/UC17/UC19 sequences, use case diagram, domain model, ERD (image16.drawio), the Google Doc report and both Figma files.

## Completely wrong: redo

### 1. openapi.yaml and the .xlsx describe architecture v3, not v4

- **Experience layer.** The YAML has 5 Experience APIs, one per profile: /exp/admin, /exp/tecnico, /exp/operador, /exp/supervisor and /exp/parceiro. v4 has ONE Web Experience API (/auth, /me, /mapa, /contentores, /alertas, /rotas, /relatorios, /utilizadores), and RBAC uses the role in the JWT. The whole Experience section needs rewriting.
- **Parceiro API / Portal da Câmara** is still in the spec (/exp/parceiro/contentores, /exp/parceiro/indicadores, apiKeyAuth for the Câmara). The v4 notes say it was removed. Delete it, or move it to an appendix marked pinned.
- **Ingestion.** The spec has a 'Worker de ingestão' calling POST /system/leituras, and POST /process/alertas takes apiKeyAuth for that worker. In v4, Monitorização & Alertas consumes leitura.recebida straight from RabbitMQ and writes to its own schema ('sem System API'). So /system/leituras and /system/alertas should not be core System APIs. Readings and alerts belong to the Monitorização service API (Process layer).
- **Endpoints v4 needs that the spec lacks:** GET /me; GET list/detail of contentores at Process/Experience (Process has only POST/PATCH/DELETE); GET /process/rotas/{id}; DELETE sensor (UC04 has 'remover'); /process/relatorios (v4 has a Relatórios process, but the spec hides it under monitorizacao/historico); the 'GET enchimentos ≥80%' call from Rotas to Monitorização.
- **The spreadsheet** is a 1:1 copy of the old YAML (82 operations). Regenerate it after the YAML is fixed. 'Parametros: Nenhum' on every POST is misleading: name the request body schema instead.

### 2. UC17 sequence contradicts v4, the professor's feedback and the report's own UC17 text

- It shows Sensor → **API System** over HTTP with an apiKey, a synchronous **201 leituraRegistada**, then a 'Worker Process/System'. The professor asked for the simulator to go straight to RabbitMQ, and the UC17 text in the report already says MQTT → broker → Monitorização.
- Redraw it as: Simulador (MQTT) → RabbitMQ → Monitorização & Alertas → schema monitorizacao → RabbitMQ (alerta.criado) → WebSocket gateway → Web App. No HTTP, no 201: the broker ack replaces it.
- The 'chave inválida' error flow becomes 'the broker rejects the MQTT connection', which is what extension 1a in the text already says.
- **Logic gap, in the text too:** CONTENTOR\_CHEIO is only created 'se não existir alerta ativo'. If a QUASE\_CHEIO alert is active when the level passes 95%, the critical alert never appears. Add escalation: upgrade or replace the warning alert.

### 3. Required report sections are empty

- **Security & Functional/Non-Functional Requirements Updates** has only the heading, and it is a graded deliverable.
- **Agile Backlog & Phase 3 Planning** has only the heading. It needs Jira Initiatives/Epics/Tasks with estimates and owners, plus a Phase 3 roadmap. The Phase 1 backlog table still says 'No one' and 'To do', and one criterion is 'rota evita áreas marcadas como limpas' (from the camera design).
- **Architecture Pattern Selection** is an empty heading. Its content sits under Target State Architecture: move it or merge the two headings.

## Needs changing

### Report: Phase 1 content left over

The team decided on a volume sensor only, no cameras, solar power and no battery reporting. The report still contradicts this in several places.

- **Project Goal and In Scope** still list cameras, weight sensors and sound sensors. The **Privacidade NFR** is about cameras. The Target State 'Security' paragraph still says 'cameras follow privacy by design'.
- **Risks** still include 'Captação de pessoas', 'lei de videovigilância' and 'monitorizar níveis de energia/baterias'. The Phase 1 feedback asked for **development risks**, and none were added. Examples: ORS free-tier limits or outage, the RabbitMQ/Kubernetes learning curve, scope creep, integration between layers built by different people.
- The feedback also asked you to **explain the sensor installation, what data it produces and how**. Still missing: one volume sensor per bin, fill % computed on the device, MQTT every 15 min or when it changes by ≥10 p.p., solar panel.
- The feedback asked for **more Scrum**. The Agile section still describes Scrumban, with no sprints and no ceremonies.
- **UC18** is 'Detetar sensor sem comunicação' in the table but 'Enviar estado do dispositivo' (battery, signal) in the text. Rewrite it as the Monitorização cron job. **UC15** also mentions 'nível de bateria'.
- The Project Goal paragraph about the target audience appears twice.
- **Formatting:** the NFR bullets and the 9 risk categories are styled as Heading 1, which floods the index. Figure numbers restart: 'Figura 1' is both the use case diagram and a sequence diagram. The Target State section is in English and the rest is in Portuguese.

### Report: Target State and API text describe v3

- It says the 'System API validates it, stores it and publishes reading received… replies 201' and mentions 'City Council adapters'. Rewrite from the v4 diagram: MQTT ingestion, a Monitorização microservice with its own schema, a single Web Experience API, 4 Kubernetes deployments.
- The API text still says Experience APIs are per profile and that sensors and the Câmara use X-API-Key. It claims '21 endpoints, 22 schemas', but the spec has 82 operations. It gives the example ?aprovado=false, but the spec uses ?estado=GERADA. It uses the role 'ADMINISTRADOR', but the enum is ADMIN.
- The status code table is missing 409 (the mockup uses it for a duplicate email), 422 (used in the spec) and 500.
- **Performance** promises PostGIS spatial indexes, but the ERD uses plain DECIMAL lat/long. Use geography(Point) or drop the claim.
- The brief requires you to **disclose AI use**. Add a short section if the team used AI.

### OpenAPI details to fix in the rewrite

- **Alert types differ.** The spec uses AVISO\_ENCHIMENTO / ENCHIMENTO\_CRITICO / SENSOR\_AVARIADO. UC17 and the mockups use CONTENTOR\_QUASE\_CHEIO / CONTENTOR\_CHEIO. v4 also has 'sensor sem comunicação'. Pick one set and use it everywhere.
- **Contentor:** add tipo\_residuo (it's in the ERD and the mockup) or remove it everywhere. Add sensor\_id and estado (v4: 'contentores (+sensor\_id, estado)').
- **Rota:** add otimizada. UC19 stores it and the ORS fallback depends on it.
- **CalibracaoInput** has only data/observacoes/novo\_estado. The mockup asks for 'leitura de referência' and 'correção (p.p.)'. Make the API, ERD and mockup match.
- **Users:** the mockup has 'Remover' (deletes personal data), UC02 says ativar/desativar, and the API only has PATCH ativo. Decide which, then add a DELETE or drop the button.
- **Naming:** /system/…/recolhas is plural, /process/…/recolha is singular.
- **Pagination:** /system/leituras returns {total, page, items}, the other paginated lists return a bare array. Use one envelope.
- **Events:** none are documented (leitura.recebida, alerta.criado, rota.gerada, contentor.alterado, recolha.registada). OpenAPI can't describe them, so add an event table or an AsyncAPI file.

### Sequence diagrams UC03 and UC19

- **UC03** calls the old /exp/admin/contentores. In v4 it is /api/v1/exp/contentores.
- **UC03:** several replies jump straight from Process or the DB to the Administrador, skipping layers: '3. erro(400)', '6. Contentor Criado', '11. contentorEditado' and '12. ContentorRemovido'. Send replies back through each lifeline.
- **UC03 Remover:** 'aviso(dependências)' stops at the Experience API and never reaches the admin. The opt frame '\[tem sensor associado ou faz parte de rota ativa\]' was deleted, so the warning now appears every time.
- **UC03** never publishes **contentor.alterado**. The v4 legend says Monitorização keeps a 'cópia contentores' updated from that event; without it the copy goes stale.
- **Which three:** UC03 is plain CRUD and shows none of the async/WebSocket flow the brief asks for. The report still shows UC11 (Registar recolha), which is the better pick. Make sure the report figures match the files you hand in.
- **UC19:** eligible bins come from the core DB through 'System (adaptador ORS)'. In v4, Rotas asks Monitorização for 'GET enchimentos ≥80%', and the ORS adapter is a separate System API. Split that lifeline.
- **UC19:** the ORS-down fallback (nearest neighbour, otimizada=false) was deleted from the file. The report, the mockups and 'NFR-14' depend on it, so restore it.
- **UC19:** the manual branch never returns an HTTP 201 to the supervisor. 'obterDeposito()' uses a Depósito that exists in no model.

### Use case diagram

- **Câmara Municipal** is linked to 'Gerir chaves de integração', which is pinned and not in v4. Remove both or mark them out of scope. If you keep them, the Câmara consumes data; it doesn't manage keys.
- **Sensor IoT → 'Detetar sensor sem comunicação' is wrong.** A silent sensor can't trigger anything. The actor is the Temporizador (the v4 cron in Monitorização).
- **UC19** names Temporizador AND Supervisor as actors, but only the Temporizador is linked to 'Gerar rota'.
- Minor: the admin 'Visão Geral' screen has no use case. 'consultar Dispositivos' needs a capital C.

### Domain model

- Operador has **empresa** in the image but **camara: string** in the report text.
- **Temporizador** is a class in the text but not in the diagram. It's an actor, so remove it from the text.
- **Contentor–Sensor** is 1 — 0..\* in the image and '1 → 1' in the text. The decision is one sensor per bin: use 1 — 0..1.
- **Paragem–Contentor** is 1 — 0..1, which is backwards. Each paragem has exactly 1 contentor, and a contentor is in 0..\* paragens. The report's ERD section already says this.
- **Rota–Operador** is 1..\* — 0..\*, so a route would have several operators. The API and the text say one. Use 0..1 (null until approved), and the same for Supervisor aprova Rota.
- **Missing concepts that other artifacts use:** Depósito (UC19), zona on Contentor (API, ERD, mockups), distanciaEstimada and otimizada on Rota, and a link from Alerta to Sensor for 'sem comunicação' alerts.
- Typos: 'capicidade', 'descricção', 'TecnicoDeManutanção', and the Calibração multiplicity '0\*'.

### ERD (image16.drawio)

- **It ignores the 2-schema decision** (core + monitorizacao, in v4 and in the team's own decision). LEITURAS and ALERTAS have foreign keys into SENSORES and CONTENTORES as if everything were one schema. Draw two schemas and add the monitoring copy of contentores. Cross-schema foreign keys break the 'own credentials' isolation.
- **CONFIGURACOES\_INTEGRACAO** has no relationships and belongs to the pinned Câmara feature. Remove it or mark it pinned.
- **ROTAS** lacks distancia\_estimada\_km, duracao\_estimada\_min and otimizada, which the API has.
- **There is no DEPOSITO table**, but UC19 needs the depot location.
- **SENSORES.contentor\_id** should be UNIQUE (one sensor per bin), but the relationship is drawn 1 — 0..\*.
- **LEITURAS** needs UNIQUE(sensor\_id, data\_hora). UC17's deduplication relies on it.
- v4 lists 'empresas · auditoria' under System utilizadores, but the ERD has neither table: empresa is a varchar, yet the mockups promise audited changes.

### Figma mockups

- **Mobile 'Dispositivos do contentor'** (in both files) still shows 'Sensor 2 · Som', 'Sensor 3 · Câmara', 'Sensor 4 · Peso' and battery levels. The desktop screen is fixed. The professor only asked for web, so fix or drop the mobile screens.
- Screens cite **NFR-14, NFR-17/24/26, NFR-20, NFR-33, D3, D4/D6 and D9**, but the report's requirements have no numbers. Number the FR/NFR list so these references lead somewhere; that is the traceability the brief asks for.
- **Placeholder data:** the Contentores list shows 'Latitude: 123123'. The sample coordinates (41,55; −8,42) are in mainland Portugal, but the project is in the Azores (the API examples use 37.8, −25.7). Zona is '2' in the mockups and a name in the API.
- **Missing screens:** a sensor list for UC04 (only the register form exists), the technician's list of 'sem comunicação' alerts, and the supervisor's manual 'Gerar rota' action.
- The report links only the design file. Add the prototype link and rename the 'Untitled' file.

## OK: keep

- **Architecture v4 diagram:** it shows all three required styles and the simulator → MQTT → RabbitMQ path the professor asked for. It also has the Monitorização microservice with its own schema, durable queues with a DLQ, the WebSocket gateway fed by the broker, the ingress (TLS, rate limiting) and the event list. One small addition: label which Process service the Experience API calls to acknowledge and resolve alerts.
- **Use case catalogue:** the UC01–UC19 table and the full write-ups of UC02, UC17 and UC19 are well structured, with pre/post-conditions and extensions.
- **OpenAPI mechanics:** OAS 3.0.3, reusable schemas, one ErrorResponse format, bearer and apiKey schemes, page/limit, enums for states and realistic examples. The structure is right; only the content has to follow v4.
- **Data model text:** the PostgreSQL choice, single-table inheritance for roles, the lat/long split, surrogate vs natural keys and the route and alert state machines are all well argued.
- **Desktop mockups:** they cover all 4 roles and follow the use cases: approve and adjust a route, a route in progress, calibration, alerts. They show the Normal/Aviso/Crítico states and the business rules: only assigned routes, ≥80% eligibility, the ORS fallback. The Câmara screen is marked PINNED instead of being invented.
- **Quality attributes:** all 7 are covered, each with a trade-off, as the brief asks. Only the wording that describes v3 needs updating.

## Suggested order of work

1. Freeze the shared vocabulary once: alert types, the role enum, the Contentor, Rota and Calibração fields, Depósito, and whether the Câmara stays pinned.
2. Rewrite openapi.yaml for v4, then regenerate the .xlsx and the endpoint screenshots in the report.
3. Redraw UC17, fix UC03 (or switch back to UC11) and fix UC19.
4. Fix the domain model multiplicities and update the ERD: 2 schemas, DEPOSITO, the UNIQUE constraints.
5. Update the report: Phase 1 leftovers, Target State, the API text, numbered requirements. Then write the two empty sections (Security/NFR updates, Backlog & Phase 3 plan).
6. Clean up the mockups: the mobile Dispositivos screen, placeholders, missing screens.
