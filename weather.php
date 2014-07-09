<?php
/**
 * Author: James Vasky
 * Date: 7/3/14
 * Title: weather.php
 * Description: Accesses the weather underground API and is accessed via POST by weather.js.
 */
require_once __DIR__.'/unirest-php-master/lib/Unirest.php';

$token = "635161d7b35541ad"; // My API authorization key)
$zip = $_POST['zip']; // Get zip
$forecast = $_POST['forecast']; // Get forecast type
$URL = "http://api.wunderground.com/api/$token/$forecast/q/$zip.json";
$response = Unirest::get($URL, array("Accept" => "application/json"));
header('Content-Type: application/json');
http_response_code(200);

echo $response->raw_body; // Get response from API using Unirest
