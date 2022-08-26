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
	if (ctx.query.dns) {
		dns = ctx.query.dns
	}
	if (ctx.query.blocker) {
		blocker = ctx.query.blocker
	}
	result.domain = ctx.params.domain
	result.success = false
	const res = await checkDomain(result.domain, {
		dns,
		blocker
	})
	if (res) {
		result.addressList = res.addressList
		result.isBlocked = res.isBlocked
		result.success = true
	}
	ctx.body = result
})
router.post('/', koaBody(), async (ctx, next) => {
	ctx.request.socket.setTimeout(15 * 1000)
	let dns = '195.175.39.49'
	let blocker = '195.175.254.2'
	if (ctx.query.dns) {
		dns = ctx.query.dns
	}
	if (ctx.query.blocker) {
		blocker = ctx.query.blocker
	}
	const result = {
		results: []
	}
	for await (const o of ctx.request.body.domains) {
		const subResult = {
			domain: o
		}
		await checkDomain(o, {
			dns,
			blocker
		}).then((res) => {
			subResult.addressList = res.addressList
			subResult.isBlocked = res.isBlocked
			result.results.push(subResult)
		}).catch(async (e) => {
			console.error(e)
			await checkDomain(o, {
				dns,
				blocker
			}).then((res) => {
				subResult.addressList = res.addressList
				subResult.isBlocked = res.isBlocked
				result.results.push(subResult)
			}).catch((e) => {
				console.error(e)
			})
		})
		await sleep(50)
	}
	ctx.body = result
})
app
	.use(router.routes())
	.use(router.allowedMethods())
	.listen(3000)
