// Soccer field visualization showing position-specific statistics
document.addEventListener('DOMContentLoaded', function() {
    // Dataset URL
    const datasetUrl = 'https://raw.githubusercontent.com/1Syntax-Error/visualization-projects/main/dataset%20-%202020-09-24.csv';
    
    // Load and process the data
    loadData(datasetUrl);
    
    async function loadData(url) {
        try {
            const response = await fetch(url);
            const csvText = await response.text();
            
            // Parse CSV
            Papa.parse(csvText, {
                header: true,
                dynamicTyping: true,
                skipEmptyLines: true,
                complete: function(results) {
                    processData(results.data);
                },
                error: function(error) {
                    console.error("Error parsing CSV:", error);
                }
            });
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    }
    
    function processData(rawData) {
        // Clean and filter data
        const data = rawData.filter(player => {
            return player.Position && player.Appearances && player.Appearances >= 10;
        });
        
        createVisualization(data);
    }
    
    function createVisualization(data) {
        // Get container
        const container = document.getElementById('field-visualization');
        if (!container) return;
        
        container.innerHTML = `
            <h2>Player Performance by Position (Soccer Field Bubble Chart)</h2>
            <p>This shows how different positions contributes to some key performance metrics across the soccer pitch</p>
            
            <div class="field-controls">
                <div class="metric-selector">
                    <label>Performance Metric:</label>
                    <div class="button-group">
                        <!-- First row of metrics -->
                        <button class="metric-btn active" data-metric="Goals">Goals</button>
                        <button class="metric-btn" data-metric="Assists">Assists</button>
                        <button class="metric-btn" data-metric="Passes">Passes</button>
                        <button class="metric-btn" data-metric="Tackles">Tackles</button>
                        <button class="metric-btn" data-metric="Interceptions">Interceptions</button>
                        <button class="metric-btn" data-metric="Clearances">Clearances</button>
                        <button class="metric-btn" data-metric="Yellow cards">Yellow Cards</button>
                        <button class="metric-btn" data-metric="Red cards">Red Cards</button>
                    </div>
                </div>
            </div>
            
            <div class="field-container-vertical">
                <svg id="soccer-field" width="800" height="500"></svg>
                <div id="position-details" class="position-details">
                    <p class="position-prompt">Click on a position bubble to see player details</p>
                </div>
            </div>
        `;
        
        // Set up the soccer field
        drawSoccerField();
        
        // Define positions and their coordinates on the field
        const positions = [
            { id: "gk", name: "Goalkeeper", x: 50, y: 250, players: data.filter(p => p.Position === "Goalkeeper") },
            { id: "lb", name: "Left Back", x: 150, y: 380, players: data.filter(p => p.Position === "Defender") },
            { id: "cb1", name: "Center Back (L)", x: 150, y: 300, players: data.filter(p => p.Position === "Defender") },
            { id: "cb2", name: "Center Back (R)", x: 150, y: 200, players: data.filter(p => p.Position === "Defender") },
            { id: "rb", name: "Right Back", x: 150, y: 120, players: data.filter(p => p.Position === "Defender") },
            { id: "dm", name: "Defensive Midfielder", x: 270, y: 250, players: data.filter(p => p.Position === "Midfielder") },
            { id: "lm", name: "Left Midfielder", x: 350, y: 380, players: data.filter(p => p.Position === "Midfielder") },
            { id: "cm", name: "Central Midfielder", x: 350, y: 250, players: data.filter(p => p.Position === "Midfielder") },
            { id: "rm", name: "Right Midfielder", x: 350, y: 120, players: data.filter(p => p.Position === "Midfielder") },
            { id: "lf", name: "Left Forward", x: 500, y: 350, players: data.filter(p => p.Position === "Forward") },
            { id: "cf", name: "Center Forward", x: 500, y: 250, players: data.filter(p => p.Position === "Forward") },
            { id: "rf", name: "Right Forward", x: 500, y: 150, players: data.filter(p => p.Position === "Forward") }
        ];
        
        // Position markers
        drawPositionMarkers(positions, "Goals");
        
        // Event listeners for metric buttons
        document.querySelectorAll('.metric-btn').forEach(button => {
            button.addEventListener('click', function() {
                // Update active button
                document.querySelectorAll('.metric-btn').forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                
                // Update visualization with new metric
                const metric = this.getAttribute('data-metric');
                drawPositionMarkers(positions, metric);
            });
        });
        
        // Publish the positions data for other visualizations to use
        window.positionsData = positions;
        
        // Dispatch event to notify other visualizations
        const event = new CustomEvent('positionsDataReady', { detail: positions });
        document.dispatchEvent(event);
    }
    
    function drawSoccerField() {
        const svg = d3.select("#soccer-field");
        const width = +svg.attr("width");
        const height = +svg.attr("height");
        
        // Clear SVG
        svg.selectAll("*").remove();
        
        // Draw field background
        svg.append("rect")
            .attr("width", width)
            .attr("height", height)
            .attr("fill", "#7bb369")
            .attr("stroke", "white")
            .attr("stroke-width", 4)
            .attr("rx", 10)
            .attr("ry", 10);
        
        // Draw center line
        svg.append("line")
            .attr("x1", width / 2)
            .attr("y1", 0)
            .attr("x2", width / 2)
            .attr("y2", height)
            .attr("stroke", "white")
            .attr("stroke-width", 2);
        
        // Draw center circle
        svg.append("circle")
            .attr("cx", width / 2)
            .attr("cy", height / 2)
            .attr("r", 60)
            .attr("fill", "none")
            .attr("stroke", "white")
            .attr("stroke-width", 2);
        
        // Draw penalty areas
        // Left penalty area
        svg.append("rect")
            .attr("x", 0)
            .attr("y", height / 2 - 110)
            .attr("width", 130)
            .attr("height", 220)
            .attr("fill", "none")
            .attr("stroke", "white")
            .attr("stroke-width", 2);
        
        // Right penalty area
        svg.append("rect")
            .attr("x", width - 130)
            .attr("y", height / 2 - 110)
            .attr("width", 130)
            .attr("height", 220)
            .attr("fill", "none")
            .attr("stroke", "white")
            .attr("stroke-width", 2);
        
        // Draw goal areas
        // Left goal area
        svg.append("rect")
            .attr("x", 0)
            .attr("y", height / 2 - 40)
            .attr("width", 50)
            .attr("height", 80)
            .attr("fill", "none")
            .attr("stroke", "white")
            .attr("stroke-width", 2);
        
        // Right goal area
        svg.append("rect")
            .attr("x", width - 50)
            .attr("y", height / 2 - 40)
            .attr("width", 50)
            .attr("height", 80)
            .attr("fill", "none")
            .attr("stroke", "white")
            .attr("stroke-width", 2);
        
        // Add field pattern
        svg.append("pattern")
            .attr("id", "field-pattern")
            .attr("patternUnits", "userSpaceOnUse")
            .attr("width", 60)
            .attr("height", 60)
            .append("path")
            .attr("d", "M 0,30 L 60,30")
            .attr("stroke", "#6ba55a")
            .attr("stroke-width", 1.5);
        
        // Apply pattern
        svg.append("rect")
            .attr("width", width)
            .attr("height", height)
            .attr("fill", "url(#field-pattern)")
            .attr("rx", 10)
            .attr("ry", 10)
            .attr("opacity", 0.3);
        
        // Add legend for field positions
        const legend = svg.append("g")
            .attr("transform", `translate(${width - 180}, 20)`);
        
        legend.append("rect")
            .attr("width", 160)
            .attr("height", 90)
            .attr("fill", "white")
            .attr("opacity", 0.7)
            .attr("rx", 5)
            .attr("ry", 5);
        
        const positions = [
            { color: "#ff9e00", label: "Goalkeeper" },
            { color: "#00ff85", label: "Defender" },
            { color: "#04f5ff", label: "Midfielder" },
            { color: "#e90052", label: "Forward" }
        ];
        
        positions.forEach((pos, i) => {
            legend.append("circle")
                .attr("cx", 20)
                .attr("cy", 20 + i * 18)
                .attr("r", 6)
                .attr("fill", pos.color);
            
            legend.append("text")
                .attr("x", 35)
                .attr("y", 23 + i * 18)
                .attr("font-size", "12px")
                .text(pos.label);
        });
    }
    
    function drawPositionMarkers(positions, metric) {
        const svg = d3.select("#soccer-field");
        
        // Remove existing markers
        svg.selectAll(".position-marker").remove();
        
        // Calculate maximum value for scaling
        const maxValue = d3.max(positions, pos => {
            return d3.sum(pos.players, p => p[metric] || 0);
        });
        
        // Create scale for marker size
        const sizeScale = d3.scaleSqrt()
            .domain([0, maxValue])
            .range([20, 45]);
        
        // Color scale for positions
        const colorScale = d3.scaleOrdinal()
            .domain(["Goalkeeper", "Defender", "Midfielder", "Forward"])
            .range(["#ff9e00", "#00ff85", "#04f5ff", "#e90052"]);
        
        // Draw markers for each position
        positions.forEach(pos => {
            // Calculate total value for this position
            const totalValue = d3.sum(pos.players, p => p[metric] || 0);
            
            // Calculate average per player
            const avgValue = totalValue / (pos.players.length || 1);
            
            // Draw position marker
            const marker = svg.append("g")
                .attr("class", "position-marker")
                .attr("transform", `translate(${pos.x}, ${pos.y})`)
                .style("cursor", "pointer");
            
            // Determine color based on first player's position
            const color = pos.players.length > 0 ? colorScale(pos.players[0].Position) : "#999";
            
            // Add circle
            marker.append("circle")
                .attr("r", sizeScale(totalValue) / 2)
                .attr("fill", color)
                .attr("opacity", 0.7)
                .attr("stroke", "white")
                .attr("stroke-width", 2);
            
            // Add position label
            marker.append("text")
                .attr("text-anchor", "middle")
                .attr("dy", -5)
                .attr("font-size", "10px")
                .attr("font-weight", "bold")
                .text(pos.name);
            
            // Add value label
            marker.append("text")
                .attr("text-anchor", "middle")
                .attr("dy", 15)
                .attr("font-size", "12px")
                .attr("font-weight", "bold")
                .text(Math.round(totalValue * 10) / 10);
            
            // Add average label
            marker.append("text")
                .attr("text-anchor", "middle")
                .attr("dy", 30)
                .attr("font-size", "10px")
                .text(`Avg: ${Math.round(avgValue * 10) / 10}`);
            
            // Add event listeners for interaction
            marker.on("click", function() {
                // Highlight selected position
                svg.selectAll(".position-marker circle")
                    .attr("opacity", 0.3)
                    .attr("stroke", "#ccc");
                
                d3.select(this).select("circle")
                    .attr("opacity", 0.9)
                    .attr("stroke", "white")
                    .attr("stroke-width", 3);
                
                // Show position details
                showPositionDetails(pos, metric);
                
                // Dispatch event for other visualizations
                const event = new CustomEvent('positionSelected', { 
                    detail: { position: pos.name, players: pos.players }
                });
                document.dispatchEvent(event);
            });
        });
        
        // Add title
        svg.append("text")
            .attr("class", "position-marker")
            .attr("x", 20)
            .attr("y", 30)
            .attr("font-size", "16px")
            .attr("font-weight", "bold")
            .text(`${metric} by Position on the Field`);
    }
    
    function showPositionDetails(position, metric) {
        const detailsDiv = document.getElementById('position-details');
        
        // Sort players by the selected metric
        const sortedPlayers = [...position.players]
            .sort((a, b) => (b[metric] || 0) - (a[metric] || 0))
            .slice(0, 5); // Top 5 players
        
        let html = `
            <h3>${position.name}</h3>
            <p>${position.players.length} players, ${Math.round(d3.sum(position.players, p => p[metric] || 0))} total ${metric}</p>
            <h4>Top Players (${metric})</h4>
            <table class="player-table">
                <thead>
                    <tr>
                        <th>Player</th>
                        <th>Club</th>
                        <th>${metric}</th>
                        <th>Games</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        sortedPlayers.forEach(player => {
            html += `
                <tr>
                    <td>${player.Name}</td>
                    <td>${player.Club}</td>
                    <td>${player[metric] || 0}</td>
                    <td>${player.Appearances}</td>
                </tr>
            `;
        });
        
        html += `
                </tbody>
            </table>
            
            <div class="position-stats">
                <div>Avg Age: ${Math.round(d3.mean(position.players, p => p.Age) * 10) / 10}</div>
                <div>Avg Appearances: ${Math.round(d3.mean(position.players, p => p.Appearances) * 10) / 10}</div>
            </div>
        `;
        
        detailsDiv.innerHTML = html;
        detailsDiv.style.display = 'block';
    }
});
