# QA Auto-Test: So sánh 2 projects & Hướng dẫn từng bước

---

## 1. Sizing QA Demo vs Regression Suite — Khác gì?

| | **sizing-qa-demo** (Case 2) | **regression-suite** (Case 3) |
|---|---|---|
| **Mục đích** | Validate sizing logic across 6 international systems | Prevent cross-client regression when engine updates |
| **Loại test** | Unit test cho sizing logic | Regression test cho hệ thống multi-client |
| **Stack** | Python + pytest | Node.js + Playwright |
| **Test data** | Hardcoded trong test files | Tách riêng → JSON files per client |
| **Mở rộng** | Thêm test = thêm code | Thêm client = thêm JSON file (no code) |
| **CI** | Không | Có (GitHub Actions) |
| **Target** | Engine code đi kèm (self-contained) | Engine placeholder → swap real engine |
| **Use case** | Portfolio demo | Production-ready workflow |

### In short:
- **sizing-qa-demo**: Deep-dive into sizing logic correctness — unit-level validation
- **regression-suite**: Scalable workflow for multi-client environments — system-level protection

---

## 2. Nếu tôi là QA Auto-tester, làm từng bước thế nào?

### Bước 1: Hiểu bài toán (trước khi viết code)
```
Hỏi:
├── Test cái gì? (API? UI? Logic? Data pipeline?)
├── Ai sẽ dùng suite này? (QA only? Dev cũng chạy? CI auto?)
├── Data test lấy từ đâu? (Spec? Production data? Manual input?)
└── Khi fail → ai fix? (QA update data? Dev fix code?)
```

**Ở regression suite:**
- Test: sizing logic (không phải UI)
- Ai dùng: QA viết test data, dev xem CI report
- Data: từ client sizing spec (mỗi client 1 file JSON)
- Fail: dev fix engine hoặc QA update expected value (nếu rule thay đổi có chủ đích)

### Bước 2: Chọn stack
```
Hỏi: Team dev đang dùng gì?
├── Python → pytest
├── JavaScript/TypeScript → Playwright hoặc Jest
├── Java → JUnit/TestNG
└── Cần test browser UI → Playwright/Cypress/Selenium
```

**Rule: dùng cùng ngôn ngữ với team dev.** QA dùng Python nhưng team dùng JS → dev không đọc/maintain được tests.

### Bước 3: Thiết kế structure

Có 2 cách organize tests:

**Option A — By test type** (convention phổ biến, team lớn):
```
tests/
├── unit/             ← Test từng function riêng lẻ
├── integration/      ← Test nhiều function kết hợp
└── regression/       ← Test toàn bộ flow, bảo vệ existing behavior
```

**Option B — By domain** (regression-suite dùng cách này, team nhỏ/đọc nhanh):
```
tests/
├── engine/           ← Test sizing logic (band, cup, recalibration)
├── clients/          ← Test per-client regression + cross-client
└── onboarding/       ← Validate new client config structure
```

**Tại sao prj này chọn Option B:**
- Bella/dev đọc vào hiểu ngay: "tests cho engine", "tests cho clients"
- Readers immediately understand what's being tested without QA terminology
- Phù hợp với bài toán multi-client (mỗi domain có concern riêng)

**Cả 2 cách đều đúng.** Chọn theo team. Quan trọng nhất là **tách test data ra config riêng:**
```
clients/              ← Test data TÁCH RIÊNG khỏi test code
├── _template.json    ← Hướng dẫn onboard
├── boobydoo.json     ← Dễ thêm/sửa không cần biết code
├── latched.json
└── lemonade.json
```

### Bước 4: Viết engine/helper layer (nếu cần)
```
Hỏi: Test gọi cái gì?
├── Real API/module → Import trực tiếp, không cần simulation
├── Chưa có access → Viết simulation placeholder
└── Prototype/demo → Viết engine đi kèm (như sizing-qa-demo)
```

**Regression suite dùng simulation vì chưa có access real engine.**
Khi join team → swap 1 dòng import.

### Bước 5: Viết tests theo pattern
```
Mỗi test case:
1. Arrange: load input data
2. Act: gọi function/API
3. Assert: so sánh output với expected
```

### Bước 6: Chạy, calibrate, document
```
First run → có failures → debug:
├── Test data sai? → Fix data
├── Engine sai? → File bug
└── Test logic sai? → Fix test
```

### Bước 7: CI + Handoff
```
├── CI auto-trigger khi code thay đổi
├── README giải thích cách chạy
└── Template giải thích cách thêm test case mới
```

---

## 3. Structure này có dùng cho auto-test khác được không?

**Có.** Pattern "data-driven test + auto-loading config" áp dụng cho nhiều loại:

| Loại test | Config file chứa gì | Test code làm gì |
|---|---|---|
| **API regression** | Endpoint, payload, expected response | Loop config → call API → assert |
| **E-commerce pricing** | Product, discount rules, expected price | Loop config → calculate → assert |
| **Multi-tenant SaaS** | Tenant settings, expected behavior | Loop config → test per tenant |
| **i18n/localization** | Language, expected translations | Loop config → verify per locale |
| **Data pipeline** | Input CSV, expected output | Loop config → run transform → assert |

### Pattern tóm gọn:
```
clients/                ← 1 file = 1 context (client/tenant/language/product)
tests/
  client-regression.js  ← Auto-load ALL client files → loop → test
  onboarding.js         ← Validate new client config structure
```

**Cái pattern "add config = add test coverage, no code change" là reusable.**

---


