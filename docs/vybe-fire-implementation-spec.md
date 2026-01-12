# Vybe Fire (Working Title) — Engineering Implementation Specification

## 1. System Overview

### 1.1 Purpose
Provide personalised, real-time situational awareness for bushfire events in high-risk areas of Victoria and VIC–NSW border regions.

The system translates authoritative fire and weather data into:
- Direction
- Distance
- Time relevance
- Plain-English risk context

The system does **not**:
- Predict fire behaviour with certainty
- Issue evacuation commands
- Provide routing instructions

---

## 2. Architecture (High Level)

### 2.1 Components
- Mobile Client (iOS-first)
- Data Aggregation Layer
- Risk Translation Engine
- Notification Engine

All components must be loosely coupled.

### 2.2 Design Principles
- Fail safe > feature rich
- Explainable logic > opaque AI
- Conservative outputs > precision theatre
- Offline tolerance is mandatory

---

## 3. Mobile Client Requirements

### 3.1 Platform
- iOS (Swift / SwiftUI preferred)
- Android optional if capacity allows
- Must support dark mode
- Must support large text accessibility

### 3.2 Core Screen (Primary UI)

The app opens directly to the Fire Status Screen.

Required UI Elements (Top → Bottom)
1. Fire Direction Vector
   - Arrow pointing from fire toward user
   - Orientation derived from wind + fire edge
   - Colour indicates relevance (not alert category)
2. Distance Display
   - Distance in kilometres to nearest fire edge
   - Precision capped (e.g. 12.4 km, not 12.432)
3. Time Relevance Window
   - Range format only (e.g. “60–120 minutes”)
   - Labelled as “Potential relevance window”
4. Wind Context Line
   - Plain language (e.g. “Wind pushing fire toward your area”)
5. Risk Context Sentence
   - Single sentence only
   - No emergency terminology
6. Next Consideration (Advisory)
   - Suggestive, not directive
   - Example: “Now is a good time to prepare to leave”
7. Footer
   - Data attribution
   - Timestamp of last update
   - Disclaimer: “Conditions can change rapidly”

### 3.3 Location Handling
- GPS permission requested on first launch
- If denied:
  - Fallback to manual suburb/postcode input
- Location updates throttled to preserve battery

---

## 4. Data Ingestion

### 4.1 Mandatory Sources

Fire Data
- VicEmergency API
- Fire perimeters / incident locations
- Update cadence: as provided by source

Weather Data
- Bureau of Meteorology (BOM)
- Wind speed + direction
- Update cadence: hourly or better

### 4.2 Optional (Recommended)
- Terrain slope (static dataset, cached locally)

### 4.3 Data Handling Rules
- All data must be timestamped
- Stale data must be detectable
- UI must clearly display last update time

---

## 5. Risk Translation Engine

### 5.1 Purpose
Convert raw data into human-comprehensible situational context.

This engine must be deterministic and explainable.

### 5.2 Inputs
- User location (lat/long)
- Nearest fire edge geometry
- Wind direction (degrees)
- Wind speed
- Terrain slope (optional)

### 5.3 Core Calculations

A. Distance
- Calculate shortest distance from user to fire edge
- Output in kilometres

B. Directional Relevance
Determine whether wind is:
- Pushing fire toward user
- Moving laterally
- Pushing fire away

Translate internally to enum; externally to language.

C. Time Relevance Estimation
- Use conservative heuristics
- Never present a single timestamp
- Output ranges only

This is contextual estimation, not prediction.

### 5.4 Risk Levels (Internal Only)
- Low
- Medium
- High

Externally translated into:
- Colour intensity
- Language tone
- Alert behaviour

---

## 6. Notification Engine

### 6.1 Notification Triggers

Send notifications only when:
- Risk level changes
- Time relevance window shortens materially
- Wind shifts toward user

### 6.2 Notification Content Rules
- Plain English
- No commands
- No panic language
- Always reference uncertainty

Example:
“Conditions near you have changed. Fire relevance may increase.”

---

## 7. Offline / Degraded Mode

### 7.1 Required Behaviour
- Cache last known fire + wind state
- UI remains readable without connectivity
- Display “Last updated at” timestamp clearly

### 7.2 Failure Handling

If data unavailable:
- Do not guess
- Display conservative message
- Maintain last known context

---

## 8. Security & Privacy
- No user accounts required
- No personal data stored server-side
- Location used transiently only
- Analytics (if any) must be anonymous and minimal

---

## 9. Legal & Ethical Constraints

### 9.1 Prohibited Outputs

The app must never:
- Say “You are safe”
- Say “Evacuate now”
- Recommend routes or directions to travel

### 9.2 Required Messaging
- Data attribution always visible
- Disclaimer always present
- Official emergency instructions take precedence

---

## 10. Acceptance Criteria

The implementation is acceptable if:
- A user can understand the situation in <5 seconds
- The app remains useful during poor connectivity
- Alerts are rare but trusted
- No UI element can be reasonably interpreted as instruction

---

## 11. Change Management

Any proposed feature must answer:

“Does this improve orientation under stress?”

If not, it does not belong.

---

## 12. Handoff Instruction (For You to Say)

You can literally say this to the team:

“Build exactly what’s in this document.
Prioritise clarity and safety over cleverness.
If you’re unsure, choose the more conservative option.”

---

## Final Note (Not For the Team)

This document is intentionally strict.
That’s what keeps the product honest.
