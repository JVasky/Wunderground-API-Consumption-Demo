/**
 * Author: James Vasky
 * Title: weather.js
 * Date: 7--14
 * Description: This is a javaScript file that uses jQuery. Acts as the controller.
 *
 * ******* Removed the PHP script as an exercise. Now directly consumes API *******
 */
$(document).ready(function($) {
var APIKEY = '635161d7b35541ad';
    /*
     * From validation with validator plugin
     */
    $("#myForm").validate({
        debug: true,
        // Rules for validation
        rules: {
            zip: {
                required: true,
                zipcodeUS: true
            },
            forecast: "required",
            units: "required"
        },
        // Validation messages
        messages: {
            zip: "Please enter a valid US zip code",
            forecast: "Please select forecast type",
            units: "Please select unit type"
        }
    });

    $('#submit').click(function() {
        if($("#myForm").valid()){
            var form = $( "#myForm" ).serializeArray();
            var zipCode = form[0]['value']; // grab zip from form
            var forecast = form[1]['value']; // grab forecast type from form
            var units = form[2]['value']; // grab the metric or standard value from form
            var apiUrl = 'http://api.wunderground.com/api/'+ APIKEY + '/' + forecast + '/q/' + zipCode + '.json';
            $.ajax({ // send a request to API
                url: apiUrl,
                dataType: 'jsonp',
                success: function( data ){ // Upon success, parse the weather and take appropriate action
                    var weather = parseWeather(data, units);
                    if(weather.type == 'hourly')
                    {
                        hourlyHTML(weather);
                    }
                    else if(weather.type == '3day')
                    {
                        threeHTML(weather);
                    }
                    else if(weather.type == 'almanac')
                    {
                        almanacHTML(weather);
                    }
                    else // error
                    { // removes any previous error message and appends the form with an error message
                        $("#errorMsg").remove();
                        $("#myForm").append("<p id='errorMsg'>There was an error, " +
                            "please re-enter your zip and try again...</p>")
                    }
                }
            });
        }
    });

   /*
    * Returns the appropriate object upon calling
    */
    function parseWeather(weather, units)
    {
        var result; // placeholder
        if(weather.hourly_forecast) //if hourly_forecast is in the weather, it is hourly
        {
            result = new CreateHourly(weather, units);
        }
        else if(weather.forecast) // 3-day forecast
        {
            result = new Create3Day(weather, units);
        }
        else if(weather.almanac) // Almanac request
        {
            result = new CreateAlmanac(weather, units);
        }
        else
        {
            result = {type: "error"}; // error
        }
        return result;
    }
    /*
     * Creates an object that contains hourly forecast data
     */
    function CreateHourly(weather, units)
    {
        this.type = "hourly";
        var unitType = (units == 'standard') ? 'english' : 'metric';
        this.hours = [];
        for(var hour in weather['hourly_forecast'])
        {
            var newHour = new Object();
            newHour.time = weather['hourly_forecast'][hour]['FCTTIME']['pretty'];
            newHour.condition = weather['hourly_forecast'][hour]['condition'];
            newHour.temperature = weather['hourly_forecast'][hour]['temp'][unitType];
            newHour.feels = weather['hourly_forecast'][hour]['feelslike'][unitType];
            newHour.icon = weather['hourly_forecast'][hour]['icon_url'];
            this.hours.push(newHour);
        }
    }

    /*
     * Creates an object that contains 3-day forecast data
     */
    function Create3Day(weather, units)
    {
        this.type = "3day";
        var unitType = (units == 'standard') ? 'fahrenheit' : 'celsius';
        var forecastDay, day;
        this.days =  [];
        day = new Object;
        for(var i = 0; i < weather['forecast']['txt_forecast']['forecastday'].length; i++)
        {
            if(i % 2 == 0) // on first iteration, retrieve the day data
            {
                day.dayTitle = weather['forecast']['txt_forecast']['forecastday'][i]['title'];
                day.high = weather['forecast']['simpleforecast']['forecastday'][i/2]['high'][unitType];
                day.low = weather['forecast']['simpleforecast']['forecastday'][i/2]['low'][unitType];
                day.dayIcon = weather['forecast']['txt_forecast']['forecastday'][i]['icon_url'];
                if(unitType == 'fahrenheit')
                {
                    day.dayText = weather['forecast']['txt_forecast']['forecastday'][i]['fcttext'];
                }
                else
                {
                    day.dayText = weather['forecast']['txt_forecast']['forecastday'][i]['fcttext_metric'];
                }
            }

            if(i % 2 != 0) // on the next iteration, retrieve the evening data
            {
                day.nightTitle = weather['forecast']['txt_forecast']['forecastday'][i]['title'];
                day.nightIcon = weather['forecast']['txt_forecast']['forecastday'][i]['icon_url'];
                if(unitType == 'fahrenheit')
                {
                    day.nightText = weather['forecast']['txt_forecast']['forecastday'][i]['fcttext'];
                }
                else
                {
                    day.nightText = weather['forecast']['txt_forecast']['forecastday'][i]['fcttext_metric'];
                }
                this.days.push(day);
                day = new Object();
            }

        }
    }
    /*
     * Creates an object that contains almanac data
     */
    function CreateAlmanac(weather, units)
    {
        this.type = 'almanac';
        unitType = (units == 'standard') ? 'F' : 'C';
        this.normalHigh = weather['almanac']['temp_high']['normal'][unitType];
        this.recordHigh = weather['almanac']['temp_high']['record'][unitType];
        this.highYear = weather['almanac']['temp_high']['recordyear'];
        this.normalLow = weather['almanac']['temp_low']['normal'][unitType];
        this.recordLow = weather['almanac']['temp_low']['record'][unitType];
        this.lowYear = weather['almanac']['temp_low']['recordyear'];
    }

    /*
     * Clears the HTML, and updates it with the hourly forecast using the hourly object
     */
    function hourlyHTML(weather)
    {
        clearPage();
        $("body").append(
            '<h1>Hourly Forecast</h1><br>' +
            '<div id="hourly"></div>'
        );
        for(var hour = 0; hour < (weather['hours'].length); hour++)
        {
            $("#hourly").append(
                '<div class="weather hour">' +
                '<h2>Forecast for ' + weather['hours'][hour]['time'] + '</h2>' +
                '<img class="wicon" src="' + weather['hours'][hour]['icon'] + '">' +
                '<p>Condition: ' + weather['hours'][hour]['condition'] + '</p>' +
                '<p>Temperature: ' + weather['hours'][hour]['temperature'] + '&deg</p>' +
                '<p>Feels Like: ' + weather['hours'][hour]['feels'] + '&deg</p>' +
                '</div>'
            );
        }
    }

    /*
     * Clears the HTML, and updates it with the 3-day forecast using the 3 day object
     */
    function threeHTML(weather)
    {
        clearPage();
        $("body").append(
            '<h1>3-Day Forecast</h1>' +
            '<div id="tdforecast"></div>'
        );
        for(var day = 0; day < weather['days'].length; day++)
        {
            $("#tdforecast").append( // Display first 12 hours
                '<h1 class="daytitle">'+ weather['days'][day]['dayTitle'] + '</h1>' +
                '<h2 class="high">High: ' + weather['days'][day]['high'] + '&deg</h2>' +
                '<h2 class="low">Low: ' + weather['days'][day]['low'] + '&deg</h2>' +
                '<div class="tday" id="period">' +
                '<h2>Forecast for ' + weather['days'][day]['dayTitle'] + '</h2>' +
                '<img class="wicon" src="' + weather['days'][day]['dayIcon'] + '">' +
                '<p>' + weather['days'][day]['dayText'] + '</p>' +
                '</div>' +
                 // Display next 12 hours
                '<div class="tday" id="period">' +
                '<h2>Forecast for ' + weather['days'][day]['nightTitle'] + '</h2>' +
                '<img class="wicon" src="' + weather['days'][day]['nightIcon'] + '">' +
                '<p>' + weather['days'][day]['nightText'] + '</p>' +
                '</div>'
            );
        }
    }

    /*
     * Clears the HTML, and updates it with the almanac data using the almanac object
     */
    function almanacHTML(weather)
    {
        clearPage();
        $("body").append(
            '<div id="almanac">' +
            '<h1>Almanac Forecast for Today</h1><br>' +
            '</div>'
        );
        $("#almanac").append(
            '<h2 id="highs">Highs</h2>' +
            '<h2>Normal High: ' + weather.normalHigh + '&deg</h2>' +
            '<h2>Record High: ' + weather.recordHigh + '&deg</h2>' +
            '<h2>Record Year: ' + weather.highYear + '</h2><br>' +
            '<h2 id="lows">Lows</h2>' +
            '<h2>Normal Low: ' + weather.normalLow + '&deg</h2>' +
            '<h2>Record Low: ' + weather.recordLow + '&deg</h2>' +
            '<h2>Record Year: ' + weather.lowYear + '</h2>'
        );
    }

    /*
     * Utility function that clears the form and the pre form header from the HTML.
     */
    function clearPage()
    {
        $("#prefore").remove();
        $("#myForm").remove();
    }
});