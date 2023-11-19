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
    console.log("====================");

    // Initialize variables for calculation

    let savedData = []  // Array to be returned
    let arrCount = 0;   // Array elements count

    
    // These variables change per day
    let savedDay = '';
    let tempTotal = 0, humTotal = 0, windTotal = 0;
    let divident = 0;

    for (let i = 0; i < data.list.length; i++) {

        // Parse Date and Time of list
        const dateString = data.list[i].dt_txt;
        const parsedDate = dayjs(dateString, { format: "YYYY-MM-DD HH:mm:ss" });

        // If day is today, skip
        if (CURRENT_DATE.day() !== parsedDate.day()) {

            if (savedDay === parsedDate.format('dddd')) {
                //  Store totals
                tempTotal += data.list[i].main.temp;
                humTotal += data.list[i].main.humidity;
                windTotal += data.list[i].wind.speed;

                console.log(data.list[i].dt_txt);
                // Update Count that will be used to create averages
                divident++;

                console.log("divident:", divident);
                console.log("temp:", data.list[i].main.temp);
                console.log("temptTotal:", tempTotal);
                console.log("humTotal:", humTotal);
                console.log("windTotal:", windTotal);

            } else {
                if (savedDay === '') {

                    // Go one i back
                    i--;

                    //  Update savedDay
                    savedDay = parsedDate.format('dddd');

                    // Push new element to array
                    savedData.push(
                        {
                            day: parsedDate.format('dddd'),
                            date: parsedDate.format('DD/MM/YYYY'),
                        }
                    )

                } else {

                    // Go one i back
                    i--;

                    // Push data to current array's object
                    savedData[arrCount]['temp'] = Number((tempTotal / divident).toFixed(2));
                    savedData[arrCount]['humidity'] = Math.round((humTotal / divident).toFixed(2));
                    savedData[arrCount]['wind'] = Number((windTotal / divident).toFixed(2));

                    // Initialize totals
                    tempTotal = 0;
                    humTotal = 0;
                    windTotal = 0;
                    divident = 0;

                    //  Update savedDay
                    savedDay = parsedDate.format('dddd');

                    // Update array Count
                    arrCount++;

                    // Push new {}
                    if (arrCount < 5) {
                        savedData.push(
                            {
                                day: parsedDate.format('dddd'),
                                date: parsedDate.format('DD/MM/YYYY'),
                            }
                        )
                        console.log("------------");
                    }
                }
            }
        }
    }
    // Push data to current array's object
    savedData[arrCount]['temp'] = Number((tempTotal / divident).toFixed(2));
    savedData[arrCount]['humidity'] = Math.round((humTotal / divident).toFixed(2));
    savedData[arrCount]['wind'] = Number((windTotal / divident).toFixed(2));

    return savedData;
}