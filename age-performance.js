// Simplified Age vs Performance Visualization for Premier League Player Statistics
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
            return player.Age && player.Position && player.Appearances;
        }).map(player => {
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
        // Create container for the visualization
        const mainContainer = document.querySelector('#age-performance-section');
        if (!mainContainer) return;
        
        // Create heading
        const heading = document.createElement('h2');
        heading.textContent = 'Age vs. Performance Analysis';
        mainContainer.appendChild(heading);
        
        const description = document.createElement('p');
        description.textContent = 'Examine how player performance metrics change with age';
        mainContainer.appendChild(description);
        
        // Create controls section
        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'controls';
        mainContainer.appendChild(controlsDiv);
        
        // Performance metric selector
        const metricGroup = document.createElement('div');
        metricGroup.className = 'control-group';
        
        const metricLabel = document.createElement('label');
        metricLabel.textContent = 'Performance Metric:';
        metricLabel.htmlFor = 'performance-metric';
        
        const metricSelect = document.createElement('select');
        metricSelect.id = 'performance-metric';
        
        // Add the most important performance metrics
        const metrics = [
            'Goals', 
            'Goals per match',
            'Assists', 
            'Passes per match',
            'Shooting accuracy %',
            'Tackle success %'
        ];
        
        metrics.forEach(metric => {
            const option = document.createElement('option');
            option.value = metric;
            option.textContent = metric;
            metricSelect.appendChild(option);
        });
        
        metricGroup.appendChild(metricLabel);
        metricGroup.appendChild(metricSelect);
        controlsDiv.appendChild(metricGroup);
        
        // Position filter
        const posGroup = document.createElement('div');
        posGroup.className = 'control-group';
        
        const posLabel = document.createElement('label');
        posLabel.textContent = 'Position Filter:';
        
        const posCheckboxes = document.createElement('div');
        posCheckboxes.id = 'age-position-checkboxes';
        
        // Get all positions
        const positions = [...new Set(data.map(d => d.Position))].filter(Boolean);
        
        // Create position checkboxes
        positions.forEach(position => {
            const label = document.createElement('label');
            label.style.marginRight = '10px';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = position;
            checkbox.checked = true;
            checkbox.id = `age-pos-${position.toLowerCase()}`;
            checkbox.addEventListener('change', () => updateVisualization(data));
            
            const span = document.createElement('span');
            span.textContent = position;
            
            const marker = document.createElement('span');
            marker.className = `position-marker position-${position.toLowerCase()}`;
            
            label.appendChild(checkbox);
            label.appendChild(marker);
            label.appendChild(span);
            posCheckboxes.appendChild(label);
        });
        
        posGroup.appendChild(posLabel);
        posGroup.appendChild(posCheckboxes);
        controlsDiv.appendChild(posGroup);
        
        // Minimum appearances filter
        const appGroup = document.createElement('div');
        appGroup.className = 'control-group';
        
        const appLabel = document.createElement('label');
        appLabel.textContent = 'Min Appearances:';
        appLabel.htmlFor = 'min-appearances-age';
        
        const appInput = document.createElement('input');
        appInput.type = 'number';
        appInput.id = 'min-appearances-age';
        appInput.min = 0;
        appInput.max = 50;
        appInput.value = 10;
        appInput.step = 1;
        
        appGroup.appendChild(appLabel);
        appGroup.appendChild(appInput);
        controlsDiv.appendChild(appGroup);
        
        // Create visualization container
        const chartDiv = document.createElement('div');
        chartDiv.id = 'age-performance-chart';
        chartDiv.style.width = '100%';
        chartDiv.style.height = '500px';
        chartDiv.style.marginTop = '20px';
        chartDiv.style.border = '1px solid #eee';
        chartDiv.style.borderRadius = '4px';
        chartDiv.style.backgroundColor = '#fafafa';
        mainContainer.appendChild(chartDiv);
        
        // Add event listeners to the controls
        metricSelect.addEventListener('change', () => updateVisualization(data));
        appInput.addEventListener('input', () => updateVisualization(data));
    }
    
    function createVisualization(data) {
        updateVisualization(data);
    }
    
    function updateVisualization(data) {
        // Get selected options
        const performanceMetric = document.getElementById('performance-metric').value;
        const minAppearances = parseInt(document.getElementById('min-appearances-age').value) || 0;
        
        // Get selected positions
        const selectedPositions = Array.from(document.querySelectorAll('#age-position-checkboxes input:checked')).map(cb => cb.value);
        
        // Filter data based on selections
        let filteredData = data.filter(player => {
            return selectedPositions.includes(player.Position) && 
                   player.Appearances >= minAppearances &&
                   player[performanceMetric] !== null && player[performanceMetric] !== undefined;
        });
        
        // Create age performance chart
        createAgePerformanceChart(filteredData, performanceMetric);
    }
    
    function createAgePerformanceChart(data, metric) {
        // Clear previous visualization
        d3.select("#age-performance-chart").html("");
        
        // Set up dimensions and margins
        const margin = {top: 40, right: 120, bottom: 60, left: 80};
        const width = document.getElementById('age-performance-chart').clientWidth - margin.left - margin.right;
        const height = document.getElementById('age-performance-chart').clientHeight - margin.top - margin.bottom;
        
        // Create SVG
        const svg = d3.select("#age-performance-chart")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);
        
        // Create scales
        const xScale = d3.scaleLinear()
            .domain([
                d3.min(data, d => d.Age) - 1, 
                d3.max(data, d => d.Age) + 1
            ])
            .range([0, width]);
        
        const yScale = d3.scaleLinear()
            .domain([0, d3.max(data, d => d[metric]) * 1.1])
            .range([height, 0]);
        
        // Create color scale for positions
        const colorScale = d3.scaleOrdinal()
            .domain(["Forward", "Midfielder", "Defender", "Goalkeeper"])
            .range(["#e90052", "#04f5ff", "#00ff85", "#ff9e00"]);
        
        // Add axes
        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(xScale).ticks(10))
            .append("text")
            .attr("x", width / 2)
            .attr("y", 40)
            .attr("fill", "black")
            .style("text-anchor", "middle")
            .style("font-size", "14px")
            .text("Age");
        
        svg.append("g")
            .call(d3.axisLeft(yScale))
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", -60)
            .attr("x", -height / 2)
            .attr("fill", "black")
            .style("text-anchor", "middle")
            .style("font-size", "14px")
            .text(metric);
        
        // Group data by position
        const positionGroups = d3.group(data, d => d.Position);
        
        // Add trend lines for each position using a simple loess smoothing approach
        positionGroups.forEach((players, position) => {
            // Only draw trend line if we have enough data points
            if (players.length > 5) {
                // Group by age
                const ageGroups = d3.group(players, d => d.Age);
                
                // Create aggregated data (average metric by age)
                const aggregatedData = Array.from(ageGroups, ([age, agePlayers]) => {
                    return {
                        age: +age,
                        value: d3.mean(agePlayers, p => p[metric]),
                        position: position
                    };
                }).sort((a, b) => a.age - b.age);
                
                // Create line generator
                const line = d3.line()
                    .x(d => xScale(d.age))
                    .y(d => yScale(d.value))
                    .curve(d3.curveBasis);
                
                // Add the line
                svg.append("path")
                    .datum(aggregatedData)
                    .attr("fill", "none")
                    .attr("stroke", colorScale(position))
                    .attr("stroke-width", 3)
                    .attr("opacity", 0.8)
                    .attr("d", line);
            }
        });
        
        // Add scatter points
        svg.selectAll(".age-point")
            .data(data)
            .enter()
            .append("circle")
            .attr("cx", d => xScale(d.Age))
            .attr("cy", d => yScale(d[metric]))
            .attr("r", 4)
            .attr("fill", d => colorScale(d.Position))
            .attr("stroke", "white")
            .attr("stroke-width", 1)
            .style("opacity", 0.7)
            .on("mouseover", function(event, d) {
                // Highlight on hover
                d3.select(this)
                    .attr("r", 6)
                    .style("opacity", 1);
                
                // Create tooltip
                const tooltip = d3.select("body").append("div")
                    .attr("class", "tooltip")
                    .style("opacity", 0);
                
                tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);
                
                tooltip.html(`
                    <strong>${d.Name}</strong> (${d.Age})<br>
                    ${d.Club}<br>
                    Position: ${d.Position}<br>
                    ${metric}: ${d[metric]}<br>
                    Appearances: ${d.Appearances}
                `)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function() {
                d3.select(this)
                    .attr("r", 4)
                    .style("opacity", 0.7);
                
                d3.select(".tooltip").remove();
            });
        
        // Add legend
        const legend = svg.append("g")
            .attr("transform", `translate(${width + 20}, 0)`);
        
        const positions = ["Forward", "Midfielder", "Defender", "Goalkeeper"];
        
        positions.forEach((position, i) => {
            const g = legend.append("g")
                .attr("transform", `translate(0, ${i * 25})`);
            
            g.append("line")
                .attr("x1", 0)
                .attr("y1", 10)
                .attr("x2", 20)
                .attr("y2", 10)
                .attr("stroke", colorScale(position))
                .attr("stroke-width", 2.5);
            
            g.append("circle")
                .attr("cx", 10)
                .attr("cy", 10)
                .attr("r", 4)
                .attr("fill", colorScale(position))
                .attr("stroke", "white")
                .attr("stroke-width", 1);
            
            g.append("text")
                .attr("x", 30)
                .attr("y", 13)
                .text(position)
                .style("font-size", "12px");
        });
        
        // Add simple age brackets
        const ageBrackets = [
            { label: "Young", start: 17, end: 23 },
            { label: "Prime", start: 24, end: 30 },
            { label: "Veteran", start: 31, end: 40 }
        ];
        
        // Add age bracket backgrounds
        ageBrackets.forEach(bracket => {
            svg.append("rect")
                .attr("x", xScale(bracket.start))
                .attr("y", 0)
                .attr("width", xScale(bracket.end) - xScale(bracket.start))
                .attr("height", height)
                .attr("fill", "#f5f5f5")
                .attr("opacity", 0.3);
            
            svg.append("text")
                .attr("x", xScale(bracket.start) + (xScale(bracket.end) - xScale(bracket.start)) / 2)
                .attr("y", 15)
                .attr("text-anchor", "middle")
                .attr("font-size", "10px")
                .attr("fill", "#777")
                .text(bracket.label);
        });
    }
});