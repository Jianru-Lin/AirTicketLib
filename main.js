var Search = require('./lib/search.js');
var format = require('util').format;

var search = new Search();

// 填写参数
search['days'] = '5';
search['type'] = 'classic';
search['depart'] = '20-10-2013';
search['return'] = '25-10-2013';
search['currency'] = 'MYR';
search['origin'] = 'KUL';
search['destination'] = 'PER';
search['passenger-count'] = '1';
search['infant-count'] = '0';

search.on('success', onSuccess);
search.on('failure', onFailure);
search.on('error', onError);

// start
var d1 = new Date();
search.start();

function onSuccess(obj, res) {
	var d2 = new Date();
	console.log(format('%s', (d2 - d1) / 1000));
}

function onFailure(reason, res) {
	console.error('failure because ' + reason);
}

function onError(phase, err) {
	console.error(phase + ' ' + err.toString());
}