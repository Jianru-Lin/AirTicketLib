var execFile = require('child_process').execFile;

var targetUrl = 'https://argon.airasia.com/api/2/search';
var postData = "days=5&type=classic&depart=18-10-2013&return=18-10-2013&currency=MYR&origin=KUL&destination=PER&passenger-count=1&infant-count=0";

var args = [
	"--debug",
	"--no-check-certificate",
	"--user-agent=Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/30.0.1599.101 Safari/537.36",
	"--header=Channel: chrome",
	"--header=Referer: https://chrome.airasia.com/",
	"--header=Content-Type: application/x-www-form-urlencoded; charset=UTF-8",
	"--save-cookies=cookies.txt",
	"--post-data=" + postData,
	targetUrl,
];

var p = execFile('wget.exe', args, {}, output);
p.on('error', onError);
p.on('exit', onExit);
p.on('close', onClose);

function output(error, stdout, stderr) {
	if (error) {
		console.log(error.toString());
		return;
	}

	console.log(stdout);
	console.log(stderr);
}

function onError(err) {
	console.log(err.toString());
}

function onExit(code, signal) {
	//console.log('exit');
}

function onClose(code, signal) {
	//console.log('close');
}