//处理http头
import url from 'url'
import { createReader } from './reader'
const nodeUrl = url


export class RequestHeader {
	//其他数据
	[i: string]: any

	public host: string
	public protocol?: 'http' | 'https'

	//构造一个请求头
	constructor(public type: string, public url: string, public version: string) {
		this.host = url
		if (/^http(s)?:\/\//.test(url)) {
			let res = nodeUrl.parse(url)
			this.host = res.host!
			this.protocol = (res.protocol!).replace(':', '') as any
		}
	}

	//存入数据
	public put(key: string, value: string) {
		this[key] = value
	}

	/**
	 * 转换成字符串
	 */
	public toString() {
		if (!this.type || !this.host || !this.version) return ''
		let buffer = [`${this.type} ${this.url} ${this.version}`]
		Object.keys(this).forEach(key => {
			let val = this[key]
			if (typeof val !== 'string' || ['type', 'host', 'version', 'url', 'protocol'].includes(key)) return
			buffer.push(`${key}: ${val}`)
		})
		return buffer.join('\r\n') + '\r\n\r\n'
	}
}

/**
 * 转换请求头
 */
export function parseRequest() {
	//处理函数
	let handleFuncs = [] as Array<(header: RequestHeader) => void>
	let reader = createReader()
	//请求头
	let header: RequestHeader

	//行数据转换
	function parseLine(data: Buffer) {
		let line = (data + '').trim()
		//如果没有转换第一行数据则转换第一行数据
		if (!header) {
			let match = line.match(/^(\S+)\s+(\S+)\s+(\S+)$/)
			if (!match) throw new Error(`can't parse http header of [${line}]`)
			header = new RequestHeader(match[1], match[2], match[3])
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
	function on(type: 'header', cb: (header: RequestHeader) => void): void
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
	//返回操作函数
	return { on, write }
}


// let buffer1 = new Buffer([
// 	'GET http://www.baidu.com:88/ HTTP/1.1',
// 	'User-Agent: Wget/1.18 (darwin16.3.0)',
// 	'Accept: */*',
// 	'Accept-Encoding: identity',
// 	'Host: www.baidu.com:88',
// 	'Connection: Keep-Alive',
// 	'Proxy-Connection: Keep-Alive'
// ].join('\r\n') + '\r\n\r\n')

// let buffer2 = new Buffer('CONNECT home.netscape.com:443 HTTP/1.0\r\nUser-agent: Mozilla/4.0\r\n\r\n这里的这些数据会被忽略掉')

// //创建转换器
// let parser = parseRequest()
// //监听头消息
// parser.on('header', header => {
// 	//得到请求头
// 	console.log(header)
// 	console.log(header.toString())  //CONNECT home.netscape.com:443 HTTP/1.0\r\nUser-agent: Mozilla/4.0\r\n\r\n
// })
// //写入数据
// parser.write(buffer1)
