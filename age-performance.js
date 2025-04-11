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
            { value: 'appearances', text: 'Per Appearance' },
            { value: 'minutes', text: 'Per 90 Minutes (est.)' }
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
        chartDiv.style.height = '400px';
        chartDiv.style.border = '1px solid #eee';
        chartDiv.style.borderRadius = '4px';
        chartDiv.style.backgroundColor = '#fafafa';
        visContainer.appendChild(chartDiv);
        
        // Distribution chart
        const distDiv = document.createElement('div');
        distDiv.id = 'age-distribution-chart';
        distDiv.style.width = '100%';
        distDiv.style.height = '200px';
        distDiv.style.border = '1px solid #eee';
        distDiv.style.borderRadius = '4px';
        distDiv.style.backgroundColor = '#fafafa';
        visContainer.appendChild(distDiv);
        
        // Analysis panel
        const analysisPanel = document.createElement('div');
        analysisPanel.className = 'analysis-panel';
        analysisPanel.style.display = 'flex';
        analysisPanel.style.flexWrap = 'wrap';
        analysisPanel.style.gap = '20px';
        analysisPanel.style.marginTop = '20px';
        mainContainer.appendChild(analysisPanel);
        
        // Age group stats card
        const ageGroupCard = document.createElement('div');
        ageGroupCard.className = 'stats-card';
        ageGroupCard.style.flex = '1';
        ageGroupCard.style.minWidth = '250px';
        ageGroupCard.style.padding = '15px';
        ageGroupCard.style.backgroundColor = '#f5f5f5';
        ageGroupCard.style.borderRadius = '4px';
        ageGroupCard.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
        
        const ageGroupTitle = document.createElement('h3');
        ageGroupTitle.textContent = 'Age Group Analysis';
        ageGroupCard.appendChild(ageGroupTitle);
        
        const ageGroupStats = document.createElement('div');
        ageGroupStats.id = 'age-group-stats';
        ageGroupCard.appendChild(ageGroupStats);
        
        analysisPanel.appendChild(ageGroupCard);
        
        // Performance insights card
        const insightsCard = document.createElement('div');
        insightsCard.className = 'stats-card';
        insightsCard.style.flex = '1';
        insightsCard.style.minWidth = '250px';
        insightsCard.style.padding = '15px';
        insightsCard.style.backgroundColor = '#f5f5f5';
        insightsCard.style.borderRadius = '4px';
        insightsCard.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
        
        const insightsTitle = document.createElement('h3');
        insightsTitle.textContent = 'Performance Insights';
        insightsCard.appendChild(insightsTitle);
        
        const insightsContent = document.createElement('div');
        insightsContent.id = 'performance-insights';
        
        const defaultText = document.createElement('p');
        defaultText.textContent = 'Select a metric to see performance insights';
        insightsContent.appendChild(defaultText);
        
        insightsCard.appendChild(insightsContent);
        
        analysisPanel.appendChild(insightsCard);
        
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
        
        // Create age distribution chart
        createAgeDistributionChart(filteredData);
        
        // Update age group statistics
        updateAgeGroupStats(filteredData, performanceMetric, normalization);
        
        // Update performance insights
        updatePerformanceInsights(filteredData, performanceMetric, normalization);
    }
    
    function getNormalizedValue(player, metric, normalization) {
        if (!player[metric] && player[metric] !== 0) return null;
        
        switch(normalization) {
            case 'appearances':
                return player.Appearances > 0 ? player[metric] / player.Appearances : null;
            case 'minutes':
                // Estimate minutes based on appearances (90 mins per appearance)
                const estimatedMinutes = player.Appearances * 90;
                return estimatedMinutes > 0 ? (player[metric] / estimatedMinutes) * 90 : null;
            default:
                return player[metric];
        }
    }
    
    function getMetricLabel(metric, normalization) {
        if (normalization === 'appearances') {
            return `${metric} per Appearance`;
        } else if (normalization === 'minutes') {
            return `${metric} per 90 Minutes`;
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
    
    function createAgeDistributionChart(data) {
        // Clear previous visualization
        d3.select("#age-distribution-chart").html("");
        
        // Set up dimensions and margins
        const margin = {top: 40, right: 30, bottom: 60, left: 50};
        const width = document.getElementById('age-distribution-chart').clientWidth - margin.left - margin.right;
        const height = document.getElementById('age-distribution-chart').clientHeight - margin.top - margin.bottom;
        
        // Create SVG
        const svg = d3.select("#age-distribution-chart")
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
        
        // Group data by position
        const positionGroups = d3.group(data, d => d.Position);
        
        // Create histogram
        const histogram = d3.histogram()
            .value(d => d.Age)
            .domain(xScale.domain())
            .thresholds(xScale.ticks(15));
        
        // Compute the bins for each position
        const bins = {};
        let maxCount = 0;
        
        positionGroups.forEach((players, position) => {
            bins[position] = histogram(players);
            
            bins[position].forEach(bin => {
                if (bin.length > maxCount) maxCount = bin.length;
            });
        });
        
        // Y scale for the histogram
        const yScale = d3.scaleLinear()
            .domain([0, maxCount])
            .range([height, 0]);
        
        // Create color scale for positions
        const colorScale = d3.scaleOrdinal()
            .domain(["Forward", "Midfielder", "Defender", "Goalkeeper"])
            .range(["#e90052", "#04f5ff", "#00ff85", "#ff9e00"]);
        
        // Add X axis
        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(xScale).ticks(10))
            .append("text")
            .attr("x", width / 2)
            .attr("y", 35)
            .attr("fill", "black")
            .style("text-anchor", "middle")
            .style("font-size", "14px")
            .text("Age");
        
        // Add Y axis
        svg.append("g")
            .call(d3.axisLeft(yScale).ticks(5))
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", -35)
            .attr("x", -height / 2)
            .attr("fill", "black")
            .style("text-anchor", "middle")
            .style("font-size", "14px")
            .text("Count");
        
        // Add title
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", -10)
            .attr("text-anchor", "middle")
            .style("font-size", "14px")
            .style("font-weight", "bold")
            .text("Age Distribution");
        
        // Create a stack to stack the bars
        const stackedData = [];
        
        // Prepare stacked data
        const positions = Array.from(positionGroups.keys());
        
        // For each age bin, stack the position counts
        const allBins = [];
        positions.forEach(position => {
            bins[position].forEach(bin => {
                const existingBin = allBins.find(b => b.x0 === bin.x0);
                if (existingBin) {
                    existingBin[position] = bin.length;
                } else {
                    allBins.push({
                        x0: bin.x0,
                        x1: bin.x1,
                        [position]: bin.length
                    });
                }
            });
        });
        
        // Fill in missing position counts with 0
        allBins.forEach(bin => {
            positions.forEach(position => {
                if (bin[position] === undefined) {
                    bin[position] = 0;
                }
            });
        });
        
        // Create the stack
        const stack = d3.stack()
            .keys(positions)
            .order(d3.stackOrderNone)
            .offset(d3.stackOffsetNone);
        
        const stackData = stack(allBins);
        
        // Add bars
        svg.append("g")
            .selectAll("g")
            .data(stackData)
            .join("g")
            .attr("fill", d => colorScale(d.key))
            .selectAll("rect")
            .data(d => d)
            .join("rect")
            .attr("x", d => xScale(d.data.x0))
            .attr("y", d => yScale(d[1]))
            .attr("height", d => yScale(d[0]) - yScale(d[1]))
            .attr("width", d => Math.max(0, xScale(d.data.x1) - xScale(d.data.x0) - 1))
            .attr("opacity", 0.7)
            .on("mouseover", function(event, d) {
                d3.select(this)
                    .attr("opacity", 1);
                
                const position = stackData.find(layer => layer.includes(d)).key;
                const count = d[1] - d[0];
                
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
                    <strong>${position}</strong><br>
                    Age: ${Math.floor(d.data.x0)}-${Math.floor(d.data.x1)}<br>
                    Count: ${count} players
                `)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function() {
                d3.select(this)
                    .attr("opacity", 0.7);
                
                d3.select(".tooltip").remove();
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
                
                const title = document.createElement('h4');
                title.textContent = group.name;
                bracket.appendChild(title);
                
                // Stats
                const playerCount = document.createElement('p');
                playerCount.textContent = `Players: ${playersInGroup.length}`;
                bracket.appendChild(playerCount);
                
                const avgStat = document.createElement('p');
                avgStat.textContent = `Avg ${getMetricLabel(metric, normalization)}: ${avgValue.toFixed(2)}`;
                bracket.appendChild(avgStat);
                
                const topPosStat = document.createElement('p');
                topPosStat.textContent = `Best Position: ${highestPosition} (${highestAvg.toFixed(2)})`;
                bracket.appendChild(topPosStat);
                
                const topPlayerStat = document.createElement('p');
                topPlayerStat.textContent = `Top Performer: ${topPerformer.Name} (${topPerformer.normalizedValue.toFixed(2)})`;
                bracket.appendChild(topPlayerStat);
                
                ageGroupsDiv.appendChild(bracket);
            }
        });
    }
    
    function updatePerformanceInsights(data, metric, normalization) {
        const insightsDiv = document.getElementById('performance-insights');
        insightsDiv.innerHTML = '';
        
        // Prepare normalized data
        const normalizedData = data.map(player => {
            return {
                ...player,
                normalizedValue: getNormalizedValue(player, metric, normalization)
            };
        }).filter(player => player.normalizedValue !== null);
        
        if (normalizedData.length === 0) {
            insightsDiv.innerHTML = '<p>No data available for selected filters</p>';
            return;
        }
        
        // Find peak age for the selected metric
        const agePerformance = d3.rollup(
            normalizedData,
            v => d3.mean(v, d => d.normalizedValue),
            d => d.Age
        );
        
        const ageEntries = Array.from(agePerformance.entries())
            .filter(([age, value]) => {
                // Filter out ages with very few players (less than 3% of the dataset)
                const playersAtAge = normalizedData.filter(p => p.Age === age).length;
                return playersAtAge >= normalizedData.length * 0.03;
            })
            .sort((a, b) => b[1] - a[1]);
        
        let peakAge = ageEntries.length > 0 ? ageEntries[0][0] : null;
        
        // Find performance by position
        const positionPerformance = d3.rollup(
            normalizedData,
            v => d3.mean(v, d => d.normalizedValue),
            d => d.Position
        );
        
        const positionEntries = Array.from(positionPerformance.entries())
            .sort((a, b) => b[1] - a[1]);
        
        // Find overall trend (increasing or decreasing with age)
        const trendData = Array.from(d3.rollup(
            normalizedData,
            v => d3.mean(v, d => d.normalizedValue),
            d => d.Age
        ).entries()).sort((a, b) => a[0] - b[0]);
        
        let trend = "neutral";
        if (trendData.length > 3) {
            // Simple linear regression to determine trend
            const n = trendData.length;
            const sumX = trendData.reduce((sum, [x, y]) => sum + x, 0);
            const sumY = trendData.reduce((sum, [x, y]) => sum + y, 0);
            const sumXY = trendData.reduce((sum, [x, y]) => sum + x * y, 0);
            const sumXX = trendData.reduce((sum, [x, y]) => sum + x * x, 0);
            
            const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
            
            trend = slope > 0.05 ? "increasing" : (slope < -0.05 ? "decreasing" : "neutral");
        }
        
        // Create insights
        const title = document.createElement('h4');
        title.textContent = `Insights for ${getMetricLabel(metric, normalization)}`;
        insightsDiv.appendChild(title);
        
        if (peakAge) {
            const peakAgePara = document.createElement('p');
            peakAgePara.innerHTML = `<strong>Peak Age:</strong> ${peakAge} years`;
            
            // Add trend indicator
            const trendSpan = document.createElement('span');
            trendSpan.className = "trend-indicator trend-" + 
                (trend === "increasing" ? "up" : (trend === "decreasing" ? "down" : "flat"));
            peakAgePara.appendChild(trendSpan);
            
            insightsDiv.appendChild(peakAgePara);
        }
        
        if (positionEntries.length > 0) {
            const bestPositionPara = document.createElement('p');
            bestPositionPara.innerHTML = `<strong>Best Position:</strong> ${positionEntries[0][0]} (${positionEntries[0][1].toFixed(2)})`;
            insightsDiv.appendChild(bestPositionPara);
        }
        
        // Top performers
        const topPerformers = [...normalizedData]
            .sort((a, b) => b.normalizedValue - a.normalizedValue)
            .slice(0, 3);
        
        const topPara = document.createElement('p');
        topPara.innerHTML = `<strong>Top Performers:</strong>`;
        insightsDiv.appendChild(topPara);
        
        const topList = document.createElement('ol');
        topList.style.marginLeft = "20px";
        topList.style.marginTop = "5px";
        
        topPerformers.forEach(player => {
            const item = document.createElement('li');
            item.textContent = `${player.Name} (${player.Age}, ${player.Position}): ${player.normalizedValue.toFixed(2)}`;
            topList.appendChild(item);
        });
        
        insightsDiv.appendChild(topList);
        
        // Add narrative insight based on trend
        const insightPara = document.createElement('p');
        insightPara.style.marginTop = "10px";
        
        if (trend === "increasing") {
            insightPara.textContent = `This metric tends to improve with age and experience, with players reaching their peak around age ${peakAge}.`;
        } else if (trend === "decreasing") {
            insightPara.textContent = `This metric tends to decline with age, with players performing best at younger ages (around ${peakAge}).`;
        } else {
            insightPara.textContent = `This metric remains relatively stable across age groups, with individual skill being more important than age.`;
        }
        
        insightsDiv.appendChild(insightPara);
    }
});