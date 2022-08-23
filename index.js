const Koa = require('koa')
const Router = require('@koa/router')
const koaBody = require('koa-body')
const app = new Koa()
const router = new Router()

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
