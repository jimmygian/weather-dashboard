// EXTENSIONS (for day.js) //
dayjs.extend(window.dayjs_plugin_calendar);
dayjs.extend(window.dayjs_plugin_advancedFormat);


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
const apiUrl = '/weather';

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
for (const city of cities) {
    createSearchHistoryBtn(city);
}

// ============================== //


// EVENT LISTENERS


// Event listener for the form submission
searchForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const city = searchInput.value.trim();
    try {
        const data = await getCityWeatherData(city);
        displayWeatherData(data);
        createMainWeatherCard(data);
        weatherSection.classList.remove('d-none');
    } catch (err) {
        console.error(err)
    }
});


historyDiv.addEventListener('click', async (event) => {
    // Checks which button was clicked
    const target = event.target;

    if (target.tagName === 'BUTTON') {
        try {
            const data = await getCityWeatherData(target.innerText);
            displayWeatherData(data);
            createMainWeatherCard(data);
            weatherSection.classList.remove('d-none');
        } catch (err) {
            console.error(err)
        }
    }
})

// ============================== //


// MAIN FUNCTION (Gets called when user asks for another city to be displayed) //


async function getCityWeatherData(city) {
    try {
        const response = await fetch(`${apiUrl}?city=${city}`);
        const data = await response.json();
        return data;
    } catch(err) {
        console.error("Could not retrieve DATA from server.")
    }
}


function displayWeatherData(data) {
    // Clears user input after storing value
    searchInput.setAttribute('placeholder', "City name..");
    searchInput.value = '';

    const cityName = data.cityData[0].name;
    // Handle the response data
    console.log(data); // Process the weather data received from the server


    // Clear forecastDiv
    while (forecastDiv.firstChild) {
        forecastDiv.removeChild(forecastDiv.firstChild);
    }

    // Create Forecast Card for each data item
    for (const item of data.forecastData) {
        // console.log(item);
        createForecastCard(item)
    }
    // Update Local Storage with new city name
    updateLocalStorage(cityName);

    // If City is not stored in local storage, create History Button
    if (!cityBtnExists(cityName)) {
        createSearchHistoryBtn(cityName);
    }
    weatherSection.classList.remove('d-none');
    console.log("FINISHED SUCCESSFULLY!!")
}


// ============================== //


// Gets Current Weather
function createMainWeatherCard(data) {
    // INITIAL CONSTS
    const mainCard = document.querySelector('.main-card');
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
    iconImg.setAttribute('src', `https://openweathermap.org/img/wn/${data.todaysData.weather[0].icon}@2x.png`);
    iconImg.setAttribute('width', '60');
    iconImg.setAttribute('style', 'display: inline');

    const tempP = createWeatherDataItem('Temp', [data.todaysData.main.temp], '°C');
    const windP = createWeatherDataItem('Wind', [data.todaysData.wind.speed], 'KPH');
    const humiP = createWeatherDataItem('Humidity', [data.todaysData.main.humidity], '%');

    let cityName = data.cityData[0].name;
    let stateName = data.cityData[0].state;
    let displayName = `${cityName}, ${stateName}  `

    h2El.append(displayName, dateSpan, iconImg);
    weatherDataDiv.append(tempP, windP, humiP);
    mainCard.append(h2El, weatherDataDiv);
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

    const tempP = createWeatherDataItem('Temp', [forecast.minMax.temp.min, forecast.minMax.temp.max], '°C');
    const windP = createWeatherDataItem('Wind', [forecast.minMax.wind.min, forecast.minMax.wind.max], 'KPH');
    const humP = createWeatherDataItem('Humidity', [forecast.minMax.humidity.min, forecast.minMax.humidity.max], '%');

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
    if (value.length > 1) {
        valueSpan.innerText = `${value[0]} to ${value[1]}`;
    } else {
        valueSpan.innerText = `${value[0]}`;
    }

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



