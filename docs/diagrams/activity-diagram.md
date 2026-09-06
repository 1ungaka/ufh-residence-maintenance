# Activity diagram - maintenance request workflow

From the moment a student notices a fault to the moment the repair is closed.

```mermaid
flowchart TD
  start([Student notices a fault]) --> login{Logged in?}
  login -- No --> auth[Log in or register] --> form
  login -- Yes --> form[Open the request form]

  form --> fill[Choose category, residence, room, urgency; describe the problem; optionally attach a photo]
  fill --> validate{Valid?}
  validate -- No --> error[Show what to fix] --> fill
  validate -- Yes --> save[(Save request with status Submitted and write the first history entry)]

  save --> queue[Request enters the prioritised queue]
  queue --> review[Worker reads the queue, highest priority first]
  review --> open[Worker opens the request]
  open --> mine{Already taken by someone else?}
  mine -- Yes --> other[Read only - the assigned worker owns it] --> review
  mine -- No --> assign[Assign to me - status becomes Assigned]

  assign --> begin[Start work - status becomes In Progress]
  begin --> work[Do the repair]
  work --> note{Anything to report?}
  note -- Yes --> addnote[Add a progress note to the history] --> work
  note -- No --> done{Repair finished?}
  done -- No --> work
  done -- Yes --> complete[Mark as completed - status Completed, completion time recorded]

  complete --> see[Student opens the request and reads the full history]
  see --> close[Worker closes the request - status Closed]
  close --> stop([End])
```

## Notes on the flow

- The only path into the queue is through validation, so no half-complete request is ever stored.
- The loop between *do the repair* and *add a progress note* is what the student actually sees
  while waiting; it is the difference between this and a WhatsApp message that disappears.
- The status can only move forward. The backend rejects any other jump, so the diagram is also
  the specification of `ALLOWED_TRANSITIONS` in `backend/src/utils/constants.js`.
