exports = module.exports = objToForm;

function objToForm(obj) {
	if (!obj) return '';

	var list = [];
	for (var name in obj) {
		// TODO 这里没有考虑转义的情况
		list.push(name + '=' + obj[name]);
	}
	return list.join('&');
}