# GitHub Similar Projects Research

## Research Context

- Research date: 2026-08-14
- Target product: AdlerLens
- Product concept: A warm, cat-led self-reflection web product for everyday anxiety, relationship concerns, procrastination, and self-doubt.
- Core interaction: The user mainly answers multiple-choice questions. The system progressively narrows the problem space in an Akinator-like flow, then generates a cautious interpretation and a small action.
- Psychological framework: Adlerian psychology is used as a reflection lens, not as medical diagnosis.
- Important distinction: AdlerLens is not intended to be an AI therapist, diagnostic instrument, or replacement for professional care.

Star counts and repository activity are snapshots from the research date and may change. A repository without an explicit license may be studied, but its code and assets should not be copied or redistributed.

## Executive Finding

No repository found in this search combines all of the following:

1. Choice-first interaction with minimal typing.
2. Akinator-like progressive narrowing of the user's real-life difficulty.
3. Adlerian concepts such as purpose, belonging, inferiority, courage, and separation of tasks.
4. A fixed cat character with a consistent narrative voice.
5. A narrow focus on everyday anxiety, relationships, procrastination, and self-doubt.
6. Deterministic local safety routing plus AI-generated provisional analysis.
7. Returning-user continuity such as "this is your second day talking with the cat."

Most comparable projects are generic chatbots, conventional mental-health questionnaires, mood trackers, or broad wellness dashboards. AdlerLens therefore has a defensible product distinction if it preserves its fast, structured inference flow.

---

## 1. RASA Mental Health Chatbot

- Repository: https://github.com/stutisehgal/RASA-Mental-Health-Chatbot
- Approximate stars: 59
- Main technology: Python, Rasa
- Last meaningful push found: 2021-05-26
- License: No explicit license detected
- Similarity: High for questionnaire-driven conversational narrowing; low for character design and daily continuity

### Description

A Rasa chatbot that uses a survey questionnaire and conversational flow to estimate a person's chances of having a mental illness and attempts to improve the user's mood.

### Strengths

- Uses an explicit conversation flow instead of relying entirely on free-form generation.
- Demonstrates intent recognition and contextual routing.
- Shows how survey answers can influence later chatbot behavior.
- Its architecture is easier to inspect than a single opaque LLM prompt.

### Weaknesses

- Frames the result as the probability of mental illness, creating medical and ethical risk.
- The question flow appears closer to screening than to understanding an everyday situation.
- Limited visible safety, privacy, uncertainty, and output-validation design.
- Old implementation and ecosystem assumptions.
- No explicit license, so code should not be copied.

### Useful Lessons for AdlerLens

- Reuse the architectural idea of deterministic routing by intent and selected answers.
- Keep AdlerLens's safer language: "provisional understanding" rather than illness prediction.
- Do not copy its diagnostic framing.

---

## 2. Building a Chatbot for Mental Health Support

- Repository: https://github.com/Okes2024/Building-a-Chatbot-for-Mental-Health-Support
- Approximate stars: 59
- Main technology: Python, scikit-learn, TF-IDF, LinearSVC
- Last push found: 2025-09-23
- License: README claims MIT, but GitHub did not expose a recognized license during research; verify before reuse
- Similarity: High for safety routing; medium for topic classification; low for UI

### Description

An educational, synthetic-data mental-health chatbot that classifies intents such as stress, anxiety, low mood, sleep, grounding requests, medical advice, self-harm, and crisis.

### Strengths

- Separates crisis and medical-advice requests from ordinary conversation.
- Uses a small local classifier, reducing dependence on a cloud model for safety decisions.
- Includes synthetic labeled examples that make behavior testable.
- Explicitly states that it is not therapy or medical advice.
- Demonstrates a practical safety-first processing order.

### Weaknesses

- Primarily a command-line technical demonstration, not a complete user product.
- Intent categories are broad and do not deeply reconstruct the user's actual situation.
- Synthetic training data can produce blind spots and demographic bias.
- Simple keyword or classifier routing is insufficient as the only safety layer.
- License status needs manual verification.

### Useful Lessons for AdlerLens

- Best reference for a local input safety and intent gate before sending text to an LLM.
- Build a small, product-specific evaluation set for crisis, medical, violent, and ordinary messages.
- Keep the existing structured branch flow as the main inference system; use classification only for routing.

---

## 3. Mental Health Support Chatbot

- Repository: https://github.com/Vikranth3140/Mental-Health-Support-Chatbot
- Live demo: https://mental-health-support.streamlit.app/
- Approximate stars: 44
- Main technology: Python, Streamlit, OpenAI API, TextBlob
- Last push found: 2025-02-03
- License: MIT
- Similarity: High for AI responses and session summaries; medium for mood continuity; low for progressive questions

### Description

A Streamlit chatbot offering sentiment analysis, mood tracking, personalized coping strategies, conversation summaries, and crisis resources.

### Strengths

- Combines immediate conversation with mood history.
- Session summaries create a clear ending to each interaction.
- Provides actionable coping suggestions rather than conversation alone.
- Has a working hosted demonstration.
- MIT license permits reuse under its terms.

### Weaknesses

- The primary interface is still an open chat box, which creates high expression cost for anxious users.
- Sentiment analysis is too shallow to infer the structure of a real-life problem.
- Generic coping strategies may feel interchangeable or impersonal.
- A single LLM conversation can drift beyond product scope.
- Streamlit limits fine-grained branded interaction and animation.

### Useful Lessons for AdlerLens

- Add a concise session summary and let users correct it.
- Use stored mood and topic metadata for the returning-user greeting, not complete private transcripts.
- Do not replace the structured selection flow with generic chat.

---

## 4. MindGarden

- Repository: https://github.com/Devina0810/Mindgarden
- Live demo: https://mindgarden-platform.onrender.com
- Approximate stars: 2
- Main technology: React, Vite, TypeScript, Tailwind CSS, Framer Motion, Chart.js, Gemini API, Firebase
- Last push found: 2025-07-25
- License: No explicit license detected
- Similarity: High for AI companion and longitudinal features; low for focused diagnosis flow

### Description

A broad mental-wellness platform combining journaling, mood tracking, trend charts, guided meditation, and an AI companion named Aura.

### Strengths

- Demonstrates how an AI companion can coexist with non-chat features.
- Mood trends provide meaningful continuity across multiple visits.
- Uses a modern frontend stack suitable for animation and dashboards.
- Offers a complete hosted product experience.

### Weaknesses

- Broad feature set makes the core product promise unclear.
- Journaling requires substantial typing, especially when users are already distressed.
- Risks becoming a standard wellness dashboard with an AI chatbot attached.
- Storing journals and chat data increases privacy and security obligations.
- No explicit license, so code and assets should not be copied.

### Useful Lessons for AdlerLens

- Borrow the idea of lightweight emotional trends and returning-user continuity.
- Avoid adding meditation, courses, journals, and dashboards before the core inference flow is excellent.
- Store minimal derived metadata where possible instead of full sensitive text.

---

## 5. Pixy Mood Tracker

- Repository: https://github.com/mrzmyr/pixy-mood-tracker-app
- Product site: https://pixy.day
- Approximate stars: 149
- Main technology: React Native, Expo
- Last push found: 2026-08-03
- Maintenance status: README states that the current version is no longer actively maintained
- License: MIT
- Similarity: High for low-friction daily check-ins; low for analysis and conversation

### Description

A minimalist mood tracker where the user records one mood pixel per day.

### Strengths

- Extremely low input cost.
- Daily continuity is visible immediately.
- Simple visual history encourages return visits without requiring long journals.
- Clear and narrow product promise.
- MIT license permits reuse under its terms.

### Weaknesses

- A single mood value cannot explain context, thoughts, fears, or protective behavior.
- No personalized analysis or conversational support.
- No mechanism for distinguishing emotional distress from a solvable external constraint.
- Current version is not actively maintained.

### Useful Lessons for AdlerLens

- Strong reference for "today is day X with the cat" and calendar-based continuity.
- Keep daily recording optional and extremely brief.
- Record compact attributes such as topic, intensity, and chosen action rather than complete conversations.

---

## 6. Aura 3.0 AI Therapist Agent

- Repository: https://github.com/mendsalbert/ai-therapist-agent
- Live demo: https://ai-therapist-agent.vercel.app
- Approximate stars: 47
- Main technology: TypeScript, generative AI, blockchain components
- Last push found: 2026-03-12
- License: No explicit license detected
- Similarity: Medium for character-like AI support and crisis claims; low for interaction simplicity

### Description

An expansive AI therapist concept combining conversational support, crisis detection, progress tracking, mindfulness activities, blockchain records, tokens, NFTs, and smart-environment integrations.

### Strengths

- Presents progress tracking and crisis response as first-class product concerns.
- Shows how a companion can have a named identity and a broad interaction system.
- Provides screenshots and a hosted experience useful for competitive review.

### Weaknesses

- Excessive feature scope weakens the central mental-health use case.
- Blockchain, tokens, and NFTs add complexity without clearly improving user outcomes.
- Strong claims such as AI therapy and HIPAA compliance require evidence that is not established by a README badge.
- Complex architecture increases privacy, reliability, and maintenance risks.
- No explicit license, so code and assets should not be copied.

### Useful Lessons for AdlerLens

- Treat this primarily as an anti-pattern for feature accumulation and unsupported clinical claims.
- Keep the cat as a narrative and interaction device, not as a claim of professional authority.
- Only add technology when it directly reduces user effort, improves safety, or improves inference quality.

---

## Comparative Matrix

| Project | Structured Questions | AI Chat | Safety Routing | Daily Tracking | Character | Psychological Framework | Main Risk |
|---|---:|---:|---:|---:|---:|---:|---|
| RASA Mental Health Chatbot | Yes | Limited | Limited | No | No | Generic screening | Diagnostic framing |
| Safety-first synthetic chatbot | No | Template-based | Yes | No | No | Generic support | Synthetic-data blind spots |
| Streamlit Mental Health Support | No | Yes | Basic | Yes | No | Generic support | Generic advice and model drift |
| MindGarden | No | Yes | Unclear | Yes | Named companion | Generic wellness | Excessive scope and stored sensitive data |
| Pixy Mood Tracker | No | No | No | Yes | No | None | Too little context |
| Aura 3.0 | No | Yes | Claimed | Yes | Named agent | Mixed | Overengineering and unsupported claims |
| AdlerLens | Yes, progressive | Optional 3-question deepening | Local first | Seven-day local cycle | Cat problem organizer | Adlerian reflection | Must keep testing safety and output quality |

## Recommended Product Direction

AdlerLens should not become a generic AI therapist or an all-in-one wellness platform. Its strongest product architecture is:

1. Local safety check.
2. Low-effort structured choices.
3. Dynamic branch selection based on the emerging problem shape.
4. Optional short free-text clarification.
5. Local input safety and scope validation.
6. AI-generated provisional interpretation with explicit uncertainty.
7. Local output validation before display.
8. One immediate action, one action for today, and one observation target.
9. Minimal longitudinal memory: date, topic, intensity, selected action, and user correction.

## Features Worth Borrowing

- From the safety-first chatbot: local intent and crisis classification.
- From the Rasa project: deterministic contextual routing.
- From the Streamlit chatbot: session summaries and correction.
- From MindGarden: lightweight trend visualization.
- From Pixy: one-action daily check-in and visible continuity.

## Features to Avoid

- Claiming to diagnose disorders or estimate mental-illness probability.
- Presenting the cat as a therapist, doctor, or clinical authority.
- Making a free-form chat box the primary interface.
- Saving complete sensitive conversations by default.
- Adding journals, meditation, courses, communities, blockchain, tokens, or NFTs before the core inference experience is validated.
- Copying code or assets from repositories without an explicit compatible license.

## Suggested Competitive Positioning

> The cat does not wait for the user to organize difficult feelings into a perfect explanation. Through a short sequence of low-effort choices, it helps reconstruct what happened, what felt threatening, what the user feared it meant, and what small action is realistically available next.

This positioning is more specific than "AI mental-health chatbot" and should remain central in product design, evaluation, and competition materials.
