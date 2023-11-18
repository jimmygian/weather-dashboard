console.log("script.js is working");

// Add your OPEN WEATHER API KEY here
const weatherApiKey = OPEN_WEATHER_MAP_API;

// ELEMENT SELECTORS
const searchForm = document.querySelector('#search-form');
const searchInput = document.querySelector('#search-input');
const searchSubmit = document.querySelector('#search-button');


// Store City
searchForm.addEventListener('submit', function(event) {
    event.preventDefault();
    let city = searchInput.value.trim();
    console.log(city);
    searchInput.value = '';

    // Call API
    let queryURL = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${weatherApiKey}`
    console.log(queryURL);
    fetch(queryURL)
        .then(function(response) {
            if (response.ok) {
                return response.json()
            } else {
                console.log("ERROR - PLEASE TRY ANOTHER CITY")
            }
            })
        .then(function(data) { console.log(data) })
        .catch(function(error) {console.log(error)});

    // Create Button
})