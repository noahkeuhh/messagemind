# AI Chat Coach - Compleet Tier & Credit Systeem

**Versie:** 2.0  
**Laatst bijgewerkt:** 28 december 2025  
**Document:** Volledige uitleg abonnementen, analyse opties, credits en tokens

---

## 📋 Inhoudsopgave

1. [Overzicht Abonnementen](#overzicht-abonnementen)
2. [Analyse Modi](#analyse-modi)
3. [Credit Kosten Berekening](#credit-kosten-berekening)
4. [Token Limieten per Tier](#token-limieten-per-tier)
5. [AI Model & Provider](#ai-model--provider)
6. [Gedetailleerde Tier Specificaties](#gedetailleerde-tier-specificaties)
7. [Credit Voorbeelden](#credit-voorbeelden)
8. [Technische Implementatie](#technische-implementatie)

---

## 🎯 Overzicht Abonnementen

### Free Tier
**Prijs:** €0  
**Credits:** 0 per dag (1 gratis analyse totaal)  
**Analyse limiet:** 1 snapshot analyse (lifetime)

| Feature | Beschikbaar |
|---------|-------------|
| Snapshot mode | ✅ Ja (1x totaal) |
| Expanded mode | ❌ Nee |
| Deep mode | ❌ Nee |
| Afbeelding analyse | ❌ Nee |
| Chat geschiedenis | ❌ Nee |
| AI Model | Groq llama-3.3-70b |

**Gebruik:**
- Perfect om de service te testen
- 1 gratis snapshot analyse
- Upgrade nodig voor meer analyses

---

### Pro Tier
**Prijs:** €17/maand  
**Credits:** 100 per dag  
**Analyse limiet:** ~8-20 analyses per dag

| Feature | Beschikbaar |
|---------|-------------|
| Snapshot mode | ✅ Ja |
| Expanded mode | ✅ Ja |
| Deep mode | ❌ Nee |
| Deep toggle | ❌ Verborgen |
| Afbeelding analyse | ❌ Nee |
| Chat geschiedenis | ✅ Ja |
| Reply templates | ✅ 3 opties |
| AI Model | Groq llama-3.3-70b |
| Batch limiet | 1 analyse tegelijk |

**Gebruik:**
- Ideaal voor casual gebruikers
- Basis snapshot & expanded analyses
- Geen toggles of extra opties
- Zuinig met credits

---

### Plus Tier ⭐
**Prijs:** €29/maand  
**Credits:** 180 per dag  
**Analyse limiet:** ~15-36 analyses per dag

| Feature | Beschikbaar |
|---------|-------------|
| Snapshot mode | ✅ Ja (auto-selected) |
| Expanded mode | ✅ Ja (included) |
| Deep mode | ✅ Ja (via toggle +12 credits) |
| Deep analyse toggle | ✅ Ja (+12 credits) |
| Afbeelding analyse | ✅ Ja |
| Chat geschiedenis | ✅ Ja |
| Reply templates | ✅ 3-5 opties |
| AI Model | Groq llama-3.3-70b |
| Batch limiet | 3 analyses tegelijk |
| Auto mode selectie | ✅ Ja |

**Gebruik:**
- Voor serieuze gebruikers
- Expanded mode automatisch included
- Deep analyse optioneel beschikbaar (+12 credits)
- Afbeeldingen geanalyseerd
- Auto mode selectie voor optimale resultaten

**Auto Mode Selectie:**
- Korte tekst (≤200 chars) → Snapshot
- Lange tekst (>200 chars) → Expanded
- Met Deep toggle aan → Deep mode

---

### Max Tier 👑
**Prijs:** €59/maand  
**Credits:** 300 per dag  
**Analyse limiet:** ~25-60 analyses per dag

| Feature | Beschikbaar |
|---------|-------------|
| Snapshot mode | ✅ Ja (handmatig selecteerbaar) |
| Expanded mode | ✅ Ja (handmatig selecteerbaar) |
| Deep mode | ✅ Ja (included met 1.2x multiplier) |
| Afbeelding analyse | ✅ Ja |
| Chat geschiedenis | ✅ Ja |
| Reply templates | ✅ 5-8 opties |
| Conversation flow | ✅ Ja (deep mode) |
| Risk mitigation | ✅ Ja (deep mode) |
| Escalation advice | ✅ Ja (deep mode) |
| AI Model | Groq llama-3.3-70b |
| Batch limiet | 10 analyses tegelijk |
| Prioriteit support | ✅ Ja |

**Gebruik:**
- Maximale analyse mogelijkheden
- Deep mode included (geen extra toggle)
- Volledig handmatige mode controle
- Deep mode gebruikt 1.2x credit multiplier
- Meest uitgebreide analyses

**Mode Selectie (handmatig):**
- Gebruiker kiest zelf: Snapshot, Expanded, of Deep
- Deep mode: extra gedetailleerde output met conversation flows
- Smart routing: afbeeldingen → altijd Deep

---

## 📊 Analyse Modi

### 1. Snapshot Mode 📸
**Snelste & goedkoopste analyse**

**Output velden:**
- `intent` - Wat bedoelen ze echt
- `tone` - Toon van het bericht
- `category` - Type bericht
- `emotional_risk` - Emotioneel risico (low/medium/high)
- `recommended_timing` - Wanneer reageren
- `suggested_replies` - 2 reply opties
- `interest_level` - Interest percentage (bijv. "65%")

**Tokens:** 250 max tokens  
**Geschikt voor:** Snelle checks, korte berichten  
**Detail niveau:** Basis

---

### 2. Expanded Mode 📈
**Meer detail & context**

#### Pro Tier Expanded (LITE DETAILS):
**Output velden:**
- Alle Snapshot velden
- `explanation` - 1 zin uitleg
- `suggested_replies` - 3 reply opties
- `details` object:
  - `summary_one_liner` - Korte samenvatting
  - `confidence.overall` - Overall confidence (0-1)
  - `signals.positive` - Max 2 positieve signalen

**Tokens:** 380 max tokens  
**Detail niveau:** Lite (beperkte details)

#### Plus Tier Expanded (RICH DETAILS):
**Output velden:**
- Alle Snapshot velden
- `explanation` - 1-2 zinnen uitleg
- `suggested_replies` - 3 reply opties
- `details` object:
  - `summary_one_liner` - Samenvatting
  - `confidence` - Overall, intent, tone, interest_level (alle 0-1)
  - `signals` - Positive (2-3), neutral (1-2), negative arrays
  - `timing_logic` - Why + avoid_when advies
  - `reply_pack` - 1-3 reply opties met style, text, why_it_works, risk
  - `next_steps` - 2-3 volgende stappen

**Tokens:** 520 max tokens  
**Detail niveau:** Rich (uitgebreide details)

---

### 3. Deep Mode 🔍
**Meest uitgebreide analyse**  
**Alleen beschikbaar voor:** Plus (toggle +12) en Max (included)

**Output velden:**
- Alle basis velden
- `explanation` - Object met 4 velden:
  - `meaning_breakdown` - Betekenis breakdown
  - `emotional_context` - Emotionele context
  - `relationship_signals` - Relatie signalen
  - `hidden_patterns` - Verborgen patronen
- `suggested_replies` - Object met 5 stijlen:
  - `playful`, `confident`, `safe`, `bold`, `escalation`
- `conversation_flow` - Array van 3 stappen (you → them_reaction → you_next)
- `escalation_advice` - Escalatie advies
- `risk_mitigation` - Risico mitigatie
- `interest_level` - Percentage

**MAX Tier Deep (FULL DETAILS):**
- `details` object:
  - `summary_one_liner`
  - `confidence` - 4 velden (overall, intent, tone, interest_level)
  - `micro_signal_map` - 4 scores (humor, warmth, challenge, directness 0-1)
  - `risk_flags` - misread_risk, overpursuit_risk, boundary_risk
  - `persona_replies` - 1-2 persona-based replies
  - `timing_matrix` - best_windows + avoid_windows
  - `what_not_to_send` - 2-3 dingen om te vermijden

**Tokens:** 750 max tokens  
**Temperature:** 0.8 (meer creatief)  
**Detail niveau:** Full (maximale details)  
**Geschikt voor:** Complexe situaties, belangrijke berichten

---

## 💰 Credit Kosten Berekening

### Basis Credit Kosten (alle tiers)

#### Tekst Analyse:
- **Korte tekst** (≤200 karakters): **5 credits**
- **Lange tekst** (>200 karakters): **12 credits**
- **Extra lange tekst penalty**: +floor(textLength / 500) credits

#### Afbeelding Analyse:
- **Per afbeelding**: **30 credits**
- **Afbeelding + tekst**: Som van beide

#### Voorbeelden:
```
"Hey!" (4 chars)              → 5 credits
"How are you?" (12 chars)     → 5 credits
"I had such a great time..." (250 chars) → 12 credits
Tekst van 1000 chars          → 12 + 2 = 14 credits
Tekst van 1500 chars          → 12 + 3 = 15 credits
1 afbeelding                  → 30 credits
1 afbeelding + korte tekst    → 30 + 5 = 35 credits
1 afbeelding + lange tekst    → 30 + 12 = 42 credits
```

---

### Tier-Specifieke Kosten

#### FREE Tier:
```
Mode: Snapshot only
Cost: baseTotal (niet daadwerkelijk afgetrokken)
Limiet: 1 analyse totaal (lifetime)

Voorbeeld:
- "Hey there!" → 5 credits (intern geteld, niet afgetrokken)
```

#### PRO Tier:
```
Mode: Snapshot of Expanded
Cost: baseTotal (geen toggles)
Limiet: 100 credits/dag

Voorbeelden:
- Snapshot, korte tekst:  5 credits
- Snapshot, lange tekst:  12 credits
- Expanded, korte tekst:  5 credits
- Expanded, lange tekst:  12 credits

Dagelijkse capaciteit:
- ~20 korte berichten (5 credits elk)
- ~8 lange berichten (12 credits elk)
- Gemengd: ~10-15 analyses
```

#### PLUS Tier:
```
Mode: Snapshot (auto) / Expanded (auto) / Deep (toggle +12)
Base cost: baseTotal
Deep toggle: +12 credits extra
Limiet: 180 credits/dag

Voorbeelden (zonder Deep toggle):
- Snapshot, korte tekst:  5 credits
- Expanded, lange tekst:  12 credits
- Afbeelding:            30 credits
- Afbeelding + tekst:    35-42 credits

Voorbeelden (met Deep toggle aan):
- Snapshot, korte tekst:  5 + 12 = 17 credits
- Expanded, lange tekst:  12 + 12 = 24 credits
- Afbeelding:            30 + 12 = 42 credits
- Afbeelding + tekst:    35 + 12 = 47 credits
                         42 + 12 = 54 credits

Dagelijkse capaciteit:
- Zonder Deep: ~15-36 analyses
- Met Deep: ~7-10 deep analyses
- Gemengd: ~15-25 analyses
```

#### MAX Tier:
```
Mode: Snapshot / Expanded / Deep (handmatig kiezen)
Deep cost: ceil(baseTotal × 1.2)
Limiet: 300 credits/dag

Voorbeelden:
Snapshot mode:
- Korte tekst:           5 credits
- Lange tekst:          12 credits

Expanded mode:
- Korte tekst:           5 credits
- Lange tekst:          12 credits

Deep mode (×1.2 multiplier):
- Korte tekst:           ceil(5 × 1.2) = 6 credits
- Lange tekst:          ceil(12 × 1.2) = 15 credits
- Afbeelding:           ceil(30 × 1.2) = 36 credits
- Afbeelding + korte:   ceil(35 × 1.2) = 42 credits
- Afbeelding + lange:   ceil(42 × 1.2) = 51 credits

Dagelijkse capaciteit:
- Snapshot/Expanded: ~25-60 analyses
- Deep mode: ~20-50 analyses
- Gemengd: ~30-45 analyses
```

---

## 🎛️ Token Limieten per Tier

Tokens controleren de lengte van de AI response en dus ook de kosten aan de AI provider kant.

### Token Limieten per Mode & Tier:

| Mode | Tier | Max Tokens | Detail Niveau | Temperature |
|------|------|-----------|---------------|-------------|
| **Snapshot** | Alle | 250 | Basis | 0.7 |
| **Expanded** | Pro | 380 | Lite | 0.7 |
| **Expanded** | Plus/Max | 520 | Rich | 0.7 |
| **Deep** | Plus/Max | 750 | Full | 0.8 |

### Token Schatting (input):
```javascript
Token estimate = baselineTokens + (textLength + imageEffectiveChars) / 4

Baseline tokens:
- Snapshot: 200
- Expanded: 350
- Deep: 500

Image effective chars: images.length × 250

Voorbeeld:
Text 500 chars, 1 afbeelding, Deep mode:
= 500 + (500 + 250) / 4
= 500 + 187.5
= ~688 tokens geschat
```

### Waarom Token Limieten?

1. **Kosten controle**: Voorkomt runaway API kosten
2. **Tier differentiatie**: Pro krijgt minder detail dan Plus
3. **Response kwaliteit**: Dwingt AI tot beknopte, relevante output
4. **Gebruikers ervaring**: Snellere responses door token limits

---

## 🤖 AI Model & Provider

### Huidige Setup (Productie):

**Provider:** Groq  
**Model:** llama-3.3-70b-versatile  
**Geldt voor:** ALLE tiers (Free, Pro, Plus, Max)

### Model Eigenschappen:

- **Context window:** 8192 tokens
- **Output kwaliteit:** Hoog
- **Snelheid:** Zeer snel (~100-200 tokens/sec)
- **Kosten:** Lagere kosten dan OpenAI
- **Betrouwbaarheid:** Stabiel

### Waarom Groq voor alle tiers?

1. **Consistent**: Zelfde kwaliteit voor alle gebruikers
2. **Snelheid**: Groq is extreem snel
3. **Kosten**: Lagere kosten = betere marges
4. **Eenvoud**: Eén provider = minder complexiteit

**Toekomstig:** Mogelijkheid om later verschillende modellen per tier te gebruiken indien nodig.

---

## 📋 Gedetailleerde Tier Specificaties

### FREE Tier - Compleet Overzicht

```yaml
Naam: Free
Prijs: €0
Credits per dag: 0
Maandelijkse analyses: 1 totaal (lifetime)

Features:
  modes:
    - snapshot: Ja (1x)
    - expanded: Nee
    - deep: Nee
  
  input types:
    - text: Ja (snapshot)
    - images: Nee
  
  toggles:
    - expanded: Nee
    - deep: Nee
    - explanation: Nee
  
  ai:
    provider: groq
    model: llama-3.3-70b-versatile
  
  limits:
    batch_limit: 1
    total_analyses: 1

Cost berekening:
  - Text ≤200 chars: 5 credits (intern)
  - Text >200 chars: 12 credits (intern)
  - Mode multiplier: Geen
```

---

### PRO Tier - Compleet Overzicht

```yaml
Naam: Pro
Prijs: €17/maand (1700 cents)
Credits per dag: 100
Dagelijkse reset: 00:00 (Europe/Amsterdam)

Features:
  modes:
    - snapshot: Ja
    - expanded: Ja
    - deep: Nee (code bestaat, UI verborgen)
  
  input types:
    - text: Ja
    - images: Nee
  
  toggles:
    - expanded: Nee (geen toggles)
    - deep: Nee (verborgen)
    - explanation: Nee
  
  ai:
    provider: groq
    model: llama-3.3-70b-versatile
  
  limits:
    batch_limit: 1
    daily_credits: 100

Cost berekening:
  - Text ≤200 chars: 5 credits
  - Text >200 chars: 12 credits
  - Extra long: +floor(length/500) credits
  - Mode multiplier: Geen
  - Toggles: Geen

Token limits:
  - Snapshot: 250 tokens
  - Expanded: 380 tokens (Lite details)

Detail niveau:
  - Expanded: Lite (beperkte optional fields)
```

---

### PLUS Tier - Compleet Overzicht

```yaml
Naam: Plus
Prijs: €29/maand (2900 cents)
Credits per dag: 180
Dagelijkse reset: 00:00 (Europe/Amsterdam)

Features:
  modes:
    - snapshot: Ja (auto-selected)
    - expanded: Ja (included, auto-selected)
    - deep: Ja (via toggle +12 credits)
  
  input types:
    - text: Ja
    - images: Ja
  
  toggles:
    - deep: Ja (+12 credits)
  
  auto mode selectie:
    - Korte tekst (≤200): Snapshot
    - Lange tekst (>200): Expanded
    - Met Deep toggle: Deep
  
  ai:
    provider: groq
    model: llama-3.3-70b-versatile
  
  limits:
    batch_limit: 3
    daily_credits: 180

Cost berekening:
  Base:
    - Text ≤200 chars: 5 credits
    - Text >200 chars: 12 credits
    - Image: 30 credits per image
    - Extra long: +floor(length/500) credits
  
  Toggle:
    - Deep toggle ON: +12 credits
  
  Total:
    = baseTotal + deepToggle(12 if checked)

Token limits:
  - Snapshot: 250 tokens
  - Expanded: 520 tokens (Rich details)
  - Deep: 750 tokens (Full details)

Detail niveau:
  - Expanded: Rich (uitgebreide optional fields)
  - Deep: Full (alle optional fields + extra)
```

---

### MAX Tier - Compleet Overzicht

```yaml
Naam: Max
Prijs: €59/maand (5900 cents)
Credits per dag: 300
Dagelijkse reset: 00:00 (Europe/Amsterdam)

Features:
  modes:
    - snapshot: Ja (handmatig selecteerbaar)
    - expanded: Ja (handmatig selecteerbaar)
    - deep: Ja (included met 1.2x multiplier)
  
  input types:
    - text: Ja
    - images: Ja
  
  toggles:
    - Geen (deep is included)
  
  mode selectie:
    - Handmatig door gebruiker
    - Auto routing voor images → Deep
  
  ai:
    provider: groq
    model: llama-3.3-70b-versatile
  
  limits:
    batch_limit: 10
    daily_credits: 300
  
  extras:
    - priority_support: Ja
    - conversation_flow: Ja
    - escalation_advice: Ja
    - risk_mitigation: Ja

Cost berekening:
  Base:
    - Text ≤200 chars: 5 credits
    - Text >200 chars: 12 credits
    - Image: 30 credits per image
    - Extra long: +floor(length/500) credits
  
  Deep mode multiplier:
    - Deep mode: ceil(baseTotal × 1.2)
    - Snapshot/Expanded: baseTotal (geen multiplier)
  
  Examples:
    - Snapshot korte tekst: 5 credits
    - Expanded lange tekst: 12 credits
    - Deep korte tekst: ceil(5 × 1.2) = 6 credits
    - Deep lange tekst: ceil(12 × 1.2) = 15 credits
    - Deep image: ceil(30 × 1.2) = 36 credits

Token limits:
  - Snapshot: 250 tokens
  - Expanded: 520 tokens (Rich details)
  - Deep: 750 tokens (Full details + MAX extras)

Detail niveau:
  - Deep: Full (maximale details, alle fields)
```

---

## 💡 Credit Voorbeelden

### Scenario 1: Korte Berichten

**Input:** "Hey! How was your day?"  
**Karakters:** 23

| Tier | Mode | Credits | Beschikbaar |
|------|------|---------|-------------|
| Free | Snapshot | 5 (1x totaal) | ✅ |
| Pro | Snapshot | 5 | ✅ |
| Pro | Expanded | 5 | ✅ |
| Plus | Snapshot | 5 | ✅ |
| Plus | Expanded | 5 | ✅ |
| Plus | Deep (toggle) | 5 + 12 = 17 | ✅ |
| Max | Snapshot | 5 | ✅ |
| Max | Expanded | 5 | ✅ |
| Max | Deep | ceil(5 × 1.2) = 6 | ✅ |

---

### Scenario 2: Lange Berichten

**Input:** "I really enjoyed our conversation yesterday. You have such an interesting perspective on things, and I'd love to hear more about your travels. When you mentioned that story about Thailand, I was completely captivated..." (250 karakters)

| Tier | Mode | Credits | Beschikbaar |
|------|------|---------|-------------|
| Free | Snapshot | 12 | ❌ Nee (te duur voor free) |
| Pro | Snapshot | 12 | ✅ |
| Pro | Expanded | 12 | ✅ |
| Plus | Expanded | 12 | ✅ |
| Plus | Deep (toggle) | 12 + 12 = 24 | ✅ |
| Max | Snapshot | 12 | ✅ |
| Max | Expanded | 12 | ✅ |
| Max | Deep | ceil(12 × 1.2) = 15 | ✅ |

---

### Scenario 3: Afbeelding Analyse

**Input:** 1 screenshot van een chat

| Tier | Mode | Credits | Beschikbaar |
|------|------|---------|-------------|
| Free | - | - | ❌ Geen images |
| Pro | - | - | ❌ Geen images |
| Plus | Expanded | 30 | ✅ |
| Plus | Deep (toggle) | 30 + 12 = 42 | ✅ |
| Max | Deep | ceil(30 × 1.2) = 36 | ✅ |

---

### Scenario 4: Afbeelding + Tekst

**Input:** 1 screenshot + "What do you think about this conversation?" (50 chars)

| Tier | Mode | Base Cost | Total | Beschikbaar |
|------|------|-----------|-------|-------------|
| Plus | Expanded | 30 + 5 | 35 | ✅ |
| Plus | Deep (toggle) | 30 + 5 + 12 | 47 | ✅ |
| Max | Deep | ceil(35 × 1.2) | 42 | ✅ |

---

### Scenario 5: Extra Lang Bericht

**Input:** Essay-achtig bericht van 1500 karakters

**Berekening:**
- Base (lange tekst): 12 credits
- Extra long penalty: floor(1500 / 500) = 3 credits
- Total base: 12 + 3 = 15 credits

| Tier | Mode | Credits | Beschikbaar |
|------|------|---------|-------------|
| Pro | Snapshot | 15 | ✅ |
| Pro | Expanded | 15 | ✅ |
| Plus | Expanded | 15 | ✅ |
| Plus | Deep (toggle) | 15 + 12 = 27 | ✅ |
| Max | Snapshot | 15 | ✅ |
| Max | Expanded | 15 | ✅ |
| Max | Deep | ceil(15 × 1.2) = 18 | ✅ |

---

### Dagelijkse Capaciteit Voorbeelden

#### Pro (100 credits/dag):
```
Alleen korte berichten (5 credits):
100 ÷ 5 = 20 analyses

Alleen lange berichten (12 credits):
100 ÷ 12 = 8 analyses

Gemengd (7 korte + 5 lange):
(7 × 5) + (5 × 12) = 35 + 60 = 95 credits ✅
```

#### Plus (180 credits/dag):
```
Zonder Deep toggle:
- Korte: 180 ÷ 5 = 36 analyses
- Lange: 180 ÷ 12 = 15 analyses
- Images: 180 ÷ 30 = 6 analyses

Met Deep toggle (regelmatig):
- Deep lange tekst (24 credits): 180 ÷ 24 = 7 analyses
- Gemengd (5 deep + 5 expanded): 
  (5 × 24) + (5 × 12) = 120 + 60 = 180 ✅
```

#### Max (300 credits/dag):
```
Deep mode uitsluitend:
- Korte (6 credits): 300 ÷ 6 = 50 analyses
- Lange (15 credits): 300 ÷ 15 = 20 analyses
- Images (36 credits): 300 ÷ 36 = 8 analyses

Gemengd gebruik:
- 10 deep lange + 10 snapshot korte:
  (10 × 15) + (10 × 5) = 150 + 50 = 200 ✅
  Nog 100 credits over!
```

---

## 🔧 Technische Implementatie

### Credit Berekening Flow

```typescript
// STAP 1: Base text credits
const textLength = inputText.trim().length;
const isShort = textLength <= 200;
let baseTextCredits = 0;

if (textLength > 0) {
  baseTextCredits = isShort ? 5 : 12;
}

// STAP 2: Base image credits
const baseImageCredits = images.length * 30;

// STAP 3: Extra long input penalty
const inputExtraCredits = Math.floor(textLength / 500);

// STAP 4: Calculate base total
const baseTotal = baseTextCredits + baseImageCredits + inputExtraCredits;

// STAP 5: Tier-specific surcharges
let tierSurchargeCredits = 0;

if (tier === 'plus' && expandedToggle) {
  tierSurchargeCredits = 12; // Deep toggle
}

// STAP 6: Apply mode multipliers
let totalCreditsRequired = baseTotal + tierSurchargeCredits;

if (tier === 'max' && mode === 'deep') {
  totalCreditsRequired = Math.ceil(baseTotal * 1.2);
}

// FINAL: Total credits required
return totalCreditsRequired;
```

---

### Mode Bepaling Logic

```typescript
function determineMode(tier, inputText, hasImages, expandedToggle) {
  const textLength = inputText.trim().length;
  const isShort = textLength <= 200;

  // FREE: altijd snapshot
  if (tier === 'free') {
    return 'snapshot';
  }

  // PRO: altijd snapshot (geen toggles)
  if (tier === 'pro') {
    return 'snapshot';
  }

  // PLUS: auto-determined of deep via toggle
  if (tier === 'plus') {
    if (expandedToggle) return 'deep'; // Deep toggle
    if (isShort && !hasImages) return 'snapshot';
    return 'expanded'; // Default: expanded
  }

  // MAX: user chooses mode
  if (tier === 'max') {
    return requestedMode; // snapshot, expanded, or deep
  }
}
```

---

### Token Schatting

```typescript
function estimateTokens(mode, textLength, imageCount) {
  // Baseline per mode
  const baselineTokens = {
    snapshot: 200,
    expanded: 350,
    deep: 500
  };

  // Image contribution
  const imageEffectiveChars = imageCount * 250;
  
  // Total estimate
  const totalChars = textLength + imageEffectiveChars;
  const inputTokens = Math.ceil(totalChars / 4);
  
  return baselineTokens[mode] + inputTokens;
}
```

---

### Prompt Template Selectie

```typescript
function getPromptTemplate(mode, tier) {
  if (mode === 'snapshot') {
    return {
      maxTokens: 250,
      temperature: 0.7
    };
  }

  if (mode === 'expanded') {
    if (tier === 'pro') {
      return {
        maxTokens: 380, // Lite details
        temperature: 0.7
      };
    } else {
      return {
        maxTokens: 520, // Rich details (Plus/Max)
        temperature: 0.7
      };
    }
  }

  if (mode === 'deep') {
    return {
      maxTokens: 750, // Full details
      temperature: 0.8
    };
  }
}
```

---

## 📈 Tier Vergelijkingstabel

| Feature | Free | Pro | Plus | Max |
|---------|------|-----|------|-----|
| **Prijs/maand** | €0 | €17 | €29 | €59 |
| **Credits/dag** | 0 (1 totaal) | 100 | 180 | 300 |
| **Analyses/dag** | 1 (totaal) | 8-20 | 15-36 | 25-60 |
| **Snapshot** | ✅ (1x) | ✅ | ✅ | ✅ |
| **Expanded** | ❌ | ✅ | ✅ (included) | ✅ |
| **Deep** | ❌ | ❌ | ✅ (+12) | ✅ (×1.2) |
| **Afbeeldingen** | ❌ | ❌ | ✅ | ✅ |
| **Deep Toggle** | ❌ | ❌ | ✅ | ❌ (included) |
| **Auto Mode** | ❌ | ❌ | ✅ | ✅ |
| **Handmatige Mode** | ❌ | ❌ | ❌ | ✅ |
| **Detail Niveau** | Basis | Basis/Lite | Basis/Rich | Basis/Rich/Full |
| **Max Tokens** | 250 | 250-380 | 250-750 | 250-750 |
| **Batch Limiet** | 1 | 1 | 3 | 10 |
| **AI Model** | Groq 70b | Groq 70b | Groq 70b | Groq 70b |
| **Prioriteit Support** | ❌ | ❌ | ❌ | ✅ |
| **Chat Historie** | ❌ | ✅ | ✅ | ✅ |

---

## 🎓 Best Practices per Tier

### Free Tier:
- Gebruik je 1 gratis analyse slim
- Test met een representatief bericht
- Upgrade daarna voor meer analyses

### Pro Tier:
- Focus op korte berichten (5 credits) voor meer analyses
- Gebruik snapshot voor snelle checks
- Expanded voor meer context (zelfde kosten)
- Budget: ~100-120 credits/week spaart op

### Plus Tier:
- Laat auto-mode het werk doen
- Gebruik Deep toggle (+12) alleen voor belangrijke berichten
- Afbeeldingen kosten veel (30 credits)
- Strategisch: 5-6 deep analyses + 10-15 expanded analyses/dag

### Max Tier:
- Gebruik Deep mode voor maximaal inzicht
- Handmatige controle over alle modes
- Afbeeldingen altijd Deep (meest detail)
- Focus op kwaliteit over kwantiteit

---

## 📞 Support & Vragen

Voor vragen over het tier systeem of credit usage:
- Check je huidige usage in dashboard
- Bekijk credit history voor analyses
- Contact support voor upgrade/downgrade vragen

**Credit Reset:** Dagelijks om 00:00 (Europe/Amsterdam timezone)  
**Unused Credits:** Vervallen, rollen niet over naar volgende dag

---

## 🔄 Changelog

**v2.0 (28 december 2025):**
- Pro tier: Deep toggle verwijderd uit UI (code behouden)
- Plus tier: Deep toggle actief (+12 credits)
- Max tier: Deep mode included met 1.2x multiplier
- Alle tiers: Groq llama-3.3-70b-versatile
- Explanation toggles volledig verwijderd

**v1.0:**
- Initiële lancering met 4 tiers
- Credit systeem geïmplementeerd
- Mode-based pricing

---

**Document Einde** - Versie 2.0
