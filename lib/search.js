exports = module.exports = Search;

var EventEmitter = require('events').EventEmitter;
var inherits = require('util').inherits;
var format = require('util').format;
var https = require('https');
var http = require('http');
var url = require('url');

inherits(Search, EventEmitter);

function Search() {
	this.days = '';
	this.type = '';
	this.depart = '';
	this['return'] = '';
	this.currency = '';
	this.origin = '';
	this.destination = '';
	this['passenger-count'] = '';
	this['infant-count'] = '';
}

Search.prototype.start = function() {
	var self = this;

	var days = this.days || '';
	var type = this.type || '';
	var depart = this.depart || '';
	var return_ = this['return'] || '';
	var currency = this.currency || '';
	var origin = this.origin || '';
	var destination = this.destination || '';
	var passengerCount = this['passenger-count'] || '';
	var infantCount = this['infant-count'] || '';

	var text = format('days=%s&type=%s&depart=%s&return=%s&currency=%s&origin=%s&destination=%s&passenger-count=%s&infant-count=%s',
		days, type, depart, return_, currency, origin, destination, passengerCount, infantCount);

	//console.log(text);

	// 开始发出请求
	startRequest();

	function startRequest() {
		var targetUrl = url.parse('https://argon.airasia.com/api/2/search');

		var headers = {
			'Accept': 'application/json, text/javascript, */*; q=0.01',
			'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
			'Content-Length': Buffer.byteLength(text, 'utf8'),
			'User-Agent': 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/30.0.1599.101 Safari/537.36',
			'Channel': 'chrome',
			'Referer': 'https://chrome.airasia.com/'
		};

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