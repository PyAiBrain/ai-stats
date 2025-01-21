document.addEventListener("DOMContentLoaded", () => {
  fetchData()
  setupSearchListener()
})

async function fetchData() {
  try {
    const response = await fetch("./stats.json")
    const data = await response.json()

    const userCardsContainer = document.getElementById("user-cards")
    userCardsContainer.innerHTML = "" // Clear existing cards

    for (const [ip, userData] of Object.entries(data)) {
      const userCard = createUserCard(ip, userData)
      userCardsContainer.appendChild(userCard)
    }
  } catch (error) {
    console.error("Error fetching data:", error)
  }
}

function setupSearchListener() {
  const searchInput = document.getElementById("search-input")
  const searchButton = document.getElementById("search-button")

  const performSearch = () => {
    const searchTerm = searchInput.value.toLowerCase()
    const userCards = document.querySelectorAll(".user-card")

    userCards.forEach((card) => {
      const nickname = card.querySelector("h2").textContent.toLowerCase()
      const ip = card.querySelector(".ip-address").textContent.toLowerCase()

      if (nickname.includes(searchTerm) || ip.includes(searchTerm)) {
        card.style.display = "block"
      } else {
        card.style.display = "none"
      }
    })
  }

  searchInput.addEventListener("input", performSearch)
  searchButton.addEventListener("click", performSearch)
}

function createUserCard(ip, userData) {
  const card = document.createElement("div")
  card.className = "user-card"
  if (userData.favorite) {
    card.classList.add("favorite")
  }

  const userInfo = `
        <h2>${userData.nickname} 
            <span class="ip-address" title="Click to copy">
                [${ip}]
                <i class="fas fa-copy copy-icon" data-ip="${ip}"></i>
            </span>
            ${userData.favorite ? '<i class="fas fa-star favorite-icon"></i>' : ""}
        </h2>
        <p>Total Sessions: ${userData.sessions.length}</p>
        <p>Total Duration: ${formatDuration(calculateTotalDuration(userData.sessions))}</p>
    `

  const chartContainer = document.createElement("div")
  chartContainer.className = "chart-container"
  chartContainer.innerHTML = "<h3>Session Duration Chart</h3>"
  const chart = document.createElement("div")
  chart.className = "chart"
  chartContainer.appendChild(chart)

  const heatmapContainer = document.createElement("div")
  heatmapContainer.className = "heatmap"
  heatmapContainer.innerHTML = "<h3>Last 7 Days Activity</h3>"
  const heatmapGrid = document.createElement("div")
  heatmapGrid.className = "heatmap-grid"
  heatmapContainer.appendChild(heatmapGrid)

  const utilityButtons = `
        <div class="utility-buttons">
            <button class="utility-button" onclick="showSessionDetails('${ip}')">Show Session Details</button>
            <button class="utility-button" onclick="exportUserData('${ip}')">Export User Data</button>
        </div>
    `

  const sessionDetails = `
        <div id="session-details-${ip}" class="session-details">
            <h4>Session Details</h4>
            ${userData.sessions
              .map(
                (session, index) => `
                <p>Session ${index + 1}:</p>
                <p>Start: ${new Date(session.startTime).toLocaleString()}</p>
                <p>End: ${new Date(session.endTime).toLocaleString()}</p>
                <p>Duration: ${formatDuration(session.duration)}</p>
            `,
              )
              .join("")}
        </div>
    `

  card.innerHTML = userInfo + utilityButtons + sessionDetails
  card.appendChild(chartContainer)
  card.appendChild(heatmapContainer)

  createChart(chart, userData.sessions)
  createHeatmap(heatmapGrid, userData.last_seven_days)

  // Add event listener for copying IP address
  card.querySelector(".copy-icon").addEventListener("click", function (e) {
    e.stopPropagation()
    const ip = this.getAttribute("data-ip")
    navigator.clipboard.writeText(ip).then(() => {
      showTooltip(this, "Copied!")
    })
  })

  return card
}

function calculateTotalDuration(sessions) {
  return sessions.reduce((sum, session) => sum + session.duration, 0)
}

function formatDuration(seconds) {
  const units = [
    { name: "year", seconds: 31536000 },
    { name: "month", seconds: 2592000 },
    { name: "day", seconds: 86400 },
    { name: "hour", seconds: 3600 },
    { name: "minute", seconds: 60 },
    { name: "second", seconds: 1 },
  ]

  let remainingSeconds = seconds
  const parts = []

  for (const unit of units) {
    const unitCount = Math.floor(remainingSeconds / unit.seconds)
    if (unitCount > 0) {
      parts.push(`${unitCount} ${unit.name}${unitCount > 1 ? "s" : ""}`)
      remainingSeconds %= unit.seconds
    }
  }

  return parts.join(", ") || "0 seconds"
}

function createChart(chartElement, sessions) {
  const maxDuration = Math.max(...sessions.map((session) => session.duration))

  sessions.forEach((session, index) => {
    const bar = document.createElement("div")
    bar.className = "bar"
    const height = (session.duration / maxDuration) * 100
    bar.style.height = `${height}%`
    bar.setAttribute("data-duration", formatDuration(session.duration))
    chartElement.appendChild(bar)
  })
}

function createHeatmap(heatmapElement, lastSevenDays) {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

  days.forEach((day) => {
    const cell = document.createElement("div")
    cell.className = "heatmap-cell"
    cell.textContent = day.charAt(0)
    if (lastSevenDays[day]) {
      cell.classList.add("active")
    }
    cell.title = `${day}: ${lastSevenDays[day] ? "Active" : "Inactive"}`
    heatmapElement.appendChild(cell)
  })
}

function showTooltip(element, message) {
  const tooltip = document.createElement("span")
  tooltip.className = "tooltiptext"
  tooltip.textContent = message
  element.classList.add("tooltip")
  element.appendChild(tooltip)
  setTimeout(() => {
    tooltip.remove()
    element.classList.remove("tooltip")
  }, 2000)
}

function showSessionDetails(ip) {
  const sessionDetails = document.getElementById(`session-details-${ip}`)
  sessionDetails.classList.toggle("show")
}

function exportUserData(ip) {
  fetch("./stats.json")
    .then((response) => response.json())
    .then((data) => {
      const userData = data[ip]
      const blob = new Blob([JSON.stringify(userData, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${userData.nickname}_data.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    })
    .catch((error) => console.error("Error exporting user data:", error))
}

