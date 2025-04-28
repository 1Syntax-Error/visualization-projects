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
        // Clean and filter data - only filter out invalid players but include all appearances
        const data = rawData.filter(player => {
            return player.Name && player.Position; // Only basic validation, no minimum appearances filter
        }).map(player => {
            // Convert percentage strings to numbers
            Object.keys(player).forEach(key => {
                if (typeof player[key] === 'string' && player[key].includes('%')) {
                    player[key] = parseFloat(player[key].replace('%', ''));
                }
            });
            return player;
        });
        
        console.log(`Total players in dataset: ${data.length}`);
        
        // Set up the visualization
        createMultidimensionalView(data);
        
        // Listen for position selection from field visualization
        document.addEventListener('positionSelected', function(e) {
            const position = e.detail.position;
            const players = e.detail.players;
            
            // Update visualization based on selected position
            updateVisualizationByPosition(data, position);
        });
        
        // Window resize event to make the visualization responsive
        window.addEventListener('resize', function() {
            // Get currently selected position
            const activePositionBtn = document.querySelector('.position-btn.active');
            if (activePositionBtn) {
                const position = activePositionBtn.getAttribute('data-position');
                updateVisualizationByPosition(data, position);
            }
        });
    }
    
    function createMultidimensionalView(data) {
        // Get container
        const container = document.getElementById('multidimensional-comparison');
        if (!container) return;
        
        // Get total number of players for slider maximum
        const totalPlayersCount = data.length;
        
        // Set up container structure
        container.innerHTML = `
            <h2>Multidimensional Player Comparison (Parallel Coordinates Plot) </h2>
            <p>This shows a Comparison between player performances across multiple metrics simultaneously </p>
            
            <div class="comparison-controls">
                <div class="position-filter">
                    <span>Position: </span>
                    <div class="position-buttons">
                        <button class="position-btn active" data-position="All">All Positions</button>
                        <button class="position-btn forward-btn" data-position="Forward">Forwards</button>
                        <button class="position-btn midfielder-btn" data-position="Midfielder">Midfielders</button>
                        <button class="position-btn defender-btn" data-position="Defender">Defenders</button>
                        <button class="position-btn goalkeeper-btn" data-position="Goalkeeper">Goalkeepers</button>
                    </div>
                </div>
                
                <!-- Player count slider control -->
                <div class="player-count-control">
                    <span>Number of Players to Display: </span>
                    <div class="slider-container">
                        <input type="range" id="player-count-slider" min="10" max="${totalPlayersCount}" value="30" step="10">
                        <span id="player-count-value">30</span> of ${totalPlayersCount} players
                    </div>
                    <div class="slider-labels">
                        <span>10</span>
                        <span>All Players (${totalPlayersCount})</span>
                    </div>
                </div>
            </div>
            
            <div class="parallel-coords-container">
                <svg id="parallel-coords"></svg>
            </div>
            
            <div class="player-highlight" id="player-highlight">
                <h3>Selected Player</h3>
                <p>Select a player line to see details</p>
            </div>
        `;
        
        // Set up event listeners for position buttons
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
        
        // Set up player count slider
        const playerCountSlider = document.getElementById('player-count-slider');
        const playerCountValue = document.getElementById('player-count-value');
        
        playerCountSlider.addEventListener('input', function() {
            playerCountValue.textContent = this.value;
        });
        
        playerCountSlider.addEventListener('change', function() {
            // Get currently selected position
            const activePositionBtn = document.querySelector('.position-btn.active');
            if (activePositionBtn) {
                const position = activePositionBtn.getAttribute('data-position');
                updateVisualizationByPosition(data, position);
            }
        });
        
        // Initialize visualization with all positions and default player count
        updateVisualizationByPosition(data, 'All');
    }
    
    function updateVisualizationByPosition(data, position) {
        // Get slider value for player count
        const playerCountSlider = document.getElementById('player-count-slider');
        const maxPlayers = parseInt(playerCountSlider.value);
        
        // Filter data by position only (no minimum appearances filter)
        let filteredData;
        
        if (position === 'All') {
            filteredData = data;
        } else {
            filteredData = data.filter(player => player.Position === position);
        }
        
        // Sort by appearances (high to low) so most active players show first
        filteredData = filteredData.sort((a, b) => (b.Appearances || 0) - (a.Appearances || 0));
        
        // Get top N players based on slider
        let displayData = filteredData;
        if (filteredData.length > maxPlayers) {
            displayData = filteredData.slice(0, maxPlayers);
        }
        
        // Create parallel coordinates visualization
        createParallelCoordinates(displayData, filteredData.length);
        
        // Update player count slider max value based on filtered data
        if (position !== 'All') {
            // Only change the max if position is selected
            const positionCount = data.filter(p => p.Position === position).length;
            
            playerCountSlider.max = positionCount;
            document.querySelector('.slider-labels span:last-child').textContent = 
                `All ${position}s (${positionCount})`;
                
            // If current value is greater than new max, adjust it
            if (parseInt(playerCountSlider.value) > positionCount) {
                playerCountSlider.value = positionCount;
                document.getElementById('player-count-value').textContent = positionCount;
            }
        } else {
            // For "All Positions", set to total dataset size
            playerCountSlider.max = data.length;
            document.querySelector('.slider-labels span:last-child').textContent = 
                `All Players (${data.length})`;
        }
        
        // Update display count in slider label
        document.querySelector('#player-count-value').nextSibling.textContent = ` of ${filteredData.length} players`;
    }
    
    function createParallelCoordinates(data, totalAvailable) {
        // Clear existing visualization
        d3.select("#parallel-coords").html("");
        
        // Get container dimensions
        const container = document.querySelector('.parallel-coords-container');
        const containerWidth = container.clientWidth;
        
        // Set SVG dimensions based on container
        const svg = d3.select("#parallel-coords")
            .attr("width", containerWidth)
            .attr("height", 600);
        
        const margin = {top: 50, right: 50, bottom: 30, left: 50};
        const width = containerWidth - margin.left - margin.right;
        const height = 600 - margin.top - margin.bottom;
        
        // Append a group element to the SVG to respect margins
        const g = svg.append("g")
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
        const background = g.append("g")
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
        const foreground = g.append("g")
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
        const axes = g.selectAll(".dimension")
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
        
        // Add title with player count and total available
        const displayText = totalAvailable ? 
            `Player Performance Comparison (${data.length} of ${totalAvailable} players)` :
            `Player Performance Comparison (${data.length} players)`;
            
        g.append("text")
            .attr("x", width / 2)
            .attr("y", -30)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .style("font-weight", "bold")
            .text(displayText);
        
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
                    <span class="stat-value">${player.Appearances || 0}</span>
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
                    <span class="stat-value">${player.Wins || 0}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Losses:</span>
                    <span class="stat-value">${player.Losses || 0}</span>
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