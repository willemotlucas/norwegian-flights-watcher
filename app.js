const osmosis = require('osmosis');
const chalk = require("chalk");
const rainbow = require("chalk-rainbow");

var fares = {
	outbound: [],
	return: [],
	lowestOutbound: -1,
	lowestReturn: -1,
	totalDealPrice: -1,
}

var cpt = 0;

var displayDiff = function(outboundFareDiff, returnFareDiff){
  	// Display the difference in color
  	if (outboundFareDiff > 0) {
      outboundFareDiffString = chalk.green(`(outbound fare down \$${Math.abs(outboundFareDiff)})`)
    } else if (outboundFareDiff < 0) {
      outboundFareDiffString = chalk.red(`(outbound fare up \$${Math.abs(outboundFareDiff)})`)
    }

    if (returnFareDiff > 0) {
      returnFareDiffString = chalk.green(`(return fare down \$${Math.abs(returnFareDiff)})`)
    } else if (returnFareDiff < 0) {
      returnFareDiffString = chalk.red(`(return fare up \$${Math.abs(returnFareDiff)})`)
    }

    if(outboundFareDiff != 0)
    	console.log(outboundFareDiffString);

    if(returnFareDiff != 0)
    	console.log(returnFareDiffString);
};

var fetchPrices = function(){

	var date = new Date();
	var n = date.toDateString();
	var time = date.toLocaleTimeString();

	var req = osmosis.get('http://www.norwegian.com/fr/reservation/reservez-votre-vol/choix-du-vol/?D_City=PARALL&A_City=LAX&D_Day=8&D_Month=201703&D_SelectedDay=8&R_Day=28&R_Month=201703&R_SelectedDay=28&CurrencyCode=EUR&TripType=2')
	.find('#avaday-outbound-result td.fareselect.standardlowfare .seatsokfare')
	.then(function(priceMarkup){
		var price = priceMarkup.toString().substr(45,6).replace(',', '.');
		fares.outbound.push(price);
	})
	.find('#avaday-inbound-result td.fareselect.standardlowfare .seatsokfare')
	.then(function(priceMarkup){
		var price = priceMarkup.toString().substr(45,6).replace(',', '.');
		fares.return.push(price);	})
	.done(function(){
		// Save the current lowest price
		var currentLowestOutbound = Math.min(parseFloat(fares.outbound));
		var currentLowestReturn = Math.min(parseFloat(fares.return));

      	if(cpt == 0) {
      		fares.lowestOutbound = currentLowestOutbound;
      		fares.lowestReturn = currentLowestReturn;
      		fares.totalDealPrice = fares.lowestOutbound + fares.lowestReturn;
      		cpt++;

      		console.log(n + ' ' + time);
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

		  	if (outboundFareDiff != 0) {
		  		var message = "Lowest fare price for an outbound flight is currently:" + fares.lowestOutbound + " ";
		  		if(outboundFareDiff > 0)
		      		message += chalk.green(`(outbound fare down \$${Math.abs(outboundFareDiff)})`);
		      	else
		      		message += chalk.red(`(outbound fare up \$${Math.abs(outboundFareDiff)})`);

		      	console.log(n + ' ' + time);
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
		}
	});
};

fetchPrices();
setInterval(fetchPrices, 30*60*1000);




