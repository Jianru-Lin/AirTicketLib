var TicketBooker = require('./lib/ticket-booker.js');
var config = require('./config.json');


// 开始搜索
start(loop);

function loop() {
	console.log('');
	console.log('');
	start(loop);
}

function start(cb) {
	if (typeof cb !== 'function') {
		cb = function() {};
	}

	// 创建搜索对象
	var ticketBooker = new TicketBooker();

	// 填写搜索参数
	var g = ticketBooker.g;

	g.search.postForm['days'] = '5';
	g.search.postForm['type'] = 'classic';
	g.search.postForm['depart'] = config.search.depart;
	g.search.postForm['return'] = '';
	g.search.postForm['currency'] = config.search.currency;
	g.search.postForm['origin'] = config.search.origin;
	g.search.postForm['destination'] = config.search.destination;
	g.search.postForm['passenger-count'] = config.search['passenger-count'];
	g.search.postForm['infant-count'] = '0';

	// 填写航班参数
	g.target['flight-number'] = config.target['flight-number'];

	ticketBooker.start(cb);
}