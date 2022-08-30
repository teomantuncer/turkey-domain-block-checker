module.exports = {
	apps: [ {
		name: 'NSLookup',
		script: 'nodemon',
		args: 'index',
		env: {
			NODE_ENV: 'production'
		}
	} ]
}
