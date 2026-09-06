# Algorithms

## The problem

A residence has more open maintenance requests than workers. Two obvious orderings both fail:

- **Oldest first** ignores urgency, so a broken desk drawer is repaired before a room with no
  electricity.
- **Most urgent first** ignores age, so a Low-urgency request can sit forgotten for months while
  new High-urgency ones keep overtaking it.

The portal therefore orders the work queue with a **priority scoring algorithm** that combines
both, with an ageing rule that stops anything being starved indefinitely.

Implementation: `backend/src/services/priority.js`. Tests: `backend/tests/priority.test.js`.

## Specification

**Input:** a list of open maintenance requests, each with an `urgency` (`High`, `Medium` or
`Low`) and a `created_at` timestamp.

**Processing:** give every request a numeric score, then sort by that score, highest first.

```
priorityScore = urgencyPoints + ageingPoints

urgencyPoints:  High = 300, Medium = 200, Low = 100
ageingPoints :  min(whole hours since created_at, 99)
```

**Output:** the same requests, ordered as a work queue, each carrying its `priority_score`.

**Tie-breaking:** equal scores are settled by the older request first, then by the lower id, so
the order is always deterministic - the same input always produces the same queue.

## Why those numbers

The urgency bands are 100 points apart and ageing is capped at 99. That single choice gives the
behaviour the residence needs:

- Urgency always dominates: **a brand-new High request still outranks the oldest possible Low
  request** (300 + 0 = 300 > 100 + 99 = 199).
- Within a band, age decides: two High requests are separated purely by how long they have
  waited, so it is first-come-first-served among equals.
- Ageing is visible but bounded: after four days a Medium request has gained 96 points, which
  lifts it above every fresher Medium request, but never above a High one.

## Worked example

Queue on a Monday morning, scores calculated at 08:00:

| Request | Category | Urgency | Submitted | Urgency pts | Ageing pts | Score |
|---|---|---|---|---|---|---|
| #1 | Electrical | High | 30 hours ago | 300 | 30 | **330** |
| #5 | Door / Lock | High | 6 hours ago | 300 | 6 | **306** |
| #6 | Water | Medium | 48 hours ago | 200 | 48 | **248** |
| #2 | Plumbing | Medium | 20 hours ago | 200 | 20 | **220** |
| #4 | Furniture | Low | 96 hours ago | 100 | 96 | **196** |

Reading the result: both High requests come first, oldest of the two leading. The four-day-old
Low furniture request has climbed to 196, close behind the Medium requests, and will pass a newly
submitted Medium request (200 + 0 = 200) once it is a little older still - but it can never
overtake an electrical fault.

This is exactly the output of the running system; the same ordering appears on the maintenance
dashboard with the demo data.

## Pseudocode

```
function prioritise(requests, now):
    for each request r in requests:
        urgencyPoints = { High: 300, Medium: 200, Low: 100 }[r.urgency]
        hoursWaiting  = (now - r.created_at) in whole hours, minimum 0
        ageingPoints  = min(hoursWaiting, 99)
        r.priority_score = urgencyPoints + ageingPoints

    sort requests by:
        priority_score descending
        then created_at ascending      (older first)
        then id ascending              (stable, deterministic)

    return requests
```

The function copies each request before adding the score, so the caller's array is never
modified (test TC-P05).

## Complexity

Scoring is one pass over the list: **O(n)**. The sort is **O(n log n)**, which dominates, so the
algorithm is **O(n log n)** in time and **O(n)** in space. For a residence with a few hundred
open requests this is instant. Scores are calculated when the queue is requested rather than
stored in the database, because a stored score would be wrong the moment an hour passed.

## Where it runs

- `GET /api/requests?scope=open` - the full maintenance work queue
- `GET /api/dashboard` - the top five jobs on the maintenance dashboard

The dashboard shows the score in its own column, so the ordering can be explained on screen.
Adding `sort=newest` to the request list switches back to plain reverse-chronological order,
which is useful for showing the difference during the demonstration.

## Supporting calculations

`backend/src/services/metrics.js` computes the simple dashboard statistics with basic arithmetic
over the rows:

- **Counts per status** - one `GROUP BY status` query, mapped into Submitted / Assigned / In
  Progress / Completed / Closed, plus totals and the number still open.
- **Average resolution time** - for every request with both `created_at` and `completed_at`, the
  difference in hours, averaged and rounded to one decimal, then displayed as hours or days.

```
averageResolutionHours = sum(completed_at - created_at) / number of completed requests
```

There is no machine learning anywhere in this project, and none is needed: the ordering rule is
one a residence supervisor could apply on paper, which is precisely what makes it defensible.
