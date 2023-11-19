// EXTENSIONS (for day.js) //
dayjs.extend(window.dayjs_plugin_calendar);
dayjs.extend(window.dayjs_plugin_advancedFormat);


// GLOBAL CONSTS
const weatherApiKey = OPEN_WEATHER_MAP_API;
const LIMIT = 1;
const UNITS = 'metric';
const CURRENT_DATE = dayjs();
const dateFormated = `${CURRENT_DATE.format('YYMMDD')}`

const WEATHER_ICONS = {
    Thunderstorm: '11d', 
    Drizzle: '09d', 
    Rain: '09d', 
    Snow: '13d', 
    Clear: '01d', 
    Clouds: '03d',
};

// ELEMENT SELECTORS
const searchForm = document.querySelector('#search-form');
const searchInput = document.querySelector('#search-input');
const searchSubmit = document.querySelector('#search-button');
const forecastDiv = document.querySelector(".forecast-div-parent");
const historyDiv = document.querySelector("#history");



// EVENT LISTENERS
searchForm.addEventListener('submit', function (event) {
    
    event.preventDefault();

    // Stores user selection
    let city = searchInput.value.trim();
    if (city === '') {
        return;
    }
    // Clears user input after storing value
    searchInput.value = '';

    // Clears forecastDiv
    while (forecastDiv.firstChild) {
        forecastDiv.removeChild(forecastDiv.firstChild);
    }

    // CREATES BUTTONS

    /*
          <button class="btn btn-secondary search-button w-100 mt-3 py-1" type="submit" id="search-button"
            aria-label="submit search">
            Paris
          </button>

    */
   const newBtn = document.createElement('button');
   newBtn.classList.add('btn', 'btn-secondary', 'search-button', 'w-100', 'mt-3', 'py-1');
   newBtn.setAttribute('type', 'submit');
   newBtn.setAttribute('aria-label', 'submit old search');
   newBtn.innerText = city;
   historyDiv.append(newBtn)

   if (historyDiv.childElementCount > 5) {
    historyDiv.removeChild(historyDiv.firstChild);
   }

    // CREATES 5-DAY FORECAST CARDS
    getLatLon(city)
        .then(latLon => getForecast(latLon))
        .then(data => {
            console.log(data);

            for (item of data) {
                createForecastCard(item)
            }
        })

    // CREATES MAIN CARD
})

// Gets Latitude and Longitude of city
function getLatLon(city) {

    // Call API
    let locationURL = `http://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=${LIMIT}&appid=${weatherApiKey}`;


    // Return a promise using fetch
    return fetch(locationURL)
        .then(function (response) {
            if (response.ok) {
                return response.json();
            } else {
                // Throw error to stop the process and go to .catch
                throw new Error("Response Unsuccesful");
            }
        })
        .then(function (data) {
            console.log(data[0]['lat']);
            console.log(data[0]['lon']);
            return [data[0]['lat'], data[0]['lon']];
        })
        .catch(function (error) {
            console.error(error);
            return [];
        });
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
        .catch(function (error) {
            console.error(error);
            return "I returned this error cause I couldnt fetch 5-day!";
        });
}


function processForecastData(data) {
    console.log(data)
    // MAIN FUNCTION //

    // Initializes savedData array and Index
    let savedData = [];
    let savedDataIndex = 0;

    // Initializes variables that will calculate the averages
    let tempTotal = 0, humTotal = 0, windTotal = 0, hourCount = 0;
    let savedDay = '';
    let weather = {};

    // Loops through each item of the data.list
    for (const item of data.list) {
        const parsedDate = dayjs(item.dt_txt, { format: "YYYY-MM-DD HH:mm:ss" });

        if (CURRENT_DATE.day() !== parsedDate.day()) {
            if (savedDay === '') {
                savedDay = parsedDate.format('dddd');
                handleNewDay(parsedDate);
            }

            if (savedDay === parsedDate.format('dddd')) {
                tempTotal += item.main.temp;
                humTotal += item.main.humidity;
                windTotal += item.wind.speed;
                hourCount++;

                // Check if the key exists
                if (weather.hasOwnProperty(item.weather[0].main)) {
                    // Key exists, increment its value
                    weather[item.weather[0].main] += 1;
                } else {
                    // Key doesn't exist, initialize it with a value of 1
                    weather[item.weather[0].main] = 1;
                }

            } else {
                updatesSavedData();
                console.log(weather)
                tempTotal = 0;
                humTotal = 0;
                windTotal = 0;
                hourCount = 0;
                weather = {};
                savedDay = parsedDate.format('dddd');
                savedDataIndex++;
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

    const tempP = createWeatherDataItem('Temp', forecast.avgTemp, 'C');
    const windP = createWeatherDataItem('Wind', forecast.avgWind, 'KPH');
    const humP = createWeatherDataItem('Humidity', forecast.avgHum, '%');

    childDiv.append(dateH5, iconImg, tempP, windP, humP);
    forecastDiv.append(childDiv);


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
}