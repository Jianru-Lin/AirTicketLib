exports = module.exports = Booking;

var EventEmitter = require('events').EventEmitter;
var inherits = require('util').inherits;
var format = require('util').format;
var https = require('https');
var http = require('http');
var url = require('url');

inherits(Booking, EventEmitter);

function Booking() {
	this['depart-date'] = '';
	this['depart-sellkey'] = '';
	this['return-date'] = '';
	this['return-sellkey'] = '';
	this.headers = {};
}

Booking.prototype.start = function() {
	var self = this;

	var departDate = this['depart-date'] || '';
	var departSellkey = this['depart-sellkey'] || '';
	var returnDate = this['return-date'] || '';
	var returnSellkey = this['return-sellkey'] || '';

	var text = format('depart-date=%s&depart-sellkey=%s&return-date=%s&return-sellkey=%s',
		departDate, departSellkey, returnDate, returnSellkey);

	//console.log(text);

	// 开始发出请求
	startRequest();

	function startRequest() {
		var targetUrl = url.parse('https://argon.airasia.com/api/2/booking');

		var headers = {
			'Accept': 'application/json, text/javascript, */*; q=0.01',
			'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
			'Content-Length': Buffer.byteLength(text, 'utf8'),
			'User-Agent': 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/30.0.1599.101 Safari/537.36',
			'Channel': 'chrome',
			'Origin': 'https://chrome.airasia.com',
			'Referer': 'https://chrome.airasia.com/'
		};

		// 叠加上用户指定的 headers
		var userDefHeaders = self.headers;debugger;
		if (userDefHeaders) {
			for (var name in userDefHeaders) {
				headers[name] = userDefHeaders[name];
			}
		}

		var options = {
			method: 'POST',
			hostname: targetUrl.hostname,
			port: targetUrl.port,
			path: targetUrl.path,
			headers: headers
		};

		var req = undefined;
		if (targetUrl.protocol === 'http:') {
			req = http.request(options);
		} else if (targetUrl.protocol === 'https:') {
			req = https.request(options);
		} else {
			throw 'unknown targetUrl.protocol=' + targetUrl.protocol;
		}

		req.on('response', onResponse);
		req.on('error', onError);
		req.end(text);

		function onResponse(res) {
			if (res.statusCode !== 200) {
				self.emit('failure', 'statusCode=' + res.statusCode, res);
				res.on('data', function(){});
				res.on('end', function(){});
				res.on('error', function(){});
				return;
			}

			if (!/^application\/json/.test(res.headers['content-type'])) {
				self.emit('failure', 'Content-Type=' + res.headers['content-type'], res);
				return;
			}

			var chunkList = [];
			var totalLength = 0;

			res.on('data', onData);
			res.on('end', onEnd);
			res.on('error', onError);

			function onData(chunk) {
				chunkList.push(chunk);
				totalLength += chunk.length;
			}

			function onEnd() {
				var buffer = Buffer.concat(chunkList, totalLength);
				chunkList = null;

				var text = buffer.toString('utf8');
				var obj = undefined;
				try {
					obj = JSON.parse(text);
				} catch(err) {
					self.emit('failure', err.toString(), res);
					return;
				}

				// 好了，终于获得结果了
				self.emit('success', obj, res);
			}

			function onError(err) {
				self.emit('error', 'response', err);
			}
		}

		function onError(err) {
			self.emit('error', 'request', err);
		}
	}
}