const osmosis = require('osmosis');
const chalk = require("chalk");
const rainbow = require("chalk-rainbow");
const argv = require('yargs').argv;
const airports = require('./airports');

// Criteras for research
var criteria = {
	currencyCode: 'EUR',
	tripType: 2
};

// Structure to save founded fares
var fares = {
	outbound: [],
	return: [],
	lowestOutbound: -1,
	lowestReturn: -1,
	totalDealPrice: -1,
}


// Today's date and time for logging
var date = new Date();
var today = {
	date: date.toDateString(),
	time: date.toLocaleTimeString()
}

var cpt = 0;

/*
 * This function retrieves criterias provided by user in CLI
 * Criterias are mandatory to execute a research
 */
var retrieveCriteria = function(){
	if(argv.ddate === undefined){
		console.log('No departure date provided');
		process.exit();
	}

	if(argv.dcity === undefined){
		console.log('No departure city provided');
		process.exit();
	} 

	if(argv.acity === undefined){
		console.log('No arrival city provided');
		process.exit();
	}

	if(argv.adate === undefined){
		console.log('No arrival date provided');
		process.exit();
	}

	if(argv.interval === undefined){
		console.log('No refresh interval provided');
		process.exit();
	}

	// Retrieve departure airport code
	var airportCode = airports.getCodeByCityName(argv.dcity);
	criteria.dcity = airportCode;

	// Retrieve arrival airport code
	var airportCode = airports.getCodeByCityName(argv.acity);
	criteria.acity = airportCode;

	// Retrieve departure date
	var ddate = argv.ddate.split('/');
	criteria.dfulldate = argv.ddate;
	criteria.dday = ddate[0];
	criteria.dmonth = ddate[1];
	criteria.dyear = ddate[2];

	// Retrieve arrival date
	var adate = argv.adate.split('/');
	criteria.afulldate = argv.adate;
	criteria.aday = adate[0];
	criteria.amonth = adate[1];
	criteria.ayear = adate[2];

	// Interval for calling Norwegian website
	criteria.refreshInterval = argv.interval * 60 * 1000;

	// Clear the CLI and fetch prices for criterias defined by the user
	process.stdout.write('\033c');
	fetchPrices();
	setInterval(fetchPrices, criteria.refreshInterval);
}

/*
 * This function displays the price difference between 2 API calls if there is one
 */
var displayDiff = function(outboundFareDiff, returnFareDiff){
	if (outboundFareDiff != 0) {
  		var message = "Lowest fare price for an outbound flight is currently:" + fares.lowestOutbound + " ";
  		if(outboundFareDiff > 0)
      		message += chalk.green(`(outbound fare down \$${Math.abs(outboundFareDiff)})`);
      	else
      		message += chalk.red(`(outbound fare up \$${Math.abs(outboundFareDiff)})`);

      	console.log(today.date + ' ' + today.time);
      	console.log(message);
    }

    if (returnFareDiff != 0) {
  		var message = "Lowest fare price for a return flight is currently:" + fares.lowestReturn + " ";
  		if(returnFareDiff > 0)
      		message += chalk.green(`(return fare down \$${Math.abs(returnFareDiff)})`);
      	else
      		message += chalk.red(`(return fare up \$${Math.abs(returnFareDiff)})`);
      	
			console.log(n + ' ' + time);
      	console.log(message);
    }

    if(outboundFareDiff != 0 || returnFareDiff != 0){
    	console.log("TOTAL PRICE:", fares.lowestOutbound + fares.lowestReturn);
    	console.log("------------------------------");
    }
};

/*
 * This function calls the Norwegian Airline URL to retrieve result page
 * Then, it scrappes the html page to retrievee the standard price for the trip
 * We only retrieve standard fares as they are the lowest deals for a trip
*/
var fetchPrices = function(){

	var req = osmosis.get(`http://www.norwegian.com/fr/reservation/reservez-votre-vol/choix-du-vol/?D_City=${criteria.dcity}&A_City=${criteria.acity}&D_Day=${criteria.dday}&D_Month=${criteria.dyear}${criteria.dmonth}&D_SelectedDay=${criteria.dday}&R_Day=${criteria.aday}&R_Month=${criteria.ayear}${criteria.amonth}&R_SelectedDay=${criteria.aday}&CurrencyCode=${criteria.currencyCode}&TripType=${criteria.tripType}`)
	.find('#avaday-outbound-result td.fareselect.standardlowfare .seatsokfare')
	.then(function(priceMarkup){
		// Retrieve price inside the label HTML element. e.g: <label class="..." id="..." ...>185,00</label>
		var price = priceMarkup.toString().substr(45,6).replace(',', '.');
		fares.outbound.push(parseFloat(price));
	})
	.find('#avaday-outbound-result td.fareselect.standardlowfare .fewseatsleftfare')
	.then(function(priceMarkup){
		var price = priceMarkup.toString().substr(50,6).replace(',', '.');
		fares.oubound.push(parseFloat(price));
	})
	.find('#avaday-inbound-result td.fareselect.standardlowfare .fewseatsleftfare')
	.then(function(priceMarkup){
		var price = priceMarkup.toString().substr(50,6).replace(',', '.');
		fares.return.push(parseFloat(price));	
	})
	.find('#avaday-inbound-result td.fareselect.standardlowfare .seatsokfare')
	.then(function(priceMarkup){
		var price = priceMarkup.toString().substr(45,6).replace(',', '.');
		fares.return.push(parseFloat(price));	
	})
	.done(function(){
		// Save the current lowest prices
		var currentLowestOutbound = Math.min(...fares.outbound);
		console.log(fares.return);
		var currentLowestReturn = Math.min(...fares.return);

		// This means that we did'nt find any trip
		if(isNaN(currentLowestOutbound) || isNaN(currentLowestReturn)){
			if(isNaN(currentLowestOutbound))
				console.log(`No departure ticket on date ${criteria.dfulldate}`);
			
			if(isNaN(currentLowestReturn))
				console.log(`No return ticket on date ${criteria.afulldate}`);
		}
		else {
			// The first time we call the request, we don't have any lowest prices, so we don't care about making a difference between prices.
			if(cpt == 0) {
	      		fares.lowestOutbound = currentLowestOutbound;
	      		fares.lowestReturn = currentLowestReturn;
	      		fares.totalDealPrice = fares.lowestOutbound + fares.lowestReturn;
	      		cpt++;

	      		console.log(today.date + ' ' + today.time);
	      		console.log("Lowest fare for an outbound flight is currently:", fares.lowestOutbound);
				console.log("Lowest fare for a return flight is currently:", fares.lowestReturn);
				console.log("TOTAL PRICE:", fares.lowestOutbound + fares.lowestReturn);
				console.log("------------------------------");
	      	} else {
	      		// Compare the current lowest price with previous lowest price
				const outboundFareDiff = fares.lowestOutbound - currentLowestOutbound;
	      		const returnFareDiff = fares.lowestReturn - currentLowestReturn;

	      		fares.lowestOutbound = currentLowestOutbound;
	      		fares.returnFareDiff = currentLowestReturn;

	      		displayDiff(outboundFareDiff, returnFareDiff);
	      		cpt++;
			}
		}
	});
};

retrieveCriteria();
//setInterval(fetchPrices, 2000);




