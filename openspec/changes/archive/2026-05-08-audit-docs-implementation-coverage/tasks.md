# Tasks: audit-docs-implementation-coverage

- [x] 1.1 Add frontend test and coverage scripts without changing runtime behavior
- [x] 1.2 Add backend test and coverage scripts without changing runtime behavior
- [x] 1.3 Configure explicit coverage thresholds and documented exclusions
- [x] 1.4 Add test fixtures for auth, beans, routes, spots, mood profiles, comments, and shares

- [x] 2.1 Build PRD acceptance coverage matrix for all 74 criteria
- [x] 2.2 Add bug CSV generator with fixed header and severity/status enums
- [x] 2.3 Wire validation output to update `bugs.csv` with requirement IDs

- [x] 3.1 Refactor backend route planning fallback into a deterministic service
- [x] 3.2 Ensure route generation consumes exactly 40 beans only after successful route creation
- [x] 3.3 Ensure failed route generation rolls back route creation and bean updates
- [x] 3.4 Implement link import fallback parser with invalid-link no-charge behavior
- [x] 3.5 Add route detail contract fields for spots, connections, recommended spots, mood weighting, and source type
- [x] 3.6 Add backend tests for route generation, adoption, import, bean insufficiency, and rollback properties

- [x] 4.1 Verify bean balance cap, weekly grant, reward, and cost invariants in model/controller logic
- [x] 4.2 Ensure mood update reward is limited to 5 beans per user per day
- [x] 4.3 Ensure checkin reward is limited to 10 beans per user/spot/day
- [x] 4.4 Ensure comment reward is limited to 10 beans per user/spot/day
- [x] 4.5 Add backend PBT/unit tests for bean bounds and idempotent reward invariants

- [x] 5.1 Complete spot detail backend contract with weather, crowd, address, coordinates, images, and comments
- [x] 5.2 Enforce GPS >500m checkin rejection with code `50001`
- [x] 5.3 Enforce checkin photo upper bound of 3 photos
- [x] 5.4 Implement comment listing priority grouping by matching tags/mood with photos, then likes/time
- [x] 5.5 Add comment like endpoint if absent and update sorting data
- [x] 5.6 Add backend tests for GPS boundaries, photo bounds, comment reward, likes, and sorting

- [x] 6.1 Complete route share and spot share backend fallback data contracts
- [x] 6.2 Ensure share codes round-trip to original target type and target ID
- [x] 6.3 Add backend tests for share generation, share lookup, invalid share code, and fallback poster data

- [x] 7.1 Replace frontend placeholder delivery text across registered pages with real loading/error/empty/ready states
- [x] 7.2 Update explore recommendation tap to open route preview instead of route detail
- [x] 7.3 Update explore quick import to switch to path tab and open import-link panel
- [x] 7.4 Add frontend tests for registered page paths and navigation target existence

- [x] 8.1 Implement mood questionnaire 7-question flow with skip and submit actions
- [x] 8.2 Persist questionnaire answers through mood-map API and update Pinia user state
- [x] 8.3 Display daily +5 bean reward feedback without double-counting repeated submissions
- [x] 8.4 Add frontend tests for questionnaire completion, skip, and reward display states

- [x] 9.1 Implement path page route factory UI with day mode, preferences, play time, atmosphere, must-go spots, and bean cost
- [x] 9.2 Implement atmosphere options derived from social identity and mood with generic fallback
- [x] 9.3 Implement path import-link panel and route import success/error states
- [x] 9.4 Implement ongoing trip card and historical route grouping by month
- [x] 9.5 Add frontend tests for route factory payloads, import panel state, and route grouping

- [x] 10.1 Implement route preview page read-only route display
- [x] 10.2 Implement preview adoption confirmation and successful bean balance update
- [x] 10.3 Ensure preview browsing does not create personal routes before adoption
- [x] 10.4 Add share entry on route preview
- [x] 10.5 Add frontend tests for preview no-create invariant and adoption flow

- [x] 11.1 Complete route detail page map overview fallback UI and spot markers
- [x] 11.2 Complete route detail ordered spot cards with connection distance/time rows
- [x] 11.3 Implement mood-match filter for route detail spots
- [x] 11.4 Add share entry on route detail
- [x] 11.5 Add frontend tests for route detail rendering, filter behavior, and share navigation

- [x] 12.1 Complete spot detail page base information, weather, crowd, address navigation, and image carousel states
- [x] 12.2 Implement checkin action with location request, GPS error handling, max 3 photos, dry tags, and description
- [x] 12.3 Implement comments list, comment creation, like action, and priority display
- [x] 12.4 Add share entry after checkin and on spot detail
- [x] 12.5 Add frontend tests for GPS rejection display, photo limit, dry-tag requirement, comments, and share entry

- [x] 13.1 Complete profile page asset card, mood tags, bean progress, and four shortcut grid entries
- [x] 13.2 Complete tag setting page with emotion-aware recommendations and save behavior
- [x] 13.3 Complete bean log page with chronological bean records
- [x] 13.4 Complete message page with notifications and unread red dot state
- [x] 13.5 Complete share generate page with poster preview, save fallback, and share fallback actions
- [x] 13.6 Add frontend tests for profile shortcuts, tag save, bean logs, messages, and share page states

- [x] 14.1 Synchronize `docs/API.md` with final backend routes, payloads, errors, and fallback behavior
- [ ] 14.2 Synchronize backend OpenAPI document with implemented API contracts
- [ ] 14.3 Update coverage matrix statuses after implementation

- [ ] 15.1 Run frontend type-check, lint, and coverage validation
- [ ] 15.2 Run backend lint and coverage validation
- [ ] 15.3 Run OpenSpec status validation for this change
- [x] 15.4 Generate final `bugs.csv` and summarize total bugs by severity/status
- [ ] 15.5 Fix all Critical and High bugs before delivery
