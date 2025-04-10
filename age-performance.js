// Age vs Performance Visualization for Premier League Player Statistics
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
        const data = rawData.filter(player => {
            // Filter out players with missing essential data
            return player.Age && player.Position && player.Appearances;
        }).map(player => {
            // Convert percentage strings to numbers
            Object.keys(player).forEach(key => {
                if (typeof player[key] === 'string' && player[key].includes('%')) {
                    player[key] = parseFloat(player[key].replace('%', ''));
                }
            });
            
            // Add derived metrics
            player.ageGroup = getAgeGroup(player.Age);
            
            return player;
        });
        
        // Initialize the visualization
        setupControls(data);
        createVisualization(data);
    }
    
    function getAgeGroup(age) {
        if (age < 23) return "Young (Under 23)";
        if (age < 27) return "Early Prime (23-26)";
        if (age < 30) return "Prime (27-29)";
        if (age < 33) return "Late Prime (30-32)";
        return "Veteran (33+)";
    }
    
    function setupControls(data) {
        // Create container for the visualization
        const mainContainer = document.querySelector('.visualization-card');
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
        
        const metrics = [
            'Goals', 
            'Goals per match',
            'Assists', 
            'Passes per match',
            'Shooting accuracy %',
            'Tackle success %',
            'Successful 50/50s',
            'Aerial battles won'
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
        
        // Normalization selector
        const normGroup = document.createElement('div');
        normGroup.className = 'control-group';
        
        const normLabel = document.createElement('label');
        normLabel.textContent = 'Normalize by:';
        normLabel.htmlFor = 'normalization';
        
        const normSelect = document.createElement('select');
        normSelect.id = 'normalization';
        
        const normOptions = [
            { value: 'none', text: 'Raw Values' },
            { value: 'appearances', text: 'Per Appearance' }
        ];
        
        normOptions.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt.value;
            option.textContent = opt.text;
            if (opt.value === 'appearances') option.selected = true;
            normSelect.appendChild(option);
        });
        
        normGroup.appendChild(normLabel);
        normGroup.appendChild(normSelect);
        controlsDiv.appendChild(normGroup);
        
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
        const visContainer = document.createElement('div');
        visContainer.className = 'visualization-container';
        visContainer.style.display = 'flex';
        visContainer.style.flexDirection = 'column';
        visContainer.style.gap = '20px';
        visContainer.style.marginTop = '20px';
        mainContainer.appendChild(visContainer);
        
        // Main chart
        const chartDiv = document.createElement('div');
        chartDiv.id = 'age-performance-chart';
        chartDiv.style.width = '100%';
        chartDiv.style.height = '500px';
        chartDiv.style.border = '1px solid #eee';
        chartDiv.style.borderRadius = '4px';
        chartDiv.style.backgroundColor = '#fafafa';
        visContainer.appendChild(chartDiv);
        
        // Age group analysis
        const ageGroupTitle = document.createElement('h3');
        ageGroupTitle.textContent = 'Age Group Analysis';
        ageGroupTitle.style.marginTop = '20px';
        mainContainer.appendChild(ageGroupTitle);
        
        const ageGroupStats = document.createElement('div');
        ageGroupStats.id = 'age-group-stats';
        ageGroupStats.style.display = 'grid';
        ageGroupStats.style.gridTemplateColumns = 'repeat(2, 1fr)';
        ageGroupStats.style.gap = '15px';
        ageGroupStats.style.marginTop = '10px';
        mainContainer.appendChild(ageGroupStats);
        
        // Add event listeners to the controls
        metricSelect.addEventListener('change', () => updateVisualization(data));
        normSelect.addEventListener('change', () => updateVisualization(data));
        appInput.addEventListener('input', () => updateVisualization(data));
    }
    
    function createVisualization(data) {
        // Initial visualization with default settings
        updateVisualization(data);
    }
    
    function updateVisualization(data) {
        // Get selected options
        const performanceMetric = document.getElementById('performance-metric').value;
        const normalization = document.getElementById('normalization').value;
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
        createAgePerformanceChart(filteredData, performanceMetric, normalization);
        
        // Update age group statistics
        updateAgeGroupStats(filteredData, performanceMetric, normalization);
    }
    
    function getNormalizedValue(player, metric, normalization) {
        if (!player[metric] && player[metric] !== 0) return null;
        
        switch(normalization) {
            case 'appearances':
                return player.Appearances > 0 ? player[metric] / player.Appearances : null;
            default:
                return player[metric];
        }
    }
    
    function getMetricLabel(metric, normalization) {
        if (normalization === 'appearances') {
            return `${metric} per Appearance`;
        }
        return metric;
    }
    
    function createAgePerformanceChart(data, metric, normalization) {
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
        
        // Prepare normalized data
        const normalizedData = data.map(player => {
            return {
                ...player,
                normalizedValue: getNormalizedValue(player, metric, normalization)
            };
        }).filter(player => player.normalizedValue !== null);
        
        const yScale = d3.scaleLinear()
            .domain([0, d3.max(normalizedData, d => d.normalizedValue) * 1.1])
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
            .text(getMetricLabel(metric, normalization));
        
        // Group data by position
        const positionGroups = d3.group(normalizedData, d => d.Position);
        
        // Create line generator
        const line = d3.line()
            .x(d => xScale(d.Age))
            .y(d => yScale(d.normalizedValue))
            .curve(d3.curveMonotoneX);
        
        // Add trend lines for each position
        positionGroups.forEach((players, position) => {
            // Sort players by age for the line
            const sortedPlayers = [...players].sort((a, b) => a.Age - b.Age);
            
            // Aggregate data by age for smoother trends
            const ageGroups = d3.group(sortedPlayers, d => d.Age);
            const aggregatedData = Array.from(ageGroups, ([age, players]) => {
                return {
                    Age: +age,
                    normalizedValue: d3.mean(players, p => p.normalizedValue),
                    Position: position,
                    count: players.length
                };
            }).sort((a, b) => a.Age - b.Age);
            
            // Only draw trend line if we have enough data points
            if (aggregatedData.length > 1) {
                // Add area under the line
                const area = d3.area()
                    .x(d => xScale(d.Age))
                    .y0(height)
                    .y1(d => yScale(d.normalizedValue))
                    .curve(d3.curveMonotoneX);
                
                svg.append("path")
                    .datum(aggregatedData)
                    .attr("fill", colorScale(position))
                    .attr("fill-opacity", 0.2)
                    .attr("d", area);
                
                // Add the line
                svg.append("path")
                    .datum(aggregatedData)
                    .attr("fill", "none")
                    .attr("stroke", colorScale(position))
                    .attr("stroke-width", 2.5)
                    .attr("opacity", 0.8)
                    .attr("d", line);
            }
        });
        
        // Add scatter points
        svg.selectAll(".age-point")
            .data(normalizedData)
            .enter()
            .append("circle")
            .attr("cx", d => xScale(d.Age))
            .attr("cy", d => yScale(d.normalizedValue))
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
                    .style("opacity", 0)
                    .style("position", "absolute")
                    .style("background", "rgba(0,0,0,0.7)")
                    .style("color", "white")
                    .style("padding", "10px")
                    .style("border-radius", "5px")
                    .style("pointer-events", "none")
                    .style("font-size", "12px")
                    .style("z-index", 100);
                
                tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);
                
                tooltip.html(`
                    <strong>${d.Name}</strong> (${d.Age})<br>
                    ${d.Club}<br>
                    Position: ${d.Position}<br>
                    ${metric}: ${d[metric]}<br>
                    ${getMetricLabel(metric, normalization)}: ${d.normalizedValue.toFixed(2)}<br>
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
                .attr("stroke-width", 2.5)
                .attr("opacity", 0.8);
            
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
        
        // Add age brackets visualization
        const ageBrackets = [
            { label: "Young", start: 17, end: 22 },
            { label: "Early Prime", start: 23, end: 26 },
            { label: "Prime", start: 27, end: 29 },
            { label: "Late Prime", start: 30, end: 32 },
            { label: "Veteran", start: 33, end: 40 }
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
    
    function updateAgeGroupStats(data, metric, normalization) {
        const ageGroupsDiv = document.getElementById('age-group-stats');
        ageGroupsDiv.innerHTML = '';
        
        // Define age groups
        const ageGroups = [
            { name: "Young (U23)", min: 17, max: 22, class: "age-group-young" },
            { name: "Prime (23-29)", min: 23, max: 29, class: "age-group-prime" },
            { name: "Experienced (30-32)", min: 30, max: 32, class: "age-group-experienced" },
            { name: "Veteran (33+)", min: 33, max: 40, class: "age-group-veteran" }
        ];
        
        // Prepare normalized data
        const normalizedData = data.map(player => {
            return {
                ...player,
                normalizedValue: getNormalizedValue(player, metric, normalization)
            };
        }).filter(player => player.normalizedValue !== null);
        
        // Calculate stats for each age group
        ageGroups.forEach(group => {
            const playersInGroup = normalizedData.filter(p => p.Age >= group.min && p.Age <= group.max);
            
            if (playersInGroup.length > 0) {
                const avgValue = d3.mean(playersInGroup, p => p.normalizedValue);
                const positions = d3.group(playersInGroup, p => p.Position);
                
                // Find position with highest average in this age group
                let highestPosition = '';
                let highestAvg = -Infinity;
                
                positions.forEach((players, position) => {
                    const posAvg = d3.mean(players, p => p.normalizedValue);
                    if (posAvg > highestAvg) {
                        highestAvg = posAvg;
                        highestPosition = position;
                    }
                });
                
                // Get top performer in this age group
                const topPerformer = playersInGroup.reduce((prev, current) => 
                    (prev.normalizedValue > current.normalizedValue) ? prev : current
                );
                
                // Create age bracket card
                const bracket = document.createElement('div');
                bracket.className = `age-bracket ${group.class}`;
                bracket.style.padding = '12px';
                bracket.style.backgroundColor = 'white';
                bracket.style.borderRadius = '4px';
                bracket.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                
                const title = document.createElement('h4');
                title.textContent = group.name;
                title.style.marginTop = '0';
                title.style.marginBottom = '8px';
                bracket.appendChild(title);
                
                // Stats
                const playerCount = document.createElement('p');
                playerCount.textContent = `Players: ${playersInGroup.length}`;
                playerCount.style.margin = '4px 0';
                bracket.appendChild(playerCount);
                
                const avgStat = document.createElement('p');
                avgStat.textContent = `Avg ${getMetricLabel(metric, normalization)}: ${avgValue.toFixed(2)}`;
                avgStat.style.margin = '4px 0';
                bracket.appendChild(avgStat);
                
                const topPosStat = document.createElement('p');
                topPosStat.textContent = `Best Position: ${highestPosition} (${highestAvg.toFixed(2)})`;
                topPosStat.style.margin = '4px 0';
                bracket.appendChild(topPosStat);
                
                const topPlayerStat = document.createElement('p');
                topPlayerStat.textContent = `Top Performer: ${topPerformer.Name} (${topPerformer.normalizedValue.toFixed(2)})`;
                topPlayerStat.style.margin = '4px 0';
                bracket.appendChild(topPlayerStat);
                
                ageGroupsDiv.appendChild(bracket);
            }
        });
    }
});