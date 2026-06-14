# 🚂 RAKSHA-NETRA

### AI-Powered Real-Time Railway Track Obstruction Detection — Interactive Simulator

*"Eyes on every meter of track, every second of the day."*


> **What this repo is:** a fully working, browser-based **simulator + dashboard** that demonstrates how the RAKSHA-NETRA concept would detect track obstructions and alert trains in real time. The physical hardware (sensors, LoRa, cloud) is our **proposed system design — not yet built**. This demo simulates that pipeline end-to-end in software.

---

**Problem Statement**
Every year, over 2,000 train accidents in India occur due to obstructions on railway tracks — stray cattle, fallen trees, boulders, landslide debris, vehicles stuck at crossings, and even trespassers. Current detection relies entirely on manual patrolling by gangmen, who can cover only 8–10 km/day on foot.

The gap: Between patrols, tracks remain unmonitored for hours. A single boulder falling after a patrol passes can cause a catastrophic derailment.

Result: Preventable deaths, massive delays, and crores in damages.



## 💡 The 30-Second Pitch

> Every **4 hours**, a train in India hits an obstruction on the track. Behind every statistic is a family that lost someone.

**RAKSHA-NETRA** envisions a low-cost network of solar-powered, AI-enabled sensor nodes that watch the track 24/7, classify obstructions on-device in **under 1 second**, and warn loco pilots and station masters — automatically triggering emergency braking.

This repository contains a **working software simulator** that brings that vision to life in the browser — so you can see exactly how the detection-to-braking pipeline behaves, without any hardware.

---

## ✅ What We Built (this repo)

A fully self-contained **web app** (Vanilla HTML/CSS/JS — no backend, no build step) with three synchronized modules:

| Module | What it does |
|---|---|
| 🛤️ Interactive Track Simulator | A miniature track with a moving train; place obstacles (cow, boulder, human, vehicle) and watch the system react |
| 🖥️ Station Master Dashboard | Network map, animated LoRa packet hops, live telemetry charts, and an alert feed |
| 📱 Loco Pilot App (UI) | Phone-style HUD with a simulated photo, distance countdown, audio alarm, and Emergency Brake button |

**Everything is simulated in JavaScript** — sensor readings, the AI classifier confidence, LoRa transmission, and braking physics are modeled in code to faithfully demonstrate the intended real-world behavior.

---

## 🎮 Live Demo Walkthrough

1. Open the app in your browser.
2. Place a **Boulder** on the track.
3. Press **Start** — the train moves toward it.
4. As the train nears, the simulated sensors light up (ultrasonic distance, vibration, motion).
5. The **AI classifier card** reveals the object: *"96% Boulder Detected."*
6. A **LoRa packet** animates from the node → gateway → Station Master dashboard.
7. The **Loco Pilot screen** flashes red, shows a photo + countdown, and an alarm sounds.
8. The train **auto-brakes** and stops before collision.
9. Clear the obstacle → the track resets to green and the train resumes.

---

## 🚀 Getting Started

You only need a web browser — no installation, no dependencies.


    # Run a local server (recommended, so the alarm audio plays reliably)
    
    # then open  ** https://nagashree-sakthivel.github.io/raksha-netra/ **

---



## 🧩 How the Simulation Works

The app models the full detection pipeline in JavaScript:

1. A **10 Hz loop** moves the train and measures its live distance to any placed obstacle.
2. Within a caution range, simulated **sensors** (ultrasonic / vibration / PIR) begin reacting.
3. Within a confirm range, a mock **TinyML classifier** reveals the object with a confidence score.
4. A simulated **LoRa packet** animates across the network map to the dashboard.
5. The **Loco Pilot HUD** triggers a visual + Web Audio alarm and a distance countdown.
6. A **deceleration curve** brings the train to a stop before collision.

Multi-sensor fusion logic (modeled in the demo):

    Ultrasonic only                -> could be rain/bird     -> ignore
    Ultrasonic + PIR               -> could be debris        -> caution
    Ultrasonic + PIR + Vibration   -> physical impact        -> alert
    All + Camera AI confirmation   -> high-confidence object -> ACT

---

## 🧪 Tech Stack (what's built)

| Area | Technology |
|---|---|
| Structure | HTML5 |
| Styling | CSS3 (glassmorphism dark theme, animations) |
| Logic | Vanilla ES6 JavaScript (no frameworks, no build step) |
| Audio | Web Audio API (emergency alarm) |

---

## 🔭 Proposed Real-World System (concept — not yet built)

The simulator demonstrates how the full hardware system *would* work once built. The intended physical design:

| Layer | Planned approach |
|---|---|
| 🔍 Multi-sensor detection | Ultrasonic (HC-SR04) + PIR motion + Vibration (SW-420) |
| 🧠 Edge AI | TinyML (TFLite Micro, INT8 MobileNetV2) on ESP32-CAM |
| 📡 Communication | LoRa SX1278 mesh + SIM800L 4G gateway |
| ☁️ Cloud + alerts | Firebase / AWS IoT Core dashboard + mobile alerts |
| 🛑 Auto-braking | Emergency-brake trigger signal to train control |

**Estimated hardware cost (if built):** ~₹3,000 per prototype node; ~₹36,000/km in production — vs. ₹50 lakh/km for radar.

---

## 📊 Vision & Impact

If deployed, the concept scales across the Indian Railways network:

| Phase | Coverage | Investment | Timeline |
|---|---|---|---|
| Pilot | 50 km (vulnerable section) | ₹25 lakh | 6 months |
| Zone rollout | 5,000 km (high-risk zones) | ₹15 crore | 2 years |
| National | 68,000 km (full network) | ₹200 crore | 5 years |

- 💰 Targeting **₹36,000/km** vs. **₹50 lakh/km** for radar — up to **167× cheaper**
- ⚡ Designed for **< 1 second** end-to-end detection
- 🌞 Solar + LoRa — works in remote areas with no power or cellular
- 🔌 Retrofittable alongside existing track; integrates with Kavach/ETCS via open APIs

---



**RAKSHA-NETRA** — because every life on the tracks deserves a guardian watching over it. 🛡️

