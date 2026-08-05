# Load tests

Two scripts, both meant to run **from the VPS itself**, never from a laptop.

```bash
# on the VPS
cd /root/loadtest
export LOADTEST_EMAIL=...    # an admin account
export LOADTEST_PASSWORD=...

# one event, many participants — "can a 300-person webinar hold?"
node single_event_test.mjs <participants> [rampMs]

# many events at once — "can a school run a whole shift?"
node multi_event_test.mjs <events> <participantsPerEvent> [rampMs] [voteSpreadMs]
```

Both create their own test events, run the exact six realtime channels
`useEvent.js` subscribes to, fire `increment_vote`, verify the counts landed in
the database, and delete everything afterwards.

`voteSpreadMs` is the difference between a synthetic spike and a real room. At
`0` every simulated student taps in the same millisecond — physically
impossible across sixteen classrooms, and the number that used to be quoted.
Pass a window (20000 is a reasonable school figure) to see what actually
happens.

## Two methodology traps, both hit for real

**1. Never run from your own machine.** (21.07.2026) The first attempts, run
from a home Windows machine, showed ~55% success at 300 participants. The same
script from the VPS showed 100%. The bottleneck was the home network path, not
the server. Results from a laptop are not just noisy, they are false.

**2. Watch the harness's own CPU.** (05.08.2026) This VPS has **two cores**.
Above roughly 700 simulated participants, the Node process running the test
consumed **123% CPU** — more than a full core — while `supabase-db` sat at 44%
peak and mostly under 16%. The degradation measured there is the test
competing with the server for the same two cores, not a server limit. Any
figure above ~650 from this setup measures the harness. To go higher, drive the
load from a second machine in the same datacenter.

## Measured results

### Single event (21.07.2026)

| Participants | Connect | Vote success | p50 / p95 |
|---|---|---|---|
| 300 | 100% | **100%** | 1.6s / 2.2s |
| 500 | 100% | 85–94% (varies) | 1.8s / 3.3s |

### Many simultaneous events (05.08.2026)

Modelled on a real school: 60 staff, ~half using the tool, up to 26 students
per class, roughly 16 classes in one shift.

| Events × participants | Total | Vote spread | Connect | Vote success | p50 |
|---|---|---|---|---|---|
| 16 × 26 | 416 | 0ms (synthetic spike) | 100% | **100%** | 4.7–6.2s |
| 16 × 26 | 416 | 20s (realistic) | 100% | **100%** | **8ms** |
| 24 × 26 | 624 | 20s | 100% | **100%** | 7ms |
| 28 × 26 | 728 | 20s | 96–99% | 53–89% (varies) | 5ms |
| 32 × 26 | 832 | 20s | 85.6% | 82.2% | 7ms |

**What this establishes.** A whole school shift — sixteen classes, 416
students, all voting — completes with no lost votes at all, and in the
realistic case each vote lands in about 8ms. Twenty-four simultaneous classes
with 624 students is still 100%.

**What it does not establish.** The 728 and 832 rows are not a server ceiling;
see trap 2. They are the point where the test harness saturated the box. The
server's own database peaked at 44% of one core during those runs.

**Where the real limit would bite first.** Under a genuinely simultaneous
burst (spread 0), `supabase-db` reached 72% CPU and load average 5.5 on two
cores. Vote loss was still zero, but latency stretched to ~6s. That is the
scenario to watch, and the fix is cores: a 4-core box should roughly halve it.
Realtime, PostgREST and Kong were all near idle throughout — the constraint is
database CPU, not connection limits.

Tenant limits currently configured: `max_concurrent_users=1000`,
`max_events_per_second=1000`, `max_joins_per_second=500`,
`max_channels_per_client=100`. Postgres `max_connections=200`. None of these
were the binding constraint in any run above.

## Re-measured after fixing realtime (06.08.2026)

`postgres_changes` had never worked on this server: the `supabase_realtime`
publication was empty, so `polls`, `options` and `events` published nothing and
the app ran entirely on its 3-second REST fallback. That is what the earlier
table actually measured — polling, not push.

With 416 participants re-polling every three seconds the database sees roughly
139 queries a second continuously, which is why `supabase-db` sat at 72% CPU
during the burst while the realtime container idled at 1%. The bottleneck was
never the voting.

Tables added to the publication, realtime restarted, and `votes` deliberately
left out — nothing subscribes to it, so publishing it was WAL decoding for no
benefit.

| Scenario | Before (polling) | After (realtime) |
|---|---|---|
| 16 × 26 = 416, realistic 20s spread | 100%, p50 8ms | **100%, p50 6ms** |
| 24 × 26 = 624, realistic 20s spread | 100%, p50 7ms | **100%, p50 8ms** |
| 16 × 26 = 416, synthetic 0ms burst | 100%, p50 4.7–6.2s | 85–100% (varies), **p50 1.5–3.1s** |
| DB CPU during burst | 72% | 25% peak, mostly under 6% |
| Realtime CPU during burst | 1% | 19–25% |

**Read this honestly.** The realistic case — the one that happens in a school —
is unchanged at 100% and slightly faster, and the database is no longer the
constraint. The synthetic burst, where every student in sixteen rooms taps in
the same millisecond, got two to four times faster but lost its perfect
success rate: five runs came in at 85.6, 92.3, 92.3, 100 and 100 percent.

That variance is not new. The original single-event test recorded "85–94%,
varies" at 500 participants, so the extreme is where this stack has always
wobbled. What changed is that latency under the extreme fell from six seconds
to under three, and the load moved off the database, which is the constraint
that would bite first as schools are added.

Nothing above 650 has been measured from this setup — the harness saturates the
VPS's two cores before the server does. See trap 2 above.
