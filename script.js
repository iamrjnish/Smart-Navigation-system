// Configuration: Coordinate System (Based on 1000x600 viewBox)
// These points map to physical locations on your image.
const locations = {
    entry: { x: 90, y: 500 },     // Bottom Left Entry
    security: { x: 330, y: 500 }, // Security Check
    
    // Platforms (Bottom/Ground Level)
    p1_bottom: { x: 480, y: 500 },
    p2_bottom: { x: 580, y: 500 },
    
    // Platforms (Top/Upper Level - just for visual routing)
    p1_top: { x: 480, y: 250 },
    p2_top: { x: 580, y: 250 },
    p3_top: { x: 680, y: 250 },
    
    // Accessibility Points
    ramp: { x: 180, y: 530 },
    lift_p1: { x: 460, y: 280 },
    lift_p2: { x: 560, y: 280 },
    
    // FOB (Bridge)
    fob_start: { x: 480, y: 130 }, // Bridge over P1
    fob_mid: { x: 580, y: 130 },   // Bridge over P2
    fob_end: { x: 680, y: 130 },   // Bridge over P3
    
    // Facilities
    toilet: { x: 820, y: 100 },    // Top Right
    food: { x: 850, y: 400 },      // Bottom Right Food Court
    help: { x: 750, y: 500 },      // Help Desk near waiting area
    medical: { x: 920, y: 180 }    // Medical Room (Right side)
};

// State
let isAccessMode = false;

// DOM Elements
const svgOverlay = document.getElementById('mapOverlay');
const pin = document.getElementById('pin');
const accessibilityToggle = document.getElementById('accessibilityToggle');

// Event Listener for Toggle
accessibilityToggle.addEventListener('change', (e) => {
    isAccessMode = e.target.checked;
    console.log("Accessibility Mode:", isAccessMode);
    // If a route is already shown, refresh it
    findRoute();
});

// Function to clear map
function clearMap() {
    svgOverlay.innerHTML = ''; // Remove all lines
    pin.style.display = 'none'; // Hide pin
}

// Function to draw a line (path)
function drawPath(points, type) {
    const polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    
    // Convert array of objects {x,y} to string "x,y x,y"
    const pointsStr = points.map(p => `${p.x},${p.y}`).join(" ");
    
    polyline.setAttribute("points", pointsStr);
    polyline.setAttribute("class", `route-line ${type}`); // route-normal or route-access
    
    svgOverlay.appendChild(polyline);
}

// Function: Find and Draw Route
function findRoute() {
    clearMap();
    
    const source = document.getElementById('sourceSelect').value;
    const dest = document.getElementById('destSelect').value;
    
    if (source === dest) {
        alert("You are already at the destination!");
        return;
    }

    let routePoints = [];

    // --- LOGIC: Define paths based on Source -> Destination ---
    // In a real app, this would use a Graph Algorithm (Dijkstra/A*).
    // For the hackathon, we manually define the key paths from the image.

    // 1. ENTRY -> PLATFORM 1
    if (source === 'entry' && dest === 'p1') {
        if (isAccessMode) {
            // Ramp -> Lift -> Platform
            routePoints = [
                locations.entry, 
                locations.ramp, 
                locations.security, 
                locations.lift_p1,
                locations.p1_top
            ];
        } else {
            // Walk -> Stairs -> Platform
            routePoints = [
                locations.entry, 
                locations.security, 
                locations.p1_bottom,
                locations.p1_top
            ];
        }
    }
    
    // 2. ENTRY -> PLATFORM 2
    else if (source === 'entry' && dest === 'p2') {
        if (isAccessMode) {
            // Ramp -> Security -> Lift P1 -> Bridge -> Lift P2
            routePoints = [
                locations.entry, locations.ramp, locations.security, 
                locations.lift_p1, locations.fob_start, locations.fob_mid, locations.lift_p2
            ];
        } else {
            // Normal Stairs -> Bridge
            routePoints = [
                locations.entry, locations.security, locations.p1_bottom, 
                locations.fob_start, locations.fob_mid, locations.p2_top
            ];
        }
    }

    // 3. ANY -> TOILET (Simplified)
    else if (dest === 'toilet') {
        routePoints = [locations.entry, locations.security, locations.fob_start, locations.fob_end, locations.toilet];
    }

    // 4. ENTRY -> FOOD COURT
    else if (source === 'entry' && dest === 'food') {
        routePoints = [locations.entry, locations.security, locations.help, locations.food];
    }
    
    // Fallback for undefined routes in demo
    else {
        alert("Route not defined for this demo scenario. Try 'Entry Gate' to 'Platform 1'!");
        return;
    }

    // Draw the calculated route
    const styleClass = isAccessMode ? 'route-access' : 'route-normal';
    drawPath(routePoints, styleClass);
    
    // Highlight Destination
    const endPoint = routePoints[routePoints.length - 1];
    showPin(endPoint.x, endPoint.y);
}

// Function: Highlight specific facility (Facility Finder)
function highlightFacility(type) {
    clearMap();
    let loc;
    
    switch(type) {
        case 'toilet': loc = locations.toilet; break;
        case 'lift': loc = locations.lift_p1; break; // Demo highlighting P1 lift
        case 'medical': loc = locations.medical; break;
        case 'food': loc = locations.food; break;
    }
    
    if (loc) {
        showPin(loc.x, loc.y);
    }
}

// Helper to show the pulsing pin
function showPin(x, y) {
    // Convert SVG coordinates to percentages for HTML div positioning
    // ViewBox is 1000x600
    const xPercent = (x / 1000) * 100;
    const yPercent = (y / 600) * 100;
    
    pin.style.left = xPercent + '%';
    pin.style.top = yPercent + '%';
    pin.style.display = 'block';
}