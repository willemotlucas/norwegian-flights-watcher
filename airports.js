const list = require('./destinations.json');
const readlineSync = require('readline-sync');

var Airports = {
	getCodeByCityName: function(cityName){
		var airports = list.destinations.filter(function(item){
			return item.cityName === cityName || item.displayName === cityName;
		});

		if(airports.length > 1){
			console.log('Please choose an airport in this city by entering his code:');
			airports.forEach(function(airport){
				console.log(airport.displayName + ', ' + airport.code);
			});
			console.log('------');

			var code = readlineSync.question("> ");

			var airportChoosen = airports.filter(function(airport){
				return airport.code === code;
			})

			if(airportChoosen.length != 1){
				console.log("You didn't choose a correct airport");
				process.exit();
			} else {
				return airportChoosen[0].code;
			}

		} else if (airports.length == 1){
			return airports[0].code;
		} else {
			console.log('Airport city not found, try another one.');
			process.exit();
		}
	}
};

module.exports = Airports;