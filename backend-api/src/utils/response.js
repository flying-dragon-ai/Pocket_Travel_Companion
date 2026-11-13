export function ok(ctx, data = {}, message = 'ok') {
  ctx.body = { code: 0, message, data }
}

export function fail(ctx, code, message, data = null, status = 200) {
  ctx.status = status
  ctx.body = { code, message, data }
}
