export class BizError extends Error {
  constructor(code, message, data = null, status = 200) {
    super(message)
    this.code = code
    this.data = data
    this.status = status
  }
}
