const dns = require('native-dns');

function makeError(name, msg) {
	const err = new Error(msg);
	err.name = 'NSLookup' + name + 'Error';
	return err;
}

function Lookup() {
	this.domainName = null;
	this.domainType = 'a';

	this.serverAddr = '8.8.8.8';
	this.serverPort = 53;
	this.serverType = 'udp';

	this._timeout = 3 * 1000;
}

Lookup.prototype.type = function (type) {
	type = type.toLowerCase();

	if (type === 'cname' || type === 'soa' || type === 'srv') {
		throw makeError('NotSupport', 'do not support type: ' + type);
	}

	this.domainType = type;
	return this;
};

Lookup.prototype.server = function (server) {
	if (typeof server === 'string') {
		this.serverAddr = server;
	}
	if (typeof server === 'object') {
		this.serverAddr = server.address;
		this.serverPort = server.port;
		this.serverType = server.type;
	}

	return this;
};

// ms
Lookup.prototype.timeout = function (timeout) {
	this._timeout = timeout;
	return this;
};

function extracterBuilder(type) {
	let prop = null
	if ('a' === type) {
		prop = 'address';
	} else if ('mx' === type) {
		prop = 'exchange';
	} else if ('ns' === type || 'txt' === type) {
		prop = 'data';
	} else {
		prop = 'address';
	}
	return function (addr) {
		return addr[prop];
	};
}

Lookup.prototype.end = function (callback) {
	const self = this
	const question = dns.Question({
		name: this.domainName,
		type: this.domainType
	})
	const server = {
		address: this.serverAddr,
		port: this.serverPort,
		type: this.serverType
	}
	const timeout = this._timeout
	const req = dns.Request({
		question: question,
		server: server,
		timeout: timeout,
		cache: false
	})
	req.on('timeout', function () {
		callback(makeError('Timeout', 'dns request exceed ' + timeout + 'ms'));
	});

	req.on('message', function (err, answer) {
		if (err) {
			return callback(err);
		}
		const extracter = extracterBuilder(self.domainType)
		const addrs = answer.answer.map(function (a) {
			return extracter(a)
		})
		callback(null, addrs);
	});

	req.on('end', function () {
	});

	req.send();
};

exports = module.exports = function (name, callback) {
	const lookup = new Lookup()
	lookup.domainName = name;
	if (callback) {
		lookup.end(callback);
	}
	return lookup;
};


