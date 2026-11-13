# Specs: implementation coverage

## ADDED Requirements

### Requirement: Requirement Coverage Matrix

The system SHALL maintain a coverage matrix for all 74 acceptance criteria from `PRD_V1.0.md`.

#### Scenario: Criteria are mapped to implementation and tests

- GIVEN the implementation is ready for review
- WHEN the coverage matrix is generated
- THEN every criterion SHALL include `requirement_id`, `frontend_files`, `backend_endpoints`, `test_cases`, and `status`
- AND no criterion SHALL have status `unknown`

#### Scenario: Missing implementation is tracked as bug

- GIVEN a requirement has no matching implementation or test
- WHEN validation runs
- THEN a row SHALL be written to `bugs.csv`
- AND the row SHALL include the matching `requirement_id`

### Requirement: Frontend Page Completeness

The frontend SHALL implement all pages registered in `src/pages.json` as usable business pages.

#### Scenario: Registered pages are not placeholders

- GIVEN a user opens any registered page
- WHEN the page renders
- THEN it SHALL NOT display delivery-state text containing `占位`, `骨架`, `后续接入`, or equivalent placeholder wording
- AND it SHALL provide loading, error, empty, or ready business states

#### Scenario: Tab bar matches PRD

- GIVEN the mini-program starts
- WHEN the tab bar renders
- THEN it SHALL contain exactly `探索`, `路径`, and `我的`

### Requirement: Explore Flow

The explore page SHALL connect discovery, import, and route preview flows.

#### Scenario: Recommendation opens route preview

- GIVEN recommendation cards are displayed
- WHEN the user taps a recommendation card
- THEN the app SHALL navigate to `/pages/route-preview/route-preview`
- AND no personal route SHALL be created before adoption

#### Scenario: Quick import opens path import panel

- GIVEN the user taps the quick import entry on explore page
- WHEN navigation completes
- THEN the app SHALL switch to the path tab
- AND the path page SHALL open the import-link panel

### Requirement: Mood Questionnaire

The mood questionnaire page SHALL implement the 7-question PRD flow.

#### Scenario: Submit full questionnaire

- GIVEN the user answers all 7 questions
- WHEN the user submits
- THEN the backend SHALL persist social identity, mood tags, travel pace, atmosphere preference, theme interests, travel goal, and popular attitude
- AND the user SHALL receive at most 5 beans for mood update per day

#### Scenario: Skip questionnaire

- GIVEN the user chooses to skip
- WHEN the user enters the app
- THEN base features SHALL remain usable
- AND route generation SHALL not require mood tags

### Requirement: Route Generation and Adoption

Routes SHALL observe bean charging and preview/adoption boundaries.

#### Scenario: Generate route from preferences

- GIVEN the authenticated user has at least 40 beans
- WHEN the user submits route preferences
- THEN one personal route SHALL be created
- AND exactly 40 beans SHALL be consumed
- AND the route SHALL include ordered spots and connections

#### Scenario: Generation failure does not charge

- GIVEN route generation fails
- WHEN the request returns an error
- THEN the user bean balance SHALL remain unchanged
- AND no personal route SHALL be created

#### Scenario: Adopt route preview

- GIVEN the user opens a route preview
- WHEN the user confirms adoption
- THEN one personal route SHALL be created
- AND exactly 40 beans SHALL be consumed

### Requirement: Link Import

The link import flow SHALL parse supported links through a fallback-capable service.

#### Scenario: Valid link import succeeds

- GIVEN the authenticated user has at least 40 beans
- WHEN the user submits a valid `http` or `https` link
- THEN the system SHALL create one route
- AND exactly 40 beans SHALL be consumed

#### Scenario: Invalid or unparsable link does not charge

- GIVEN the user submits an invalid or unparsable link
- WHEN import fails
- THEN the system SHALL not consume beans
- AND SHALL return a user-readable error

### Requirement: Beans Invariants

The bean system SHALL preserve balance and reward invariants.

#### Scenario: Balance bounds

- GIVEN any sequence of bean rewards and costs
- WHEN the sequence is applied
- THEN the balance SHALL remain between 0 and 200 inclusive

#### Scenario: Weekly grant cap

- GIVEN weekly grant runs
- WHEN a user receives weekly beans
- THEN the balance SHALL increase by at most 100
- AND SHALL NOT exceed 200

### Requirement: Spot Checkin and Comments

Spot interactions SHALL enforce GPS, upload, and reward rules.

#### Scenario: Checkin within 500m

- GIVEN the user is within 500 meters of the spot
- WHEN the user submits checkin with at most 3 photos and dry tags
- THEN the checkin SHALL be accepted
- AND the user SHALL receive at most 10 beans for that spot on that day

#### Scenario: Checkin outside 500m

- GIVEN the user is farther than 500 meters from the spot
- WHEN the user submits checkin
- THEN the backend SHALL return code `50001`
- AND no reward SHALL be granted

#### Scenario: Comment reward is daily idempotent

- GIVEN the user comments on the same spot multiple times in one day
- WHEN comments are accepted
- THEN total comment reward for that user/spot/day SHALL NOT exceed 10 beans

#### Scenario: Comment sorting prioritizes matching profile

- GIVEN comments include tags, mood tags, photos, likes, and timestamps
- WHEN comments are listed
- THEN the first group SHALL prioritize up to 3 comments matching current user tags or mood and having photos
- AND remaining comments SHALL sort by likes and time

### Requirement: Share Flow

Share functionality SHALL provide route and spot share artifacts with fallback data.

#### Scenario: Generate route share

- GIVEN a valid personal route
- WHEN the user requests route share
- THEN the system SHALL return a `shareCode`
- AND the `shareCode` SHALL resolve to the original route target

#### Scenario: Generate spot share

- GIVEN a valid spot or checkin
- WHEN the user requests spot share
- THEN the system SHALL return poster data or a poster URL fallback
- AND the share target SHALL resolve to the spot detail

### Requirement: Testing and Bug CSV

The project SHALL provide automated validation and a CSV bug register.

#### Scenario: Validation commands pass

- GIVEN implementation is complete
- WHEN validation runs
- THEN `npm run type-check`, `npm run lint`, frontend coverage, backend lint, and backend coverage SHALL pass

#### Scenario: Coverage reaches configured target

- GIVEN coverage reports are generated
- WHEN thresholds are evaluated
- THEN line, statement, function, and branch coverage SHALL meet 100% for included files
- AND excluded files SHALL be documented with reasons

#### Scenario: Bug CSV is generated

- GIVEN validation completes
- WHEN bugs are found or no bugs are found
- THEN `bugs.csv` SHALL exist with the fixed header
- AND Critical/High open bug count SHALL be 0 before delivery

## PBT Properties

- PROPERTY P1: Bean balance bounds are preserved for arbitrary reward/cost sequences.
- PROPERTY P2: Failed route generation/import is transactionally neutral.
- PROPERTY P3: Successful route generation/import consumes exactly 40 beans.
- PROPERTY P4: Users below 40 beans cannot generate/import routes.
- PROPERTY P5: GPS distances above 500m always reject checkin reward.
- PROPERTY P6: GPS distances from 0m to 500m do not fail due to distance.
- PROPERTY P7: Same user/spot/day checkin reward is idempotent.
- PROPERTY P8: Same user/spot/day comment reward is idempotent.
- PROPERTY P9: Preview browsing never creates personal routes.
- PROPERTY P10: Preview adoption creates one route and consumes exactly 40 beans.
- PROPERTY P11: Share code generation and resolution round-trip target identity.
- PROPERTY P12: Comment ordering preserves priority grouping and likes/time ordering.
- PROPERTY P13: Checkin photo payload is bounded to at most 3 photos.
- PROPERTY P14: Navigation targets exist in `src/pages.json`.
- PROPERTY P15: API errors always produce user-readable frontend messages.
