# TrashCanned — Phase 2: what still needs to be done

Checked on 20 Nov 2026. Everything Claude could change is finished and checked. The items below have to be done by the team by hand.

Report: [ES entrega I](https://docs.google.com/document/d/191DI9PLEJRj5jqndz57gtYKgxcXNvc6sQosjYwJMgTI). The same list, in Portuguese, is in the report's tab **Registo de alterações (Fase 2)**.

## 1. Report (Google Doc)

- [ ] **Refresh the table of contents.** Click it and press the refresh icon. The new headings (requirements subsections) are not listed until you do.
- [ ] **Replace the ERD image** (Data Model section) with an export of `ERD_v2.drawio`. In draw.io, use File → Export as → PNG, with a 2x zoom.
- [ ] **Replace the sequence diagram images** with exports of `UC3_v2`, `UC17_v2` and `UC19_v2.excalidraw`. The report currently shows UC11, UC17 and UC19. Either add a UC03 figure or keep the old UC11 figure and caption it as Entrega 1.
- [ ] **Replace the endpoint table screenshots** (API Design section, 11 images) with screenshots of `TrashCanned_Endpoints_API_v2.xlsx`.
- [ ] **Confirm that the Target State Architecture image shows v4.** It should show the simulator publishing over MQTT straight into RabbitMQ, a single Experience API, the System APIs the professor said were missing, and the WebSocket gateway.
- [ ] **Write the two empty sections** if they are part of this delivery: "Agile Backlog & Phase 3 Planning" and "Architecture Pattern Selection".
- [ ] **After the Visual Paradigm edits (section 3),** replace the use case diagram (Figura 1) and the domain model (Figura 2) images.

## 2. Figma mockups

Claude only has read access to the file, so these were not applied. The file is [Mockups-ES](https://www.figma.com/design/cNW8EWZy7Iz2j1EVokmV3V/Mockups-ES).

- [ ] **Móvel · 12 · Dispositivos do contentor:** delete the cards "Sensor 2 · Som", "Sensor 3 · Câmara" and "Sensor 4 · Peso · reserva". They are the only ones that show battery percentages, so deleting them removes those too.
- [ ] **Portátil · 03 and Móvel · 19 · Utilizadores:** rename the three "Remover" buttons to "Desativar". Change the footnote to: «Sem autorregisto. Não existe remoção: desativar impede o início de sessão e mantém o histórico de recolhas. Pedir confirmação e auditar alterações (NFR-24/26).»
- [ ] **Portátil · 06 and Móvel · 21 · Gerir contentor:** delete the field "Tipo de resíduo · exemplo / Resíduos indiferenciados".
- [ ] **Coordinates:** replace the mainland ones with Azores ones, using the same pair for each container on every screen:

  | Container | Coordinates |
  |---|---|
  | Dumpster_01 | 37,8396; −25,7942 |
  | Dumpster_02 | 37,8412; −25,7965 |
  | Dumpster_03 | 37,8380; −25,7920 |

  The screens to change:
  - Portátil · 05 · Contentores: "Latitude: 123123" and "Longitude: 123123" on all three cards.
  - Portátil · 10, 11 and 12, and Móvel · 09, 10 and 11: the "Exemplo · 41,55…; −8,42…" lines.
  - Gerir contentor (Portátil · 06 and Móvel · 21): "41,5520; −8,4220".
- [ ] **Prototype file:** check whether `omXRfObn7fZDGONwsoxNU2` has the same screens, and apply the same changes there.

## 3. Visual Paradigm (`Engenharia de Software.vpp`)

**Use case diagram (`ES_casos_de_uso.jpg`)**
- [ ] Mark "Gerir chaves de integração" and the actor "Camara Municipal" as PINNED.
- [ ] Link "Detetar sensor sem comunicação" to the Temporizador instead of the Sensor IoT. The system detects that readings stopped; the sensor itself does not.

**Domain model (`Modelo_de_Dominio.jpg`)**
- [ ] Replace `Operador.empresa : String` with a class **Empresa** (Operador * → 1 Empresa).
- [ ] Add a class **Depósito** (nome, localização), linked to Rota (1 → *).
- [ ] Sensor: add `tipo = VOLUME`.
- [ ] Alerta: change `tipo : string` to an enum {CONTENTOR_QUASE_CHEIO, CONTENTOR_CHEIO, SENSOR_SEM_COMUNICACAO}.
- [ ] Change the Contentor–Sensor multiplicity from `0...*` to `0..1`, since there is one sensor per container.
- [ ] Rota: add `otimizada` and `distanciaEstimadaKm`.
- [ ] Calibração: add `leituraReferencia`, `correcaoPp` and `novoEstado`.
- [ ] Fix the typos `capicidade`, `descricção` and `date` (in Calibração).

## 4. Files

- [ ] Upload `TrashCanned_Endpoints_API_v2.xlsx` to the claude.ai project and to the shared folder. The project tool does not accept binary files.

## 5. Entrega 1 feedback still open (`FeedbackEntregaI.txt`)

- [ ] Use more Scrum practices in the methodology section.
- [ ] Add risks related to development, not only to the hardware.
- [ ] Explain how the sensors are installed, what data they produce and how.

## Files (v2)

| File | What it is | Where to get it |
|---|---|---|
| `TrashCanned_Endpoints_API_v2.xlsx` | Endpoint table: 96 operations, with roles and events, plus an Eventos sheet | Sent in chat |
| `openapi_v2.yaml` | OpenAPI 3.0.3 spec: 66 paths, 96 operations, 38 schemas; validated | Sent in chat; also `ALL/openapi_v2.yaml` in the project |
| `ERD_v2.drawio` | ERD with two schemas (core and monitorizacao); open it in app.diagrams.net | Sent in chat; also `ALL/ERD_v2.drawio` in the project |
| `UC3_v2.excalidraw` | Sequence diagrams for UC03 (create, edit and remove a container) | Project `ALL/` only; open in excalidraw.com |
| `UC17_v2.excalidraw` | Sequence diagram for UC17 (sensor reading over MQTT, creating alerts) | Project `ALL/` only |
| `UC19_v2.excalidraw` | Sequence diagram for UC19 (route generation, with the ORS fallback) | Project `ALL/` only |
| `TODO.md` | This list | Sent in chat |

The original files (`openapi.yaml`, `UC3.excalidraw`, `UC17.excalidraw`, `UC19.excalidraw`, `image16.drawio`) are unchanged in the project, as a record of the process.
