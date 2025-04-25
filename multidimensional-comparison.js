// multidimensional-comparison.js - Compare players across multiple metrics simultaneously
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
            return player.Name && player.Position && player.Appearances >= 10;
        }).map(player => {
            // Convert percentage strings to numbers
            Object.keys(player).forEach(key => {
                if (typeof player[key] === 'string' && player[key].includes('%')) {
                    player[key] = parseFloat(player[key].replace('%', ''));
                }
            });
            return player;
        });
        
        // Set up the visualization
        createMultidimensionalView(data);
        
        // Listen for position selection from field visualization
        document.addEventListener('positionSelected', function(e) {
            const position = e.detail.position;
            const players = e.detail.players;
            
            // Update visualization based on selected position
            updateVisualizationByPosition(data, position);
        });
    }
    
    function createMultidimensionalView(data) {
        // Get container
        const container = document.getElementById('multidimensional-comparison');
        if (!container) return;
        
        // Set up container structure
        container.innerHTML = `
            <h2>Multidimensional Player Comparison</h2>
            <p>Compare player performance across multiple metrics simultaneously</p>
            
            <div class="comparison-controls">
                <div class="position-filter">
                    <span>Position: </span>
                    <div class="position-buttons">
                        <button class="position-btn active" data-position="All">All Positions</button>
                        <button class="position-btn" data-position="Forward">Forwards</button>
                        <button class="position-btn" data-position="Midfielder">Midfielders</button>
                        <button class="position-btn" data-position="Defender">Defenders</button>
                        <button class="position-btn" data-position="Goalkeeper">Goalkeepers</button>
                    </div>
                </div>
                
                <div class="appearance-filter">
                    <label for="min-games">Min Games:</label>
                    <input type="range" id="min-games" min="10" max="30" value="15" step="5">
                    <span id="min-games-value">15</span>
                </div>
            </div>
            
            <div class="visualization-area">
                <div class="parallel-coords-container">
                    <svg id="parallel-coords" width="800" height="500"></svg>
                </div>
                
                <div class="player-highlight" id="player-highlight">
                    <h3>Selected Player</h3>
                    <p>Select a player line to see details</p>
                </div>
            </div>
        `;
        
        // Set up event listeners
        document.querySelectorAll('.position-btn').forEach(button => {
            button.addEventListener('click', function() {
                // Update active button
                document.querySelectorAll('.position-btn').forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                
                // Update visualization
                const position = this.getAttribute('data-position');
                updateVisualizationByPosition(data, position);
            });
        });
        
        // Set up appearance filter
        const minGamesSlider = document.getElementById('min-games');
        const minGamesValue = document.getElementById('min-games-value');
        
        minGamesSlider.addEventListener('input', function() {
            minGamesValue.textContent = this.value;
            
            // Get currently selected position
            const activePositionBtn = document.querySelector('.position-btn.active');
            const position = activePositionBtn.getAttribute('data-position');
            
            // Update visualization
            updateVisualizationByPosition(data, position, parseInt(this.value));
        });
        
        // Initialize visualization with all positions
        updateVisualizationByPosition(data, 'All', 15);
    }
    
    function updateVisualizationByPosition(data, position, minAppearances = 15) {
        // Filter data by position and appearances
        let filteredData;
        
        if (position === 'All') {
            filteredData = data.filter(player => player.Appearances >= minAppearances);
        } else {
            filteredData = data.filter(player => player.Position === position && player.Appearances >= minAppearances);
        }
        
        // Get top 30 players by appearances (if we have more than 30)
        let displayData = filteredData;
        if (filteredData.length > 30) {
            displayData = filteredData
                .sort((a, b) => b.Appearances - a.Appearances)
                .slice(0, 30);
        }
        
        // Create parallel coordinates visualization
        createParallelCoordinates(displayData);
    }
    
    function createParallelCoordinates(data) {
        // Clear existing visualization
        d3.select("#parallel-coords").html("");
        
        const margin = {top: 50, right: 50, bottom: 30, left: 50};
        const width = 800 - margin.left - margin.right;
        const height = 500 - margin.top - margin.bottom;
        
        // Create SVG
        const svg = d3.select("#parallel-coords")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);
        
        // Define dimensions to display
        // We'll select meaningful metrics based on player positions
        const dimensions = [
            "Appearances", 
            "Goals", 
            "Assists", 
            "Passes per match", 
            "Tackles", 
            "Shooting accuracy %"
        ];
        
        // Create a scale for each dimension
        const y = {};
        dimensions.forEach(dim => {
            // Handle special case for percentages
            const maxValue = dim.includes('%') ? 100 : d3.max(data, d => d[dim] || 0);
            
            y[dim] = d3.scaleLinear()
                .domain([0, maxValue * 1.1]) // Add some padding
                .range([height, 0]);
        });
        
        // Build the X scale
        const x = d3.scalePoint()
            .range([0, width])
            .domain(dimensions);
        
        // Create color scale for positions
        const colorScale = d3.scaleOrdinal()
            .domain(["Forward", "Midfielder", "Defender", "Goalkeeper"])
            .range(["#e90052", "#04f5ff", "#00ff85", "#ff9e00"]);
        
        // Add background lines for context
        const background = svg.append("g")
            .attr("class", "background")
            .selectAll("path")
            .data(data)
            .enter()
            .append("path")
            .attr("d", path)
            .style("fill", "none")
            .style("stroke", "#ddd")
            .style("stroke-width", 1)
            .style("opacity", 0.3);
        
        // Add foreground lines (one per player)
        const foreground = svg.append("g")
            .attr("class", "foreground")
            .selectAll("path")
            .data(data)
            .enter()
            .append("path")
            .attr("d", path)
            .attr("class", "player-line")
            .attr("data-player", d => d.Name)
            .style("fill", "none")
            .style("stroke", d => colorScale(d.Position))
            .style("stroke-width", 1.5)
            .style("opacity", 0.7)
            .on("mouseover", function(event, d) {
                // Highlight this line
                d3.select(this)
                    .style("stroke-width", 3)
                    .style("opacity", 1)
                    .style("stroke", "#333");
                
                // Show player details
                showPlayerDetails(d);
            })
            .on("mouseout", function() {
                // Restore styles
                d3.select(this)
                    .style("stroke-width", 1.5)
                    .style("opacity", 0.7)
                    .style("stroke", d => colorScale(d.Position));
            });
        
        // Add a group element for each dimension
        const axes = svg.selectAll(".dimension")
            .data(dimensions)
            .enter()
            .append("g")
            .attr("class", "dimension")
            .attr("transform", d => `translate(${x(d)})`);
        
        // Add axis and labels
        axes.append("g")
            .each(function(d) {
                d3.select(this).call(d3.axisLeft().scale(y[d]));
            });
        
        // Add dimension titles
        axes.append("text")
            .style("text-anchor", "middle")
            .attr("y", -9)
            .text(d => d)
            .style("fill", "black");
        
        // Add title
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", -30)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .style("font-weight", "bold")
            .text(`Player Performance Comparison (${data.length} players)`);
        
        // Add legend
        const legend = svg.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(${width - 150}, -30)`);
        
        const positions = ["Forward", "Midfielder", "Defender", "Goalkeeper"];
        
        positions.forEach((pos, i) => {
            const lg = legend.append("g")
                .attr("transform", `translate(0, ${i * 20})`);
            
            lg.append("rect")
                .attr("x", 0)
                .attr("y", 0)
                .attr("width", 12)
                .attr("height", 12)
                .attr("fill", colorScale(pos));
            
            lg.append("text")
                .attr("x", 20)
                .attr("y", 10)
                .text(pos)
                .style("font-size", "12px");
        });
        
        // Helper function for drawing paths
        function path(d) {
            return d3.line()(dimensions.map(function(p) {
                // Handle missing values
                const value = d[p] !== undefined ? d[p] : 0;
                return [x(p), y[p](value)];
            }));
        }
    }
    
    function showPlayerDetails(player) {
        const detailsDiv = document.getElementById('player-highlight');
        
        // Create HTML for player details
        let html = `
            <h3>${player.Name}</h3>
            <div class="player-basic-info">
                <div class="player-team">${player.Club}</div>
                <div class="player-position" style="color: ${getPositionColor(player.Position)}">
                    ${player.Position}
                </div>
                <div class="player-numbers">
                    <span class="player-age">Age: ${player.Age}</span>
                    <span class="player-jersey">Jersey: ${player['Jersey Number']}</span>
                </div>
            </div>
            
            <div class="player-stats">
                <div class="stat-item">
                    <span class="stat-label">Appearances:</span>
                    <span class="stat-value">${player.Appearances}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Goals:</span>
                    <span class="stat-value">${player.Goals || 0}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Assists:</span>
                    <span class="stat-value">${player.Assists || 0}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Passes per match:</span>
                    <span class="stat-value">${player['Passes per match'] || 0}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Tackles:</span>
                    <span class="stat-value">${player.Tackles || 0}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Wins:</span>
                    <span class="stat-value">${player.Wins}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Losses:</span>
                    <span class="stat-value">${player.Losses}</span>
                </div>
            </div>
        `;
        
        // Add position-specific stats
        if (player.Position === "Forward") {
            html += `
                <div class="position-specific-stats">
                    <h4>Forward Stats</h4>
                    <div class="stat-item">
                        <span class="stat-label">Shooting accuracy:</span>
                        <span class="stat-value">${player['Shooting accuracy %'] || 0}%</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Big chances missed:</span>
                        <span class="stat-value">${player['Big chances missed'] || 0}</span>
                    </div>
                </div>
            `;
        } else if (player.Position === "Midfielder") {
            html += `
                <div class="position-specific-stats">
                    <h4>Midfielder Stats</h4>
                    <div class="stat-item">
                        <span class="stat-label">Pass accuracy:</span>
                        <span class="stat-value">${player['Tackle success %'] || 0}%</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Big chances created:</span>
                        <span class="stat-value">${player['Big chances created'] || 0}</span>
                    </div>
                </div>
            `;
        } else if (player.Position === "Defender") {
            html += `
                <div class="position-specific-stats">
                    <h4>Defender Stats</h4>
                    <div class="stat-item">
                        <span class="stat-label">Tackle success:</span>
                        <span class="stat-value">${player['Tackle success %'] || 0}%</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Clearances:</span>
                        <span class="stat-value">${player.Clearances || 0}</span>
                    </div>
                </div>
            `;
        } else if (player.Position === "Goalkeeper") {
            html += `
                <div class="position-specific-stats">
                    <h4>Goalkeeper Stats</h4>
                    <div class="stat-item">
                        <span class="stat-label">Clean sheets:</span>
                        <span class="stat-value">${player['Clean sheets'] || 0}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Saves:</span>
                        <span class="stat-value">${player.Saves || 0}</span>
                    </div>
                </div>
            `;
        }
        
        detailsDiv.innerHTML = html;
    }
    
    function getPositionColor(position) {
        const colorMap = {
            "Forward": "#e90052",
            "Midfielder": "#04f5ff",
            "Defender": "#00ff85",
            "Goalkeeper": "#ff9e00"
        };
        
        return colorMap[position] || "#999";
    }
});