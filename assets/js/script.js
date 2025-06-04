function initPage() {
    const cityEl = document.getElementById("enter-city");
    const searchEl = document.getElementById("search-button");
    const clearEl = document.getElementById("clear-history");
    const nameEl = document.getElementById("city-name");
    const currentPicEl = document.getElementById("current-pic");
    const currentTempEl = document.getElementById("temperature");
    const currentHumidityEl = document.getElementById("humidity");
    const currentWindEl = document.getElementById("wind-speed");
    const currentUVEl = document.getElementById("UV-index");
    const historyEl = document.getElementById("history");
    var fivedayEl = document.getElementById("fiveday-header");
    var todayweatherEl = document.getElementById("today-weather");
    let searchHistory = JSON.parse(localStorage.getItem("search")) || [];

    // Assigning a unique API to a variable
    const APIKey = "84b79da5e5d7c92085660485702f4ce8";

    function showToast(message, color="#3498db") {
      const toast = document.getElementById("toast");
      toast.textContent = message;
      toast.style.background = color;
      toast.style.display = "block";
      setTimeout(() => { toast.style.display = "none"; }, 2000);
    }

    function getWeather(cityName) {
        let queryURL = "https://api.openweathermap.org/data/2.5/weather?q=" + cityName + "&appid=" + APIKey;
        axios.get(queryURL)
            .then(function (response) {
                todayweatherEl.classList.remove("d-none");
                const currentDate = new Date(response.data.dt * 1000);
                const day = currentDate.getDate();
                const month = currentDate.getMonth() + 1;
                const year = currentDate.getFullYear();
                nameEl.innerHTML = response.data.name + " (" + month + "/" + day + "/" + year + ") ";
                let weatherPic = response.data.weather[0].icon;
                currentPicEl.setAttribute("src", "https://openweathermap.org/img/wn/" + weatherPic + "@2x.png");
                currentPicEl.setAttribute("alt", response.data.weather[0].description);
                currentTempEl.innerHTML = "Temperature: " + k2f(response.data.main.temp) + " &#176F";
                currentHumidityEl.innerHTML = "Humidity: " + response.data.main.humidity + "%";
                currentWindEl.innerHTML = "Wind Speed: " + response.data.wind.speed + " MPH";
                
                // Get UV Index
                let lat = response.data.coord.lat;
                let lon = response.data.coord.lon;
                let UVQueryURL = "https://api.openweathermap.org/data/2.5/uvi/forecast?lat=" + lat + "&lon=" + lon + "&appid=" + APIKey + "&cnt=1";
                axios.get(UVQueryURL)
                    .then(function (response) {
                        let UVIndex = document.createElement("span");
                        if (response.data[0].value < 4 ) {
                            UVIndex.setAttribute("class", "badge badge-success");
                        }
                        else if (response.data[0].value < 8) {
                            UVIndex.setAttribute("class", "badge badge-warning");
                        }
                        else {
                            UVIndex.setAttribute("class", "badge badge-danger");
                        }
                        UVIndex.innerHTML = response.data[0].value;
                        currentUVEl.innerHTML = "UV Index: ";
                        currentUVEl.append(UVIndex);
                    });
                
                // Get 5 day forecast for this city
                let cityID = response.data.id;
                let forecastQueryURL = "https://api.openweathermap.org/data/2.5/forecast?id=" + cityID + "&appid=" + APIKey;
                axios.get(forecastQueryURL)
                    .then(function (response) {
                        fivedayEl.classList.remove("d-none");
                        const forecastEls = document.querySelectorAll(".forecast");
                        for (i = 0; i < forecastEls.length; i++) {
                            forecastEls[i].innerHTML = "";
                            const forecastIndex = i * 8 + 4;
                            const forecastDate = new Date(response.data.list[forecastIndex].dt * 1000);
                            const forecastDay = forecastDate.getDate();
                            const forecastMonth = forecastDate.getMonth() + 1;
                            const forecastYear = forecastDate.getFullYear();
                            const forecastDateEl = document.createElement("p");
                            forecastDateEl.setAttribute("class", "mt-3 mb-0 forecast-date");
                            forecastDateEl.innerHTML = forecastMonth + "/" + forecastDay + "/" + forecastYear;
                            forecastEls[i].append(forecastDateEl);

                            // Icon for current weather
                            const forecastWeatherEl = document.createElement("img");
                            forecastWeatherEl.setAttribute("src", "https://openweathermap.org/img/wn/" + response.data.list[forecastIndex].weather[0].icon + "@2x.png");
                            forecastWeatherEl.setAttribute("alt", response.data.list[forecastIndex].weather[0].description);
                            forecastEls[i].append(forecastWeatherEl);
                            const forecastTempEl = document.createElement("p");
                            forecastTempEl.innerHTML = "Temp: " + k2f(response.data.list[forecastIndex].main.temp) + " &#176F";
                            forecastEls[i].append(forecastTempEl);
                            const forecastHumidityEl = document.createElement("p");
                            forecastHumidityEl.innerHTML = "Humidity: " + response.data.list[forecastIndex].main.humidity + "%";
                            forecastEls[i].append(forecastHumidityEl);
                        }
                    })
            })
            .catch(function () {
                showToast("City not found. Please try again.", "#e74c3c");
            });
    }

    searchEl.addEventListener("click", function () {
        const searchTerm = cityEl.value.trim();
        if (!searchTerm) {
          showToast("Please enter a city name.", "#f1c40f");
          return;
        }
        getWeather(searchTerm);
        if (!searchHistory.includes(searchTerm)) {
          searchHistory.push(searchTerm);
          localStorage.setItem("search", JSON.stringify(searchHistory));
          renderSearchHistory();
        }
    });

    clearEl.addEventListener("click", function () {
        localStorage.removeItem("search");
        searchHistory = [];
        renderSearchHistory();
        showToast("Search history cleared.", "#e74c3c");
    });

    function k2f(K) {
        return Math.floor((K - 273.15) * 1.8 + 32);
    }

    function renderSearchHistory() {
        historyEl.innerHTML = "";
        for (let i = 0; i < searchHistory.length; i++) {
            const historyItem = document.createElement("input");
            historyItem.setAttribute("type", "text");
            historyItem.setAttribute("readonly", true);
            historyItem.setAttribute("class", "form-control d-block bg-white mb-1");
            historyItem.setAttribute("value", searchHistory[i]);
            historyItem.addEventListener("click", function () {
                getWeather(historyItem.value);
            });
            historyEl.append(historyItem);
        }
    }

    // Favorite cities logic
    let favoriteCities = JSON.parse(localStorage.getItem("favoriteCities")) || [];

    function renderFavoriteCities() {
      const favList = document.getElementById("favorite-cities");
      favList.innerHTML = "";
      favoriteCities.forEach((city, idx) => {
        const li = document.createElement("li");
        li.className = "list-group-item bg-light text-dark d-flex justify-content-between align-items-center";
        li.style.cursor = "pointer";

        // City name span
        const citySpan = document.createElement("span");
        citySpan.textContent = city;
        citySpan.onclick = () => {
          cityEl.value = city;
          searchEl.click();
        };

        // Remove button
        const removeBtn = document.createElement("button");
        removeBtn.className = "btn btn-sm btn-danger ml-2";
        removeBtn.innerHTML = '<i class="fas fa-times"></i>';
        removeBtn.onclick = (e) => {
          e.stopPropagation();
          favoriteCities.splice(idx, 1);
          localStorage.setItem("favoriteCities", JSON.stringify(favoriteCities));
          renderFavoriteCities();
          showToast("Removed from favorites.", "#e74c3c");
        };

        li.appendChild(citySpan);
        li.appendChild(removeBtn);
        favList.appendChild(li);
      });
    }

    document.getElementById("add-favorite").addEventListener("click", function () {
      const city = cityEl.value.trim();
      if (city && !favoriteCities.includes(city)) {
        favoriteCities.push(city);
        localStorage.setItem("favoriteCities", JSON.stringify(favoriteCities));
        renderFavoriteCities();
        showToast("Added to favorites!", "#27ae60");
      } else if (favoriteCities.includes(city)) {
        showToast("City already in favorites.", "#f1c40f");
      } else {
        showToast("Enter a city to add.", "#f1c40f");
      }
    });

    // Theme toggle
    const themeToggle = document.getElementById("theme-toggle");
    themeToggle.addEventListener("click", () => {
      document.body.classList.toggle("dark-theme");
      themeToggle.textContent = document.body.classList.contains("dark-theme") ? "☀️" : "🌙";
      themeToggle.style.transform = "scale(1.2)";
      setTimeout(() => themeToggle.style.transform = "scale(1)", 200);
    });

    // Render favorites and history on page load
    renderFavoriteCities();
    renderSearchHistory();
    if (searchHistory.length > 0) {
        getWeather(searchHistory[searchHistory.length - 1]);
    }
}

// Add this function to your script.js
function confettiBurst() {
  const colors = ["#f1c40f", "#3498db", "#e74c3c", "#2ecc71", "#9b59b6"];
  for (let i = 0; i < 30; i++) {
    const conf = document.createElement("div");
    conf.style.position = "fixed";
    conf.style.left = (50 + Math.random() * 30) + "%";
    conf.style.top = (60 + Math.random() * 10) + "%";
    conf.style.width = conf.style.height = (6 + Math.random() * 6) + "px";
    conf.style.background = colors[Math.floor(Math.random() * colors.length)];
    conf.style.borderRadius = "50%";
    conf.style.opacity = 0.8;
    conf.style.zIndex = 9999;
    conf.style.transition = "all 1.2s cubic-bezier(.17,.67,.83,.67)";
    document.body.appendChild(conf);
    setTimeout(() => {
      conf.style.transform = `translateY(-${80 + Math.random() * 60}px) scale(0.7)`;
      conf.style.opacity = 0;
    }, 10);
    setTimeout(() => conf.remove(), 1300);
  }
}

initPage();