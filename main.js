var Request = require('./lib/request.js');
var objToForm = require('./lib/objToForm.js');
var format = require('util').format;

var g = {
	search : {
		request: undefined,
		postForm: {
			'days': undefined,
			'type': undefined,
			'depart': undefined,
			'return': undefined,
			'currency': undefined,
			'origin': undefined,
			'destination': undefined,
			'passenger-count': undefined,
			'infant-count': undefined
		},
		responseObj: undefined
	},
	booking: {
		request: undefined,
		cookie: undefined,
		postForm: {
			'depart-date': undefined,
			'depart-sellkey': undefined,
			'return-date': undefined,
			'return-sellkey': undefined
		},
		responseObj: undefined
	}
}

// 填写搜索参数
g.search.postForm['days'] = '5';
g.search.postForm['type'] = 'classic';
g.search.postForm['depart'] = '25-10-2013';
g.search.postForm['return'] = '';
g.search.postForm['currency'] = 'THB';
g.search.postForm['origin'] = 'DMK';
g.search.postForm['destination'] = 'MFM';
g.search.postForm['passenger-count'] = '1';
g.search.postForm['infant-count'] = '0';

// 开始搜索
beginSearch(onSearchDone);

function onSearchDone() {
	// 数据往返的过程中出现了错误
	if (!/success/.test(g.search.request.status)) {
		return;
	}

	// 服务端返回的值不是 200
	if (g.search.request.res.statusCode !== 200) {
		console.log('statusCode: ' + g.search.request.res.statusCode);
		return;
	}

	// 解析一下服务端返回的额 JSON 结果
	g.search.responseObj = JSON.parse(g.search.request.resBuffer.toString('utf8'));

	// 目前的选票逻辑是自动选择当天的打折票（promo）
	// 如果当天没有票，或者有票但是没有打折票，那么提示用户错误信息然后退出即可

	var departDate = g.search.postForm['depart'];

	var departFilght;

	if (!selectDepartFilght()) {
		return;
	}

	var departSellkey = departFilght.sellkey;

	// 输出当前的订票信息
	console.log('> flight-number = ' + departFilght['flight-number']);
	console.log('> depart-date = ' + departDate);
	console.log('> time = ' + departFilght.time);
	console.log(format('> total = %s %s (%s+%s)', departFilght.currency, departFilght['total'], departFilght['fare-price'], departFilght['taxes-and-fees']));
	console.log('> depart-sellkey = ' + departSellkey);

	// 填写订票参数
	g.booking.postForm['depart-date'] = departDate;
	g.booking.postForm['depart-sellkey'] = departSellkey;
	g.booking.postForm['return-date'] = '';
	g.booking.postForm['return-sellkey'] = '';

	console.log('');

	// 开始执行订票
	beginBooking(onBookingDone);

	function selectDepartFilght() {
		var o = g.search.responseObj;

		if (!o.depart) {
			console.log('no depart ticket: !o.depart');
			return;
		}

		if (!o.depart[departDate]) {
			console.log('no depart ticket: !o.depart[departDate]');
			return;
		}

		if (!o.depart[departDate].details) {
			console.log('no depart ticket: !o.depart[departDate].details');
			return;
		}

		// 买指定航班的票
		var details = o.depart[departDate].details;
		var targetFlightNumber = 'FD 2542';
		var targetFlight = undefined;

		for (var flightType in details) {
			details[flightType].forEach(function(flight) {
				if (flight['flight-number'] === targetFlightNumber) {
					targetFlight = flight;
					console.log('target flight found: ' + targetFlightNumber);
				}
			});
		}

		if (!targetFlight) {
			console.log('target flight not found: ' + targetFlightNumber);
			return false;
		}

		// 记录到上级变量
		departFilght = targetFlight;

		// 确认成功
		return true;

		/*

		// 买特价票

		if (!o.depart[departDate].details.promo) {
			console.log('no depart ticket: !o.depart[departDate].details.promo');
			return;
		}

		if (!o.depart[departDate].details.promo[0]) {
			console.log('no depart ticket: !o.depart[departDate].details.promo[0]');
			return;
		}

		if (!o.depart[departDate].details.promo[0].sellkey) {
			console.log('no depart ticket: !o.depart[departDate].details.promo[0].sellkey');
			return;
		}

		*/
	}
}

function onBookingDone() {
}

function beginSearch(cb) {
	console.log('[search]');

	// 创建搜索请求对象
	var request = new Request();

	// 记录下来
	g.search.request = request;

	// 构造请求内容
	var body = objToForm(g.search.postForm);

	// 填写搜索请求对象所需的基本参数
	request.targetUrl = 'https://argon.airasia.com/api/2/search';
	//request.targetUrl = 'http://127.0.0.1:6666/api/2/search';
	request.method = 'POST';
	request.addtionHeaders = {
		'Accept': 'application/json, text/javascript, */*; q=0.01',
		'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
		'Content-Length': Buffer.byteLength(body, 'utf8'),
		'User-Agent': 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/30.0.1599.101 Safari/537.36',
		'Channel': 'chrome',
		'Referer': 'https://chrome.airasia.com/',
		'Origin': 'https://chrome.airasia.com'
	};
	request.body = body;

	// 开始发出请求
	request.start(cb);
}

function beginBooking(cb) {
	console.log('[booking]');

	// 创建搜索请求对象
	var request = new Request();

	// 记录下来
	g.booking.request = request;

	// 构造请求内容
	var body = objToForm(g.booking.postForm);

	// 填写搜索请求对象所需的基本参数
	request.targetUrl = 'https://argon.airasia.com/api/2/booking';
	request.method = 'POST';
	request.addtionHeaders = {
		'Accept': 'application/json, text/javascript, */*; q=0.01',
		'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
		'Content-Length': Buffer.byteLength(body, 'utf8'),
		'User-Agent': 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/30.0.1599.101 Safari/537.36',
		'Channel': 'chrome',
		'Referer': 'https://chrome.airasia.com/',
		'Origin': 'https://chrome.airasia.com'
	};
	request.body = body;

	// 注意要带上 Cookie
	request.addtionHeaders.Cookie = g.booking.cookie;

	// 开始发出请求
	request.start(cb);
}