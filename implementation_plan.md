# Implementation Plan - Project RAKSHA-NETRA Simulator

RAKSHA-NETRA is an AI-powered, real-time track obstruction detection system. To showcase its potential, we will build a high-fidelity, interactive, and visually stunning web-based dashboard and simulation application.

This application is designed to function as an all-in-one pitch and prototype demo for hackathon judges, presenting the technical feasibility, user interfaces, and business model in a cohesive, premium web interface.

## User Review Required

We propose to build this as a modern, single-page dashboard containing three synchronized modules side-by-side:
1. **Interactive Demo Simulator**: Visualizes the miniature track, a moving train, and draggable/clickable obstacles.
2. **Station Master Dashboard**: Displays live network map, node telemetry (vibration, ultrasonic), alerts history, and controls.
3. **Loco Pilot Mobile App**: Simulates a mobile HUD with audio-visual alarms and emergency actions.

> [!NOTE]
> We will implement this using **Vanilla HTML5, ES6+ Javascript, and Custom CSS3 (with CSS Variables)**. This ensures that the application is lightweight, self-contained, and works instantly without needing a complex backend/build process or `node_modules` installation, while maintaining absolute visual excellence.

Please review the structure and details below.

---



### [raksha-netra]

#### [NEW] [index.html](file:///C:/Users/nagas/.gemini/antigravity-ide/scratch/raksha-netra/index.html)
The core structure of the web application. It will contain:
- A header with status metrics (System status, active nodes, power autonomy, etc.).
- A three-column grid layout:
  - **Left Column**: Interactive Demo Simulator. Includes track overview, motorized train movement controls, and obstacle deployment options (Cow, Boulder, Human, Vehicle, Clear).
  - **Middle Column**: Station Master Dashboard. Includes network map, active alert feed, and real-time telemetry charts (vibration, ultrasonic distance).
  - **Right Column**: Simulated Loco Pilot Mobile App. Styled to look like a physical smartphone with a dynamic HUD, audio alarms (using Web Audio API), and emergency brakes.
- A toggleable Project Information modal / panel displaying the business model, cost estimates (₹3,030 prototype, ₹36,000/km production), and the pitch deck.

#### [NEW] [style.css](file:///C:/Users/nagas/.gemini/antigravity-ide/scratch/raksha-netra/style.css)
The style system for the application, following the **Rich Aesthetics** guidelines:
- **Color Palette**: Dark theme using deep slate/navy backgrounds (`#0a0f1d`), card backgrounds with glassmorphism (`rgba(20, 30, 55, 0.7)` with backdrop filter), glowing colors (Emergency Red: `#ff3366`, Safety Green: `#00e676`, Warning Amber: `#ffc107`, LoRa Blue: `#00e5ff`).
- **Typography**: Import Google Fonts (`Outfit` or `Inter`) for clean, modern readability.
- **Animations**: 
  - Train motion along the track.
  - LoRa packet transmission waves.
  - Flashing screen alerts for emergency states.
  - Telemetry update animations.
- Responsive design adapting to larger monitors and standard screens.

#### [NEW] [app.js](file:///C:/Users/nagas/.gemini/antigravity-ide/scratch/raksha-netra/app.js)
The logic engine of the simulator:
- **Simulation Loop (10Hz)**: Simulates the train's position as it moves along the track. Calculates distance to the nearest active node and any placed obstacles.
- **Sensor Fusion Logic**: Combines distance (ultrasonic), vibration (SW-420), and motion (PIR).
- **Edge AI Classifier Sim**: Processes "captured image" of obstacles and displays a confidence progress bar (e.g. `98% Cow Detected`, `96% Boulder Detected`).
- **LoRa Communication Sim**: Simulates packet transmission hops from Node -> Gateway -> Server, illustrating the mesh network.
- **Web Audio Alert**: Uses browser synthesizer (`OscillatorNode`) to produce a rhythmic emergency alarm sound when an obstruction is confirmed, mimicking a cab warning receiver.
- **Emergency Braking System**: Simulates deceleration curves when emergency brakes are applied.

---

## Verification Plan

### Manual Verification
1. Open `  https://nagashree-sakthivel.github.io/raksha-netra/
 in a modern web browser.
2. Select "Add Obstruction" (e.g., place a Boulder at KM 142).
3. Watch the train travel toward it.
4. Verify that:
   - Sensors trigger caution state (PIR/vibration/ultrasonic indicators update).
   - TinyML classification card reveals the classified object with confidence.
   - Mesh transmission animation occurs (Node -> Gateway -> Station Master).
   - The Loco Pilot's screen turns red, displays the photo, calculates countdown, and sound alert triggers.
   - Pressing "Emergency Brake" or letting the system auto-stop slows the train to a halt before collision.
   - Clearing the obstacle resets the track, stopping the alarm, and allows the train to resume.
