const Koa = require('koa')
const Router = require('@koa/router')
const koaBody = require('koa-body')
const nslookup = require('./lib/nslookup')
const app = new Koa()
const router = new Router()

function sleep(ms) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}
const checkDomain = (domain, {
	dns,
	blocker
}) => {
	let response = false
	return new Promise((resolve, reject) => {
		try {
			nslookup(domain)
				.server(dns || '195.175.39.49')
				.end(async function (err, addrs) {
					response = true
					if (!err) {
						resolve({
							addressList: addrs,
							isBlocked: addrs.indexOf(blocker || '195.175.254.2') > -1
						})
					} else {
						reject()
					}
				})
		} catch (e) {
			reject()
		}
		setTimeout(() => {
			if (!response) {
				return checkDomain(domain, { dns, blocker })
			}
		}, 150)
	})
}
router.get('/:domain', async (ctx, next) => {
	ctx.request.socket.setTimeout(15 * 1000)
	let dns = '195.175.39.49'
	let blocker = '195.175.254.2'
	const result = {}
	ctx.body = result
})
router.post('/', koaBody(), async (ctx, next) => {
	ctx.request.socket.setTimeout(15 * 1000)
	let dns = '195.175.39.49'
	let blocker = '195.175.254.2'
	const result = {
		results: []
	}
	ctx.body = result
})
app
	.use(router.routes())
	.use(router.allowedMethods())
	.listen(3000)
