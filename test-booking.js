var Booking = require('./lib/booking.js');

var booking = new Booking();
booking['depart-date'] = '21-10-2013';
booking['depart-sellkey'] = 'HF~D7~ 222~ ~~KUL~10/21/2013 23:40~SYD~10/22/2013 10:45~';
booking['return-date'] = '';
booking['return-sellkey'] = '';
booking.headers = {
	'Cookie': 'argon=osn7g00hh4mqe3gtb3u1jrilkt5mn6aj;'
};

booking.on('success', function(obj, res) {
	console.log('success');
});

booking.on('failure', function(reason, res) {
	console.error('failure because ' + reason);
});

booking.on('error', function(phase, err) {
	console.error(phase + ' ' + err.toString());
});

booking.start();