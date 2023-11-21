// EXTENSIONS (for day.js) //
dayjs.extend(window.dayjs_plugin_calendar);
dayjs.extend(window.dayjs_plugin_advancedFormat);


// ============================== //

// ** STORE YOUR API KEY ** //

/* 
As instructed in our class, the API keys should not be stored, and a .gitignore file should be
used to exclude our api.js file from the commits.

A valid (free) API key from 'https://openweathermap.org' needs to be inserted in "weatherApiKey" 
variable for the program to run correctly.

Both of the below actions should work:
1) Clone this repository and:
-   Create a ./assets/js/api.js JavaScript file (that is already connected to the index.html) 
    and include a const OPEN_WEATHER_MAP_API that stores your key.
-   Change the code snipped below and assign your key string to "weatherApiKey"

2) In the deployed web page (https://jimmygian.github.io/weather-dashboard), 
   paste your API code when prompted. Note that you will be asked every time the page refreshes. 
   Everything else should work as expected.

*/

let weatherApiKey = typeof OPEN_WEATHER_MAP_API !== 'undefined' ? OPEN_WEATHER_MAP_API : '';

// ============================== //


// GLOBAL CONSTS
const HISTORY_BTN_COUNT = 5;                // Change if you want more history buttons displayed
const UNITS = 'metric';                     // Change if you want another unit (e.g. fahrenheit)
const SEARCH_LIMIT = 1;
const CURRENT_DATE = dayjs();
const WEATHER_ICONS = {
    Thunderstorm: '11d',
    Drizzle: '09d',
    Rain: '09d',
    Snow: '13d',
    Clear: '01d',
    Clouds: '03d',
};


// GLOBAL ELEMENT SELECTORS
const searchForm = document.querySelector('#search-form');
const searchInput = document.querySelector('#search-input');
const forecastDiv = document.querySelector('.forecast-div-parent');
const historyDiv = document.querySelector('#history-div');
const weatherSection = document.querySelector('.weather-info-section');

// ============================== //


// LOCAL STORAGE 
const recentSearches = JSON.parse((localStorage.getItem('recentSearches'))) || [];
let cities = recentSearches;

// Updates History Buttons based on stored cities
for (city of recentSearches) {
    createSearchHistoryBtn(city);
}

// ============================== //


// EVENT LISTENERS

searchForm.addEventListener('submit', function (event) {

    // Prevents Default
    event.preventDefault();

    // Prompt for API
    promptForAPI();

    // Stores user selection if value not an empty string
    let city = searchInput.value.trim();
    if (city === '') {
        return;
    }

    // Displays Weather Data (Current Weather and 5-Day Forecast)
    displayWeatherData(city)
})


historyDiv.addEventListener('click', (event) => {
    // Checks which button was clicked
    const target = event.target;

    // Prompt for API
    promptForAPI();

    if (target.tagName === 'BUTTON') {
        displayWeatherData(target.innerText);
        weatherSection.classList.remove('d-none');
    }
})

// ============================== //


// MAIN FUNCTION (Gets called when user asks for another city to be displayed) //

function displayWeatherData(city) {
    // Clears user input after storing value
    searchInput.setAttribute('placeholder', "City name..");
    searchInput.value = '';

    /* EXPLANATION OF THE FOLLOWING FUNCTIONS (In call order):

    getLatLon(city): Given a string of a city name, it returns co-ordinates in an array [lat, lon]
    getForecast(latLon): Given an array then holds lat/lon, it returns an arr of 5 objects, each of them representing 1/5 day of the 5-day forecast
    createForecastCard(item): Given an object of required data, it creates a forecast card and appends it to the forecast parent Div
    updateLocalStorage(city): It updates the local storage, if city is not already included in the "cities" array
    cityBtnExists(city): Checks if a history-button with the specified 'city' value exists, returns a bool
    createSearchHistoryBtn(city): Creates a history-button, if it doesn't already exist
    updateCurrentWeather(latLon, city): Given a latLon arr and a city name, it creates a main card and updates its values
    
    The way the following works is that getLanLon(city), getForecast(city), and updateCurrentWeather(latLon, city)
    return the result of the whole fetch() function. Since fetch() returns a promise, these functions
    also return a Promise. This is why they can be chained together below.
    */


    // Get latitude and longitude once
    const latLonPromise = getLatLon(city);

    // Call other functions using the latLonPromise
    latLonPromise
        .then(latLon => Promise.all([getForecast(latLon), updateCurrentWeather(latLon)]))
        .then(([forecastData, cityName]) => {

            // Clear forecastDiv
            while (forecastDiv.firstChild) {
                forecastDiv.removeChild(forecastDiv.firstChild);
            }

            // Create Forecast Card for each data item
            for (const item of forecastData) {
                createForecastCard(item);
            }

            // Update Local Storage with new city name
            updateLocalStorage(cityName);

            // If City is not stored in local storage, create History Button
            if (!cityBtnExists(cityName)) {
                createSearchHistoryBtn(cityName);
            }
            weatherSection.classList.remove('d-none');
        })
        .catch(error => {
            // console.error(error);
            searchInput.value = '';
            alert("Wrong City Name or API key. Please try again.")

            // Reloads the current page (so that user can be prompted again for an API key)
            location.reload();
        });
}


// ============================== //


// fetch() FUNCTIONS //

// Gets Current Weather
function updateCurrentWeather(latLon) {
    // INITIAL CONSTS
    const mainCard = document.querySelector('.main-card');
    const queryURL = `https://api.openweathermap.org/data/2.5/weather?lat=${latLon[0]}&lon=${latLon[1]}&units=${UNITS}&appid=${weatherApiKey}`;

    return fetch(queryURL)
        .then(response => { return response.json() })
        .then(data => {
            mainCard.innerText = '';

            const weatherDataDiv = document.createElement('div');
            weatherDataDiv.classList.add('weather-data-container');

            const h2El = document.createElement('h2');
            h2El.classList.add('card-title', 'pb-3', 'city');

            const dateSpan = document.createElement('span');
            dateSpan.classList.add('date', 'date-current');
            dateSpan.innerText = dayjs().format('DD/MM/YYYY');

            const iconImg = document.createElement('img');
            iconImg.classList.add('weather-icon');
            iconImg.setAttribute('src', `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`);
            iconImg.setAttribute('width', '60');
            iconImg.setAttribute('style', 'display: inline');

            const tempP = createWeatherDataItem('Temp', data.main.temp, '°C');
            const windP = createWeatherDataItem('Wind', data.main.temp, 'KPH');
            const humiP = createWeatherDataItem('Humidity', data.main.temp, '%');
            let cityName = `${latLon[2]}, ${latLon[3]} `;
            h2El.append(cityName, dateSpan, iconImg);
            weatherDataDiv.append(tempP, windP, humiP);
            mainCard.append(h2El, weatherDataDiv);

            return latLon[2];
        })
        .catch(error => { console.error(error) })
}


// Gets Latitude and Longitude of city, returns a promise arr [lat, lon, city-name, state]
function getLatLon(city) {

    // Constructs API URL
    let locationURL = `https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=${SEARCH_LIMIT}&appid=${weatherApiKey}`;

    // Returns a Promise (using fetch)
    return fetch(locationURL)
        .then(function (response) {

            if (response.ok) {
                return response.json();
            } else {
                // Throw error to stop the process and go to .catch
                throw new Error("Lat Lon Response Unsuccesful");
            }
        })
        .then(function (data) {
            return [data[0]['lat'], data[0]['lon'], data[0]['name'], data[0]['state']];
        })
}


// Gets 5-day forecast
function getForecast(latLon) {

    const queryURL = `https://api.openweathermap.org/data/2.5/forecast?lat=${latLon[0]}&lon=${latLon[1]}&units=${UNITS}&appid=${weatherApiKey}`;

    return fetch(queryURL)
        .then(function (response) {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error("ERROR fetching 5-day Forecast");
            }
        })
        .then(data => processForecastData(data))
}


// ============================== //

// OTHER FUNCTIONS

function processForecastData(data) {

    // Initializes savedData array and Index
    let savedData = [];
    let savedDataIndex = 0;

    // Initializes variables that will calculate the averages
    let tempTotal = 0, humTotal = 0, windTotal = 0, hourCount = 0;
    let weather = {};

    // This string gets updated each time "parsedDate" shows a new day
    let savedDay = '';

    /*
    This API returns an array of objects. Each element of the array hold weather data 
    from the day the request was called and every 3 hours, until it reaches 5-days.
    E.g. if the request happened 2023-11-20 17:23:14, we will get back 39 elements:
    data[0] === Weather data for 2023-11-20 18:00:00
    data[1] === Weather data for 2023-11-20 21:00:00
    data[2] === Weather data for 2023-11-21 00:00:00
    data[2] === Weather data for 2023-11-21 03:00:00
    data[2] === Weather data for 2023-11-21 06:00:00 etc..
    */

    // Loops through each weatherData of the data.list
    for (const weatherData of data.list) {
        // Parses the weatherData's date and time
        const parsedDate = dayjs(weatherData.dt_txt, { format: "YYYY-MM-DD HH:mm:ss" });

        // Ensures that we are getting the data starting in the next day and not the current one
        if (CURRENT_DATE.day() !== parsedDate.day()) {

            // Updates the value of savedDay 
            if (savedDay === '') {
                savedDay = parsedDate.format('dddd');
                handleNewDay(parsedDate);
            }

            // If the day of the weatherData is still the same, it keeps adding to the sum
            if (savedDay === parsedDate.format('dddd')) {
                tempTotal += weatherData.main.temp;
                humTotal += weatherData.main.humidity;
                windTotal += weatherData.wind.speed;
                hourCount++;

                // Check if the key exists 
                if (weather.hasOwnProperty(weatherData.weather[0].main)) {
                    // Key exists, increment its value
                    weather[weatherData.weather[0].main] += 1;
                } else {
                    // Key doesn't exist, initialize it with a value of 1
                    weather[weatherData.weather[0].main] = 1;
                }

            } else {
                // Update savedData array with new object element
                updatesSavedData();

                // Then, restore all values to starting point, so you can repeat process for the next day
                tempTotal = 0;
                humTotal = 0;
                windTotal = 0;
                hourCount = 0;
                weather = {};

                // Update the savedDay and increment savedDataIndex
                savedDay = parsedDate.format('dddd');
                savedDataIndex++;

                // Push a new object element to the array
                handleNewDay(parsedDate);

            }
        }
    }
    updatesSavedData();
    return savedData;



    // NESTED FUNCTIONS //

    // 1: Pushes a new object instance to savedData array
    function handleNewDay(parsedDate) {
        savedData.push(
            {
                day: parsedDate.format('dddd'),
                date: parsedDate.format('DD/MM/YYYY')
            }
        );
    }

    // 2: Calculates Averages
    function calculateAverage(total, div) {
        return Number((total / div).toFixed(2));
    }

    // 3: Updates savedData array
    function updatesSavedData() {
        savedData[savedDataIndex]['avgTemp'] = calculateAverage(tempTotal, hourCount);
        savedData[savedDataIndex]['avgHum'] = Math.round(calculateAverage(humTotal, hourCount));
        savedData[savedDataIndex]['avgWind'] = calculateAverage(windTotal, hourCount);
        savedData[savedDataIndex]['icon'] = calculateIcon(weather);
    }


    // 4. Calculates which icon to use
    function calculateIcon(weather) {
        let maxKey = null;
        let maxValue = -Infinity;

        // Iterate through the object
        for (let key in weather) {
            if (weather.hasOwnProperty(key)) {
                // Check if the current value is greater than the maximum value
                if (weather[key] > maxValue) {
                    maxValue = weather[key];
                    maxKey = key;
                }
            }
        }
        return WEATHER_ICONS[maxKey];
    }
}

function promptForAPI() {
    if (weatherApiKey === '' || weatherApiKey === null) {
        const userInput = prompt("To use this weather app, please enter an API KEY from https://openweathermap.org/");

        // Check if the user clicked "Cancel" or entered an empty string
        if (userInput === null || userInput.trim() === '') {
            // Handle the case where the user canceled the prompt or entered an empty string
            console.log("User canceled the prompt or entered an empty API key.");
        } else {
            // User entered a valid API key
            weatherApiKey = userInput.trim();
            console.log("API Key entered:", weatherApiKey);
        }
    }
}

// ============================== //


// CREATING ELEMENTS //

// 1. Forecast Card
function createForecastCard(forecast) {

    const forecastDiv = document.querySelector(".forecast-div-parent");

    const childDiv = document.createElement('div');
    childDiv.classList.add('col-12', 'col-md', 'm-md-2', 'card', 'weather-data-container', 'weather-data-secondary');

    const dateH5 = document.createElement('h5');
    dateH5.classList.add('date', 'p-2');
    dateH5.innerText = forecast.date;

    const iconImg = document.createElement('img');
    iconImg.classList.add('weather-icon');
    iconImg.setAttribute('src', `https://openweathermap.org/img/wn/${forecast.icon}@2x.png`);
    iconImg.setAttribute('width', '40');

    const tempP = createWeatherDataItem('Temp', forecast.avgTemp, '°C');
    const windP = createWeatherDataItem('Wind', forecast.avgWind, 'KPH');
    const humP = createWeatherDataItem('Humidity', forecast.avgHum, '%');

    childDiv.append(dateH5, iconImg, tempP, windP, humP);
    forecastDiv.append(childDiv);


}

// Helper function to create weather data item with <span> elements
function createWeatherDataItem(label, value, unit) {
    const itemP = document.createElement('p');
    itemP.classList.add('card-text', 'weather-data-item', label.toLowerCase());

    const labelSpan = document.createElement('span');
    labelSpan.classList.add('label-name');
    labelSpan.innerText = `${label}: `;

    const valueSpan = document.createElement('span');
    valueSpan.classList.add(`${label.toLowerCase()}-data`);
    valueSpan.innerText = value;

    const unitSpan = document.createElement('span');
    unitSpan.innerText = ` ${unit}`;

    itemP.append(labelSpan, valueSpan, unitSpan);
    return itemP;
}


function createSearchHistoryBtn(city) {
    // Create Button and set its attributes
    const newBtn = document.createElement('button');
    newBtn.classList.add('btn', 'btn-secondary', 'btn-history', 'search-button', 'w-100', 'mt-3', 'py-1');
    newBtn.setAttribute('type', 'submit');
    newBtn.setAttribute('aria-label', 'submit old search');
    newBtn.innerText = city;
    historyDiv.append(newBtn)

    // Remove a child if child count is more than 5
    if (historyDiv.childElementCount >= HISTORY_BTN_COUNT) {
        removeFromArray(cities, historyDiv.firstChild.innerText);
        historyDiv.removeChild(historyDiv.firstChild);
    }
}


function cityBtnExists(city) {
    // Check if the parent div includes a child button with the text of at least 1 of the array elements
    var cityBtnExists = Array.from(historyDiv.children).some(function (child) {
        return child.classList.contains('btn-history') && child.textContent.trim() === city;
    });

    if (cityBtnExists) {
        return true;
    }
    return false;
}


function updateLocalStorage(city) {
    if (!cityBtnExists(city)) {
        cities.push(city);
        localStorage.setItem('recentSearches', JSON.stringify(cities));
    }
}

function removeFromArray(array, elementToRemove) {
    // Returns index number of specified element, or -1 if index was not found
    var index = array.indexOf(elementToRemove);

    //  If element was actually found in array
    if (index !== -1) {
        array.splice(index, 1);
    }
}



