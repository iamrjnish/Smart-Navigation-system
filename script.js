// Global graph variables
let graphData = { nodes: {}, edges: [] };
let isAccessMode = false;

// DOM Elements
const svgOverlay = document.getElementById('mapOverlay');
const pin = document.getElementById('pin');
const accessibilityToggle = document.getElementById('accessibilityToggle');
const sourceSelect = document.getElementById('sourceSelect'); // Get Dropdowns
const destSelect = document.getElementById('destSelect');     // Get Dropdowns

// 1. LOAD THE JSON DATA
async function loadGraphData() {
    try {
        const response = await fetch('station_graph.json');
        graphData = await response.json();
        console.log("Graph data loaded:", graphData);
    } catch (error) {
        console.error("Error loading graph:", error);
    }
}

// Initialize
loadGraphData();

// --- EVENT LISTENERS ---

// Toggle Accessibility
accessibilityToggle.addEventListener('change', (e) => {
    isAccessMode = e.target.checked;
    findRoute(); // Re-calculate if mode changes
});

// Auto-Clear: Clear map immediately when user changes dropdowns
sourceSelect.addEventListener('change', clearMap);
destSelect.addEventListener('change', clearMap);


// 2. PATHFINDING ALGORITHM (Dijkstra's Algorithm)
function findShortestPath(startNodeId, endNodeId) {
    const distances = {};
    const previous = {};
    const queue = [];

    // Setup
    for (const node in graphData.nodes) {
        distances[node] = Infinity;
        previous[node] = null;
        queue.push(node);
    }
    distances[startNodeId] = 0;

    while (queue.length > 0) {
        queue.sort((a, b) => distances[a] - distances[b]);
        const current = queue.shift();

        if (current === endNodeId) break; 
        if (distances[current] === Infinity) break;

        const neighbors = getNeighbors(current);
        
        for (const neighbor of neighbors) {
            if (isAccessMode && !neighbor.isAccessible) continue;

            const alt = distances[current] + neighbor.dist;
            if (alt < distances[neighbor.id]) {
                distances[neighbor.id] = alt;
                previous[neighbor.id] = current;
            }
        }
    }

    // Reconstruct Path
    const path = [];
    let u = endNodeId;
    if (previous[u] || u === startNodeId) {
        while (u) {
            path.unshift(graphData.nodes[u]);
            u = previous[u];
        }
    }
    return path;
}

// Helper to find connected nodes (2-WAY TRAVEL ENABLED)
function getNeighbors(nodeId) {
    const neighbors = [];
    graphData.edges.forEach(edge => {
        // Forward (From -> To)
        if (edge.from === nodeId) {
            neighbors.push({ id: edge.to, dist: edge.dist, isAccessible: edge.access });
        }
        // Reverse (To -> From) - Allows walking back
        if (edge.to === nodeId) {
            neighbors.push({ id: edge.from, dist: edge.dist, isAccessible: edge.access });
        }
    });
    return neighbors;
}

// 3. DRAWING & INTERACTION

// --- IMPROVED CLEAR FUNCTION ---
function clearMap() {
    // Force remove all lines from the SVG
    while (svgOverlay.firstChild) {
        svgOverlay.removeChild(svgOverlay.firstChild);
    }
    // Hide the pin
    pin.style.display = 'none';
}

function drawPath(pathNodes) {
    if (pathNodes.length < 2) return;

    const polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    const pointsStr = pathNodes.map(node => `${node.x},${node.y}`).join(" ");
    
    polyline.setAttribute("points", pointsStr);
    polyline.setAttribute("class", isAccessMode ? 'route-line route-access' : 'route-line route-normal');
    
    svgOverlay.appendChild(polyline);
}

function findRoute() {
    // 1. CLEAR MAP FIRST!
    clearMap(); 

    const source = sourceSelect.value;
    const dest = destSelect.value;
    
    if (source === dest) {
        alert("You are already there!");
        return;
    }

    const routePath = findShortestPath(source, dest);

    if (routePath.length > 1) {
        drawPath(routePath);
        const endNode = routePath[routePath.length - 1];
        showPin(endNode.x, endNode.y);
    } else {
        alert("No route found! (Check your JSON connections)");
    }
}

function showPin(x, y) {
    const xPercent = (x / 1000) * 100;
    const yPercent = (y / 600) * 100;
    
    pin.style.left = xPercent + '%';
    pin.style.top = yPercent + '%';
    pin.style.display = 'block';
}

function highlightFacility(type) {
    clearMap(); // Clear first!
    
    const facilityMap = {
        'toilet': 'toilet',
        'lift': 'lift_p1_g',
        'food': 'food',      
        'medical': 'medical'
    };
    
    const nodeId = facilityMap[type];
    if (nodeId && graphData.nodes[nodeId]) {
        const node = graphData.nodes[nodeId];
        showPin(node.x, node.y);
    }
}
