/**
 * RAKSHA-NETRA Simulation Engine
 * Core logic, sensor fusion simulation, edge AI emulation, and user interactions.
 */

// --- Global Application State ---
const state = {
    // Train states
    trainSpeed: 0,              // Current speed in km/h
    trainTargetSpeed: 80,       // Target speed set by pilot (km/h)
    trainPosition: 0,           // Percent along the track (0 to 100)
    trainKM: 140.0,             // Calculated KM marker (140.0 to 145.0)
    isRunning: false,           // Train motor active
    isBraking: false,           // Brake lever pulled / Decelerating
    isAutoBrakeEnabled: true,   // Automatic braking system active (Kavach link)
    decelerationRate: 1.5,      // Emergency deceleration (km/h per tick)
    accelerationRate: 0.6,      // Normal acceleration (km/h per tick)
    
    // Obstacle states
    activeObstacle: 'clear',    // 'clear', 'cow', 'boulder', 'human', 'vehicle'
    obstacleKM: 142.2,          // Position of the obstacle on track (KM marker)
    
    // Sensor states
    node1KM: 141.5,
    node2KM: 143.5,
    nodeRangeKM: 0.8,           // Detection radius around node
    
    // Live Alerts
    isAlertActive: false,
    alertedNodeId: null,
    timeToCollision: 99.9,
    
    // LoRa Network states
    networkLog: 'System Idle. Awaiting triggers.',
    meshStep: 0,                // Visual index for LoRa packet hops
};

// --- Web Audio API Cab Warning Sound Synthesizer ---
let audioCtx = null;
let alarmInterval = null;

function initAudio() {
    if (audioCtx) return;
    try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
        console.error("Web Audio API not supported.", e);
    }
}

function startAlarmSound() {
    initAudio();
    if (!audioCtx) return;
    if (alarmInterval) return; // already playing
    
    alarmInterval = setInterval(() => {
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        
        // Pulse cab buzzer tone
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        
        osc.type = 'sawtooth';
        // Alternating frequencies for dual-tone alarm
        const freq = (Math.floor(Date.now() / 300) % 2 === 0) ? 880 : 700;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(freq - 100, audioCtx.currentTime + 0.25);
        
        gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.start();
        osc.stop(audioCtx.currentTime + 0.28);
    }, 300);
}

function stopAlarmSound() {
    if (alarmInterval) {
        clearInterval(alarmInterval);
        alarmInterval = null;
    }
}

// --- Live Telemetry Vibration Chart Engine ---
const canvas = document.getElementById('vibration-canvas');
const ctx = canvas.getContext('2d');
let vibData = new Array(60).fill(0.02); // Queue of historical G-forces

// Initialize Canvas resolution matching its styled layout
function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function drawVibrationChart(newGVal) {
    vibData.push(newGVal);
    vibData.shift();
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let y = 10; y < canvas.height; y += 20) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
    
    // Draw line
    const isHeavy = (newGVal > 0.08);
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    grad.addColorStop(0, isHeavy ? '#ff3366' : '#00e5ff');
    grad.addColorStop(1, 'rgba(8, 12, 30, 0.1)');
    
    ctx.strokeStyle = isHeavy ? '#ff3366' : '#00e5ff';
    ctx.fillStyle = grad;
    ctx.lineWidth = 2.5;
    ctx.shadowBlur = isHeavy ? 10 : 2;
    ctx.shadowColor = isHeavy ? 'rgba(255, 51, 102, 0.5)' : 'rgba(0, 229, 255, 0.2)';
    
    ctx.beginPath();
    const sliceWidth = canvas.width / (vibData.length - 1);
    
    for (let i = 0; i < vibData.length; i++) {
        // Map G level (0.0G to 1.0G max amplitude) to Y axis
        const val = Math.min(vibData[i], 1.0);
        const y = canvas.height - (val * (canvas.height - 15)) - 8;
        const x = i * sliceWidth;
        
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    }
    ctx.stroke();
    ctx.shadowBlur = 0; // reset shadow
}

// --- Dynamic SVG Obstacle Drawer ---
// Renders vector representations of injected obstacles inside the virtual camera feed
function drawCameraObstacle(svgElementId, type) {
    const container = document.getElementById(svgElementId);
    if (!container) return;
    
    container.innerHTML = ''; // Clear previous drawing
    
    if (type === 'clear') return;
    
    // Position parameters for the camera projection (brings object to track center)
    const cx = 160; 
    const cy = 145;
    
    if (type === 'cow') {
        // Dynamic Cow SVG
        container.innerHTML = `
            <!-- Cow Body -->
            <rect x="${cx - 30}" y="${cy - 25}" width="50" height="28" rx="8" fill="#e2e8f0" stroke="#475569" stroke-width="2"/>
            <!-- Spots -->
            <ellipse cx="${cx - 15}" cy="${cy - 12}" rx="8" ry="6" fill="#1e293b"/>
            <ellipse cx="${cx + 10}" cy="${cy - 18}" rx="6" ry="5" fill="#1e293b"/>
            <ellipse cx="${cx - 22}" cy="${cy - 20}" rx="4" ry="3" fill="#1e293b"/>
            <!-- Legs -->
            <rect x="${cx - 25}" y="${cy}" width="6" height="20" rx="2" fill="#cbd5e1" stroke="#475569" stroke-width="1.5"/>
            <rect x="${cx - 12}" y="${cy}" width="6" height="20" rx="2" fill="#cbd5e1" stroke="#475569" stroke-width="1.5"/>
            <rect x="${cx + 5}" y="${cy}" width="6" height="20" rx="2" fill="#cbd5e1" stroke="#475569" stroke-width="1.5"/>
            <rect x="${cx + 12}" y="${cy}" width="6" height="20" rx="2" fill="#cbd5e1" stroke="#475569" stroke-width="1.5"/>
            <!-- Neck & Head -->
            <rect x="${cx + 15}" y="${cy - 35}" width="12" height="18" rx="3" fill="#e2e8f0" stroke="#475569" stroke-width="2" transform="rotate(-15 ${cx+15} ${cy-35})"/>
            <rect x="${cx + 20}" y="${cy - 42}" width="16" height="12" rx="4" fill="#cbd5e1" stroke="#475569" stroke-width="2"/>
            <!-- Snout -->
            <rect x="${cx + 30}" y="${cy - 38}" width="8" height="7" rx="2" fill="#fda4af"/>
            <!-- Ears -->
            <ellipse cx="${cx + 18}" cy="${cy - 45}" rx="3" ry="5" fill="#e2e8f0" stroke="#475569" transform="rotate(-30 ${cx+18} ${cy-45})"/>
            <!-- Horns -->
            <path d="M${cx + 24} ${cy - 42} Q${cx + 25} ${cy - 48} ${cx + 28} ${cy - 49}" fill="none" stroke="#f1f5f9" stroke-width="2" stroke-linecap="round"/>
            <path d="M${cx + 28} ${cy - 42} Q${cx + 30} ${cy - 47} ${cx + 34} ${cy - 47}" fill="none" stroke="#f1f5f9" stroke-width="2" stroke-linecap="round"/>
            <!-- Tail -->
            <path d="M${cx - 30} ${cy - 20} Q${cx - 38} ${cy - 10} ${cx - 35} ${cy + 5}" fill="none" stroke="#475569" stroke-width="2" stroke-linecap="round"/>
        `;
    } 
    else if (type === 'boulder') {
        // Heavy Jagged Boulder SVG
        container.innerHTML = `
            <!-- Shadow -->
            <ellipse cx="${cx}" cy="${cy + 15}" rx="35" ry="8" fill="rgba(0,0,0,0.4)"/>
            <!-- Boulder Main Shape -->
            <polygon points="${cx-35},${cy+15} ${cx-40},${cy-10} ${cx-15},${cy-30} ${cx+15},${cy-35} ${cx+38},${cy-8} ${cx+32},${cy+18}" fill="#64748b" stroke="#334155" stroke-width="3"/>
            <!-- Surface facets/cracks for dimensional realism -->
            <polygon points="${cx-35},${cy+15} ${cx-15},${cy-30} ${cx-5},${cy-5} ${cx-20},${cy+10}" fill="#475569" opacity="0.6"/>
            <polygon points="${cx+15},${cy-35} ${cx+38},${cy-8} ${cx+10},${cy-2}" fill="#94a3b8" opacity="0.3"/>
            <line x1="${cx-5}" y1="${cy-5}" x2="${cx+15}" y2="${cy-35}" stroke="#1e293b" stroke-width="2"/>
            <line x1="${cx-5}" y1="${cy-5}" x2="${cx+32}" y2="${cy+18}" stroke="#1e293b" stroke-width="2"/>
        `;
    } 
    else if (type === 'human') {
        // Pedestrian Stick Figure Detail SVG
        container.innerHTML = `
            <!-- Shadow -->
            <ellipse cx="${cx}" cy="${cy + 22}" rx="12" ry="4" fill="rgba(0,0,0,0.5)"/>
            <!-- Torso -->
            <line x1="${cx}" y1="${cy - 20}" x2="${cx}" y2="${cy + 5}" stroke="#f8fafc" stroke-width="4" stroke-linecap="round"/>
            <!-- Head -->
            <circle cx="${cx}" cy="${cy - 28}" r="7" fill="#f1f5f9" stroke="#334155" stroke-width="1.5"/>
            <!-- Arms (Waving Alert) -->
            <path d="M${cx - 18} ${cy - 25} Q${cx - 10} ${cy - 15} ${cx} ${cy - 12}" fill="none" stroke="#f8fafc" stroke-width="3" stroke-linecap="round"/>
            <path d="M${cx + 18} ${cy - 25} Q${cx + 10} ${cy - 15} ${cx} ${cy - 12}" fill="none" stroke="#f8fafc" stroke-width="3" stroke-linecap="round"/>
            <!-- Legs (Running/Walking) -->
            <line x1="${cx}" y1="${cy + 5}" x2="${cx - 10}" y2="${cy + 22}" stroke="#cbd5e1" stroke-width="3.5" stroke-linecap="round"/>
            <line x1="${cx}" y1="${cy + 5}" x2="${cx + 8}" y2="${cy + 22}" stroke="#cbd5e1" stroke-width="3.5" stroke-linecap="round"/>
        `;
    } 
    else if (type === 'vehicle') {
        // Stuck Level-Crossing Car SVG
        container.innerHTML = `
            <!-- Car shadow -->
            <rect x="${cx - 48}" y="${cy}" width="96" height="15" rx="5" fill="rgba(0,0,0,0.5)"/>
            <!-- Wheels -->
            <circle cx="${cx - 28}" cy="${cy + 10}" r="10" fill="#1e293b" stroke="#64748b" stroke-width="2"/>
            <circle cx="${cx - 28}" cy="${cy + 10}" r="4" fill="#cbd5e1"/>
            <circle cx="${cx + 28}" cy="${cy + 10}" r="10" fill="#1e293b" stroke="#64748b" stroke-width="2"/>
            <circle cx="${cx + 28}" cy="${cy + 10}" r="4" fill="#cbd5e1"/>
            <!-- Lower Body -->
            <rect x="${cx - 45}" y="${cy - 15}" width="90" height="20" rx="5" fill="#f43f5e" stroke="#991b1b" stroke-width="2"/>
            <!-- Glass Cabin -->
            <path d="M${cx - 30} ${cy - 15} L${cx - 18} ${cy - 32} L${cx + 18} ${cy - 32} L${cx + 30} ${cy - 15} Z" fill="#38bdf8" stroke="#0369a1" stroke-width="2"/>
            <!-- Windows Split -->
            <line x1="${cx}" y1="${cy - 32}" x2="${cx}" y2="${cy - 15}" stroke="#0369a1" stroke-width="1.5"/>
            <!-- Headlight glow -->
            <polygon points="${cx + 42},${cy - 8} ${cx + 120},${cy - 20} ${cx + 120},${cy + 25}" fill="url(#lightGrad)" opacity="0.3"/>
            <!-- Bumpers -->
            <rect x="${cx - 48}" y="${cy - 5}" width="6" height="6" fill="#94a3b8" rx="2"/>
            <rect x="${cx + 42}" y="${cy - 5}" width="6" height="6" fill="#94a3b8" rx="2"/>
            
            <defs>
                <linearGradient id="lightGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="#fef08a" />
                    <stop offset="100%" stop-color="transparent" />
                </linearGradient>
            </defs>
        `;
    }
}

// --- Incident Log Recorder ---
function addLogEntry(type, message) {
    const timeline = document.getElementById('incident-timeline');
    if (!timeline) return;
    
    const item = document.createElement('div');
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    
    let severityClass = 'timeline-system';
    if (type === 'DANGER') severityClass = 'timeline-danger';
    if (type === 'WARN') severityClass = 'timeline-warn';
    
    item.className = `timeline-item ${severityClass}`;
    item.innerHTML = `
        <div class="time">${timeStr}</div>
        <div class="details">${message}</div>
    `;
    
    timeline.insertBefore(item, timeline.firstChild);
    
    // Cap log items at 20 to prevent DOM overhead
    if (timeline.children.length > 20) {
        timeline.removeChild(timeline.lastChild);
    }
}

// --- UI Interaction Hooks ---

// Tab Control inside Pitch Deck Modal
const tabs = document.querySelectorAll('.tab-btn');
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        const contentId = tab.getAttribute('data-tab');
        const contents = document.querySelectorAll('.tab-content');
        contents.forEach(c => c.classList.remove('active'));
        document.getElementById(contentId).classList.add('active');
    });
});

// Modal toggle actions
const pitchModal = document.getElementById('pitch-modal');
const btnOpenPitch = document.getElementById('btn-pitch-deck');
const btnClosePitch = document.getElementById('btn-close-pitch');
const btnClosePitchFooter = document.getElementById('btn-close-pitch-footer');

function toggleModal(show) {
    pitchModal.style.display = show ? 'flex' : 'none';
}
btnOpenPitch.addEventListener('click', () => toggleModal(true));
btnClosePitch.addEventListener('click', () => toggleModal(false));
btnClosePitchFooter.addEventListener('click', () => toggleModal(false));

// Obstacle injection button selection handlers
const obstacleBtns = document.querySelectorAll('.btn-obs');
obstacleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        obstacleBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const obsType = btn.getAttribute('data-obstacle');
        state.activeObstacle = obsType;
        
        const obstacleVisual = document.getElementById('track-obstacle');
        const avatar = document.getElementById('obstacle-visual-avatar');
        
        if (obsType === 'clear') {
            obstacleVisual.style.display = 'none';
            state.isAlertActive = false;
            stopAlarmSound();
            addLogEntry('INFO', 'Track cleared. Sensors set to normal scanning mode.');
        } else {
            obstacleVisual.style.display = 'block';
            let emoji = '🐄';
            if (obsType === 'boulder') emoji = '🪨';
            if (obsType === 'human') emoji = '🚶';
            if (obsType === 'vehicle') emoji = '🚗';
            avatar.textContent = emoji;
            
            addLogEntry('WARN', `Physical obstruction (${obsType.toUpperCase()}) simulated at KM ${state.obstacleKM}`);
        }
        
        // Redraw vector graphics
        drawCameraObstacle('camera-svg-obstacle-group', obsType);
        // Sync log text
        document.getElementById('svg-cam-classification-text').textContent = `CLASSIFICATION: ${obsType.toUpperCase()}`;
    });
});

// Obstacle position slider sync
const obsKMInput = document.getElementById('obstacle-km-slider');
const obsKMVal = document.getElementById('obstacle-km-val');
obsKMInput.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value).toFixed(1);
    state.obstacleKM = parseFloat(val);
    obsKMVal.textContent = val;
    
    // Visual alignment of marker on simulator ribbon
    const pct = ((state.obstacleKM - 140.0) / 5.0) * 100;
    const marker = document.getElementById('track-obstacle');
    marker.style.left = `${pct}%`;
    
    if (state.activeObstacle !== 'clear') {
        addLogEntry('INFO', `Obstruction moved to KM ${val}`);
    }
});

// Train Speed slider control
const speedInput = document.getElementById('train-speed-slider');
const speedVal = document.getElementById('speed-slider-val');
speedInput.addEventListener('input', (e) => {
    state.trainTargetSpeed = parseInt(e.target.value);
    speedVal.textContent = state.trainTargetSpeed;
});

// Train Run & Halt Buttons
const btnStartTrain = document.getElementById('btn-start-train');
const btnStopTrain = document.getElementById('btn-stop-train');
const btnEmergencyStop = document.getElementById('btn-emergency-stop');

btnStartTrain.addEventListener('click', () => {
    initAudio();
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    state.isRunning = true;
    state.isBraking = false;
    document.getElementById('sim-train').classList.remove('braking');
    addLogEntry('INFO', `Loco Pilot opened regulator. Accelerating to ${state.trainTargetSpeed} km/h.`);
});

btnStopTrain.addEventListener('click', () => {
    state.trainTargetSpeed = 0;
    speedInput.value = 0;
    speedVal.textContent = 0;
    addLogEntry('INFO', 'Halt command received. Gradual deceleration initiated.');
});

btnEmergencyStop.addEventListener('click', () => {
    state.isBraking = true;
    document.getElementById('sim-train').classList.add('braking');
    addLogEntry('DANGER', 'Manual Emergency Braking applied by Loco Pilot.');
});

// Phone App Specific Controls (Horn Test, Brake Override)
const btnTestHorn = document.getElementById('btn-test-horn');
btnTestHorn.addEventListener('click', () => {
    initAudio();
    if (audioCtx) {
        // Simple short buzz for test confirmation
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.setValueAtTime(440, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.15);
    }
});

const btnPilotBrake = document.getElementById('btn-pilot-brake');
btnPilotBrake.addEventListener('click', () => {
    state.isBraking = true;
    document.getElementById('sim-train').classList.add('braking');
    addLogEntry('DANGER', 'Loco Pilot triggered Emergency Brakes via smartphone interface.');
});

const btnPilotOverride = document.getElementById('btn-pilot-override');
btnPilotOverride.addEventListener('click', () => {
    // Override clears active alert and lets train pass obstacle
    state.isAlertActive = false;
    state.isBraking = false;
    document.getElementById('sim-train').classList.remove('braking');
    stopAlarmSound();
    addLogEntry('WARN', 'Loco Pilot initiated Alert Override. Automatic Braking bypassed.');
});

const chkAutoBrake = document.getElementById('chk-auto-brake');
chkAutoBrake.addEventListener('change', (e) => {
    state.isAutoBrakeEnabled = e.target.checked;
    addLogEntry('INFO', `Auto-Braking Link ${state.isAutoBrakeEnabled ? 'ENABLED' : 'DISABLED'}`);
});

// --- CORE SIMULATION LOOP (10Hz) ---
setInterval(() => {
    // 1. Train speed physics calculations
    if (state.isRunning) {
        if (state.isBraking) {
            // Decelerate rapidly
            state.trainSpeed = Math.max(0, state.trainSpeed - state.decelerationRate);
        } else {
            // Accelerate or decelerate to target speed
            if (state.trainSpeed < state.trainTargetSpeed) {
                state.trainSpeed = Math.min(state.trainTargetSpeed, state.trainSpeed + state.accelerationRate);
            } else if (state.trainSpeed > state.trainTargetSpeed) {
                state.trainSpeed = Math.max(state.trainTargetSpeed, state.trainSpeed - state.accelerationRate);
            }
        }
    } else {
        // Slow down due to friction if motor off
        state.trainSpeed = Math.max(0, state.trainSpeed - 0.5);
    }

    // 2. Position updates
    if (state.trainSpeed > 0) {
        // 1 tick = 100ms = 0.1s. Let's scale position speed for smooth demo visualization.
        // At 80 km/h, the train should cover the 5km track in about 35 seconds.
        const distanceCoveredInPercent = (state.trainSpeed / 80) * 0.28;
        state.trainPosition += distanceCoveredInPercent;
        
        if (state.trainPosition >= 100) {
            state.trainPosition = 0; // Wrap around to Station A
            addLogEntry('INFO', 'Train 12345 completed section run. Entering Station A block segment.');
            
            // Auto reset overrides
            if (state.isAlertActive) {
                state.isAlertActive = false;
                stopAlarmSound();
            }
        }
    }
    
    state.trainKM = 140.0 + (state.trainPosition / 100) * 5.0;
    
    // UI Update positions
    const trainEl = document.getElementById('sim-train');
    trainEl.style.left = `${state.trainPosition}%`;
    document.getElementById('train-current-km').textContent = `KM ${state.trainKM.toFixed(2)}`;
    document.getElementById('pilot-speed-val').textContent = Math.round(state.trainSpeed);
    
    // Speedometer dial ring orientation
    const speedPct = state.trainSpeed / 120;
    const deg = (speedPct * 270) - 135; // Map to dial boundaries
    document.getElementById('speed-ring').style.transform = `rotate(${deg}deg)`;

    // 3. Sensor Fusion Logic calculations
    // Base defaults
    let s1Ultra = 4.2, s1Vib = 0.02, s1Pir = false;
    let s2Ultra = 4.2, s2Vib = 0.02, s2Pir = false;
    let anomalyDetected = false;
    let alertedNode = 0;
    let activeObstructionDetected = false;
    
    // Calculate distance from train to obstacle to handle braking triggers
    let distanceToObstacleKM = 999;
    if (state.activeObstacle !== 'clear') {
        distanceToObstacleKM = state.obstacleKM - state.trainKM;
    }

    // Process sensor readings if an obstacle exists
    if (state.activeObstacle !== 'clear') {
        // Check Node 1 (KM 141.5)
        const distToNode1 = Math.abs(state.obstacleKM - state.node1KM);
        if (distToNode1 <= state.nodeRangeKM) {
            anomalyDetected = true;
            alertedNode = 1;
            
            // Generate sensor metrics based on obstacle type
            if (state.activeObstacle === 'cow') {
                s1Ultra = 1.6; s1Pir = true; s1Vib = 0.07;
            } else if (state.activeObstacle === 'boulder') {
                s1Ultra = 1.2; s1Pir = false; s1Vib = 0.85; // High impact
            } else if (state.activeObstacle === 'human') {
                s1Ultra = 2.4; s1Pir = true; s1Vib = 0.04;
            } else if (state.activeObstacle === 'vehicle') {
                s1Ultra = 1.0; s1Pir = true; s1Vib = 0.06;
            }
        }

        // Check Node 2 (KM 143.5)
        const distToNode2 = Math.abs(state.obstacleKM - state.node2KM);
        if (distToNode2 <= state.nodeRangeKM) {
            anomalyDetected = true;
            alertedNode = 2;
            
            if (state.activeObstacle === 'cow') {
                s2Ultra = 1.6; s2Pir = true; s2Vib = 0.07;
            } else if (state.activeObstacle === 'boulder') {
                s2Ultra = 1.2; s2Pir = false; s2Vib = 0.85;
            } else if (state.activeObstacle === 'human') {
                s2Ultra = 2.4; s2Pir = true; s2Vib = 0.04;
            } else if (state.activeObstacle === 'vehicle') {
                s2Ultra = 1.0; s2Pir = true; s2Vib = 0.06;
            }
        }
    }

    // Superimpose train rumble onto vibration signals
    if (state.trainSpeed > 0) {
        // The closer the train is to the node, the higher the normal vibration rumble
        const proximity1 = Math.max(0, 1 - Math.abs(state.trainKM - state.node1KM));
        const proximity2 = Math.max(0, 1 - Math.abs(state.trainKM - state.node2KM));
        
        s1Vib += (state.trainSpeed / 120) * 0.05 * proximity1;
        s2Vib += (state.trainSpeed / 120) * 0.05 * proximity2;
    }

    // Push vibration updates to canvas chart (draw node matching active zone)
    const activeVib = (alertedNode === 2) ? s2Vib : s1Vib;
    drawVibrationChart(activeVib);

    // Update telemetry readings on DOM
    document.getElementById('node1-ultra').textContent = `${s1Ultra.toFixed(1)} m`;
    document.getElementById('node1-vib').textContent = `${s1Vib.toFixed(2)} G`;
    document.getElementById('node1-pir').textContent = s1Pir ? 'MOTION DETECTED' : 'NO MOTION';
    
    document.getElementById('node2-ultra').textContent = `${s2Ultra.toFixed(1)} m`;
    document.getElementById('node2-vib').textContent = `${s2Vib.toFixed(2)} G`;
    document.getElementById('node2-pir').textContent = s2Pir ? 'MOTION DETECTED' : 'NO MOTION';

    // Node state alerts styling
    const card1 = document.getElementById('node1-card');
    const badge1 = document.getElementById('node1-status');
    const card2 = document.getElementById('node2-card');
    const badge2 = document.getElementById('node2-status');

    if (state.activeObstacle !== 'clear' && alertedNode === 1) {
        card1.classList.add('alert-state');
        badge1.textContent = 'ALERT ACTIVE';
        badge1.className = 'badge badge-danger';
        
        card2.classList.remove('alert-state');
        badge2.textContent = 'ONLINE';
        badge2.className = 'badge badge-success';
    } else if (state.activeObstacle !== 'clear' && alertedNode === 2) {
        card2.classList.add('alert-state');
        badge2.textContent = 'ALERT ACTIVE';
        badge2.className = 'badge badge-danger';
        
        card1.classList.remove('alert-state');
        badge1.textContent = 'ONLINE';
        badge1.className = 'badge badge-success';
    } else {
        card1.classList.remove('alert-state');
        badge1.textContent = 'ONLINE';
        badge1.className = 'badge badge-success';
        card2.classList.remove('alert-state');
        badge2.textContent = 'ONLINE';
        badge2.className = 'badge badge-success';
    }

    // 4. Alert Decision Matrix (Fusion logic checks)
    // Multi-sensor voting checks if distance drops, PIR is active, or vibration spiked
    if (anomalyDetected && state.activeObstacle !== 'clear') {
        const activeUltra = (alertedNode === 1) ? s1Ultra : s2Ultra;
        const activeVibLevel = (alertedNode === 1) ? s1Vib : s2Vib;
        const activePIR = (alertedNode === 1) ? s1Pir : s2Pir;
        
        // Decision algorithm:
        // A confirmed alert requires Ultrasonic anomaly + either PIR motion or Vibration impact.
        // Boulders trigger via Ultrasonic + Vibration (PIR false).
        // Livestock/humans trigger via Ultrasonic + PIR.
        if (activeUltra < 3.0 && (activePIR || activeVibLevel > 0.06)) {
            activeObstructionDetected = true;
        }
    }

    // 5. Mesh and UI warning updates
    const rib = document.getElementById('track-safety-ribbon');
    const gStatus = document.getElementById('global-system-status');
    
    // LoRa links components
    const meshNode1 = document.getElementById('mesh-node1');
    const meshNode2 = document.getElementById('mesh-node2');
    const meshLink1 = document.getElementById('mesh-link-1');
    const meshLink2 = document.getElementById('mesh-link-2');
    const meshLink3 = document.getElementById('mesh-link-3');
    const meshLog = document.getElementById('mesh-status-text');

    if (activeObstructionDetected && distanceToObstacleKM > 0) {
        rib.textContent = 'OBSTRUCTION DETECTED';
        rib.className = 'track-status-ribbon danger';
        
        gStatus.textContent = 'WARNING';
        gStatus.className = 'status-value active-pulse danger';
        
        // Loop mesh hop visuals
        state.meshStep = (state.meshStep + 1) % 15;
        if (alertedNode === 1) {
            meshNode1.className = 'mesh-node mesh-sensor transmit';
            meshNode2.className = 'mesh-node mesh-sensor active';
            meshLink1.className = 'mesh-link link-1 alarm-flow animating';
            meshLink2.className = 'mesh-link link-2 alarm-flow animating';
            meshLink3.className = 'mesh-link link-3 alarm-flow animating';
            meshLog.textContent = `CRITICAL: Node 1 packets routing through Node 2 -> Gateway. RSSI: -92dBm`;
        } else {
            meshNode2.className = 'mesh-node mesh-sensor transmit';
            meshNode1.className = 'mesh-node mesh-sensor active';
            meshLink1.className = 'mesh-link link-1';
            meshLink2.className = 'mesh-link link-2 alarm-flow animating';
            meshLink3.className = 'mesh-link link-3 alarm-flow animating';
            meshLog.textContent = `CRITICAL: Node 2 sending packets direct to Gateway. RSSI: -84dBm`;
        }
        
        // Alert train only if approaching
        if (distanceToObstacleKM <= 1.8) {
            state.isAlertActive = true;
        }
    } else {
        rib.textContent = 'TRACK SECURE';
        rib.className = 'track-status-ribbon';
        
        gStatus.textContent = 'SECURE';
        gStatus.className = 'status-value active-pulse';
        
        // Idle network representation
        meshNode1.className = 'mesh-node mesh-sensor active';
        meshNode2.className = 'mesh-node mesh-sensor active';
        meshLink1.className = 'mesh-link link-1';
        meshLink2.className = 'mesh-link link-2';
        meshLink3.className = 'mesh-link link-3';
        meshLog.textContent = 'LoRa Network Status: Listening. Node check-ins secure.';
    }

    // 6. Loco Pilot CAB HUD warnings management
    const pilotScreenNormal = document.getElementById('hud-normal');
    const pilotScreenDanger = document.getElementById('hud-danger');
    const pilotClearance = document.getElementById('pilot-clearance-status');
    const targetDistanceLabel = document.getElementById('train-distance-label');

    if (state.isAlertActive && distanceToObstacleKM > 0) {
        // Dynamic image feeds clone
        drawCameraObstacle('svg-camera-danger-view', state.activeObstacle);
        
        // Sound and screen alerts
        startAlarmSound();
        pilotScreenNormal.style.display = 'none';
        pilotScreenDanger.style.display = 'flex';
        
        // Speed updates
        const distanceM = Math.round(distanceToObstacleKM * 1000);
        document.getElementById('danger-distance').textContent = `${distanceM}m`;
        targetDistanceLabel.textContent = `${distanceM}m`;
        
        // Threat classification details
        document.getElementById('danger-ai-class').textContent = `${state.activeObstacle.toUpperCase()} DETECTED`;
        document.getElementById('danger-val-ultra').textContent = `${((alertedNode === 1) ? s1Ultra : s2Ultra).toFixed(1)}m`;
        
        // ETA countdown calculation
        if (state.trainSpeed > 0) {
            // Speed in m/s = speed_kmh * 1000 / 3600 = speed_kmh / 3.6
            const speedMS = state.trainSpeed / 3.6;
            const eta = distanceM / speedMS;
            document.getElementById('danger-time-countdown').textContent = `EST. IMPACT: ${eta.toFixed(1)}s`;
        } else {
            document.getElementById('danger-time-countdown').textContent = 'TRAIN IMMOBILIZED';
        }

        // Automatic emergency braking execution
        if (state.isAutoBrakeEnabled && !state.isBraking) {
            state.isBraking = true;
            document.getElementById('sim-train').classList.add('braking');
            addLogEntry('DANGER', `Auto-Brake Link triggered! Obstruction confirmed ${distanceM}m ahead. Emergency deceleration active.`);
        }
        
    } else {
        // Safe HUD resets
        stopAlarmSound();
        pilotScreenNormal.style.display = 'flex';
        pilotScreenDanger.style.display = 'none';
        targetDistanceLabel.textContent = '--';
        
        if (state.activeObstacle !== 'clear') {
            pilotClearance.className = 'clearance-card bg-caution';
            pilotClearance.querySelector('h4').textContent = 'TRACK STATUS: CAUTION';
            pilotClearance.querySelector('p').textContent = `Obstacle reported nearby at KM ${state.obstacleKM.toFixed(1)}`;
            pilotClearance.querySelector('.card-icon').textContent = '🟡';
        } else {
            pilotClearance.className = 'clearance-card bg-safe';
            pilotClearance.querySelector('h4').textContent = 'TRACK STATUS: SECURE';
            pilotClearance.querySelector('p').textContent = 'Next 5.0 km verified safe. Kavach link synced.';
            pilotClearance.querySelector('.card-icon').textContent = '🟢';
        }
    }
    
    // Next node distance tracker display
    let nextNodeDist = 0;
    if (state.trainKM < state.node1KM) {
        nextNodeDist = state.node1KM - state.trainKM;
        document.getElementById('hud-next-node-dist').textContent = `${nextNodeDist.toFixed(2)} km (Node 1)`;
    } else if (state.trainKM < state.node2KM) {
        nextNodeDist = state.node2KM - state.trainKM;
        document.getElementById('hud-next-node-dist').textContent = `${nextNodeDist.toFixed(2)} km (Node 2)`;
    } else {
        nextNodeDist = 5.0 - (state.trainKM - 140.0) + (state.node1KM - 140.0);
        document.getElementById('hud-next-node-dist').textContent = `${nextNodeDist.toFixed(2)} km (Node 1)`;
    }

    // Deceleration HUD details
    if (state.isBraking) {
        document.getElementById('hud-decel-target').textContent = '🚨 DANGER STOP';
        document.getElementById('hud-decel-target').className = 'hud-val text-red';
    } else {
        document.getElementById('hud-decel-target').textContent = 'N/A';
        document.getElementById('hud-decel-target').className = 'hud-val';
    }

    // Handling Collision event!
    if (state.activeObstacle !== 'clear' && distanceToObstacleKM <= 0 && distanceToObstacleKM > -0.2) {
        if (state.trainSpeed > 0) {
            // Collision occurred
            state.trainSpeed = 0;
            state.isRunning = false;
            stopAlarmSound();
            addLogEntry('DANGER', `💥 COLLISION EVENT! Train 12345 struck ${state.activeObstacle.toUpperCase()} at KM ${state.obstacleKM.toFixed(1)}!`);
            alert(`COLLISION ALERT!\nTrain WAP-7 has collided with ${state.activeObstacle.toUpperCase()} at KM ${state.obstacleKM.toFixed(1)}! Speed: 0 km/h.`);
        } else {
            // Stopped safely!
            if (state.isAlertActive) {
                state.isAlertActive = false;
                addLogEntry('INFO', `🛡️ ACCIDENT AVERTED! Train stopped safely at KM ${state.trainKM.toFixed(2)}, ${Math.round(distanceToObstacleKM*1000)}m before obstruction.`);
            }
        }
    }

}, 100);

// Set clock text on mobile mock mockup
setInterval(() => {
    const clock = document.getElementById('phone-clock');
    if (clock) {
        const now = new Date();
        const hrs = String(now.getHours()).padStart(2, '0');
        const mins = String(now.getMinutes()).padStart(2, '0');
        clock.textContent = `${hrs}:${mins}`;
    }
}, 1000);

// Initialize initial drawing
drawCameraObstacle('camera-svg-obstacle-group', 'clear');
addLogEntry('INFO', 'System ready. Open pitch deck or click Obstacles to start.');
console.log("RAKSHA-NETRA engine initialized.");
