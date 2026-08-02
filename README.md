# Blinkit Category Expansion: The Occasion Engine

![Blinkit](https://upload.wikimedia.org/wikipedia/commons/2/25/Blinkit_logo.png)

> **Nextleap Graduation Project Submission**  
> **Role:** Product Manager, Growth Team, Blinkit

## 1. Project Overview
Blinkit has won the quick-commerce behavioural battle, becoming a weekly habit for millions. However, this habit has hardened into a ceiling: high-frequency users transact repeatedly but within a narrow band of 2-3 familiar categories.

**The Goal:** Increase the **Category Expansion Rate (CER)** — the percentage of Monthly Active Customers who purchase products from at least one new category every month.

**The Insight:** Users don't explore new categories because of **evaluation cost**. In a 10-minute delivery paradigm, taking the time to deliberate on a new product feels out of place. 

**The Solution:** The **Occasion Engine**. An AI-native feature that triggers when a user adds an item to their cart, infers the underlying "occasion," and surfaces 1-2 curated, cross-category items with a compelling reason to buy — all purchasable in one tap without blocking the cart flow.

---

## 2. Live Production Deployments
This MVP is fully functional and deployed live.

- 🌐 **Frontend (Next.js / Vercel):** [https://n-lblinkitmvp-at6x.vercel.app](https://n-lblinkitmvp-at6x.vercel.app)
- ⚙️ **Backend (Python / Railway):** [https://nlblinkitmvp-production.up.railway.app](https://nlblinkitmvp-production.up.railway.app)

*(Note: The backend `/config` endpoint is protected, but the frontend seamlessly communicates with the `/api/occasion` routes).*

---

## 3. The 4-Part Submission Structure
The complete project documentation is located in the [`docs/`](docs/) folder. I recommend reading them in this sequence:

1. **Part 1: Discovery & Validation:** [02-discovery-engine-report.md](docs/02-discovery-engine-report.md)
   - *How we analysed 977 reviews to uncover the evaluation cost barrier.*
2. **Part 2: Qualitative Research:** [03-research-kit.md](docs/03-research-kit.md) & [04-research-synthesis.md](docs/04-research-synthesis.md)
   - *How we tested the hypothesis against actual high-frequency, low-breadth Blinkit users.*
3. **Part 3: Problem Definition:** [05-problem-definition.md](docs/05-problem-definition.md)
   - *The final lock on the problem statement, root cause, and business value.*
4. **Part 4: MVP Architecture & Concept:** [06-mvp-concept.md](docs/06-mvp-concept.md) & [07-demo-journey.md](docs/07-demo-journey.md)
   - *The design of the Occasion Engine, its strict safety invariants, and the demo test flows.*

*For a deep dive into the initial problem space and metric definitions, see [01-problem-statement.md](docs/01-problem-statement.md).*

---

## 4. Demo Walkthrough
You can experience the Occasion Engine directly on the [live Vercel deployment](https://n-lblinkitmvp-at6x.vercel.app/demo). There are four specific test flows designed to validate our core invariants:

- **DF-A (The Core Moment):** Add **"Whole Wheat Atta 5kg"** to the cart. You will see cross-category suggestions (e.g., Home & Office, Cleaning) rather than more grocery items.
- **DF-B (Live AI Inference):** Add a combination of items (e.g., **Paneer + Cream + Naan**). The system will dynamically generate an occasion ("North Indian dinner party") using live Groq inference.
- **DF-C (The Safety Guard):** Add **"Pregnancy Test Kit"**. You will observe *nothing happens*. The system silently suppresses suggestions for sensitive categories to protect user privacy (Invariant 7).
- **DF-D (The Persona Filter):** The system knows the active persona already buys "Home & Office" products. Therefore, it will *never* suggest Home & Office items to them, forcing true category expansion (Invariant 3).

**Check the [Scorecard](https://n-lblinkitmvp-at6x.vercel.app/insights/scorecard)** to see real-time performance metrics and AI validation passes.

---

## 5. Honest Limitations (P15-5)
To evaluate this project accurately, please note the following constraints:
1. **Synthetic Catalogue:** We do not have access to Blinkit's actual product or inventory database. The demo uses a synthetic, 200+ SKU catalogue created specifically to test the engine.
2. **Curated, Not Generated, Reasons:** The LLM *selects* reasons from a human-reviewed fact set, but it never *authors* them. This is a deliberate design choice to mathematically eliminate hallucination risk on safety-critical copy.
3. **Lack of Internal Data:** Assumptions about basket co-occurrence and margin were extrapolated from public quick-commerce trends, not internal Blinkit data warehouses.

---

## 6. Local Development
To run this project locally:

### Prerequisites
- Node.js 18+
- Python 3.12+

### Setup
1. Clone the repository.
2. **Frontend:**
   ```bash
   npm install
   npm run dev
   ```
   *Runs on localhost:3000*
3. **Backend Engine:**
   ```bash
   cd engine
   python -m venv .venv
   source .venv/Scripts/activate  # Or .venv/bin/activate on Mac/Linux
   pip install -e .
   python -m uvicorn engine.api.main:app --reload --port 8000
   ```
   *Requires a valid `.env` with Groq API keys.*

---

*This project was submitted anonymously to preserve grading integrity.*
