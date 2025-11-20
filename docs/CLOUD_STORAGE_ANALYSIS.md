# Cloud Storage Persistence Analysis
## FFX Sphere Grid Planner - User Data Backup Strategy

**Date**: 2025-11-20
**Status**: Research Complete - Ready for Implementation
**Recommended Solution**: Supabase with Google OAuth

---

## Executive Summary

This document analyzes cloud storage options for persisting user sphere grid customizations with Google authentication. The current implementation uses localStorage, which is device-specific and lacks backup capabilities.

### Key Recommendation: **Supabase**

- **Free tier** handles up to 50,000 users (500 MB database)
- **Cost-effective scaling**: $25/month covers 100K+ users
- **PostgreSQL-based**: No vendor lock-in, open source
- **Native Google OAuth**: Seamless authentication
- **Data size per user**: 5-10 KB (storing only modified nodes)
- **Estimated implementation time**: 5-7 hours

---

## Current Implementation

### Persistence Mechanism

The application currently uses `@vueuse/core`'s `useLocalStorage()` composable for client-side persistence.

**Location**: `src/composables/useSphereData.ts:105-118`

**Storage Keys**:
- `ffx-sphere-grid-nodes-standard` - Standard grid (860 nodes)
- `ffx-sphere-grid-nodes-expert` - Expert grid (803 nodes)

**Data Stored**:
```typescript
// Full SphereNode[] array for each grid type
interface SphereNode {
  id: string                // e.g., "node-1"
  type: SphereType          // 12 possible values
  value: number
  locked: boolean
  abilityId?: number | null
  abilityName?: string
}
```

**Auto-save**: Watch-based persistence triggers on any node modification (lines 164-177)

### Existing Share Feature

The application already has URL-based sharing (`src/stores/gridSharing.ts`) that demonstrates efficient data encoding:

- **Only encodes modified nodes** (not full grid)
- Uses bit-packing compression
- Base64url encoding for URLs
- Average modified node: ~41 bytes JSON, smaller when bit-packed
- URL limit: 4000 characters

**This sharing implementation provides the perfect model for cloud storage.**

---

## Data Size Analysis

### Storage Requirements Per User

| Scenario | Modified Nodes | Storage Size |
|----------|----------------|--------------|
| Very light user (5%) | ~43 nodes | 3.3 KB |
| Typical user (10%) | ~86 nodes | 6.7 KB |
| Average estimate | ~120 nodes | 5-10 KB |
| Heavy user (50%) | ~430 nodes | 33 KB |
| Maximum (100% both grids) | ~1,663 nodes | 66.6 KB |

### Aggregate Storage Projections

| User Base | Storage (Realistic) | Storage (Maximum) |
|-----------|---------------------|-------------------|
| 1,000 users | 5-10 MB | 67 MB |
| 10,000 users | 50-100 MB | 670 MB |
| 100,000 users | 500 MB - 1 GB | 6.7 GB |

**Conclusion**: Extremely lightweight compared to most web applications. Storage costs will be negligible.

---

## Cloud Provider Comparison

### 1. Supabase (Recommended)

#### Pros
- **PostgreSQL-based**: Full SQL capabilities, complex queries, foreign keys
- **Open source**: Can self-host, no vendor lock-in
- **Real-time subscriptions**: Via PostgreSQL change notifications
- **Row Level Security (RLS)**: Fine-grained access control at database level
- **Generous free tier**: 500 MB database, 1 GB file storage, 50K monthly active users
- **Google OAuth**: Native support, simple integration
- **Transparent pricing**: $25/month Pro tier includes 8 GB + compute credits
- **Database backups**: Automated daily backups on Pro tier
- **Best for structured data**: Ideal when you need relationships and complex queries

#### Cons
- Free projects pause after 1 week inactivity (solved by upgrading to Pro)
- Requires SQL knowledge (vs NoSQL simplicity)
- Younger ecosystem than Firebase
- Free tier limited to 2 projects

#### Pricing
```
Free Tier:
  500 MB database
  1 GB file storage
  50,000 monthly active users
  Unlimited API requests
  FREE FOREVER

Pro Tier ($25/month):
  8 GB database
  100 GB file storage
  100,000 monthly active users
  Daily automated backups
  No project pausing
```

#### Cost Estimate for FFX App
- **0 - 50,000 users**: FREE (free tier)
- **50,000 - 500,000 users**: $25-50/month (Pro tier)
- **500,000+ users**: $50-100/month (with usage overages)

#### Best Use Case
Perfect for apps needing SQL power, cost predictability, open source solutions, and avoiding vendor lock-in.

---

### 2. Firebase Firestore

#### Pros
- **Google ecosystem integration**: Seamless with Google OAuth
- **Real-time sync**: Built-in automatic synchronization across devices
- **Offline caching**: Automatic local cache with sync when online
- **Mature ecosystem**: 10+ years of development, extensive libraries
- **VueFire library**: Excellent Vue 3 integration
- **Generous free tier**: 1 GB storage, 50K reads/day, 20K writes/day
- **Auto-scaling**: No server management required
- **Security rules**: Declarative access control

#### Cons
- **Vendor lock-in**: Proprietary Google service
- **Operation-based pricing**: Costs scale with read/write volume
- **Can get expensive**: High read volumes drive costs up quickly
- **NoSQL limitations**: Requires client-side joins for relational data
- **Less flexible querying**: Compared to SQL databases

#### Pricing
```
Free Tier (Spark):
  1 GB storage
  50,000 reads/day
  20,000 writes/day
  10 GB/month bandwidth

Pay-as-you-go (Blaze):
  $0.18 per GB stored
  $0.06 per 100,000 document reads
  $0.18 per 100,000 document writes
  $0.10 per GB bandwidth
```

#### Cost Estimate for FFX App
- **0 - 200 users**: FREE (free tier sufficient)
- **1,000 users**: $2-5/month
- **10,000 users**: $20-50/month (operation costs increase)
- **100,000 users**: $200-500/month (operation costs dominate)

#### Best Use Case
Ideal for real-time multi-device sync, Google Cloud Platform ecosystem, and rapid prototyping.

---

### 3. AWS DynamoDB

#### Pros
- **Extreme scalability**: 20M+ requests/second
- **Low latency**: Single-digit millisecond response times
- **Mature AWS ecosystem**: Deep integration with AWS services
- **Pay-per-request pricing**: No capacity planning needed
- **Free tier**: 25 GB storage, 25 read/write capacity units
- **Global tables**: Multi-region replication
- **DynamoDB Streams**: Change data capture

#### Cons
- **No built-in real-time sync**: Requires custom implementation
- **Steep learning curve**: More complex than Firestore/Supabase
- **No native OAuth**: Must use AWS Cognito (adds complexity)
- **Query limitations**: Harder to query than SQL or Firestore
- **AWS complexity**: Overwhelming for simple use cases
- **Vendor lock-in**: AWS-specific
- **More expensive for small apps**: Pricing favors high-scale applications

#### Pricing
```
Free Tier:
  25 GB storage
  25 read capacity units
  25 write capacity units

On-Demand Pricing:
  $1.25 per million write requests
  $0.25 per million read requests
  $0.25 per GB storage
```

#### Cost Estimate for FFX App
- **0 - 25,000 users**: FREE (free tier covers 25 GB)
- **100,000 users**: $50-100/month
- **Higher scale**: Cost-effective at massive scale

#### Best Use Case
High-scale server applications, AWS ecosystem apps, enterprise applications. Not ideal for client-heavy apps.

---

### 4. PocketBase (Self-hosted Alternative)

#### Pros
- **Single executable**: Extremely easy deployment
- **SQLite-based**: Lightweight, portable
- **Built-in auth**: Email/OAuth support included
- **Real-time subscriptions**: WebSocket support
- **File storage**: Built-in file handling
- **100% free**: If self-hosted
- **Open source**: Full control over code

#### Cons
- **Self-hosting required**: Need to manage server infrastructure
- **No auto-scaling**: Manual scaling required
- **Less mature**: Smaller community than alternatives
- **Single server**: Not distributed by default
- **Maintenance burden**: You handle updates, backups, security

#### Cost Estimate
- **Self-hosted on VPS**: $5-20/month (server costs only)
- **Managed hosting**: Variable

#### Best Use Case
Small projects, hobby apps, learning, or when you want complete control.

---

## Recommended Implementation

### Data Structure

**Store only modified nodes** to minimize storage and bandwidth:

```typescript
// Reuse existing ModifiedNode interface from gridSharing.ts
interface ModifiedNode {
  index: number      // Node index in grid array
  type: SphereType   // Modified sphere type
  value: number      // Modified value
}
```

### Supabase Database Schema

```sql
-- Users table (auto-created by Supabase Auth)
-- Provides: id, email, created_at, etc.

-- Sphere grids table
CREATE TABLE sphere_grids (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  grid_type TEXT NOT NULL CHECK (grid_type IN ('standard', 'expert')),
  modifications JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure one record per user per grid type
  UNIQUE(user_id, grid_type)
);

-- Create index for faster lookups
CREATE INDEX idx_sphere_grids_user_id ON sphere_grids(user_id);

-- Enable Row Level Security
ALTER TABLE sphere_grids ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own data
CREATE POLICY "Users can read own grids"
  ON sphere_grids FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own grids"
  ON sphere_grids FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own grids"
  ON sphere_grids FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own grids"
  ON sphere_grids FOR DELETE
  USING (auth.uid() = user_id);

-- Auto-update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_sphere_grids_updated_at
  BEFORE UPDATE ON sphere_grids
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### TypeScript Interfaces

```typescript
// Database record structure
interface StoredGrid {
  id: string
  user_id: string
  grid_type: 'standard' | 'expert'
  modifications: ModifiedNode[]
  created_at: string
  updated_at: string
}

// Supabase client types
interface Database {
  public: {
    Tables: {
      sphere_grids: {
        Row: StoredGrid
        Insert: Omit<StoredGrid, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<StoredGrid, 'id' | 'user_id' | 'created_at'>>
      }
    }
  }
}
```

### Firebase Alternative Schema

```typescript
// Collection structure: users/{userId}/grids/{gridType}
interface FirestoreGrid {
  gridType: 'standard' | 'expert'
  modifications: ModifiedNode[]
  createdAt: Timestamp
  updatedAt: Timestamp
}

// Firestore path examples:
// users/abc123/grids/standard
// users/abc123/grids/expert
```

---

## Access Patterns & Performance

### Read Operations

| Event | Reads | Frequency |
|-------|-------|-----------|
| User login | 2 | Once per session |
| Grid type switch | 1 | Infrequent (~0.1/session) |
| Auto-save | 0 | N/A (already loaded) |

**Monthly estimate per active user**: ~10 reads/month

### Write Operations

| Event | Writes | Frequency |
|-------|--------|-----------|
| Node modification | 1 | Debounced to 1 per 2-5 seconds |
| Session with edits | 3-5 | Per active editing session |

**Monthly estimate per active user**: ~30 writes/month

### Performance Optimization

**Debounced Auto-save**:
```typescript
// Batch modifications, write every 2-5 seconds
const debouncedSync = useDebounceFn(async () => {
  await syncToCloud(modifications.value)
}, 2000) // 2 second debounce
```

**Benefits**:
- Reduces write operations by 95%+
- Prevents rate limiting
- Minimal cost impact
- Good user experience (feels instant)

---

## Authentication Implementation

### Google OAuth with Supabase

```typescript
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types/database'

// Initialize Supabase client
const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

// Sign in with Google
async function sign_in_with_google() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`
    }
  })

  if (error) throw error
  return data
}

// Sign out
async function sign_out() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

// Get current user
async function get_current_user() {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  return user
}

// Listen for auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN') {
    // Sync localStorage → cloud
  } else if (event === 'SIGNED_OUT') {
    // Keep localStorage, clear cloud reference
  }
})
```

### Google OAuth with Firebase

```typescript
import { initializeApp } from 'firebase/app'
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut
} from 'firebase/auth'

// Initialize Firebase
const app = initializeApp({
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
})

const auth = getAuth(app)
const google_provider = new GoogleAuthProvider()

// Sign in with Google
async function sign_in_with_google() {
  const result = await signInWithPopup(auth, google_provider)
  return result.user
}

// Sign out
async function sign_out() {
  await firebaseSignOut(auth)
}
```

---

## Migration Path from localStorage

### Phase 1: Optional Cloud Sync (Low Risk)

**Approach**: Add cloud backup without changing existing behavior

```typescript
// Keep localStorage as primary storage
const nodes_local = useLocalStorage('ffx-sphere-grid-nodes', defaultNodes)

// Add optional cloud sync
async function backup_to_cloud() {
  if (user.value) {
    await supabase
      .from('sphere_grids')
      .upsert({
        user_id: user.value.id,
        grid_type: current_grid_type.value,
        modifications: get_modified_nodes()
      })
  }
}

// Manual backup button
<button @click="backup_to_cloud">Save to Cloud</button>
```

**Benefits**:
- No breaking changes
- User opt-in
- Gradual adoption
- Easy rollback

### Phase 2: Automatic Sync (Recommended)

**Approach**: Sync automatically on login, localStorage remains cache

```typescript
// On login, merge localStorage with cloud
async function sync_on_login() {
  const cloud_data = await fetch_from_cloud()
  const local_data = nodes_local.value

  // Strategy: Most recent wins
  if (cloud_data.updated_at > local_data.updated_at) {
    nodes_local.value = cloud_data.modifications
  } else if (local_data.updated_at > cloud_data.updated_at) {
    await save_to_cloud(local_data.modifications)
  }
}

// Debounced auto-save to cloud
watch(nodes_local,
  useDebounceFn(async (new_nodes) => {
    if (user.value) {
      await save_to_cloud(get_modified_nodes())
    }
  }, 2000)
)
```

**Benefits**:
- Works offline (localStorage cache)
- Auto-sync when online
- Cross-device synchronization
- Transparent to user

### Phase 3: Cloud-First (Optional Future)

**Approach**: Cloud becomes primary, localStorage is cache only

```typescript
// Load from cloud first
const nodes = ref<SphereNode[]>([])

async function load_grid() {
  if (user.value) {
    // Try cloud first
    const cloud_data = await fetch_from_cloud()
    nodes.value = apply_modifications(default_nodes, cloud_data.modifications)

    // Cache to localStorage
    localStorage.setItem('cache', JSON.stringify(nodes.value))
  } else {
    // Use localStorage if not logged in
    nodes.value = nodes_local.value
  }
}
```

**Benefits**:
- True multi-device sync
- Single source of truth
- Still works offline
- Better for future features (shared builds, etc.)

---

## Cost Projections

### Supabase (Recommended)

| User Count | Monthly Cost | Tier | Notes |
|------------|--------------|------|-------|
| 0 - 5,000 | **$0** | Free | Free tier easily handles |
| 5,000 - 50,000 | **$0** | Free | Still under 500 MB |
| 50,000 - 100,000 | **$25** | Pro | Pro tier required |
| 100,000 - 500,000 | **$25-50** | Pro | Some usage overages |
| 500,000+ | **$50-100** | Pro+ | May need extra resources |

**Why so cheap?**
- Small data size (5-10 KB per user)
- Low operation frequency (30 writes/month per user)
- Efficient debouncing
- PostgreSQL is highly efficient

### Firebase Firestore

| User Count | Monthly Cost | Operations/Month | Notes |
|------------|--------------|------------------|-------|
| 0 - 200 | **$0** | ~6,000 | Free tier sufficient |
| 1,000 | **$2-5** | ~40,000 | Mostly operation costs |
| 10,000 | **$20-50** | ~400,000 | Operations add up |
| 100,000 | **$200-500** | ~4,000,000 | Operations expensive |

**Why more expensive?**
- Per-operation pricing
- Reads cost $0.06 per 100K
- Even with debouncing, costs scale linearly

### Break-even Analysis

| Users | Supabase | Firebase | Savings with Supabase |
|-------|----------|----------|----------------------|
| 10K | $0 | $20-50 | $20-50/month |
| 50K | $0 | $100-250 | $100-250/month |
| 100K | $25 | $200-500 | $175-475/month |

**Supabase becomes 10-20x cheaper at scale.**

---

## Implementation Checklist

When ready to implement, follow these steps:

### 1. Supabase Setup (15 minutes)

- [ ] Create Supabase account
- [ ] Create new project
- [ ] Enable Google OAuth provider in Authentication settings
- [ ] Get OAuth credentials from Google Cloud Console
- [ ] Configure authorized redirect URIs
- [ ] Copy Supabase URL and anon key
- [ ] Run SQL schema (create `sphere_grids` table)
- [ ] Test RLS policies

### 2. Project Dependencies (5 minutes)

```bash
npm install @supabase/supabase-js
```

### 3. Environment Variables (5 minutes)

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Create Composables (2-3 hours)

- [ ] `useAuth.ts` - Authentication composable
  - Google sign in/out
  - Session management
  - User state

- [ ] `useCloudSync.ts` - Cloud synchronization composable
  - Fetch from cloud
  - Save to cloud (debounced)
  - Merge conflicts
  - Sync status

### 5. Modify useSphereData (1 hour)

- [ ] Integrate cloud sync with existing localStorage
- [ ] Add auto-sync on modification (debounced)
- [ ] Handle sync on login
- [ ] Add offline support

### 6. UI Components (1 hour)

- [ ] Sign in/out button
- [ ] User profile display
- [ ] Sync status indicator ("Synced", "Syncing...", "Offline")
- [ ] Last synced timestamp
- [ ] Optional: "Continue without account" flow

### 7. Testing (1 hour)

- [ ] Test sign in flow
- [ ] Test sync across devices
- [ ] Test offline → online sync
- [ ] Test conflict resolution
- [ ] Test localStorage fallback
- [ ] Verify RLS policies

---

## Future Enhancements

Once cloud storage is implemented, these features become possible:

### Social Features
- **Shared builds**: Publish your grid builds for others to view
- **Leaderboards**: Track optimal builds (min nodes for max stats)
- **Comments**: Discuss strategies on shared builds
- **Ratings**: Vote on best builds

### Advanced Features
- **Build comparison**: Compare your grid to others
- **Build history**: Track changes over time
- **Build templates**: Start from pre-made builds
- **Character profiles**: Save multiple builds per character

### Analytics
- **Popular nodes**: Which nodes are most activated
- **Average stats**: Community-wide statistics
- **Completion rates**: How many nodes users typically activate

**All enabled by PostgreSQL's query capabilities!**

---

## Security Considerations

### Data Privacy

**What's stored**:
- Email address (from Google OAuth)
- Sphere grid modifications (node indices, types, values)

**NOT stored**:
- Full name (unless user explicitly shares)
- Google profile data beyond email
- Device information
- Location data

### GDPR Compliance

**User rights**:
- Right to access: Users can export their data
- Right to deletion: `ON DELETE CASCADE` removes all user data
- Right to portability: Export as JSON

**Implementation**:
```typescript
// Export user data
async function export_user_data() {
  const { data } = await supabase
    .from('sphere_grids')
    .select('*')
    .eq('user_id', user.value.id)

  return JSON.stringify(data, null, 2)
}

// Delete user account and all data
async function delete_account() {
  // Supabase automatically cascades delete
  const { error } = await supabase.auth.admin.deleteUser(user.value.id)
}
```

### Row Level Security

RLS policies ensure:
- Users can only read their own data
- Users can only write to their own records
- No cross-user data leakage
- Database-level enforcement (can't bypass)

---

## Conclusion

**Recommended Implementation: Supabase with Automatic Sync**

**Key advantages**:
1. **Cost-effective**: Free for initial growth, $25/month handles massive scale
2. **Open source**: No vendor lock-in, can self-host
3. **PostgreSQL power**: Enables future features (leaderboards, social)
4. **Simple integration**: Clean API, good TypeScript support
5. **Automatic backups**: Peace of mind for users (Pro tier)

**Implementation effort**: 5-7 hours total

**When to implement**:
- Before public launch (if planning multi-device support)
- After basic features are stable
- When user base justifies backup system

**The data is so lightweight that storage costs will never be a concern, even at massive scale.**
