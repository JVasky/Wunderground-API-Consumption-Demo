<!DOCTYPE html>
<html>
<head>
    <link href='http://fonts.googleapis.com/css?family=Raleway' rel='stylesheet' type='text/css'>
    <link rel="stylesheet" type="text/css" href="style.css">
    <title>Forecast</title>
</head>
<body>
    <?php
        if(!isset($_POST['zip'])) // Checks for form POST data
        {
            echo "<h1 id=\"prefore\">Forecast Selection</h1>";
            echo "<form action=\"wundergroundUni.php\" method=\"post\">";
            echo "<p>Please enter your zip: <input type=\"text\" min=\'5\'maxlength='5' name=\"zip\" required/></p>";
            echo "<p>Which forecast would you like?:<br><br>";
            echo "<label>3-Day</label><input type=\"radio\" name=\"forecast\" value=\"forecast\" required/><br>";
            echo "<label>Hourly</label><input type=\"radio\" name=\"forecast\" value=\"hourly\"/><br>";
            echo "<label>Almanac</label><input type=\"radio\" name=\"forecast\" value=\"almanac\"/><br>";
            echo "<p>Do you want metric or standard units?:<br><br>";
            echo "<label>Standard</label><input type=\"radio\" name=\"units\" value=\"standard\" required/><br>";
            echo "<label>Metric</label><input type=\"radio\" name=\"units\" value=\"metric\"/>";
            echo "<p><input type=\"submit\"/></p>";
        }
        else // Weather info requested
        {
            $zip = $_POST['zip']; // Get zip
            $forecast = $_POST['forecast']; // Get forecast type
            $units = $_POST['units']; // Get Unit type
            if(!preg_match("/^[0-9]/",$zip) || strlen($zip) != 5) // If it isn't 5 digits
            {
                echo "<p id=\"werror\">Zip code invalid, displaying weather for Scranton, PA</p>";
                $zip = 18510; // Default to Scranton, PA
            }
            /*
             * The following checks aren't necessary because of the way the form requires fields but I included
             * them anyway to prevent anomalies.
             */
            if(!isset($_POST['forecast']))
            { // Forecast wasn't set
                echo "Forecast type not set, displaying hourly by default";
                $forecast = "hourly"; // Default to hourly
            }
            if(!isset($_POST['units']))
            { // Units not set
                echo "Unit type not set, displaying standard by default";
                $units = "standard"; // Default to standard

            }
            /*
             * The following is split up just because of the way the wunderground API handles different units across
             * different request types
             */
            if($units == "standard")
            {
                $unitType = 'english';
                $degrees = "fahrenheit";
            }
            else // $units == "metric"
            {
                $unitType = 'metric';
                $degrees = 'celsius';
            }
            require_once dirname(__FILE__).'/unirest-php-master/lib/Unirest.php';
            $token = "635161d7b35541ad"; // My API authorization key
            $URL = "http://api.wunderground.com/api/$token/$forecast/q/$zip.json";
            $response = Unirest::get($URL, array("Accept" => "application/json"));
            $h = $response->raw_body; // Get response from API using Unirest
            $weather = json_decode($h, true); // Decode to JSON
            if(is_array($weather) && array_key_exists('error',$weather['response'])) // Checks for error response
            {
                echo "<h2>There was an error. " . $weather['response']['error']['description'] . ".
                        Please reload page, check zip code and try again.</h2>";
            }
            else if($forecast == "hourly") // Hourly forecast requested
            {
                echo "<h1>Hourly Forecast</h1>";
                echo "<div id=\"hourly\">"; // Put the hourly within it's own div
                for($i = 0; $i < count($weather['hourly_forecast']); $i++) // Go through all hours
                {
                    echo "<div class=\"weather hour".($i%2)."\">"; // Assigns a class based on i%2
                    echo "<h2>Forecast for {$weather['hourly_forecast'][$i]['FCTTIME']['pretty']}</h2>";
                    echo  "<img class=\"wicon\" src=\"{$weather['hourly_forecast'][$i]['icon_url']}
                                                    \" alt=\"\">";
                    echo "<p>Condition: {$weather['hourly_forecast'][$i]['condition']}</p>";
                    echo "<p>Temperature: {$weather['hourly_forecast'][$i]['temp'][$unitType]}&deg</p>";
                    echo "<p>Feels Like: {$weather['hourly_forecast'][$i]['feelslike'][$unitType]}&deg</p>";
                    echo "</div>";
                }
                echo "</div>";
            }
            else if($forecast == 'forecast')
            {
                echo "<h1>3-Day Forecast</h1><br>";
                echo "<div id=\"tdforecast\">"; // In a wrapper
                for($i = 0; $i < count($weather['forecast']['txt_forecast']['forecastday']); $i++)
                { // go through each 12 hour increment
                    if($i%2==0) //this adds both halves of the day into one div
                    {
                    echo "<h1 class =\"daytitle\"> {$weather['forecast']['txt_forecast']['forecastday']
                                                [$i]['title']}</h1>";
                    echo "<h2 class=\"high\">High: {$weather['forecast']['simpleforecast']
                                                ['forecastday'][$i/2]['high'][$degrees]} &deg</p>";
                    echo "<h2 class=\"low\">Low: {$weather['forecast']['simpleforecast']
                                                ['forecastday'][$i/2]['low'][$degrees]} &deg</p>";
                    }
                    echo "<div class=\"tday\" id=\"period".($i%2)."\">";
                    echo "<h2>Forecast for {$weather['forecast']['txt_forecast']
                                                ['forecastday'][$i]['title']}</h2>";
                    echo  "<img class=\"wicon\" src=\"{$weather['forecast']['txt_forecast']
                                                ['forecastday'][$i]['icon_url']}\" alt=\"\">";
                    if($unitType == 'english')
                    {
                        echo "<p>{$weather['forecast']['txt_forecast']['forecastday'][$i]['fcttext']}</p>";
                    }
                    else // $uniType == 'metric'
                    {
                        echo "<p>{$weather['forecast']['txt_forecast']['forecastday'][$i]['fcttext_metric']}</p>";
                    }
                    echo "</div>";
                }
                echo "</div>";
            }
            else // $forecast == 'almanac'
            {
                echo "<div id=\"almanac\">";
                echo "<h1>Almanac Forecast for Today</h1><br>";
                if($units ==  'standard'){$U = 'F';}
                else{$U = 'C';} // $units == 'metric'
                    echo "<h2 id=\"highs\"> Highs</h2>";
                    echo "<h2>Normal High: {$weather['almanac']['temp_high']['normal'][$U]}&deg$U</h2>";
                    echo "<h2>Record High: {$weather['almanac']['temp_high']['record'][$U]}&deg$U</h2>";
                    echo "<h2>Record Year: {$weather['almanac']['temp_high']['recordyear']}</h2><br>";
                    echo "<h2 id=\"lows\"> Lows</h2>";
                    echo "<h2>Normal Low: {$weather['almanac']['temp_low']['normal'][$U]}&deg$U</h2>";
                    echo "<h2>Record Low: {$weather['almanac']['temp_low']['record'][$U]}&deg$U</h2>";
                    echo "<h2>Record Year: {$weather['almanac']['temp_low']['recordyear']}</h2>";

                echo "</div>";
            }
        }
    ?>
</body>
</html>