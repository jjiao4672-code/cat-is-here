# Responsible AI and data safety

## Product boundary

Cat Is Here helps a user reflect on one everyday event and test one prediction. It does not diagnose, provide treatment, determine personality or attachment type, read another person's motives, or handle a crisis as an ordinary reflection task.

## What the model receives

Each interview request contains the current event, the broad entry option when used, and answers already confirmed in this session. A map request contains those source-bound answers and the user's summary or correction. Saved history from earlier events is not automatically added.

Before transmission, the Node service removes common email addresses, phone-number formats, and Chinese ID-number formats. This is a limited regex filter, not a guarantee of anonymity.

## What is stored

Competition mode keeps the walkthrough in memory and does not write to Local Storage or IndexedDB.

In normal mode, nothing becomes a long-term record until the user explicitly chooses “Leave it with Cat” or “留给小猫.” The saved record contains the confirmed event summary, map, questions asked, experiment, observations, and final update. It does not contain a verbatim transcript. Records can be deleted individually or cleared from the browser.

## Data flow

![Cat Is Here reflection data lifecycle](./artifacts/diagrams/cat-is-here-data-flow.svg)

| Stage | Location | Data |
|---|---|---|
| Safety routing | Browser | Current structured answer and safety choice |
| Active interview | Browser memory | Current event, confirmed answers, source IDs, and field state |
| Next-question request | Node service and configured provider | Current event and confirmed answers needed for the next question |
| Map request | Node service and configured provider | Confirmed current-event fields, user summary, and correction if present |
| Optional saved record | Browser IndexedDB | Confirmed structured record only |
| Not kept as a long-term record | Browser memory | Verbatim interview transcript and unconfirmed free text |

## Safeguards in the current build

- Deterministic crisis and real-world violence routing runs before ordinary AI analysis.
- Safety-marked requests are rejected by the API layer.
- Requests larger than 50,000 characters are rejected.
- User text is marked as untrusted data and cannot change the system role or safety rules.
- A broad entry must become one concrete event before deeper interpretation.
- Feeling is requested before deeper interpretation in the live competition flow.
- Each generated round contains one short reflection, one question, one allowed target field, and one to three optional answers. Free text remains available.
- Repeated questions and repeated fields are rejected, except one useful second pass for a fact check, alternative explanation, or counterevidence.
- The service cannot introduce “not good enough,” “incapable,” or equivalent self-worth language unless the user already wrote it.
- Action and immediate or later result must be asked before a complete map can be built.
- The interview stops when the needed fields are covered and never exceeds eight rounds.
- The user writes a summary before Cat reflects it.
- Generated output is parsed as JSON and validated up to three times. Failed output receives a bounded repair instruction that cannot change the source facts.
- A mid-interview generation failure can use a deterministic question for the next missing field. It cannot generate a completed map.
- Problem Map fields require valid source IDs. Missing, unknown, and valid absence are kept separate.
- Candidate concepts are restricted and cannot be presented as diagnoses. The current competition map returns no concept label.
- Experiments must be controllable, stoppable, and non-manipulative. A relationship experiment cannot secretly test another person.
- The user can edit or reject the map and experiment.
- A failed map does not silently switch to fixed output. A labeled synthetic example appears only after the user's choice, and Live AI remains available for retry.
- Hosted competition mode keeps the API key on the server and blocks browser replacement of that key.

## Failure behavior

The model call retries once when it returns empty or malformed JSON. A structurally readable candidate can receive two repair requests, giving the validator up to three candidates.

If a follow-up still cannot pass, the server returns a deterministic question for the next missing field so the interview does not discard the user's progress. If final map generation fails, the page stops. It offers Retry Live AI or a labeled synthetic example. Fixed map output is never inserted without that choice.

## Known limits

- Regex redaction can miss identifiers and context that makes a person recognizable.
- Source IDs prove that a field points to an answer, but they do not independently prove semantic entailment.
- Prompt and validator rules reduce unsupported claims but cannot guarantee model behavior under every input.
- No independent clinical validation, demographic bias audit, penetration test, or external adversarial evaluation has been completed.
- Region-specific crisis resources are not maintained as a verified directory.
- Browser-local storage is not an encrypted medical-record system.
- Provider terms, retention, data-processing agreements, and applicable law require review before processing real sensitive health information.
- The custom font and generated-image provider licenses still need final documentation before public release.
- The hosted public demo and live-model quality sample are not complete.

The competition walkthrough may use labeled synthetic input while exercising the actual model path. Public use with real personal data remains out of scope.
