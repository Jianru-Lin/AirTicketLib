exports = module.exports = Request;

var http = require('http');
var https = require('https');
var url = require('url');
var format = require('util').format;

function Request() {
	// 状态和一般性错误
	this.status = undefined;
	this.error = undefined;

	// 请求的一些参数
	this.method = undefined;
	this.targetUrl = undefined;
	this.addtionHeaders = undefined;
	this.body = undefined;

	// 原始的请求和响应信息
	this.req = undefined;
	this.res = undefined;
	this.reqError = undefined;
	this.resError = undefined;

	// 响应的数据
	this.resBuffer = undefined;

	// 记录起始时间
	this.beginDate = undefined;
	this.endDate = undefined;
}

Request.prototype.start = function(cb) {
	var self = this;

	console.log('* request start');

	// 记录下起始时间
	self.beginDate = new Date();

	if (typeof cb !== 'function') {
		cb = function() {}
	}

	if (self.status !== undefined) {
		console.log('* self.status !== undefined');

		self.endDate = new Date();
		self.error = 'self.status !== undefined';
		cb();
		return;
	}

	self.status = 'working';

	var targetUrl = self.targetUrl;
	var method = self.method || 'GET';
	var addtionHeaders = self.addtionHeaders;
	var body = self.body;

	// 解析目标网址
	var targetUrlParsed = url.parse(targetUrl);

	// 设置各项参数
	var options = {
		method: method,
		hostname: targetUrlParsed.hostname,
		port: targetUrlParsed.port,
		path: targetUrlParsed.path,
		headers: addtionHeaders
	};

	// 创建 req 对象
	var req;

	if (targetUrlParsed.protocol === 'http:') {
		req = http.request(options);
	} else if (targetUrlParsed.protocol === 'https:') {
		req = https.request(options);
	} else {
		error = 'unknown targetUrl.protocol=' + targetUrl.protocol;
		cb();
		return;
	}

	// 把 req 对象记录下来
	self.req = req;

	// 监听相关事件
	req.on('response', onResponse);
	req.on('error', onReqError);

	// 如果是 POST 方法，还要把数据也发送出去
	if (method === 'POST') {
		console.log(format('* sending with body ... (%s Bytes)', Buffer.byteLength(body)));
		req.end(body);
	} else {
		console.log('* sending ...');
		req.end();
	}

	function onReqError(err) {
		console.log('* ' + err.toString());

		self.status = 'finish.error.request';
		self.reqError = err;
		self.endDate = new Date();
		cb();
	}

	function onResponse(res) {
		// 把 res 记录下来
		self.res = res;

		// 接收数据
		var chunkList = [];
		var totalLength = 0;

		res.on('data', onData);
		res.on('end', onEnd);
		res.on('error', onResError);

		function onData(chunk) {
			chunkList.push(chunk);
			totalLength += chunk.length;
		}

		function onEnd() {
			var buffer = Buffer.concat(chunkList, totalLength);
			chunkList = null;

			console.log(format('* receiving response done (%s Bytes)', totalLength));

			// 把数据记录下来，然后就结束了
			self.status = 'finish.success';
			self.resBuffer = buffer;
			self.endDate = new Date();

			// 显示一下时间开销
			var span = (self.endDate - self.beginDate) / 1000;
			console.log(format('* (%ss)', span));

			cb();
		}

		function onResError(err) {
			console.log('* ' + err.toString());

			self.status = 'finish.error.response';
			self.resError = err;
			self.endDate = new Date();
			cb();
		}
	}
}