# OPENROUTE AI / தமிழ்நாடு அணுகல் & சரக்கு தளம் (PSA 02)
## Tamil Nadu AI-Based Smart Logistics & Accessibility Intelligence Platform

OPENROUTE AI is a state-wide intelligent geospatial routing and accessibility platform engineered for the entire state of Tamil Nadu (covering all 38 districts). It bridges high-throughput commercial freight dispatching (auto clusters, marine ports, textile corridors, agricultural cold-chains) with universal accessibility intelligence (accessible inter-modal transit hubs, step-free highway rest stops, gradient-safe medical transit corridors, and specialized mobility assistance across rural, urban, and ghat terrains).

---

## 🌟 Statewide Architecture & Geographic Configuration

### Geospatial Boundaries & Leaflet Setup
- **Center**: `[11.1271, 78.6569]` (Geographic Center of Tamil Nadu)
- **Default Zoom**: `7` (State-wide coverage)
- **Max Pan Bounds**: `[[7.8, 76.0], [13.8, 80.8]]` (Constrained to Tamil Nadu borders)

### 20 Key Statewide Nodes & Hubs
1. **Chennai Metro Hub** (Automotive Corridor, Chennai Port & Chennai Central) `[13.0827, 80.2707]`
2. **Sriperumbudur / Oragadam Industrial Cluster** `[12.9863, 79.9484]`
3. **Ennore / Kattupalli Marine Port Logistics Cluster** `[13.2929, 80.3308]`
4. **Hosur Manufacturing & Tech Hub** `[12.7409, 77.8253]`
5. **Vellore Transit & CMC Healthcare Gateway** `[12.9165, 79.1325]`
6. **Salem Freight Junction** (NH 44 / NH 544 cross-docking) `[11.6643, 78.1460]`
7. **Erode Agricultural & Textile Depot** `[11.3410, 77.7172]`
8. **Tiruppur Export & Garment Zone** `[11.1085, 77.3411]`
9. **Coimbatore Industrial & Medical Metro Hub** `[11.0168, 76.9558]`
10. **Tiruchirappalli Central Transit Hub** (Trichy Junction & Cargo Airport) `[10.7905, 78.7047]`
11. **Karur Textile & Heavy Bus-Body Cluster** `[10.9601, 78.0766]`
12. **Dindigul Agricultural Logistics Hub** `[10.3673, 77.9803]`
13. **Madurai Trade & Southern Logistics Junction** `[9.9252, 78.1198]`
14. **Virudhunagar Industrial Node** `[9.5680, 77.9624]`
15. **Thoothukudi (VOC Port Marine Logistics Hub)** `[8.7642, 78.1348]`
16. **Tirunelveli Multi-Modal Transit Terminal** `[8.7139, 77.7567]`
17. **Nagercoil / Kanyakumari Southern Gateway** `[8.1833, 77.4119]`
18. **Thanjavur Delta Agrarian Logistics Hub** `[10.7870, 79.1378]`
19. **Cuddalore / Nagapattinam Coastal Corridor** `[11.7480, 79.7714]`
20. **The Nilgiris (Ooty) Ghat Node** (High gradient: 2,240m altitude) `[11.4102, 76.6950]`

### Primary Highway Arteries
- **NH 44**: Hosur $\to$ Salem $\to$ Karur $\to$ Dindigul $\to$ Madurai $\to$ Virudhunagar $\to$ Tirunelveli $\to$ Kanyakumari
- **NH 544**: Salem $\to$ Erode $\to$ Tiruppur $\to$ Coimbatore
- **NH 45 (GST Road)**: Chennai $\to$ Sriperumbudur $\to$ Villupuram $\to$ Trichy $\to$ Dindigul
- **East Coast Corridor (ECR)**: Chennai $\to$ Cuddalore $\to$ Nagapattinam $\to$ Thoothukudi
- **Ghat Corridor**: Coimbatore (Mettupalayam) $\to$ Coonoor $\to$ Ooty (36 Hairpin bends, gradient > 9%)

---

## 🚀 3 Core Intelligence Engines

### Engine 1: Multi-Criteria Statewide Routing Algorithm (`src/engine/routingAlgorithm.ts`)
Multi-Criteria Dijkstra algorithm solving:
$$\text{Cost} = (w_{\text{dist}} \cdot \text{Distance}) + (w_{\text{time}} \cdot \text{TravelTime}) + (w_{\text{barrier}} \cdot \text{AccessibilityDeficit}) + (w_{\text{eco}} \cdot \text{CarbonFactor})$$
- **Industrial Freight & Express**: 6-lane Golden Corridors (NH 44, NH 544), minimizes toll queue time.
- **Green Freight Corridor**: Optimizes EV fleet battery usage and charging hub access.
- **Accessible Public Inter-District Route**: Level boarding, battery buggies at railway platforms, low-floor bus connections.
- **Barrier-Free Medical Emergency Transit**: Prioritizes access to tertiary care centers (RGGGH Chennai, CMC Vellore, GRH Madurai, Coimbatore CMC); flat gradients; avoids coastal flooding and steep ghats.
- **Interactive Weight Sliders**: Dynamic real-time adjustment of $w_{\text{dist}}$, $w_{\text{time}}$, $w_{\text{barrier}}$, $w_{\text{eco}}$.

### Engine 2: Statewide Accessibility Intelligence Engine (`src/engine/accessibilityScorer.ts`)
Scores every terminal, transit interchange, and highway rest node (0 to 100):
- **Inter-District Terminal Rating**: Wheelchair ramp gradients, tactile paving, accessible restrooms, audio-visual display boards, battery buggy availability at railway stations.
- **Highway Universal Rest Stops**: Frequency of accessible washrooms and emergency medical response facilities along state corridors (NH 44, NH 544, NH 45).
- **Terrain & Safety Warning**: Automatically flags high-slope stretches (Nilgiris/Ooty, Kodaikanal), alerting users with mobility constraints, cardiac conditions, or wheelchair dependency.
- **Bilingual Compliance Grading**: **AAA (Optimal Universal)**, **AA (Compliant)**, **A (Basic Access)**, and **Fail (Major Barrier)**.

### Engine 3: Dynamic Incident & Weather Simulator (`src/engine/predictiveTraffic.ts`)
- **Coastal Monsoon Inundation**: Simulates storm surge flooding along Chennai OMR / Cuddalore / Nagapattinam coastal stretches, forcing immediate inland rerouting via NH 45.
- **Toll Plaza Congestion**: Simulates heavy freight backlog at Paranur (Chengalpattu) or Samayapuram (Trichy) toll gates.
- **Ghat Landslide / Maintenance Alert**: Simulates route closure on Coonoor / Ooty ghat highway, triggering alternative accessible diversions.

---

## 🎯 4 Preset Demo Scenarios

In the top navigation header, click the **Demo Scenarios** selector to immediately evaluate:
1. **Automotive Export**: Sriperumbudur Cluster to Thoothukudi VOC Port (Fastest freight vs. low-carbon rail-road multi-modal).
2. **Senior & Wheelchair Transit**: Coimbatore Junction to Chennai Central (Enforces step-free platforms, lift-equipped stations, accessible coach access).
3. **Monsoon Emergency Medical Transit**: Cuddalore Coastal Belt to Trichy Medical Center (Rerouting around waterlogged coastal roads with real-time hazard detection).
4. **Agricultural Cold-Chain**: Dindigul Fruit Depot to Chennai Koyambedu Hub (Minimizing spoilage and vibration).

---

## 👤 3 Multi-Persona Dashboards

1. **State Logistics & Supply Chain Commander**:
   - Statewide fleet tracking (Ashok Leyland Electric Semis, BharatBenz 40-Ft Haulers, Carrier Transicold Reefers, 108 Cardiac Ambulances).
   - Order Dispatch queue with freight type (Automotive parts, Textile containers, Perishable produce, Medical critical).
   - Live KPI cards: Total state freight volume, delivery delay, fuel & carbon savings.
2. **Tamil Nadu Accessible Transit Navigator**:
   - District-to-District route planner with assistance filters: "Wheelchair User", "Elderly Citizen", "Sensory / Visually Impaired", "Medical Patient".
   - Turn-by-turn guidance with accessibility checkpoints.
   - Web Speech API voice guidance announcements.
   - Bilingual UI tags in English and Tamil (எ.கா., 'வழித்தட உகப்பாக்கம்', 'அணுகல்தன்மை குறியீடு').
3. **State Infrastructure & Policy Planning View**:
   - Heatmap of "Accessibility Deficit Districts" vs "High Accessibility Corridors".
   - District-level scorecard comparing logistics efficiency against disability accommodation.
   - Annual state accessibility capital allocation simulator (₹10 Crores to ₹80 Crores).

---

## 💻 Tech Stack
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + Lucide React
- **Mapping**: Leaflet + CartoDB Dark Matter / Positron + Custom SVG markers & glowing polyline shaders
- **Charts**: Recharts (Elevation & Topographic Gradient, Quality Radar, Comparative Corridor Matrix)
- **Audio Guidance**: Web Speech API & Web Audio Synthesizer
- **Accessibility**: WCAG AAA high-contrast toggle, font scaler (90% - 125%), screen-reader ARIA live regions

---

## 🚀 Running Locally

```bash
# Start Vite development server
npm run dev

# Open in browser:
http://127.0.0.1:5174/
```
