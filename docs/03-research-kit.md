# Part 2 Deliverable: Qualitative Research Kit

**Status:** Ready for execution
**Objective:** Falsify the AI-generated hypotheses from Part 1. Prove that evaluation-cost is *not* the binding constraint, or validate it if falsification fails.

---

## 1. Screener (P8-1)
**Target:** Segment A (High-frequency, low-breadth). These users have proven trust and habit, making them the ideal wedge for category expansion.

### Screening Questions
1. **How many times have you ordered from Blinkit in the last 30 days?**
   - *Target:* ≥ 6 times. (Disqualify if < 6).
2. **Think about your last 5 orders. What did you buy?**
   - *Target:* Must mention ONLY 1 or 2 distinct L1 categories (e.g., Groceries/Dairy + Snacks). (Disqualify if they mention buying Electronics, Pet Care, Pharma, etc., alongside Groceries).
3. **When you need to buy a skincare product or a new brand of pet food, where do you typically buy it?**
   - *Target:* Mentions Nykaa, Amazon, Zepto, or offline stores. We want users who *actively buy* other categories, just not on Blinkit.

---

## 2. Discussion Guide (P8-2)
**Rule:** Ask open, adversarial questions. DO NOT lead the witness to agree with the evaluation-cost thesis.

### Section A: Baseline Behavior (10 mins)
- "Walk me through your last 3 Blinkit orders. What triggered them?"
- "You mentioned buying [Non-Blinkit Category, e.g., Skincare] on [Competitor App]. Can you walk me through the last time you bought that? From opening the app to checkout, what were you looking for?"
- "Did you consider checking Blinkit for that item? Why or why not?"

### Section B: Falsifying Evaluation-Cost (15 mins)
- "Think of a time you were looking for a product on Blinkit but didn't end up buying it. What happened?"
  - *If they say "I couldn't tell if it was good":* "Could you have googled it or checked Amazon reviews and then bought it on Blinkit for the speed? Why didn't you?"
- "Imagine Blinkit adds Amazon-style reviews tomorrow. Does that change what you buy? Or are you just looking for the cheapest price?"

---

## 3. Invalidation Probes (P8-3)
These probes test the 5 invalidation conditions from `06-mvp-concept.md`. If these are true, the Occasion Engine MVP concept must be scrapped.

1. **Awareness vs Evaluation:** "Did you know Blinkit sells [Baby Care / Electronics]? Have you ever looked at that section?" *(If they don't even know it exists, the contextual UI is too small; we need upstream merchandising).*
2. **Brand Trust:** "If you see a new brand of face wash on Blinkit, how do you decide if it's safe?" *(If they inherently distrust the brand supply, an AI reason isn't enough).*
3. **Trigger Timing:** "If Blinkit suggested an add-on while you were on the Cart screen, how would you react?" *(If they say "I'm in a rush, I'll research it later," the Cart is the wrong place).*
4. **Price Sensitivity:** "How do you compare prices for [Category] on Blinkit vs Amazon?" *(If they say they'd never buy a considered item on Blinkit because of convenience fees, the MVP economics fail).*
5. **Intrusiveness:** "How do you feel about pop-ups or suggestions right before you pay?" *(Testing the non-blocking inline sheet vs modal tolerance).*

---

## 4. Concept-Reaction Protocol (P8-4)
**Context:** Show the user the Occasion Engine prototype (a non-blocking sheet on the Cart screen).

### Scenario Test
1. "Imagine you just added dog food to your cart. As you go to checkout, this appears below your items: *'Restocking for the dog? Pet-safe floor cleaner. Regular phenyl is toxic to dogs.'*"
2. **Reaction:** "What is your immediate reaction to this?"
3. **Reason Value:** "Does the text 'Regular phenyl is toxic to dogs' make you more or less likely to buy it? What if it just said 'You might also like this cleaner'?"
4. **Occasion Plausibility:** "Does 'Restocking for the dog?' feel like a real reason to buy this now?"

---

## 5. Note-taking Template (P8-5)
*Rule: Never use names. Use P1 to P6.*

| Participant ID | Segment Match | Barrier to New Categories | Reaction to Reason-Led Prompt | Will they research elsewhere? | Key Quote |
|----------------|---------------|---------------------------|-------------------------------|-------------------------------|-----------|
| P1             | Yes / No      |                           |                               |                               |           |
| P2             | Yes / No      |                           |                               |                               |           |
| P3             | Yes / No      |                           |                               |                               |           |

---

## 6. Synthesis Framework (P8-6)
**AI vs Primary Reconciliation**

After all 6 interviews are complete, use this framework to evaluate the Discovery Engine's findings against the human primary research.

| Hypothesis | AI Discovery Engine Stance | Primary Research Reality | Reconciliation Decision |
|------------|----------------------------|--------------------------|-------------------------|
| **Binding Constraint** | Evaluation-cost (users lack decision tools) | *[To be filled]* | Keep / Discard |
| **Trust Transfer** | Trust does not transfer from Grocery to Skincare | *[To be filled]* | Keep / Discard |
| **Occasion Engine** | Reason-led suggestions resolve evaluation cost | *[To be filled]* | Keep / Discard |
