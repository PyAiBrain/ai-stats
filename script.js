document.addEventListener('DOMContentLoaded', () => {
    fetchData();
});

async function fetchData() {
    try {
        const response = await fetch('./stats.json');
        const data = await response.json();
        
        const userCardsContainer = document.getElementById('user-cards');
        
        for (const [ip, userData] of Object.entries(data)) {
            const userCard = createUserCard(ip, userData);
            userCardsContainer.appendChild(userCard);
        }
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

function createUserCard(ip, userData) {
    const card = document.createElement('div');
    card.className = 'user-card';
    
    const userInfo = `
        <h2>${userData.nickname} 
            <span class="ip-address" title="Click to copy">
                [${ip}]
                <i class="fas fa-copy copy-icon" data-ip="${ip}"></i>
            </span>
        </h2>
        <p>Total Sessions: ${userData.sessions.length}</p>
        <p>Total Duration: ${formatDuration(calculateTotalDuration(userData.sessions))}</p>
    `;
    
    const chartContainer = document.createElement('div');
    chartContainer.className = 'chart-container';
    chartContainer.innerHTML = '<h3>Session Duration Chart</h3>';
    const chart = document.createElement('div');
    chart.className = 'chart';
    chartContainer.appendChild(chart);
    
    const heatmapContainer = document.createElement('div');
    heatmapContainer.className = 'heatmap';
    heatmapContainer.innerHTML = '<h3>Last 7 Days Activity</h3>';
    const heatmapGrid = document.createElement('div');
    heatmapGrid.className = 'heatmap-grid';
    heatmapContainer.appendChild(heatmapGrid);
    
    card.innerHTML = userInfo;
    card.appendChild(chartContainer);
    card.appendChild(heatmapContainer);
    
    createChart(chart, userData.sessions);
    createHeatmap(heatmapGrid, userData.last_seven_days);
    
    // Add event listener for copying IP address
    card.querySelector('.copy-icon').addEventListener('click', function(e) {
        e.stopPropagation();
        const ip = this.getAttribute('data-ip');
        navigator.clipboard.writeText(ip).then(() => {
            showTooltip(this, 'Copied!');
        });
    });
    
    return card;
}

function calculateTotalDuration(sessions) {
    return sessions.reduce((sum, session) => sum + session.duration, 0);
}

function formatDuration(seconds) {
    const units = [
        { name: 'year', seconds: 31536000 },
        { name: 'month', seconds: 2592000 },
        { name: 'day', seconds: 86400 },
        { name: 'hour', seconds: 3600 },
        { name: 'minute', seconds: 60 },
        { name: 'second', seconds: 1 }
    ];

    let remainingSeconds = seconds;
    const parts = [];

    for (const unit of units) {
        const unitCount = Math.floor(remainingSeconds / unit.seconds);
        if (unitCount > 0) {
            parts.push(`${unitCount} ${unit.name}${unitCount > 1 ? 's' : ''}`);
            remainingSeconds %= unit.seconds;
        }
    }

    return parts.join(', ') || '0 seconds';
}

function createChart(chartElement, sessions) {
    const maxDuration = Math.max(...sessions.map(session => session.duration));

    sessions.forEach((session, index) => {
        const bar = document.createElement('div');
        bar.className = 'bar';
        const height = (session.duration / maxDuration) * 100;
        bar.style.height = `${height}%`;
        bar.setAttribute('data-duration', formatDuration(session.duration));
        chartElement.appendChild(bar);
    });
}

function createHeatmap(heatmapElement, lastSevenDays) {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    days.forEach(day => {
        const cell = document.createElement('div');
        cell.className = 'heatmap-cell';
        cell.textContent = day.charAt(0);
        if (lastSevenDays[day]) {
            cell.classList.add('active');
        }
        cell.title = `${day}: ${lastSevenDays[day] ? 'Active' : 'Inactive'}`;
        heatmapElement.appendChild(cell);
    });
}

function showTooltip(element, message) {
    const tooltip = document.createElement('span');
    tooltip.className = 'tooltiptext';
    tooltip.textContent = message;
    element.classList.add('tooltip');
    element.appendChild(tooltip);
    setTimeout(() => {
        tooltip.remove();
        element.classList.remove('tooltip');
    }, 2000);
}

