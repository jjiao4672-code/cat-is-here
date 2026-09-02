# Devpost submission copy

## Project name

Cat Is Here

## Tagline

Move from repeated guessing to one small real-world test.

## Try it out

Public URL: https://cat-is-here.onrender.com/?demo=competition&lang=en

Source code: https://github.com/jjiao4672-code/cat-is-here

## Inspiration

People often make a decision before reality has answered. A difficult conversation can become “this relationship is ending.” Unanswered applications can become “my ability is not enough.” The guess affects what the person does next, and avoiding action leaves the guess untested.

Cat Is Here gives that moment a clear shape. The goal is modest: look at one event, notice the judgment attached to it, and find one safe action that can add information.

## What it does

The user starts with one recent event. They can choose a broad option, type in their own words, or do both. If the entry is broad, Cat first asks for a concrete event. The second step asks about feeling. From there, AI selects one next question at a time from the answers the user has confirmed.

The interview covers interpretation, feeling, action or inaction, and the immediate and later result. It stops when those pieces are clear and has a ten-question limit. The user then writes what they see in the event before Cat offers a short reflection.

The result is an editable Problem Map. Facts stay separate from interpretations. Guesses remain marked as guesses. Unknowns stay visible. If the user explicitly writes a self-critical judgment such as “my ability is not enough,” Cat asks what fact could revise it. Cat does not introduce that judgment on its own.

Next, the user proposes one small action. Cat can offer one suggestion if asked, but the user decides what to do, when to do it, and when to stop. After the action, the user records what happened and updates the original judgment before Cat summarizes.

The competition demo includes two optional example openings:

- Relationship: fear of a bad answer keeps a conversation from starting.
- Job search: missing replies become a judgment about personal ability, which leads to stopping applications.

Both examples use the same interview and map path. They are not separate scripted products.

## How we built it

The interface uses native HTML, CSS, and JavaScript. IndexedDB stores only confirmed structured records in normal mode. A small Node.js service calls an OpenAI-compatible chat-completions API for structured question and map generation.

Safety routing happens in the browser before ordinary reflection. The service limits request size, removes common direct identifiers, treats user text as untrusted data, and validates model output before display. Questions must target an allowed field and must not repeat or add unsupported self-judgment. Maps must cite valid source IDs, preserve uncertainty, avoid diagnosis, and keep experiments under the user's control.

Competition mode disables browser persistence. The deployed server holds the model key in an environment variable, so judges do not enter their own key.

## Challenges

The hardest problem was stopping plausible language from becoming a false fact. A warm sentence can still be wrong.

The first versions could move too quickly, repeat a question, or write “not good enough” when the user had never said it. We changed the flow so a broad category must become one event, feeling comes before deeper interpretation, every required map field is asked, and unsupported self-worth language is rejected at the service boundary.

Model reliability was another problem. Generated JSON can be empty, malformed, repetitive, or structurally valid but unsuitable for the product. The service now retries parsing, gives failed output a bounded repair instruction, validates up to three candidates, and can use a deterministic gap question without fabricating a completed map. A failed map remains a visible failure until the user chooses a labeled synthetic example or retries Live AI.

## Accomplishments

- A complete event, questions, map, action, observation, user update, and Cat summary loop.
- One-question-at-a-time AI that uses confirmed prior answers.
- User-written summary before AI synthesis.
- Editable maps and experiments with explicit uncertainty.
- Competition mode with no Local Storage or IndexedDB writes.
- 116 passing automated checks.
- Chinese and English flows for desktop and mobile layouts.

## What we learned

An empathetic tone is not enough for a mental-health product. The useful boundary is knowing what the system may infer, what must remain unknown, and which judgments belong to the user.

The action also cannot promise a good outcome. In the relationship example, “Saturday works” confirms only that a conversation was scheduled. It does not prove where the relationship will go. That limited fact is still more useful than another round of guessing.

## What's next

Before use with real sensitive data, the project needs independent safety and accessibility reviews, verified regional crisis resources, provider and legal review, adversarial model testing, and user research focused on clarity and completion. It does not claim clinical effectiveness.

## Built with

HTML, CSS, JavaScript, Node.js, IndexedDB, structured JSON generation, and an OpenAI-compatible chat-completions API. The current default provider configuration is DeepSeek with `deepseek-v4-pro`.

## Suggested prize categories

- Best Mental Health Tool
- Responsible AI
- Best Use of AI/ML
- Best Design
- Best Innovation and Creativity
