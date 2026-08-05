# Slidea Interchange Format v1

One shape every tool writes, one importer in Slidea reads.

## Why a format and not importers

Four tools already hold overlapping content:

| Tool | Unit | What it is good at |
|---|---|---|
| **MathDigitizer** | `MathTask` | turning old worksheets, books and video into structured tasks |
| **math-curriculum-ai-navigator** | lesson / outcome | the curriculum itself — what is taught, when, under which outcome |
| **Slidea** | poll | live classroom interaction, 8 activity types |
| **ActionBounty** | `QuizStage` | gamified quests, location stages |

They are not four products, they are four stages of one pipeline: material is
**digitised**, placed against the **curriculum**, **taught live**, then
**practised** as a quest. Content should be able to move along it.

Wiring them to each other directly is six directions for three tools, twelve
for four. One documented format is one exporter and one importer per tool, and
the next tool costs two rather than two-times-N.

Slidea's importer lives in `src/lib/templateImport.js`. Any tool that writes
this shape can be imported without Slidea knowing the tool exists.

## The shared vocabulary — БРО outcome codes

A common format moves content. It does not, by itself, let two tools agree on
what a piece of content is *about*. For that they need one word for "percentages,
grade six" — and the tempting move, inventing an id scheme and asking the other
three to adopt it, means whoever migrates last blocks everyone.

That word already exists and belongs to none of these apps. БРО publishes an
outcome code per learning outcome:

```text
МА . 6 . 2 . 3
│    │   │   └── outcome within the topic
│    │   └────── topic within the year
│    └────────── grade
└─────────────── subject
```

MathDigitizer already extracts these from the source programmes
(`scripts/bro-curriculum-output.json`), the navigator's curriculum is built
around the same documents, and Slidea has carried `polls.curriculum_tags` since
the curriculum sprint. Nobody has to migrate to anybody. The state's code is the
join key.

What it buys, concretely — and this is machinery that already exists rather than
machinery this format proposes:

- `curriculum_benchmark(p_tag)` matches on `polls.curriculum_tags @> ARRAY[tag]`.
  A question imported from MathDigitizer under `МА.6.2.3` is immediately
  comparable against every other school that ran *any* question under the same
  outcome — even one authored in a different app.
- The RAG index (`match_curriculum`) returns `curriculum_tags`, so imported
  content is semantically searchable from the dashboard the moment it lands.
- Results can travel back the other way: an outcome a class scored 40% on is an
  outcome the navigator can point at, and a quest ActionBounty can generate.

Codes are optional. An import without them behaves exactly as before — the tags
are left empty rather than guessed, because a wrong outcome code silently
poisons a benchmark that other schools read.

## The document

```json
{
  "slidea_import": 1,
  "title": "Дропки — вежби",
  "subject": "Математика",
  "grade": "6 одделение",
  "description": "по избор",
  "curriculum": { "outcomes": ["МА.6.2.3"] },
  "source": {
    "app": "MathDigitizer",
    "url": "https://example.mk/od-kade-e-zemeno",
    "exportedAt": "2026-08-06T12:00:00Z"
  },
  "activities": [ … ]
}
```

`source` is optional but strongly encouraged. It travels with the content into
the template: a teacher deciding whether to trust a question deserves to know
where it came from, and a wrong answer needs a trail back to the tool that
produced it.

`curriculum.outcomes` applies to every activity in the document. An individual
activity may carry its own `outcomes` and override it — worth doing when one
worksheet spans two outcomes, unnecessary otherwise. `outcomes` and
`curriculum_tags` are accepted as spellings of the same field, so a tool that
already emits one of them needs no change.

Anything that is not a well-formed code is dropped rather than kept as a loose
topic label. Two tools carrying the free text "проценти" look like they agree
and do not; `МА.6.2.3` on both sides is the only agreement that holds.

## Activities

LaTeX between `$…$` works in every text field — it renders as mathematics on
the phone and on the projector.

```json
{ "type": "quiz", "question": "Колку е $1/2 + 1/4$?",
  "options": [ { "text": "3/4", "correct": true }, { "text": "2/6" } ],
  "explanation": "Прво заеднички именител." }

{ "type": "open", "question": "Објасни што е дропка.",
  "answer": "Дел од целина", "explanation": "…" }

{ "type": "fill_blanks", "question": "Симболот {{b1}} значи припадност.",
  "blanks": [ { "id": "b1", "accept": ["∈", "\\in"] } ] }

{ "type": "poll",     "question": "…", "options": [ { "text": "…" } ] }
{ "type": "ranking",  "question": "…", "options": [ { "text": "…" } ] }
{ "type": "wordcloud" | "rating" | "scale", "question": "…" }
```

Rules worth knowing before writing an exporter:

- **`quiz` needs exactly one `correct: true`.** None, or two, and the activity
  is dropped rather than assigned an answer. An invented answer key is
  discovered by a whole class at once.
- **`open` may carry an `answer`.** With one, the host can reveal it; without,
  the question behaves as an ordinary open question. It is never used to mark a
  student automatically — Macedonian free text inflects, and a confident wrong
  "incorrect" in front of a class is worse than no verdict.
- **`fill_blanks` marks gaps inline** with `{{b1}}`, `{{b2}}`. Every gap in the
  text needs an entry in `blanks`; checking is case- and space-insensitive.
- **Unknown types are dropped, not approximated.** A type Slidea cannot render
  reaches a projector as a blank, which is worse than not arriving.

## How import behaves

Partial by design. A file with twelve good activities and one broken one
imports twelve and lists what it skipped, with the activity number and the
reason. Refusing the whole file for one bad row teaches people to fix their
exporter by deleting content.

```js
const { ok, template, imported, skipped, errors } = importTemplate(json);
```

`errors` means nothing could be imported; `skipped` means some things were.

## Mapping from the other tools

### MathDigitizer — `MathTask`

`mathTaskToActivities()` in `templateImport.js` is a reference implementation,
kept here so both sides can read the same mapping.

| MathTask | Activity |
|---|---|
| `title` / `original_text` | `question` |
| last of `solution_steps` | `answer` (open) or the correct option |
| **`misconceptions[].mistake`** | **the wrong options** |
| `solution_steps` joined | `explanation` |
| `latex_formulas` | already inline in the text, renders as-is |

The interesting one is `misconceptions`. MathDigitizer records the mistakes
students actually make on a task, and those are exactly the distractors a
multiple-choice question wants: wrong answers that mean something, instead of
three invented near-misses. A task with two or more recorded misconceptions
becomes a quiz; anything less becomes an open question.

### ActionBounty — `QuizStage`

| `questionType` | Activity |
|---|---|
| `multiple_choice` | `quiz` with `options` and `correctAnswer` |
| `free_text` | `open` with `answer` |
| `ordering` | `ranking` — `orderingItems` in their correct order |
| `estimate_number` | `open` |
| `matching` | no equivalent — leave it out |

`hintText` has no home in a Slidea activity yet; the nearest fit is
`presenter_notes`, which only the host sees.

### math-curriculum-ai-navigator — lesson

The navigator holds the curriculum rather than questions, so it is the tool that
mostly *supplies* codes rather than content:

| Navigator | Interchange |
|---|---|
| lesson title | `title` |
| grade | `grade` |
| outcome codes on the lesson | `curriculum.outcomes` |
| national standards (`I-A.1`) | not carried — see below |
| generated practice questions | `activities` |

The national standards (`I-A.1`, cross-curricular competencies) are a second,
coarser vocabulary. They are deliberately *not* part of v1: they describe a
competence spanning every subject, so benchmarking on one compares a maths class
against a language class and reports a number that means nothing. Outcome codes
are the level at which two classes are actually doing the same thing. If a use
appears that genuinely needs them, they belong in a separate field, not mixed
into `outcomes`.

### Direction of travel

Nothing here makes any tool depend on another. Each writes files; each reads
files:

```text
MathDigitizer ──┐                  ┌──► Slidea      (teach it live)
                ├─ outcome code ───┤
navigator ──────┘                  └──► ActionBounty (practise it as a quest)
                                            │
        results, tagged with the same code ─┘
```

The loop closes because the code that arrived with the question is still on the
results — which is what makes "grade six is weak on `МА.6.2.3`" a sentence any
of the four can say and the other three can act on.

## Versioning

`slidea_import` is an integer. A file declaring a **newer** version still
imports — the activities this version understands are taken and the rest
reported as skipped, because a newer file usually still holds usable content.
A file with no version at all is refused: it is not this format.
