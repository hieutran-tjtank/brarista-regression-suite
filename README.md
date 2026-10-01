# Brarista Sizing Engine Regression Suite

> **Trả lời câu hỏi từ Bella (R2 interview):**
> "Mỗi khách hàng có sizing spec riêng. Khi onboard client mới, existing clients break.
> Anh apply automation thế nào?"

## What This Does

Automated regression testing for Brarista's Global Sizing Engine.
Ensures that updating the engine for one client doesn't break sizing for others.

## Quick Start

```bash
# Install
npm install

# Run all tests (93 tests across 3 clients)
npm test

# Run engine logic tests only
npm run test:engine

# Run all client regression tests
npm run test:clients

# Run specific client
npm run test:client -- "Boobydoo"

# Run onboarding validation
npm run test:onboarding

# Open HTML report
npm run report
```

## Architecture

```
engine/                    ← Sizing engine simulation
├── ConversionRules.js     ← Constants: band ranges, cup systems, dress-to-band
└── SizingEngine.js        ← Core: calculateSize(), getSisterSizes(), convertSize()

clients/                   ← Per-client test data (THE KEY DESIGN)
├── _template.json         ← Copy this for new clients
├── boobydoo.json          ← 10 test cases
├── latched.json           ← 8 test cases
└── lemonade.json          ← 10 test cases

tests/
├── engine/                ← Engine logic tests (34 tests)
│   ├── band-conversion    ← cm → inch → band number
│   ├── cup-calculation    ← Inch formula, UK/US systems
│   └── recalibration      ← Dress size conflict handling
├── clients/               ← Client regression (38 tests)
│   ├── client-regression  ← Auto-loads ALL client JSON → runs all test cases
│   └── cross-client       ← Same input → correct different outputs per client
└── onboarding/            ← Config validation (21 tests)
    └── new-client-validation ← JSON structure, required fields, range checks
```

## How It Works

### Per-Client Config (Core Design)

Each client = 1 JSON file with test cases:

```json
{
  "client": "Boobydoo",
  "market": "UK",
  "sizing_systems": ["UK", "EU"],
  "band_range": { "min": 28, "max": 48 },
  "test_cases": [
    {
      "id": "BD-001",
      "input": { "underbust_cm": 80, "overbust_cm": 100 },
      "expected": { "band": 32, "cup": "F", "full_size": "32F" }
    }
  ]
}
```

### Adding a New Client

```bash
# 1. Copy template
cp clients/_template.json clients/newclient.json

# 2. Fill test cases from client's sizing spec

# 3. Validate
npm run test:onboarding

# 4. Run regression (all clients including new one)
npm test

# 5. Commit & push → CI runs automatically
```

## CI Integration

GitHub Actions triggers on any change to `engine/` or `clients/`:

```
Dev changes sizing engine → Push PR → CI auto-runs 93 tests
                                       ↓
                                   ALL PASS? → Merge OK
                                   FAIL?    → Block merge, report shows which client broke
```

## For Dev Team

| You need to know | How |
|---|---|
| When tests run | CI auto-triggers on PRs touching `engine/` |
| When tests fail | Read CI report — shows exact client + test case that broke |
| Adding new client | Copy `_template.json`, fill data, commit |

## Test Results

```
93 tests | 3 clients | 28 test cases | ~1 second
```

| Category | Tests | What it covers |
|---|---|---|
| Engine: Band | 10 | cm→inch conversion, rounding, boundaries |
| Engine: Cup | 15 | Inch formula, UK/US systems, fractional rounding |
| Engine: Recalibration | 9 | Dress size conflict, trust paths |
| Client: Regression | 31 | All clients × all test cases |
| Client: Cross-client | 3 | Same input → correct per-client output |
| Onboarding: Validation | 21 | JSON structure, field requirements |
| **Total** | **93** | |

## Key Domain Knowledge

- **Inch formula is canonical** (confirmed by prototype investigation in take-home Task 3)
- **Cup = overbust_inch − band_inch** (round to nearest)
- **Recalibration threshold: > 2 band difference** between measurement and dress size
- **UK and AU share cup progression** (DD, E, F, FF, G, GG...)
- **US uses different cup names** (DD/E, DDD/F, G, H...)

---

Built by Hieu Tran | [Task Log](docs/TASK_LOG.md)
