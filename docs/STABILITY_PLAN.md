# FFX Sphere Grid Stability Plan

## Current Risk Assessment

| Risk | Level | Location |
|------|-------|----------|
| Data Corruption from Bit Manipulation | 🔴 HIGH | `src/utils/BitWriter.ts`, `src/utils/BitReader.ts` |
| Sharing URL Encoding Failures | 🔴 HIGH | `src/stores/gridSharing.ts` |
| localStorage Data Loss | 🟡 MEDIUM | Browser clearing, quota, corruption |
| Import/Export Validation | 🟡 MEDIUM | `src/composables/useSphereData.ts:317-371` |
| Storage Quota Exceeded | 🟢 LOW | ~2KB per grid, well under 5-10MB limit |

## Storage Decision: Stay with localStorage

**Why not IndexedDB?**
- Current data size: ~2KB per grid (860 nodes × ~30 bytes)
- localStorage limit: 5-10MB
- No performance issues at this scale
- Simpler API, universal support
- IndexedDB only needed if: data >1MB per grid, 10+ save slots, or undo/redo history

**Migration triggers:**
- Multiple character builds (7 characters × N builds)
- Save slot system (10+ slots)
- Undo/redo history (100+ states)

## Cloud Storage: Not Yet

**Current approach:** localStorage + manual export/import
**When to add cloud:**
- User base >100 active users
- Users requesting save sync across devices
- Social features (sharing builds, leaderboards)

**Recommended stack (when ready):**
- Supabase free tier (500MB, 50k auth users)
- Anonymous saves using localStorage UUID
- Optional user accounts for cross-device sync
- Cost: $0/month initially, ~$25/month at scale

---

## Phase 1: Critical Testing (Week 1-2)
**Priority: CRITICAL** - No new features until complete

### 1.1 Bit Utilities Tests ✅ COMPLETED
```
Created: src/utils/BitWriter.spec.ts (33 tests)
Created: src/utils/BitReader.spec.ts (44 tests)

**BUG FOUND AND FIXED:**
- Values were encoded with 3 bits (max value 7)
- But VALID_VALUES array has 10 items (indices 0-9)
- Sphere values 200 and 300 (indices 8, 9) were being corrupted!
- Fixed: Changed from 3 bits to 4 bits for values
- Updated: gridSharing.ts lines 100, 129

Test coverage:
✓ Round-trip encoding/decoding
✓ Boundary values and edge cases
✓ All sphere types (0-11, 4 bits)
✓ All valid values (0-9 indices, 4 bits) ← FIXED
✓ All node indices (0-859 standard, 0-802 expert, 10 bits)
✓ Error handling (reading past end, undefined bytes)
✓ Partial byte padding correctness

Results: 77/77 tests passing, 100% code coverage
```

### 1.2 Sharing System Tests ✅ COMPLETED
```
Created: src/stores/gridSharing.spec.ts (37 tests)

Test coverage:
✓ Sphere type conversion (all 12 types)
✓ Sphere value conversion (all 10 valid values)
✓ Base64 URL-safe encoding (-, _, no padding)
✓ URL generation under 4000 char limit
✓ Grid type validation (Standard vs Expert)
✓ extractModifiedNodes() accuracy
✓ applyModifications() skip logic (ability/locked nodes)
✓ Round-trip encoding/decoding (multiple scenarios)
✓ Maximum grid modifications (860 standard, 803 expert)
✓ Edge cases (empty, all modified, max indices)
✓ Data integrity (ordering, zero values, mixed types)
✓ Error handling (URL too long, invalid data)

Results: 37/37 tests passing
```

### 1.3 Data Persistence Tests (6 hours)
```
Create: src/composables/useSphereData.spec.ts

Test cases:
- localStorage mergeDefaults behavior
- Grid generation consistency (same input → same output)
- Coordinate → node ID mapping
- Edge deduplication
- updateNode() persistence to correct key
- Watch triggers for localStorage writes
- Shared view prevents writes
- resetGrid() restores exact defaults
- clearGrid() preserves ability nodes

Target: 85%+ code coverage
```

**Total time: ~12-17 hours (2-3 days)**

---

## Phase 2: Data Protection (Week 3)
**Priority: HIGH** - Prevent data loss

### 2.1 Storage Health Monitoring
```
Create: src/composables/useStorageHealth.ts

Features:
- Check storage quota (warn at 80%)
- Validate localStorage JSON integrity
- Detect corrupted node structures
- Health check on app mount
```

### 2.2 Automated Backup System
```
Create: src/composables/useAutoBackup.ts

Features:
- Track modification count
- Offer backup every 50 modifications OR weekly
- Toast notification: "Would you like to backup your grid?"
- Auto-download export file on acceptance
```

### 2.3 Data Validation Layer
```
Create: src/utils/dataValidation.ts
Create: src/utils/dataValidation.spec.ts

Features:
- validateSphereNode() type guard
- validateGridData() array validation
- Integrate into localStorage reads
- Auto-reset corrupted data to defaults
```

**Implementation locations:**
- `useSphereData.ts:105` - Wrap localStorage reads
- `gridSharing.ts:211` - Validate URL params
- `useSphereData.ts:324` - Validate import files

---

## Phase 3: Enhanced Reliability (Week 4-5)
**Priority: MEDIUM** - Nice to have

### 3.1 Versioned Schema
```typescript
interface StoredGridData {
  version: number;
  gridType: GridType;
  nodes: SphereNode[];
  metadata: {
    created: number;
    modified: number;
  };
}
```

### 3.2 Import/Export Tests
```
Create: src/composables/useSphereData.importExport.spec.ts

Test cases:
- Export format validation
- Import field validation
- Grid type mismatch rejection
- Node count mismatch rejection
- JSON parse error handling
- FileReader error handling
- Round-trip integrity
```

### 3.3 Safe Storage Operations
```typescript
function safeLocalStorageWrite(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    if (err.name === 'QuotaExceededError') {
      // Offer backup download
    }
    return false;
  }
}
```

---

## Phase 4: Cloud Storage (Future)
**Priority: LOW** - When user base grows

### 4.1 Supabase Schema
```sql
create table grids (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id),
  anonymous_id text,
  grid_type text not null,
  modifications jsonb not null,
  name text not null,
  created_at timestamp default now(),
  updated_at timestamp default now(),
  constraint check_user_or_anon check (
    user_id is not null or anonymous_id is not null
  )
);
```

### 4.2 Features
- Save/load named builds
- Anonymous saves (localStorage UUID)
- Optional user accounts
- Share builds via short link
- Auto-backup to cloud every 5 minutes
- Restore from cloud option

---

## Testing Priority Order

1. ✅ **bitUtils tests** (2h) - COMPLETE - Found and fixed 3-bit value bug
2. ✅ **gridSharing tests** (4h) - COMPLETE - 37 comprehensive tests
3. **useSphereData tests** (6h) - Core functionality
4. **dataValidation tests** (2h) - Safety layer
5. **importExport tests** (3h) - Edge case handling

**Total: ~17 hours over 2-3 days**
**Completed: 6 hours (bitUtils + gridSharing tests)**
**Remaining: ~11 hours**

---

## Immediate Next Steps

**This Week:**
1. ✅ Create `src/utils/BitWriter.spec.ts` with 100% coverage (33 tests)
2. ✅ Create `src/utils/BitReader.spec.ts` with 100% coverage (44 tests)
3. ✅ Fix critical bug: values now use 4 bits instead of 3
4. ✅ Create `src/stores/gridSharing.spec.ts` with 37 comprehensive tests
5. ✅ All 114 tests passing (77 bitUtils + 37 gridSharing)

**Next:**
6. Create `src/composables/useSphereData.spec.ts` for data persistence tests
7. Create data validation utilities with tests

**This Month:**
1. Complete all Phase 1 tests
2. Implement `useStorageHealth` composable
3. Implement `useAutoBackup` composable
4. Add storage quota check on app mount

**Future (When Needed):**
- Monitor user reports for data issues
- Add cloud storage at 100+ active users
- Consider IndexedDB only if data >1MB per grid

---

## Success Metrics

| Metric | Current | Target (Phase 1) | Target (Phase 2) |
|--------|---------|------------------|------------------|
| Test Coverage | ~5% | 85%+ | 90%+ |
| Sharing Success Rate | Unknown | >99% | >99.5% |
| Data Loss Reports | Unknown | <1% users | <0.1% users |
| localStorage Corruption | Unknown | Auto-detected | Auto-recovered |

---

## Critical Bug Fixed

**Value Encoding Bug (Discovered during testing):**
- **Problem:** Sphere values were encoded with 3 bits (max value 7), but there are 10 valid values (indices 0-9)
- **Impact:** High-value spheres (200 HP, 300 HP - indices 8, 9) were being silently corrupted in shared URLs
- **Fix:** Changed encoding from 3 bits to 4 bits for values
- **Files Changed:**
  - `src/stores/gridSharing.ts:100` (encoding)
  - `src/stores/gridSharing.ts:129` (decoding)
- **URL Size Impact:** Minimal - each modification now uses 18 bits instead of 17 bits
  - Full grid (860 mods): Was 2,405 chars, now 2,575 chars (still well under 4000 limit)
  - Max capacity: Was 1,411 mods, now 1,333 mods (still 155% of grid size)

---

## Notes

- **Test location:** Place `.spec.ts` files next to the files they test ✅
- **localStorage is sufficient:** Current data size (~2KB) is well under limits
- **Sharing bug found:** Tests caught critical value truncation bug
- **Cloud storage premature:** Add when user base justifies cost/complexity
- **No backup mechanism:** Add auto-backup prompts to prevent data loss
