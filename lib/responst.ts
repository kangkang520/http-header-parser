import { createReader } from "./reader"

//http相应头
class ResponseHeader {

	public status: string

	[i: string]: any

	/**
	 * http响应头
	 * @param version http版本号
	 * @param statusCode 状态码
	 * @param status 状态说明
	 */
	constructor(public version: string, public statusCode: number, status?: string) {
		this.status = status || 'OK'
	}

	/**
	 * 放入一个键
	 * @param key 键名称
	 * @param value 值
	 */
	public put(key: string, value: string) {
		this[key] = value
	}

	/**
	 * 转换成字符串
	 */
	public toString() {
		if (!this.version || !this.statusCode || !this.status) return ''
		let buffer = [`${this.version} ${this.statusCode} ${this.status}`]
		Object.keys(this).forEach(key => {
			let val = this[key]
			if (typeof val !== 'string' || (key == 'version' || key == 'statusCode' || key == 'status')) return
			buffer.push(`${key}: ${val}`)
		})
		return buffer.join('\r\n') + '\r\n\r\n'
	}

}

/**
 * 转换响应头
 */
export function parseResponse() {
	let handleFuncs: Array<(response: ResponseHeader) => void> = []
	//响应头
	let header: ResponseHeader
	//头读取器
	let reader = createReader()

	//行数据转换
	function parseLine(data: Buffer) {
		let line = (data + '').trim()
		//如果没有转换第一行数据则转换第一行数据
		if (!header) {
			let match = line.match(/^(\S+)\s+(\d+)\s+(\S+)$/)
			if (!match) throw new Error(`can't parse http header of [${line}]`)
			header = new ResponseHeader(match[1], parseInt(match[2]), match[3])
		}
		//否则转换其他数据
		else {
			let match = line.match(/^(\S+?):\s*([\s\S]+)$/)
			if (!match) {
				let err = new Error(`can't parse http header of [${line}]`);
				(err as any).goon = true
				throw err
			}
			header.put(match[1], match[2])
		}
	}
	//事件
	reader.on('line', parseLine)
	reader.on('done', () => {
		handleFuncs.forEach(func => func(header))
	})

	/**
	 * 监听事件
	 * @param type 事件类型
	 * @param cb 回调函数
	 */
	function on(type: 'header', cb: (header: ResponseHeader) => void): void
	function on(type: 'error', cb: (error: Error) => void): void
	function on(type: 'end', cb: () => void): void
	function on(type: 'line', cb: (buffer: Buffer) => void): void
	function on(type: string, cb: (...args: Array<any>) => void) {
		if (type == 'header') handleFuncs.push(cb)
		else reader.on(type, cb)
	}

	/**
	 * 写入数据
	 * @param data 要写入的数据
	 */
	function write(data: Buffer): number {
		return reader.write(data)
	}


	return { on, write }
}

// let buffer1 = new Buffer([
// 	'HTTP/1.1 200 OK',
// 	'Date: Sat, 31 Dec 2005 23:59:59 GMT',
// 	'Content-Type: text/html;charset=ISO-8859-1',
// 	'Content-Length: 122',
// ].join('\r\n') + '\r\n\r\nfdsjkfldsjfklsdjfkl')
// let buffer2 = new Buffer([
// 	'HTTP/1.1 2',
// 	'00 OK\r\nDate: Sat, 31 Dec 2005 23:59:59 GMT\r\n',
// 	'Content-Type: text/html;charset=ISO-8859-1\r\n',
// 	'Content-Length: 122\r\n',
// ].join('') + '\r\n\r\nfdsjkfldsjfklsdjfkl')

// let parser = parseResponse()

// parser.on('header', head => {
// 	console.log(head.toString())
// })

// let index = parser.write(buffer1)
// console.log(index)

// let buffer3 = new Buffer([
// 	'HTTP/1.1 200 OK',
// 	'Date: Sat, 31 Dec 2005 23:59:59 GMT',
// 	'Content-Type: text/html;charset=ISO-8859-1',
// 	'Content-Length: 122',
// ].join('\r\n') + '\r\n\r\n')
// console.log(buffer3.length)