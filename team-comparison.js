// Team Comparison Dashboard for Premier League Statistics
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
                delimitersToGuess: [',', '\t', '|', ';'],
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
        // converts percentage strings to numbers and filter incomplete entries
        const data = rawData.filter(player => player.Club && player.Position).map(player => {
            // Convert percentage strings to numbers
            Object.keys(player).forEach(key => {
                if (typeof player[key] === 'string' && player[key].includes('%')) {
                    player[key] = parseFloat(player[key].replace('%', ''));
                }
            });
            return player;
        });
        
        // Set up the visualization structure
        setupTeamComparison(data);
    }
    
    function setupTeamComparison(data) {
        // Create container for the visualization
        const mainContainer = document.querySelector('#team-comparison-section');
        if (!mainContainer) {
            console.error("Container for team comparison not found");
            return;
        }
        
        // Clear any existing content
        mainContainer.innerHTML = '';
            
        // Create heading
        const heading = document.createElement('h2');
        heading.textContent = 'Team Comparison Dashboard';
        mainContainer.appendChild(heading);
        
        const description = document.createElement('p');
        description.textContent = 'This Compares all the teams against each other based on their players performance and stats\' collective statistics';
        mainContainer.appendChild(description);
        
        // Create controls section
        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'controls';
        mainContainer.appendChild(controlsDiv);
        
        // Add statistic selector
        const statGroup = document.createElement('div');
        statGroup.className = 'control-group';
        
        const statLabel = document.createElement('label');
        statLabel.textContent = 'Statistic:';
        statLabel.htmlFor = 'team-statistic';
        
        const statSelect = document.createElement('select');
        statSelect.id = 'team-statistic';
        
        // Define statistics for comparison
        const teamStats = [
            { value: 'Goals', label: 'Goals Scored' },
            { value: 'Assists', label: 'Assists' },
            { value: 'Tackles', label: 'Tackles' },
            { value: 'Passes', label: 'Total Passes' },
            { value: 'Shots on target', label: 'Shots on Target' },
            { value: 'Interceptions', label: 'Interceptions' },
            { value: 'Clearances', label: 'Clearances' },
            { value: 'Yellow cards', label: 'Yellow Cards' },
            { value: 'Red cards', label: 'Red Cards' },
            { value: 'Wins', label: 'Team Wins' },
            { value: 'Losses', label: 'Team Losses' }
        ];
        
        teamStats.forEach(stat => {
            const option = document.createElement('option');
            option.value = stat.value;
            option.textContent = stat.label;
            statSelect.appendChild(option);
        });
        
        statGroup.appendChild(statLabel);
        statGroup.appendChild(statSelect);
        controlsDiv.appendChild(statGroup);
        
        // Create visualization container
        const chartDiv = document.createElement('div');
        chartDiv.id = 'team-chart-container';
        chartDiv.style.width = '100%';
        chartDiv.style.height = '500px';
        chartDiv.style.marginTop = '20px';
        chartDiv.style.overflowY = 'auto';
        mainContainer.appendChild(chartDiv);
        
        // Create team info panel (for when users hover over bars)
        const infoPanel = document.createElement('div');
        infoPanel.id = 'team-info-panel';
        infoPanel.className = 'stats-panel';
        infoPanel.style.display = 'none';
        mainContainer.appendChild(infoPanel);
        
        // Add event listeners to controls
        statSelect.addEventListener('change', () => updateTeamChart(data));
        
        // Initialize the chart with default values
        updateTeamChart(data);
    }
    
    function updateTeamChart(data) {
        // Get selected options
        const statisticSelect = document.getElementById('team-statistic');
        
        // Check if elements exist before accessing their values
        if (!statisticSelect) {
            console.error('Required UI elements not found');
            return;
        }
        
        const statistic = statisticSelect.value;
        
        // Filter valid data points (no minimum appearances filter)
        const filteredPlayers = data.filter(player => {
            return player[statistic] !== null && player[statistic] !== undefined;
        });
        
        // Aggregate data by team
        const teamData = aggregateTeamData(filteredPlayers, statistic);
        
        // Sort teams alphabetically
        sortTeamData(teamData);
        
        // Create the chart
        createHorizontalBarChart(teamData, statistic);
    }
    
    function aggregateTeamData(data, statistic) {
        // Get all clubs
        const clubs = [...new Set(data.map(player => player.Club))].filter(Boolean);
        
        // Calculate team totals for the selected statistic
        const teamData = clubs.map(club => {
            // Get all players for this club
            const clubPlayers = data.filter(player => player.Club === club);
            
            // Calculate the sum of the selected statistic for all players in the club
            let total = 0;
            let players = [];
            
            clubPlayers.forEach(player => {
                if (player[statistic] !== null && player[statistic] !== undefined) {
                    // In case of percentage statistics, we'll use the average instead of sum
                    if (typeof player[statistic] === 'number') {
                        total += player[statistic];
                        
                        // Store player information for the info panel
                        if (player[statistic] > 0) {
                            players.push({
                                name: player.Name,
                                position: player.Position,
                                value: player[statistic],
                                appearances: player.Appearances
                            });
                        }
                    }
                }
            });
            
            // If it's a percentage statistic, calculate average instead of sum
            if (statistic.includes('%')) {
                const validPlayers = clubPlayers.filter(p => 
                    p[statistic] !== null && p[statistic] !== undefined).length;
                if (validPlayers > 0) {
                    total = total / validPlayers;
                }
            }
            
            // Round to 2 decimal places
            total = Math.round(total * 100) / 100;
            
            // Sort players by their contribution to this statistic
            players.sort((a, b) => b.value - a.value);
            
            return {
                club: club,
                total: total,
                players: players,
                playerCount: clubPlayers.length
            };
        });
        
        return teamData;
    }
    
    function sortTeamData(teamData) {
        // Always sort alphabetically by club name
        teamData.sort((a, b) => a.club.localeCompare(b.club));
    }
    
    function createHorizontalBarChart(teamData, statistic) {
        // Clear previous chart
        const chartContainer = document.getElementById('team-chart-container');
        if (!chartContainer) {
            console.error('Chart container not found');
            return;
        }
        chartContainer.innerHTML = '';
        
        // Get formatted statistic name
        const statSelect = document.getElementById('team-statistic');
        if (!statSelect) {
            console.error('Statistic selector not found');
            return;
        }
        
        const selectedOption = statSelect.options[statSelect.selectedIndex];
        const statName = selectedOption ? selectedOption.textContent : statistic;
        
        // Set up dimensions and margins
        const margin = { top: 20, right: 120, bottom: 40, left: 160 };
        const width = chartContainer.clientWidth - margin.left - margin.right;
        const height = Math.max(400, teamData.length * 35) - margin.top - margin.bottom;
        
        // Create SVG
        const svg = d3.select('#team-chart-container')
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);
        
        // Create scales
        const xScale = d3.scaleLinear()
            .domain([0, d3.max(teamData, d => d.total) * 1.1 || 1]) // Add fallback for empty data
            .range([0, width]);
        
        const yScale = d3.scaleBand()
            .domain(teamData.map(d => d.club))
            .range([0, height])
            .padding(0.2);
        
        // Add X axis
        svg.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(xScale).ticks(5))
            .append('text')
            .attr('x', width / 2)
            .attr('y', margin.bottom - 5)
            .attr('fill', 'black')
            .attr('text-anchor', 'middle')
            .text(statName);
        
        // Add Y axis (team names)
        svg.append('g')
            .call(d3.axisLeft(yScale))
            .selectAll('text')
            .attr('font-size', '12px');
        
        // Create color scale based on Premier League team colors
        const teamColors = {
            'Arsenal': 'red',
            'Aston-Villa': 'skyblue',
            'Brighton-and-Hove-Albion': 'blue',
            'Burnley': 'maroon',
            'Chelsea': 'royalblue',
            'Crystal-Palace': 'navy',
            'Everton': 'darkblue',
            'Fulham': 'black',
            'Leeds-United': 'gold',
            'Leicester-City': 'blue',
            'Liverpool': 'crimson',
            'Manchester-City': 'lightblue',
            'Manchester-United': 'darkred',
            'Newcastle-United': 'black',
            'Sheffield-United': 'red',
            'Southampton': 'firebrick',
            'Tottenham-Hotspur': 'navy',
            'West-Bromwich-Albion': 'midnightblue',
            'West-Ham-United': 'darkred',
            'Wolverhampton-Wanderers': 'orange'
        };
        
        // Fallback to D3 color scheme for any missing teams
        const colorScale = d => teamColors[d] || d3.schemeTableau10[teamData.findIndex(t => t.club === d) % 10];
        
        // Create and style the bars
        const bars = svg.selectAll('.bar')
            .data(teamData)
            .enter()
            .append('rect')
            .attr('class', 'bar')
            .attr('y', d => yScale(d.club))
            .attr('height', yScale.bandwidth())
            .attr('x', 0)
            .attr('fill', d => colorScale(d.club))
            .attr('width', 0) // Start at 0 for animation
            .on('click', function(event, d) {
                // Highlight the bar
                // First reset all bars
                svg.selectAll('.bar')
                    .attr('opacity', 1)
                    .attr('stroke', 'none');
                
                // Then highlight the clicked bar
                d3.select(this)
                    .attr('opacity', 0.7)
                    .attr('stroke', '#333')
                    .attr('stroke-width', 1);
                
                // Show team info panel
                showTeamInfo(d, statistic, statName);
            })
            .on('mouseout', function() {
                // Do not reset highlighting on mouseout
                // This allows the selection to persist until another bar is clicked
            });
        
        // Add labels to show the values
        svg.selectAll('.bar-label')
            .data(teamData)
            .enter()
            .append('text')
            .attr('class', 'bar-label')
            .attr('y', d => yScale(d.club) + yScale.bandwidth() / 2 + 5)
            .attr('x', d => xScale(d.total) + 5)
            .text(d => d.total)
            .attr('font-size', '12px')
            .attr('fill', 'black')
            .attr('opacity', 0); // Start invisible for animation
        
        // Animate the bars
        bars.transition()
            .duration(800)
            .attr('width', d => xScale(d.total))
            .on('end', function() {
                // After bar animation, fade in the labels
                svg.selectAll('.bar-label')
                    .transition()
                    .duration(400)
                    .attr('opacity', 1);
            });
    }
    
    function showTeamInfo(teamData, statistic, statName) {
        const infoPanel = document.getElementById('team-info-panel');
        if (!infoPanel) {
            console.error('Info panel not found');
            return;
        }
        
        infoPanel.style.display = 'block';
        infoPanel.innerHTML = '';
        
        // Create team header
        const header = document.createElement('h3');
        header.textContent = `${teamData.club}: ${teamData.total} ${statName}`;
        infoPanel.appendChild(header);
        
        // Show top 3 contributors
        const topPlayers = teamData.players.slice(0, 3);
        
        if (topPlayers.length > 0) {
            const playerList = document.createElement('div');
            playerList.innerHTML = '<h4>Top 3 Contributors:</h4>';
            
            const table = document.createElement('table');
            table.style.width = '100%';
            table.style.marginTop = '10px';
            
            // Add table header
            const thead = document.createElement('thead');
            thead.innerHTML = `
                <tr>
                    <th style="text-align: left;">Player</th>
                    <th style="text-align: left;">Position</th>
                    <th style="text-align: right;">${statName}</th>
                    <th style="text-align: right;">Appearances</th>
                </tr>
            `;
            table.appendChild(thead);
            
            // Add player rows
            const tbody = document.createElement('tbody');
            topPlayers.forEach(player => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${player.name}</td>
                    <td>${player.position}</td>
                    <td style="text-align: right;">${player.value}</td>
                    <td style="text-align: right;">${player.appearances}</td>
                `;
                tbody.appendChild(row);
            });
            table.appendChild(tbody);
            
            playerList.appendChild(table);
            infoPanel.appendChild(playerList);
        } else {
            const noData = document.createElement('p');
            noData.textContent = 'No player data available for this statistic.';
            infoPanel.appendChild(noData);
        }
        
        // Add note about total players
        const note = document.createElement('p');
        note.innerHTML = `<small>Total players: ${teamData.playerCount}</small>`;
        infoPanel.appendChild(note);
    }
});