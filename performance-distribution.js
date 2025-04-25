// performance-distribution.js - Analyze the distribution of performance metrics across different dimensions
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
            return player.Name && player.Position && player.Appearances >= 5;
        }).map(player => {
            // Convert percentage strings to numbers
            Object.keys(player).forEach(key => {
                if (typeof player[key] === 'string' && player[key].includes('%')) {
                    player[key] = parseFloat(player[key].replace('%', ''));
                }
            });
            return player;
        });
        
        // Create the visualization
        createVisualization(data);
        
        // Listen for position selection events
        document.addEventListener('positionSelected', function(e) {
            updateViolinPlot(data, e.detail.position);
        });
    }
    
    function createVisualization(data) {
        // Get container
        const container = document.getElementById('performance-distribution');
        if (!container) return;
        
        // Set up container structure
        container.innerHTML = `
            <h2>Performance Distribution Analysis</h2>
            <p>Explore the distribution of key metrics across player positions and age groups</p>
            
            <div class="distribution-controls">
                <div class="metric-selector">
                    <label for="distribution-metric">Performance Metric:</label>
                    <select id="distribution-metric">
                        <option value="Goals">Goals</option>
                        <option value="Assists">Assists</option>
                        <option value="Passes per match">Passes per Match</option>
                        <option value="Tackles">Tackles</option>
                        <option value="Shooting accuracy %">Shooting Accuracy %</option>
                    </select>
                </div>
                
                <div class="view-selector">
                    <label>View:</label>
                    <div class="view-buttons">
                        <button class="view-btn active" data-view="position">By Position</button>
                        <button class="view-btn" data-view="age">By Age Group</button>
                    </div>
                </div>
                
                <div class="min-appearances-control">
                    <label for="distribution-min-apps">Min. Appearances:</label>
                    <input type="number" id="distribution-min-apps" min="5" max="30" value="10" step="5">
                </div>
            </div>
            
            <div class="visualization-area">
                <svg id="distribution-plot" width="800" height="500"></svg>
                <div id="distribution-legend"></div>
            </div>
            
            <div id="distribution-insights" class="insights-panel">
                <h3>Key Insights</h3>
                <div id="insights-content">Select a metric to see insights</div>
            </div>
        `;
        
        // Set up event listeners
        document.getElementById('distribution-metric').addEventListener('change', function() {
            const activeViewBtn = document.querySelector('.view-btn.active');
            const view = activeViewBtn.getAttribute('data-view');
            const minApps = parseInt(document.getElementById('distribution-min-apps').value);
            
            updateDistributionPlot(data, this.value, view, minApps);
        });
        
        document.querySelectorAll('.view-btn').forEach(button => {
            button.addEventListener('click', function() {
                // Update active button
                document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
                this.classList.add('active');
                
                // Update visualization
                const view = this.getAttribute('data-view');
                const metric = document.getElementById('distribution-metric').value;
                const minApps = parseInt(document.getElementById('distribution-min-apps').value);
                
                updateDistributionPlot(data, metric, view, minApps);
            });
        });
        
        document.getElementById('distribution-min-apps').addEventListener('change', function() {
            const activeViewBtn = document.querySelector('.view-btn.active');
            const view = activeViewBtn.getAttribute('data-view');
            const metric = document.getElementById('distribution-metric').value;
            const minApps = parseInt(this.value);
            
            updateDistributionPlot(data, metric, view, minApps);
        });
        
        // Initialize with default values
        updateDistributionPlot(data, 'Goals', 'position', 10);
    }
    
    function updateDistributionPlot(data, metric, view, minAppearances) {
        // Filter data by minimum appearances
        const filteredData = data.filter(player => player.Appearances >= minAppearances);
        
        // Determine which plot to create based on view
        if (view === 'position') {
            createViolinPlot(filteredData, metric);
        } else if (view === 'age') {
            createAgeGroupPlot(filteredData, metric);
        }
        
        // Update insights
        updateInsights(filteredData, metric, view);
    }
    
    function createViolinPlot(data, metric) {
        // Clear previous plot
        d3.select("#distribution-plot").html("");
        
        const svg = d3.select("#distribution-plot");
        const margin = {top: 40, right: 30, bottom: 60, left: 80};
        const width = +svg.attr("width") - margin.left - margin.right;
        const height = +svg.attr("height") - margin.top - margin.bottom;
        
        const g = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);
        
        // Group data by position
        const positions = ["Forward", "Midfielder", "Defender", "Goalkeeper"];
        
        // Filter out positions with no data points
        const activePositions = positions.filter(pos => 
            data.filter(d => d.Position === pos).length > 0
        );
        
        // Create X scale
        const x = d3.scaleBand()
            .domain(activePositions)
            .range([0, width])
            .padding(0.2);
        
        // Find max value for this metric
        const maxValue = d3.max(data, d => d[metric]) || 0;
        
        // Create Y scale
        const y = d3.scaleLinear()
            .domain([0, maxValue * 1.1]) // Add 10% padding
            .range([height, 0]);
        
        // Add X axis
        g.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x))
            .selectAll("text")
            .attr("font-size", "12px");
        
        // Add Y axis
        g.append("g")
            .call(d3.axisLeft(y))
            .selectAll("text")
            .attr("font-size", "12px");
        
        // Add X axis label
        g.append("text")
            .attr("x", width / 2)
            .attr("y", height + 40)
            .attr("text-anchor", "middle")
            .attr("font-size", "14px")
            .text("Position");
        
        // Add Y axis label
        g.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -height / 2)
            .attr("y", -60)
            .attr("text-anchor", "middle")
            .attr("font-size", "14px")
            .text(metric);
        
        // Add title
        g.append("text")
            .attr("x", width / 2)
            .attr("y", -20)
            .attr("text-anchor", "middle")
            .attr("font-size", "16px")
            .attr("font-weight", "bold")
            .text(`Distribution of ${metric} by Position`);
        
        // Create color scale
        const colorScale = d3.scaleOrdinal()
            .domain(positions)
            .range(["#e90052", "#04f5ff", "#00ff85", "#ff9e00"]);
        
        // Create violin plots for each position
        activePositions.forEach(position => {
            // Get data for this position
            const posData = data.filter(d => d.Position === position);
            
            // Skip if no data
            if (posData.length === 0) return;
            
            // Compute kernel density estimation
            const kde = kernelDensityEstimator(kernelEpanechnikov(7), y.ticks(20));
            
            // Get density for this position's data
            const density = kde(posData.map(d => d[metric] || 0));
            
            // Find the maximum width of the violin
            const maxWidth = d3.max(density, d => d[1]) * 1.2;
            
            // Create scale for violin width
            const xNum = d3.scaleLinear()
                .domain([0, maxWidth])
                .range([0, x.bandwidth() / 2]);
            
            // Draw the violin
            g.append("path")
                .datum(density)
                .attr("fill", colorScale(position))
                .attr("opacity", 0.8)
                .attr("stroke", "#000")
                .attr("stroke-width", 1)
                .attr("stroke-linejoin", "round")
                .attr("transform", `translate(${x(position) + x.bandwidth() / 2}, 0)`)
                .attr("d", d3.area()
                    .x0(d => -xNum(d[1]))
                    .x1(d => xNum(d[1]))
                    .y(d => y(d[0]))
                    .curve(d3.curveCatmullRom)
                );
            
            // Add individual points inside the violin
            const jitterWidth = x.bandwidth() / 4;
            
            g.selectAll(`dot-${position}`)
                .data(posData)
                .enter()
                .append("circle")
                .attr("cx", () => x(position) + x.bandwidth()/2 + (Math.random() - 0.5) * jitterWidth)
                .attr("cy", d => y(d[metric] || 0))
                .attr("r", 3)
                .attr("fill", "white")
                .attr("stroke", colorScale(position))
                .attr("stroke-width", 1)
                .attr("opacity", 0.7)
                .on("mouseover", function(event, d) {
                    // Highlight this point
                    d3.select(this)
                        .attr("r", 5)
                        .attr("fill", colorScale(position))
                        .attr("opacity", 1);
                    
                    // Show tooltip
                    const tooltip = d3.select("body").append("div")
                        .attr("class", "tooltip")
                        .style("position", "absolute")
                        .style("background", "rgba(0, 0, 0, 0.7)")
                        .style("color", "white")
                        .style("padding", "5px")
                        .style("border-radius", "5px")
                        .style("pointer-events", "none")
                        .style("opacity", 0);
                    
                    tooltip.transition()
                        .duration(200)
                        .style("opacity", 0.9);
                    
                    tooltip.html(`
                        <strong>${d.Name}</strong> (${d.Club})<br>
                        ${metric}: ${d[metric] || 0}<br>
                        Appearances: ${d.Appearances}
                    `)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
                })
                .on("mouseout", function() {
                    // Restore normal style
                    d3.select(this)
                        .attr("r", 3)
                        .attr("fill", "white")
                        .attr("opacity", 0.7);
                    
                    // Remove tooltip
                    d3.selectAll(".tooltip").remove();
                });
            
            // Add median line
            const median = d3.median(posData, d => d[metric] || 0);
            
            g.append("line")
                .attr("x1", x(position) + x.bandwidth()/2 - x.bandwidth()/4)
                .attr("x2", x(position) + x.bandwidth()/2 + x.bandwidth()/4)
                .attr("y1", y(median))
                .attr("y2", y(median))
                .attr("stroke", "black")
                .attr("stroke-width", 2)
                .attr("stroke-dasharray", "3,3");
            
            // Add median value label
            g.append("text")
                .attr("x", x(position) + x.bandwidth()/2)
                .attr("y", y(median) - 10)
                .attr("text-anchor", "middle")
                .attr("font-size", "10px")
                .text(`Median: ${median.toFixed(1)}`);
        });
        
        // Helper functions for kernel density estimation
        function kernelDensityEstimator(kernel, X) {
            return function(V) {
                return X.map(x => [x, d3.mean(V, v => kernel(x - v))]);
            };
        }
        
        function kernelEpanechnikov(k) {
            return function(v) {
                return Math.abs(v /= k) <= 1 ? 0.75 * (1 - v * v) / k : 0;
            };
        }
    }
    
    function createAgeGroupPlot(data, metric) {
        // Clear previous plot
        d3.select("#distribution-plot").html("");
        
        const svg = d3.select("#distribution-plot");
        const margin = {top: 40, right: 30, bottom: 60, left: 80};
        const width = +svg.attr("width") - margin.left - margin.right;
        const height = +svg.attr("height") - margin.top - margin.bottom;
        
        const g = svg.append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);
        
        // Create age groups
        const ageGroups = [
            { name: "Under 23", min: 17, max: 22 },
            { name: "23-26", min: 23, max: 26 },
            { name: "27-30", min: 27, max: 30 },
            { name: "Over 30", min: 31, max: 40 }
        ];
        
        // Group data by age
        const groupedData = ageGroups.map(group => {
            return {
                group: group.name,
                players: data.filter(d => d.Age >= group.min && d.Age <= group.max)
            };
        });
        
        // Filter out empty groups
        const activeGroups = groupedData.filter(g => g.players.length > 0);
        
        // Create X scale
        const x = d3.scaleBand()
            .domain(activeGroups.map(g => g.group))
            .range([0, width])
            .padding(0.1);
        
        // Find max value for this metric
        const maxValue = d3.max(data, d => d[metric]) || 0;
        
        // Create Y scale
        const y = d3.scaleLinear()
            .domain([0, maxValue * 1.1]) // Add 10% padding
            .range([height, 0]);
        
        // Add X axis
        g.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(x))
            .selectAll("text")
            .attr("font-size", "12px");
        
        // Add Y axis
        g.append("g")
            .call(d3.axisLeft(y))
            .selectAll("text")
            .attr("font-size", "12px");
        
        // Add X axis label
        g.append("text")
            .attr("x", width / 2)
            .attr("y", height + 40)
            .attr("text-anchor", "middle")
            .attr("font-size", "14px")
            .text("Age Group");
        
        // Add Y axis label
        g.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -height / 2)
            .attr("y", -60)
            .attr("text-anchor", "middle")
            .attr("font-size", "14px")
            .text(metric);
        
        // Add title
        g.append("text")
            .attr("x", width / 2)
            .attr("y", -20)
            .attr("text-anchor", "middle")
            .attr("font-size", "16px")
            .attr("font-weight", "bold")
            .text(`Distribution of ${metric} by Age Group`);
        
        // Create color scale for age groups
        const colorScale = d3.scaleOrdinal()
            .domain(ageGroups.map(g => g.name))
            .range(["#2ca02c", "#1f77b4", "#ff7f0e", "#d62728"]);
        
        // Draw box plots for each age group
        activeGroups.forEach(group => {
            // Get values for this group
            const values = group.players.map(p => p[metric] || 0).sort(d3.ascending);
            
            // Skip if no values
            if (values.length === 0) return;
            
            // Calculate statistics
            const q1 = d3.quantile(values, 0.25);
            const median = d3.quantile(values, 0.5);
            const q3 = d3.quantile(values, 0.75);
            const interQuantileRange = q3 - q1;
            const min = Math.max(0, q1 - 1.5 * interQuantileRange);
            const max = q3 + 1.5 * interQuantileRange;
            
            // Draw box
            g.append("rect")
                .attr("x", x(group.group) + x.bandwidth() / 4)
                .attr("y", y(q3))
                .attr("width", x.bandwidth() / 2)
                .attr("height", y(q1) - y(q3))
                .attr("fill", colorScale(group.group))
                .attr("opacity", 0.7)
                .attr("stroke", "black")
                .attr("stroke-width", 1);
            
            // Draw median line
            g.append("line")
                .attr("x1", x(group.group) + x.bandwidth() / 4)
                .attr("x2", x(group.group) + 3 * x.bandwidth() / 4)
                .attr("y1", y(median))
                .attr("y2", y(median))
                .attr("stroke", "black")
                .attr("stroke-width", 2);
            
            // Draw whiskers
            g.append("line")
                .attr("x1", x(group.group) + x.bandwidth() / 2)
                .attr("x2", x(group.group) + x.bandwidth() / 2)
                .attr("y1", y(min))
                .attr("y2", y(q1))
                .attr("stroke", "black")
                .attr("stroke-width", 1);
            
            g.append("line")
                .attr("x1", x(group.group) + x.bandwidth() / 2)
                .attr("x2", x(group.group) + x.bandwidth() / 2)
                .attr("y1", y(q3))
                .attr("y2", y(max))
                .attr("stroke", "black")
                .attr("stroke-width", 1);
            
            // Draw caps on whiskers
            g.append("line")
                .attr("x1", x(group.group) + x.bandwidth() / 3)
                .attr("x2", x(group.group) + 2 * x.bandwidth() / 3)
                .attr("y1", y(min))
                .attr("y2", y(min))
                .attr("stroke", "black")
                .attr("stroke-width", 1);
            
            g.append("line")
                .attr("x1", x(group.group) + x.bandwidth() / 3)
                .attr("x2", x(group.group) + 2 * x.bandwidth() / 3)
                .attr("y1", y(max))
                .attr("y2", y(max))
                .attr("stroke", "black")
                .attr("stroke-width", 1);
            
            // Add individual points (outliers and others)
            const jitterWidth = x.bandwidth() / 3;
            
            group.players.forEach(player => {
                const value = player[metric] || 0;
                const isOutlier = value < min || value > max;
                
                g.append("circle")
                    .attr("cx", x(group.group) + x.bandwidth() / 2 + (Math.random() - 0.5) * jitterWidth)
                    .attr("cy", y(value))
                    .attr("r", isOutlier ? 4 : 3)
                    .attr("fill", isOutlier ? "red" : "white")
                    .attr("stroke", isOutlier ? "black" : colorScale(group.group))
                    .attr("stroke-width", 1)
                    .attr("opacity", 0.7)
                    .on("mouseover", function(event) {
                        // Highlight this point
                        d3.select(this)
                            .attr("r", 6)
                            .attr("fill", colorScale(group.group))
                            .attr("opacity", 1);
                        
                        // Show tooltip
                        const tooltip = d3.select("body").append("div")
                            .attr("class", "tooltip")
                            .style("position", "absolute")
                            .style("background", "rgba(0, 0, 0, 0.7)")
                            .style("color", "white")
                            .style("padding", "5px")
                            .style("border-radius", "5px")
                            .style("pointer-events", "none")
                            .style("opacity", 0);
                        
                        tooltip.transition()
                            .duration(200)
                            .style("opacity", 0.9);
                        
                        tooltip.html(`
                            <strong>${player.Name}</strong> (Age: ${player.Age})<br>
                            ${player.Club}, ${player.Position}<br>
                            ${metric}: ${value}<br>
                            Appearances: ${player.Appearances}
                        `)
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 28) + "px");
                    })
                    .on("mouseout", function() {
                        // Restore normal style
                        d3.select(this)
                            .attr("r", isOutlier ? 4 : 3)
                            .attr("fill", isOutlier ? "red" : "white")
                            .attr("opacity", 0.7);
                        
                        // Remove tooltip
                        d3.selectAll(".tooltip").remove();
                    });
            });
            
            // Add sample size
            g.append("text")
                .attr("x", x(group.group) + x.bandwidth() / 2)
                .attr("y", height + 25)
                .attr("text-anchor", "middle")
                .attr("font-size", "10px")
                .text(`n=${group.players.length}`);
        });
    }
    
    function updateViolinPlot(data, position) {
        // Get current metric
        const metric = document.getElementById('distribution-metric').value;
        const minApps = parseInt(document.getElementById('distribution-min-apps').value);
        
        // Filter data by minimum appearances
        const filteredData = data.filter(player => player.Appearances >= minApps);
        
        // Set position button to active
        document.querySelectorAll('.view-btn').forEach(btn => {
            if (btn.getAttribute('data-view') === 'position') {
                btn.click();
            }
        });
        
        // Highlight the selected position in the plot
        setTimeout(() => {
            const svg = d3.select("#distribution-plot");
            
            // Reset all opacities
            svg.selectAll("path").attr("opacity", 0.3);
            
            // Highlight selected position
            svg.selectAll("path")
                .filter(function() {
                    const transform = d3.select(this).attr("transform");
                    return transform && transform.includes(`translate(${position}`);
                })
                .attr("opacity", 0.9);
        }, 100);
    }
    
    function updateInsights(data, metric, view) {
        const insightsDiv = document.getElementById('insights-content');
        
        if (view === 'position') {
            // Generate insights about positions
            const positions = ["Forward", "Midfielder", "Defender", "Goalkeeper"];
            const posStats = positions.map(pos => {
                const players = data.filter(d => d.Position === pos);
                return {
                    position: pos,
                    count: players.length,
                    average: d3.mean(players, d => d[metric] || 0),
                    median: d3.median(players, d => d[metric] || 0),
                    max: d3.max(players, d => d[metric] || 0),
                    topPlayer: players.length > 0 ? 
                        players.reduce((a, b) => (a[metric] || 0) > (b[metric] || 0) ? a : b) : null
                };
            }).filter(s => s.count > 0);
            
            // Sort positions by average
            posStats.sort((a, b) => b.average - a.average);
            
            // Create insights HTML
            let html = `<p>Analysis of <strong>${metric}</strong> by position:</p>`;
            
            // Add insights about highest and lowest positions
            if (posStats.length > 0) {
                const highest = posStats[0];
                const lowest = posStats[posStats.length - 1];
                
                html += `
                    <p><strong>${highest.position}s</strong> have the highest average ${metric} (${highest.average.toFixed(2)}), 
                    while <strong>${lowest.position}s</strong> have the lowest (${lowest.average.toFixed(2)}).</p>
                `;
                
                // Add insight about top player
                if (highest.topPlayer) {
                    html += `
                        <p>The top player for ${metric} is <strong>${highest.topPlayer.Name}</strong> 
                        (${highest.topPlayer.Club}) with ${highest.topPlayer[metric]} 
                        in ${highest.topPlayer.Appearances} appearances.</p>
                    `;
                }
                
                // Add comparison
                if (posStats.length > 1) {
                    const ratio = highest.average / lowest.average;
                    html += `
                        <p>On average, ${highest.position}s produce ${ratio.toFixed(1)}x more ${metric} 
                        than ${lowest.position}s.</p>
                    `;
                }
            }
            
            insightsDiv.innerHTML = html;
        } else if (view === 'age') {
            // Generate insights about age groups
            const ageGroups = [
                { name: "Under 23", min: 17, max: 22 },
                { name: "23-26", min: 23, max: 26 },
                { name: "27-30", min: 27, max: 30 },
                { name: "Over 30", min: 31, max: 40 }
            ];
            
            const ageStats = ageGroups.map(group => {
                const players = data.filter(d => d.Age >= group.min && d.Age <= group.max);
                return {
                    group: group.name,
                    count: players.length,
                    average: d3.mean(players, d => d[metric] || 0),
                    median: d3.median(players, d => d[metric] || 0),
                    max: d3.max(players, d => d[metric] || 0),
                    topPlayer: players.length > 0 ? 
                        players.reduce((a, b) => (a[metric] || 0) > (b[metric] || 0) ? a : b) : null
                };
            }).filter(s => s.count > 0);
            
            // Sort age groups by average
            ageStats.sort((a, b) => b.average - a.average);
            
            // Create insights HTML
            let html = `<p>Analysis of <strong>${metric}</strong> by age group:</p>`;
            
            // Add insights about best performing age group
            if (ageStats.length > 0) {
                const best = ageStats[0];
                const worst = ageStats[ageStats.length - 1];
                
                html += `
                    <p>Players in the <strong>${best.group}</strong> age group have the highest average ${metric} (${best.average.toFixed(2)}),
                    while the <strong>${worst.group}</strong> age group has the lowest (${worst.average.toFixed(2)}).</p>
                `;
                
                // Add insight about top player
                if (best.topPlayer) {
                    html += `
                        <p>The top player for ${metric} in the ${best.group} age group is <strong>${best.topPlayer.Name}</strong> 
                        (${best.topPlayer.Position}, ${best.topPlayer.Club}) with ${best.topPlayer[metric]} 
                        in ${best.topPlayer.Appearances} appearances.</p>
                    `;
                }
                
                // Add insight about peak performance age
                if (ageStats.length > 2) {
                    html += `
                        <p>This suggests that players tend to reach their peak ${metric} performance
                        during the ${best.group} years of their career.</p>
                    `;
                }
            }
            
            insightsDiv.innerHTML = html;
        }
    }
});