console.log("script.js is working");

// EXTENSIONS (for day.js) //
dayjs.extend(window.dayjs_plugin_calendar);
dayjs.extend(window.dayjs_plugin_advancedFormat);

// const CURRENT_DATE = dayjs('2023-11-12 13:30:00'); // For testing
const CURRENT_DATE = dayjs();
const dateFormated = `${CURRENT_DATE.format('YYMMDD')}`
console.log(dateFormated);


// Add your OPEN WEATHER API KEY here
const weatherApiKey = OPEN_WEATHER_MAP_API;
const LIMIT = 1;
const UNITS = 'metric';

// ELEMENT SELECTORS
const searchForm = document.querySelector('#search-form');
const searchInput = document.querySelector('#search-input');
const searchSubmit = document.querySelector('#search-button');


// Store City
searchForm.addEventListener('submit', function (event) {
    event.preventDefault();

    let city = searchInput.value.trim();
    console.log(city);
    searchInput.value = '';

    getLatLon(city)
        .then(latLon => getForecast(latLon))
        .then(data => { console.log(data) })



    // Create Button
})

// Gets Latitude and Longitude of city
function getLatLon(city) {

    // Call API
    let locationURL = `http://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=${LIMIT}&appid=${weatherApiKey}`;

    console.log(locationURL);

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
            console.log(data);
            console.log(data[0]['lat']);
            console.log(data[0]['lon']);
            return [data[0]['lat'], data[0]['lon']];
        })
        .catch(function (error) {
            console.log("ERROOOOR!");
            // Handle the error and return an empty array
            return [];
        });
}


// Gets 5-day forecast
function getForecast(latLon) {
    console.log("latLon: " + latLon);
    const queryURL = `https://api.openweathermap.org/data/2.5/forecast?lat=${latLon[0]}&lon=${latLon[1]}&units=${UNITS}&appid=${weatherApiKey}`;
    console.log(queryURL);

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
            console.log(error);
            return "I returned this error cause I couldnt fetch 5-day!";
        });
}


function processForecastData(data) {
    
    // MAIN FUNCTION //

    // Initializes savedData array and Index
    let savedData = [];
    let savedDataIndex = 0;

    // Initializes variables that will calculate the averages
    let tempTotal = 0, humTotal = 0, windTotal = 0, hourCount = 0;
    let savedDay = '';

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
            } else {
                updatesSavedData();
                tempTotal = 0;
                humTotal = 0;
                windTotal = 0;
                hourCount = 0;
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
    }
}
