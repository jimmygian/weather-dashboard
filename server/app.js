const express = require('express');
require('dotenv').config()
const path = require('path');
const axios = require('axios');
const dayjs = require('dayjs');
console.log(process.env.OPEN_WEATHER_MAP_API)


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

const app = express();

// Make a request to the external API using your API key
const weatherApiKey = process.env.OPEN_WEATHER_MAP_API;

app.use(express.static(path.join(__dirname, "..", "public")));
console.log(path.join(__dirname, "..", "public"))


// Define a route to handle weather data requests
app.get('/weather', async (req, res) => {
    try {
        // Get the city from the query parameters
        const city = req.query.city;

        const apiUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=${SEARCH_LIMIT}&appid=${weatherApiKey}`;
        const response = await axios.get(apiUrl);
        
        // Send the weather data back to the client
        const cityData = response.data;
        const latLon = [cityData[0]['lat'], cityData[0]['lon'], cityData[0]['name'], cityData[0]['state']]

        const todaysData = await getTodaysForecast(latLon);
        const data = await getForecast(latLon);
        const forecastData = processForecastData(data);

        // Send the weather data back to the client
        res.json({ cityData, forecastData, todaysData });

    } catch (error) {
        console.error('Error fetching weather data:', error);
        res.status(500).json({ error: 'Failed to fetch weather data' });
    }
});


app.use((req, res) => {
    res.status(404);
    res.send(`<h1>Error 404: Resource not found</h1>`)
})


app.listen(3000, () => {
    console.log("App listening on port 3000");
});


async function getForecast(latLon) {

    const queryURL = `https://api.openweathermap.org/data/2.5/forecast?lat=${latLon[0]}&lon=${latLon[1]}&units=${UNITS}&appid=${weatherApiKey}`;

    const response = await axios.get(queryURL);
        
    // Send the weather data back to the client
    const data = response.data;
    return data;
}

async function getTodaysForecast(latLon) {
    const queryURL = `https://api.openweathermap.org/data/2.5/weather?lat=${latLon[0]}&lon=${latLon[1]}&units=${UNITS}&appid=${weatherApiKey}`

    const response = await axios.get(queryURL);
        
    // Send the weather data back to the client
    const data = response.data;
    return data;
}


function processForecastData(data) {

    // Initializes savedData array and Index
    let savedData = [];
    let savedDataIndex = 0;

    // Initializes variables that will calculate the averages
    let tempTotal = 0, humTotal = 0, windTotal = 0, hourCount = 0;
    let weather = {};

    // Initializes variables that will calculate the averages
    let tempMinMax = [NaN, NaN];
    let humMinMax = [NaN, NaN];
    let windMinMax = [NaN, NaN];

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

                // Update min and max values
                tempMinMax = updateMinMax(tempMinMax[0], tempMinMax[1], weatherData.main.temp);
                humMinMax = updateMinMax(humMinMax[0], humMinMax[1], weatherData.main.humidity);
                windMinMax = updateMinMax(windMinMax[0], windMinMax[1], weatherData.wind.speed);

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
                tempMinMax = [NaN, NaN];
                humMinMax = [NaN, NaN];
                windMinMax = [NaN, NaN];

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

        savedData[savedDataIndex]['icon'] = calculateIcon(weather);

        savedData[savedDataIndex]['minMax'] = {
            temp: {
                min: Math.round(tempMinMax[0]),
                max: Math.round(tempMinMax[1]),
                average: calculateAverage(tempTotal, hourCount)
            },
            humidity: {
                min: Math.round(humMinMax[0]),
                max: Math.round(humMinMax[1]),
                average: Math.round(calculateAverage(humTotal, hourCount))
            },
            wind: {
                min: Math.round(windMinMax[0]),
                max: Math.round(windMinMax[1]),
                average: calculateAverage(windTotal, hourCount)
            }
        }
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

    // 5. updates Min and Max values
    function updateMinMax(min, max, value) {
        if (isNaN(min) || isNaN(max)) {
            min = value;
            max = value;
        }
        if (min > value) {
            min = value;
        }
        if (max < value) {
            max = value;
        }
        return [min, max];
    }
}