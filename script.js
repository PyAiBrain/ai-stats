async function fetchData() {
    try {
        const response = await fetch('./stats.json');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

function createCard(ip, data) {
    const card = document.createElement('div');
    card.className = 'card';

    const title = document.createElement('h2');
    title.textContent = `IP: ${ip}`;
    card.appendChild(title);

    const sessionsContainer = document.createElement('div');
    sessionsContainer.className = 'sessions';
    data.sessions.forEach((session, index) => {
        const sessionElement = document.createElement('div');
        sessionElement.className = 'session';
        const duration = (new Date(session.endTime) - new Date(session.startTime)) / 1000;
        sessionElement.textContent = `Session ${index + 1}: ${duration.toFixed(2)} seconds`;
        sessionsContainer.appendChild(sessionElement);
    });
    card.appendChild(sessionsContainer);

    const lastSevenDays = document.createElement('div');
    lastSevenDays.className = 'last-seven-days';
    Object.entries(data.last_seven_days).forEach(([date, active]) => {
        const dayCard = document.createElement('div');
        dayCard.className = `day-card ${active ? 'active' : ''}`;
        const [year, month, day] = date.split('-');
        dayCard.textContent = `${month}/${day}`;
        lastSevenDays.appendChild(dayCard);
    });
    card.appendChild(lastSevenDays);

    return card;
}

async function init() {
    const data = await fetchData();
    const cardsContainer = document.getElementById('cards-container');

    for (const [ip, ipData] of Object.entries(data)) {
        const card = createCard(ip, ipData);
        cardsContainer.appendChild(card);
    }
}

init();

