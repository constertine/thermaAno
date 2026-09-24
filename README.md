# Thermal Insight India

### **From Thermal Signals to Actionable Intelligence.**

<p align="center">
  <img src="https://img.shields.io/badge/AI-Geospatial_Intelligence-5CC8E8?style=for-the-badge" />
  <img src="https://img.shields.io/badge/NASA-FIRMS-11161C?style=for-the-badge" />
  <img src="https://img.shields.io/badge/OSM-Infrastructure-D9A441?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Satellite-Analytics-8F82C9?style=for-the-badge" />
</p>

<p align="center">
  <strong>AI powered detection, classification and monitoring of industrial fires and persistent thermal sources using satellite and geospatial data.</strong>
</p>

<p align="center">
  <a href="#-problem">Problem</a> •
  <a href="#-solution">Solution</a> •
  <a href="#-how-it-works">How It Works</a> •
  <a href="#-features">Features</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-tech-stack">Tech Stack</a>
</p>

---

## The Idea

Satellite systems can tell us **where thermal anomalies are occurring**.

But detecting heat is not the same as understanding it.

A thermal anomaly could represent:

```text
🔥 Industrial Fire
🟠 Gas Flare
🌾 Agricultural Burning
🌲 Wildfire
⛏️ Mining Activity
🏭 Persistent Industrial Heat
❓ Unknown Thermal Source
```

**Thermal Insight India** combines NASA FIRMS thermal detections with satellite imagery, OpenStreetMap infrastructure, land cover information and AI classification to determine:

> **What is happening? Where is it happening? Is it persistent? And how significant is it?**

---

# The Problem

Existing satellite based fire monitoring systems provide valuable thermal detections, but a raw hotspot does not provide enough context.

### We identified three major gaps:

| 01 | Lack of Context                                                                             |
| -- | ------------------------------------------------------------------------------------------- |
| 📡 | A thermal detection tells us **where heat exists**, but not necessarily what is causing it. |

| 02 | Classification Gap                                                                                               |
| -- | ---------------------------------------------------------------------------------------------------------------- |
| 🏭 | Industrial fires can be difficult to distinguish from wildfires, agricultural burning and other thermal sources. |

| 03 | Persistence & Anomaly Gap                                                                  |
| -- | ------------------------------------------------------------------------------------------ |
| ⏱️ | Repeated thermal activity may represent normal industrial operations or an abnormal event. |

### The challenge

> **How do we transform millions of raw thermal observations into meaningful industrial intelligence?**

---

# Our Solution

Thermal Insight India creates a unified geospatial intelligence layer by combining:

```text
NASA FIRMS
     │
     ▼
Thermal Anomaly
     │
     ▼
AI Classification
     │
     ├───────────────┐
     ▼               ▼
Industrial       Natural /
Context          Other Sources
     │
     ▼
OSM + Land Cover
     │
     ▼
Satellite Evidence
     │
     ▼
Temporal Analysis
     │
     ▼
Risk + Confidence
     │
     ▼
GIS Intelligence
```

---

# See The Heat. Understand The Source.

<p align="center">
  <!-- Replace with your actual demo GIF -->
  <img src="assets/demo.gif" width="90%" alt="Thermal Insight India Demo"/>
</p>

> **One map. Multiple data sources. One intelligence layer.**

---

# Features

<details>
<summary><strong>Interactive Thermal Map</strong></summary>

Visualize thermal anomalies directly on an interactive GIS map.

### Map layers

* 🔴 Critical industrial fires
* 🟠 High risk events
* 🟡 Industrial thermal sources
* 🟣 Persistent thermal sources
* 🟢 Natural fires
* ⚪ Unknown anomalies
* Industrial infrastructure
* Roads and surrounding infrastructure
* Land cover context

Click any event to investigate it.

</details>

<details>
<summary><strong>AI Based Classification</strong></summary>

The system classifies detected thermal anomalies into meaningful categories.

Example:

```text
Industrial Fire       ████████████████████  91.7%

Gas Flare             ██                     4.2%

Agricultural Burn     █                      2.1%

Wildfire              █                      1.4%

Other                 ▏                      0.6%
```

The model provides both:

* Classification
* Confidence score

</details>

<details>
<summary><strong>Industrial Infrastructure Intelligence</strong></summary>

Thermal anomalies are correlated with nearby industrial infrastructure.

Supported facility contexts include:

* Oil refineries
* Petrochemical complexes
* Thermal power plants
* Steel industries
* Mining areas
* LNG terminals
* Chemical facilities

This helps answer:

> **Is this thermal event actually associated with industrial activity?**

</details>

<details>
<summary><strong>Persistent Thermal Source Detection</strong></summary>

Not every recurring thermal signal is a fire.

Repeated observations can indicate:

* Gas flaring
* Furnaces
* Industrial processes
* Power generation
* Other persistent thermal sources

The system analyzes thermal activity over time to identify persistent patterns.

</details>

<details>
<summary><strong>🛰️ Satellite Evidence</strong></summary>

Investigate an event using satellite imagery and geospatial context.

```text
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│    BEFORE    │ → │   DETECTION  │ → │    AFTER     │
│              │   │              │   │              │
│   Satellite  │   │   Thermal    │   │   Satellite  │
│    Image     │   │    Event     │   │    Image     │
└──────────────┘   └──────────────┘   └──────────────┘
```

</details>

<details>
<summary><strong>Historical & Temporal Analysis</strong></summary>

Analyze thermal activity across:

`24H` · `7D` · `30D` · `90D` · `1Y`

Track:

* Event frequency
* Thermal intensity
* Industrial activity
* Persistent sources
* Regional hotspots
* Abnormal activity

</details>

<details>
<summary><strong>Risk & Alert Prioritization</strong></summary>

Events can be prioritized using contextual factors such as:

```text
Thermal Intensity
       +
Industrial Proximity
       +
Persistence
       +
Population Proximity
       +
Classification Confidence
       ↓
   Risk Context
```

This allows users to focus on events requiring closer investigation.

</details>

---

# From Detection → Intelligence

The core philosophy of Thermal Insight India:

```text
              DETECT
                │
                ▼
         Where is the heat?
                │
                ▼
             CLASSIFY
                │
                ▼
        What is causing it?
                │
                ▼
           CONTEXTUALIZE
                │
                ▼
     What is around the event?
                │
                ▼
             ANALYZE
                │
                ▼
      Is it persistent/abnormal?
                │
                ▼
            PRIORITIZE
                │
                ▼
       What needs attention?
```

---

# Product Structure

The platform is organized around four primary workflows:

```text
┌──────────────────────────────────────────────────────────┐
│                    THERMAL INSIGHT                       │
├────────────┬────────────┬────────────┬───────────────────┤
│  Overview  │  Monitor   │  Analysis  │     Insights      │
├────────────┴────────────┴────────────┴───────────────────┤
│                                                          │
│                  GEOSPATIAL WORKSPACE                    │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Overview

A high-level operational picture:

* Active events
* Industrial events
* Persistent sources
* Critical alerts
* Regional activity

### Monitor

The operational workspace:

* Live thermal events
* Industrial events
* Persistent sources
* Alerts
* Event investigation

### Analysis

The intelligence layer:

* AI classification
* Evidence
* Industrial facilities
* Satellite context
* Event analysis

### Insights

The historical layer:

* Trends
* Regional analysis
* Hotspots
* Historical thermal activity
* Industrial patterns

---

# Architecture

```text
                         ┌─────────────────────┐
                         │     NASA FIRMS      │
                         │  Thermal Anomalies  │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │  Data Processing    │
                         │ & Geospatial ETL    │
                         └──────────┬──────────┘
                                    │
                  ┌─────────────────┼─────────────────┐
                  │                 │                 │
                  ▼                 ▼                 ▼
             Satellite             OSM          Land Cover
               Data          Infrastructure        Data
                  │                 │                 │
                  └─────────────────┼─────────────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │ AI Classification   │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │ Temporal Analysis   │
                         │ & Persistence       │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │ Risk / Confidence   │
                         └──────────┬──────────┘
                                    │
                                    ▼
                  ┌─────────────────────────────────┐
                  │        GIS APPLICATION          │
                  │                                 │
                  │  Map • Events • Alerts • AI     │
                  │  Satellite • Analytics          │
                  └─────────────────────────────────┘
```

---

# Data Fusion

Thermal Insight India does not depend on a single dataset.

| Data Source                  | Purpose                                        |
| ---------------------------- | ---------------------------------------------- |
|  **NASA FIRMS**              | Thermal anomaly detection                      |
|  **OpenStreetMap**           | Industrial infrastructure & geographic context |
|  **Satellite Imagery**       | Visual event evidence                          |
|  **Land Cover Data**         | Environmental classification                   |
|  **Industrial Databases**    | Facility identification                        |
|  **Historical Observations** | Persistence & temporal analysis                |

The strength of the system comes from **combining these sources**, not simply displaying them.

---

# Event Investigation

Every detected event can be investigated through a unified event profile.

```text
┌───────────────────────────────────────────┐
│ EVENT #IND-2841                           │
├───────────────────────────────────────────┤
│                                           │
│ Classification     Industrial Fire        │
│ Confidence          92.4%                 │
│ Risk                HIGH                  │
│                                           │
│ FRP                 184.2 MW              │
│ Detected            06:42 UTC             │
│ Persistence         3 observations        │
│                                           │
│ Nearest Facility    Petrochemical Plant   │
│ Distance            0.7 km                │
│                                           │
└───────────────────────────────────────────┘
```

The user can then inspect:

**Overview → Satellite → Timeline → Context**

---

# Example Intelligence Flow

Imagine a thermal anomaly is detected near an industrial complex.

The system evaluates:

```text
Thermal anomaly
      │
      ├── High FRP
      │
      ├── Within industrial boundary
      │
      ├── Repeated detections
      │
      ├── Industrial land cover
      │
      └── Satellite evidence
              │
              ▼
       Industrial origin
          probability
             93%
```

Instead of simply saying:

> **Fire detected**

the platform can provide:

> **Industrial thermal event - 93% confidence**

with the evidence behind the classification.

---

# Tech Stack

### Frontend

```text
React
TypeScript
Vite
Tailwind CSS
```

### Mapping & Geospatial

```text
Mapbox / Leaflet
GeoJSON
OpenStreetMap
Geospatial APIs
```

### AI / Data

```text
Python
Machine Learning
Geospatial Analysis
Satellite Data Processing
NASA FIRMS
```

### Backend

```text
Node.js
Express
REST APIs
MongoDB / Geospatial Database
```

> Replace the technologies above with the exact stack used in the final implementation.

---

# Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/<your-org>/thermal-insight-india.git

cd thermal-insight-india
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file:

```env
VITE_MAP_API_KEY=
VITE_FIRMS_API_KEY=
VITE_API_URL=
```

### 4. Start development server

```bash
npm run dev
```

Open:

```text
http://localhost:5173
```

---

# Project Structure

```text
thermal-insight-india/
│
├── public/
│
├── src/
│   ├── components/
│   │   ├── Globe/
│   │   ├── Map/
│   │   ├── Events/
│   │   ├── Alerts/
│   │   ├── Analytics/
│   │   └── UI/
│   │
│   ├── pages/
│   │   ├── Overview/
│   │   ├── Monitor/
│   │   ├── Analysis/
│   │   └── Insights/
│   │
│   ├── services/
│   ├── hooks/
│   ├── utils/
│   ├── types/
│   └── App.tsx
│
├── assets/
│   ├── demo.gif
│   └── screenshots/
│
├── .env.example
├── package.json
└── README.md
```

---

# SIH Alignment

Thermal Insight India directly addresses the core requirements of the problem statement:

| SIH Requirement                   | Implementation                   |
| --------------------------------- | -------------------------------- |
| Industrial fire classification    | AI classification engine         |
| Natural vs industrial segregation | Multi source classification      |
| Persistent thermal sources        | Temporal analysis                |
| NASA FIRMS                        | Thermal anomaly data             |
| OSM                               | Infrastructure context           |
| Satellite imagery                 | Event evidence                   |
| GIS storage                       | Geospatial data layer            |
| GIS visualization                 | Interactive map                  |
| Monitoring                        | Historical & live event tracking |

---

# Why It Matters

Industrial fires, gas leaks, explosions and abnormal thermal events can threaten:

* Critical infrastructure
* Nearby communities
* Industrial workers
* Environment
* Air quality
* Surrounding ecosystems

The goal is not simply to create another fire map.

It is to build a system that can transform:

> **Raw satellite observations**

into

> **Context aware geospatial intelligence.**

---

# Vision

### **Detect earlier. Understand better. Respond smarter.**

Thermal Insight India aims to bridge the gap between **satellite observation and real-world understanding** by bringing thermal data, AI, satellite imagery and geospatial infrastructure into one intelligence platform.

---

## 👥 Team Blue

### **Team Blue - Smart India Hackathon 2026**

> **Turning satellite thermal signals into actionable industrial intelligence.**

---

<p align="center">
  Built by <strong>Team Blue</strong>
</p>

<p align="center">
  <sub>Smart India Hackathon • Geospatial Intelligence • Satellite Analytics</sub>
</p>
