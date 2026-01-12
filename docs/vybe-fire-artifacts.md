# Vybe Fire — Requested Artifacts

## Artifact 1: Static Representation of Primary Fire Status Screen

```
Fire Status Screen
└─ Root (Full-screen container, supports dark mode, large text)
   ├─ Fire Direction Vector
   │  ├─ Arrow Icon (points toward user)
   │  └─ Relevance Colour (placeholder: amber)
   ├─ Distance Display
   │  ├─ Label: “Distance to nearest fire edge”
   │  └─ Value: “12.4 km”
   ├─ Time Relevance Window
   │  ├─ Label: “Potential relevance window”
   │  └─ Value: “60–120 minutes”
   ├─ Wind Context Line
   │  └─ Text: “Wind pushing fire toward your area”
   ├─ Risk Context Sentence
   │  └─ Text: “Conditions may become more relevant if the wind holds.”
   ├─ Next Consideration (Advisory)
   │  └─ Text: “Now is a good time to prepare to leave.”
   └─ Footer
      ├─ Data attribution: “Data: VicEmergency, BOM”
      ├─ Last update: “Last updated at 14:05”
      └─ Disclaimer: “Conditions can change rapidly”
```

## Artifact 2: Plain-English Explanation of the Risk Translation Engine

The Risk Translation Engine takes the user’s location, the nearest fire edge, and the latest wind information to provide clear context. It first finds how far the user is from the nearest fire edge and presents that distance in kilometres with limited precision so it is easy to read. It then compares the wind direction with the line from the fire edge to the user to describe whether the wind is pushing the fire toward the user, moving across their area, or away from them. This description is converted into simple language like “toward your area,” “moving laterally,” or “away from your area.”

Time relevance is a conservative estimate based on distance and wind strength. It does not attempt to predict an exact arrival time. Instead, it provides a range such as “60–120 minutes,” indicating a possible window when conditions might become more relevant if current conditions persist. The engine also applies a simple internal risk level (low, medium, high) that only affects the tone, colour intensity, and alerting behaviour; it is not shown as a label to the user. All outputs are deterministic, explainable, and designed to avoid certainty or directive language.

## Artifact 3: Example Notification Messages

1. Trigger: Risk level changes from Medium to High.
   Message: “Conditions near you have changed. Fire relevance may increase.”

2. Trigger: Time relevance window shortens materially (e.g., from “120–240 minutes” to “60–120 minutes”).
   Message: “The potential relevance window has shortened. Conditions may become more relevant sooner.”

3. Trigger: Wind shifts toward user.
   Message: “Wind has shifted toward your area. Fire relevance may increase if this continues.”
