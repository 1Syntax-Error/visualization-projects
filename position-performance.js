// Main visualization code for Premier League Player Statistics
document.addEventListener('DOMContentLoaded', function() {
    // Dataset URL (direct link to raw file)
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
                    const data = results.data;
                    processData(data);
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
        // Clean and process the data
        const data = rawData.map(player => {
            // Convert percentage strings to numbers
            Object.keys(player).forEach(key => {
                if (typeof player[key] === 'string' && player[key].includes('%')) {
                    player[key] = parseFloat(player[key].replace('%', ''));
                }
            });
            return player;
        });
        
        // Initialize the visualization
        setupControls(data);
        createVisualization(data);
    }
    
    function setupControls(data) {
        // Get all positions
        const positions = [...new Set(data.map(d => d.Position))].filter(Boolean);
        
        // Create position checkboxes
        const positionCheckboxes = document.getElementById('position-checkboxes');
        positions.forEach(position => {
            const label = document.createElement('label');
            label.style.marginRight = '10px';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = position;
            checkbox.checked = true;
            checkbox.id = `pos-${position.toLowerCase()}`;
            checkbox.addEventListener('change', () => updateVisualization(data));
            
            const span = document.createElement('span');
            span.textContent = position;
            
            const marker = document.createElement('span');
            marker.className = `position-marker position-${position.toLowerCase()}`;
            
            label.appendChild(checkbox);
            label.appendChild(marker);
            label.appendChild(span);
            positionCheckboxes.appendChild(label);
        });
        
        // Get all clubs
        const clubs = [...new Set(data.map(d => d.Club))].filter(Boolean).sort();
        
        // Create club filter dropdown
        const clubFilter = document.getElementById('club-filter');
        clubs.forEach(club => {
            const option = document.createElement('option');
            option.value = club;
            option.textContent = club;
            clubFilter.appendChild(option);
        });
        
        // Add event listeners to the controls
        document.getElementById('x-metric').addEventListener('change', () => updateVisualization(data));
        document.getElementById('y-metric').addEventListener('change', () => updateVisualization(data));
        document.getElementById('size-metric').addEventListener('change', () => updateVisualization(data));
        document.getElementById('club-filter').addEventListener('change', () => updateVisualization(data));
    }
    
    function createVisualization(data) {
        // Initial visualization with default settings
        updateVisualization(data);
    }
    
    function updateVisualization(data) {
        // Get selected metrics and filters
        const xMetric = document.getElementById('x-metric').value;
        const yMetric = document.getElementById('y-metric').value;
        const sizeMetric = document.getElementById('size-metric').value;
        const clubFilter = document.getElementById('club-filter').value;
        
        // Get selected positions
        const selectedPositions = Array.from(document.querySelectorAll('#position-checkboxes input:checked')).map(cb => cb.value);
        
        // Filter data based on selections
        let filteredData = data.filter(player => {
            return selectedPositions.includes(player.Position) && 
                   (clubFilter === 'All' || player.Club === clubFilter) &&
                   player[xMetric] !== null && player[xMetric] !== undefined &&
                   player[yMetric] !== null && player[yMetric] !== undefined &&
                   player[sizeMetric] !== null && player[sizeMetric] !== undefined;
        });
        
        // Create scatter plot
        createScatterPlot(filteredData, xMetric, yMetric, sizeMetric);
        
        // Update position statistics
        updatePositionStats(filteredData, xMetric, yMetric);
    }
    
    function createScatterPlot(data, xMetric, yMetric, sizeMetric) {
        // Clear previous visualization
        d3.select("#scatter-plot").html("");
        
        // Set up dimensions and margins
        const margin = {top: 40, right: 120, bottom: 60, left: 80};
        const width = document.getElementById('scatter-plot').clientWidth - margin.left - margin.right;
        const height = 500 - margin.top - margin.bottom;
        
        // Create SVG
        const svg = d3.select("#scatter-plot")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);
        
        // Find min and max values for the scales
        const xMin = d3.min(data, d => d[xMetric]) || 0;
        const xMax = d3.max(data, d => d[xMetric]) || 0;
        const yMin = d3.min(data, d => d[yMetric]) || 0;
        const yMax = d3.max(data, d => d[yMetric]) || 0;
        
        // Calculate padding (5% of the data range or at least 1 unit)
        const xPadding = Math.max(1, (xMax - xMin) * 0.05);
        const yPadding = Math.max(1, (yMax - yMin) * 0.05);
        
        // Create scales with padding to keep points off the axes
        const xScale = d3.scaleLinear()
            .domain([Math.max(0, xMin - xPadding), xMax + xPadding])
            .range([0, width]);
        
        const yScale = d3.scaleLinear()
            .domain([Math.max(0, yMin - yPadding), yMax + yPadding])
            .range([height, 0]);
        
        const radiusScale = d3.scaleSqrt()
            .domain([0, d3.max(data, d => d[sizeMetric])])
            .range([3, 15]);
        
        const colorScale = d3.scaleOrdinal()
            .domain(["Forward", "Midfielder", "Defender", "Goalkeeper"])
            .range(["#e90052", "#04f5ff", "#00ff85", "#ff9e00"]);
        
        // Create axes
        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(xScale))
            .append("text")
            .attr("x", width / 2)
            .attr("y", 40)
            .attr("fill", "black")
            .style("text-anchor", "middle")
            .style("font-size", "14px")
            .text(xMetric);
        
        svg.append("g")
            .call(d3.axisLeft(yScale))
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", -60)
            .attr("x", -height / 2)
            .attr("fill", "black")
            .style("text-anchor", "middle")
            .style("font-size", "14px")
            .text(yMetric);
        
        // Add tooltip
        const tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);
        
        // Add dots
        svg.selectAll("circle")
            .data(data)
            .enter()
            .append("circle")
            .attr("cx", d => xScale(d[xMetric]))
            .attr("cy", d => yScale(d[yMetric]))
            .attr("r", d => radiusScale(d[sizeMetric]))
            .style("fill", d => colorScale(d.Position))
            .style("opacity", 0.7)
            .style("stroke", "white")
            .on("mouseover", function(event, d) {
                d3.select(this)
                    .style("stroke", "#000")
                    .style("opacity", 1);
                
                tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);
                
                tooltip.html(`
                    <strong>${d.Name}</strong><br>
                    ${d.Club}<br>
                    Position: ${d.Position}<br>
                    ${xMetric}: ${d[xMetric]}<br>
                    ${yMetric}: ${d[yMetric]}<br>
                    ${sizeMetric}: ${d[sizeMetric]}<br>
                    Appearances: ${d.Appearances}
                `)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function() {
                d3.select(this)
                    .style("stroke", "white")
                    .style("opacity", 0.7);
                
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            });
        
        // Add legend - positioned within the plot area
        const legendX = width - 100; // Position the legend inside the plot area
        const legendY = 20;
        
        const legend = svg.append("g")
            .attr("transform", `translate(${legendX}, ${legendY})`);
        
        const positions = ["Forward", "Midfielder", "Defender", "Goalkeeper"];
        
        // Create a background rectangle for the legend
        legend.append("rect")
            .attr("width", 120)
            .attr("height", positions.length * 25 + 60) // Height based on number of items + size legend
            .attr("fill", "white")
            .attr("stroke", "#ddd")
            .attr("rx", 5) // Rounded corners
            .attr("ry", 5);
        
        positions.forEach((position, i) => {
            const g = legend.append("g")
                .attr("transform", `translate(10, ${i * 25 + 15})`);
            
            g.append("circle")
                .attr("r", 6)
                .style("fill", colorScale(position));
            
            g.append("text")
                .attr("x", 15)
                .attr("y", 5)
                .text(position)
                .style("font-size", "12px");
        });
        
        // Add size legend
        const sizeLegend = legend.append("g")
            .attr("transform", `translate(10, ${positions.length * 25 + 15})`);
        
        sizeLegend.append("text")
            .attr("y", 0)
            .text(`Circle size: ${sizeMetric}`)
            .style("font-size", "12px");
    }
    
    function updatePositionStats(data, xMetric, yMetric) {
        const positions = [...new Set(data.map(d => d.Position))];
        const positionStats = document.getElementById('position-stats');
        positionStats.innerHTML = '';
        
        // Create a 3-column grid for position stats
        positionStats.style.display = 'grid';
        positionStats.style.gridTemplateColumns = 'repeat(3, 1fr)';
        positionStats.style.gap = '15px';
        
        positions.forEach(position => {
            const playersInPosition = data.filter(d => d.Position === position);
            
            if (playersInPosition.length > 0) {
                // Calculate metrics for this position
                const xAvg = d3.mean(playersInPosition, d => d[xMetric]);
                const yAvg = d3.mean(playersInPosition, d => d[yMetric]);
                
                const statCard = document.createElement('div');
                statCard.className = 'position-stat-card';
                statCard.style.padding = '10px';
                statCard.style.backgroundColor = '#f5f5f5';
                statCard.style.borderRadius = '4px';
                statCard.style.border = `2px solid ${getPositionColor(position)}`;
                
                // Add marker and title in the same row
                const titleRow = document.createElement('div');
                titleRow.style.display = 'flex';
                titleRow.style.alignItems = 'center';
                titleRow.style.marginBottom = '5px';
                
                const marker = document.createElement('span');
                marker.className = `position-marker position-${position.toLowerCase()}`;
                titleRow.appendChild(marker);
                
                const title = document.createElement('strong');
                title.textContent = position;
                title.style.marginLeft = '5px';
                titleRow.appendChild(title);
                
                statCard.appendChild(titleRow);
                
                // Add player count
                const count = document.createElement('div');
                count.textContent = `${playersInPosition.length} players`;
                count.style.marginBottom = '5px';
                statCard.appendChild(count);
                
                // Add metrics
                const xMetricEl = document.createElement('div');
                xMetricEl.textContent = `Avg ${xMetric}: ${xAvg?.toFixed(2) || 'N/A'}`;
                statCard.appendChild(xMetricEl);
                
                const yMetricEl = document.createElement('div');
                yMetricEl.textContent = `Avg ${yMetric}: ${yAvg?.toFixed(2) || 'N/A'}`;
                statCard.appendChild(yMetricEl);
                
                positionStats.appendChild(statCard);
            }
        });
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
