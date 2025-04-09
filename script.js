/**
 * Premier League Player Statistics Visualization
 * Main JavaScript file for the design demonstrations
 */

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Sample data for demonstrations
    const samplePlayers = [
        {Name: "Harry Kane", Position: "Forward", Club: "Tottenham Hotspur", Goals: 21, Assists: 14, Appearances: 35},
        {Name: "Mohamed Salah", Position: "Forward", Club: "Liverpool", Goals: 19, Assists: 10, Appearances: 37},
        {Name: "Bruno Fernandes", Position: "Midfielder", Club: "Manchester United", Goals: 18, Assists: 12, Appearances: 37},
        {Name: "Son Heung-min", Position: "Forward", Club: "Tottenham Hotspur", Goals: 17, Assists: 10, Appearances: 37},
        {Name: "Patrick Bamford", Position: "Forward", Club: "Leeds United", Goals: 17, Assists: 7, Appearances: 38},
        {Name: "Dominic Calvert-Lewin", Position: "Forward", Club: "Everton", Goals: 16, Assists: 1, Appearances: 33},
        {Name: "Jamie Vardy", Position: "Forward", Club: "Leicester City", Goals: 15, Assists: 9, Appearances: 34},
        {Name: "Ilkay Gündogan", Position: "Midfielder", Club: "Manchester City", Goals: 13, Assists: 2, Appearances: 28},
        {Name: "Ollie Watkins", Position: "Forward", Club: "Aston Villa", Goals: 14, Assists: 5, Appearances: 37},
        {Name: "Alexandre Lacazette", Position: "Forward", Club: "Arsenal", Goals: 13, Assists: 2, Appearances: 31},
        {Name: "Marcus Rashford", Position: "Forward", Club: "Manchester United", Goals: 11, Assists: 9, Appearances: 37},
        {Name: "Raheem Sterling", Position: "Forward", Club: "Manchester City", Goals: 10, Assists: 7, Appearances: 31},
        {Name: "Callum Wilson", Position: "Forward", Club: "Newcastle United", Goals: 12, Assists: 5, Appearances: 26},
        {Name: "Sadio Mané", Position: "Forward", Club: "Liverpool", Goals: 11, Assists: 7, Appearances: 35},
        {Name: "Danny Ings", Position: "Forward", Club: "Southampton", Goals: 12, Assists: 4, Appearances: 29},
        {Name: "Phil Foden", Position: "Midfielder", Club: "Manchester City", Goals: 9, Assists: 5, Appearances: 28},
        {Name: "Wilfried Zaha", Position: "Forward", Club: "Crystal Palace", Goals: 11, Assists: 2, Appearances: 30},
        {Name: "Kevin De Bruyne", Position: "Midfielder", Club: "Manchester City", Goals: 6, Assists: 12, Appearances: 25},
        {Name: "Mason Mount", Position: "Midfielder", Club: "Chelsea", Goals: 6, Assists: 5, Appearances: 36},
        {Name: "Jack Grealish", Position: "Midfielder", Club: "Aston Villa", Goals: 6, Assists: 10, Appearances: 26}
    ];

    // Goalkeeper sample data
    const goalkeepers = [
        {Name: "Ederson", Position: "Goalkeeper", Club: "Manchester City", Clean_sheets: 19, Saves: 66, Appearances: 36},
        {Name: "Emiliano Martínez", Position: "Goalkeeper", Club: "Aston Villa", Clean_sheets: 15, Saves: 142, Appearances: 38},
        {Name: "Edouard Mendy", Position: "Goalkeeper", Club: "Chelsea", Clean_sheets: 16, Saves: 66, Appearances: 31},
        {Name: "Kasper Schmeichel", Position: "Goalkeeper", Club: "Leicester City", Clean_sheets: 11, Saves: 98, Appearances: 38},
        {Name: "Illan Meslier", Position: "Goalkeeper", Club: "Leeds United", Clean_sheets: 11, Saves: 140, Appearances: 35}
    ];

    // Defender sample data
    const defenders = [
        {Name: "Ruben Dias", Position: "Defender", Club: "Manchester City", Clean_sheets: 15, Tackles: 59, Interceptions: 31, Appearances: 32},
        {Name: "Harry Maguire", Position: "Defender", Club: "Manchester United", Clean_sheets: 13, Tackles: 28, Interceptions: 58, Appearances: 34},
        {Name: "John Stones", Position: "Defender", Club: "Manchester City", Clean_sheets: 14, Tackles: 22, Interceptions: 24, Appearances: 22},
        {Name: "Luke Shaw", Position: "Defender", Club: "Manchester United", Clean_sheets: 10, Tackles: 62, Interceptions: 37, Appearances: 32},
        {Name: "Aaron Wan-Bissaka", Position: "Defender", Club: "Manchester United", Clean_sheets: 13, Tackles: 88, Interceptions: 50, Appearances: 34}
    ];

    // Initialize visualizations if containers exist
    if (document.getElementById('scatter-plot-container')) {
        createScatterPlot(samplePlayers);
    }

    /**
     * Creates a scatter plot visualization
     * @param {Array} data - Array of player objects
     */
    function createScatterPlot(data) {
        // Set up dimensions and margins
        const margin = {top: 20, right: 30, bottom: 40, left: 50};
        const width = 700 - margin.left - margin.right;
        const height = 500 - margin.top - margin.bottom;

        // Remove any existing SVG
        d3.select("#scatter-plot-container svg").remove();

        // Create SVG
        const svg = d3.select("#scatter-plot-container")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Define scales
        const xScale = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.Goals) * 1.1])
            .range([0, width]);

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.Assists) * 1.1])
            .range([height, 0]);

        const radiusScale = d3.scaleSqrt()
            .domain([0, d3.max(data, d => d.Appearances)])
            .range([3, 15]);

        const colorScale = d3.scaleOrdinal()
            .domain(["Forward", "Midfielder", "Defender", "Goalkeeper"])
            .range(["#e90052", "#04f5ff", "#00ff85", "#ff9e00"]);

        // Create tooltip
        const tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

        // Create X axis
        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(xScale));

        // X axis label
        svg.append("text")
            .attr("text-anchor", "middle")
            .attr("x", width / 2)
            .attr("y", height + margin.bottom - 5)
            .text("Goals");

        // Create Y axis
        svg.append("g")
            .call(d3.axisLeft(yScale));

        // Y axis label
        svg.append("text")
            .attr("text-anchor", "middle")
            .attr("transform", "rotate(-90)")
            .attr("x", -height / 2)
            .attr("y", -margin.left + 15)
            .text("Assists");

        // Add dots
        svg.selectAll("circle")
            .data(data)
            .enter()
            .append("circle")
            .attr("cx", d => xScale(d.Goals))
            .attr("cy", d => yScale(d.Assists))
            .attr("r", d => radiusScale(d.Appearances))
            .style("fill", d => colorScale(d.Position))
            .style("opacity", 0.7)
            .style("stroke", "white")
            .on("mouseover", function(event, d) {
                d3.select(this)
                    .style("stroke", "black")
                    .style("opacity", 1);
                
                tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);
                    
                tooltip.html(`<strong>${d.Name}</strong><br>` +
                             `${d.Club}<br>` +
                             `Goals: ${d.Goals}<br>` +
                             `Assists: ${d.Assists}<br>` +
                             `Appearances: ${d.Appearances}`)
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

        // Add legend
        const legend = svg.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(${width - 100}, 20)`);

        const positions = ["Forward", "Midfielder", "Defender", "Goalkeeper"];

        positions.forEach((position, i) => {
            legend.append("circle")
                .attr("cx", 0)
                .attr("cy", i * 20)
                .attr("r", 6)
                .style("fill", colorScale(position));

            legend.append("text")
                .attr("x", 10)
                .attr("y", i * 20 + 5)
                .text(position)
                .style("font-size", "12px");
        });

        // Add size legend
        const sizeLegend = svg.append("g")
            .attr("transform", `translate(20, 20)`);

        sizeLegend.append("text")
            .attr("x", 0)
            .attr("y", 0)
            .text("Circle size: Appearances")
            .style("font-size", "12px");
    }

    /**
     * Creates a radar chart visualization (not implemented in this demo)
     * Placeholder for Design 2 implementation
     */
    function createRadarChart(selector, players, position) {
        // This would be implemented for Design 2
        console.log("Radar chart would be created here");
    }

    /**
     * Creates a heat map visualization (not implemented in this demo)
     * Placeholder for Design 3 implementation
     */
    function createHeatMap(selector, players) {
        // This would be implemented for Design 3
        console.log("Heat map would be created here");
    }

    /**
     * Creates a bar chart visualization (not implemented in this demo)
     * Placeholder for Design 4 (bad design) implementation
     */
    function createBarChart(selector, data, metric) {
        // This would be implemented for Design 4
        console.log("Bar chart would be created here");
    }

    /**
     * Utility function to process player data
     * Converts percentage strings to numbers, handles missing values, etc.
     * @param {Array} data - Raw player data array
     * @return {Object} Processed data object
     */
    function processPlayerData(data) {
        // Convert percentage strings to numbers
        data.forEach(player => {
            Object.keys(player).forEach(key => {
                if (typeof player[key] === 'string' && player[key].includes('%')) {
                    player[key] = parseFloat(player[key].replace('%', ''));
                }
            });
        });

        // Calculate position averages
        const positions = ["Forward", "Midfielder", "Defender", "Goalkeeper"];
        const positionAverages = {};

        positions.forEach(position => {
            const playersInPosition = data.filter(p => p.Position === position);
            positionAverages[position] = {};
            
            // Calculate average for metrics
            const metrics = Object.keys(playersInPosition[0]).filter(key => 
                typeof playersInPosition[0][key] === 'number' && 
                !isNaN(playersInPosition[0][key])
            );
            
            metrics.forEach(metric => {
                const values = playersInPosition.map(p => p[metric]).filter(v => !isNaN(v));
                if (values.length > 0) {
                    positionAverages[position][metric] = values.reduce((a, b) => a + b, 0) / values.length;
                } else {
                    positionAverages[position][metric] = 0;
                }
            });
        });

        return {
            players: data,
            positionAverages
        };
    }
});