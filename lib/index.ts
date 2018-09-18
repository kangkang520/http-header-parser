//处理http头

export class RequestHeader {
	//其他数据
	[i: string]: any

	//构造一个请求头
	constructor(public type: string, public host: string, public version: string) {
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
		let buffer = [`${this.type} ${this.host} ${this.version}`]
		Object.keys(this).forEach(key => {
			let val = this[key]
			if (typeof val !== 'string' || (key == 'type' || key == 'host' || key == 'version')) return
			buffer.push(`${key}: ${val}`)
		})
		return buffer.join('\r\n') + '\r\n\r\n'
	}
}

//取函数参数列表
type TFuncArgs<F extends (...args: Array<any>) => any> = F extends (...args: infer R) => any ? R : never

type ArrayType<A extends Array<any>> = A extends Array<infer R> ? R : A

/**
 * 创建一个请求头转换器
 */
export function headerParser() {
	//处理函数
	let handleFuncs = {
		header: [] as Array<(header: RequestHeader) => void>,			//获得请求
		error: [] as Array<(error: Error) => void>,			//发生错误
		line: [] as Array<(line: string) => void>,			//取得一行
		end: [] as Array<() => void>						//转换结束
	}
	//是否读取到换行
	let gotCRLF = false
	//是否解析头完毕
	let isEnd = false
	//请求头
	let header: RequestHeader
	//缓存数据
	let cache: Buffer
	//写入缓存并处理
	function parseLine(data: Buffer) {
		let line = (data + '').trim()
		fire('line', line)
		//如果没有转换第一行数据则转换第一行数据
		if (!header) {
			let match = line.match(/^(\S+)\s+(\S+)\s+(\S+)$/)
			if (!match) {
				fire('error', new Error(`can't parse http header of [${line}]`))
				fire('end')
				isEnd = true
				return false
			}
			header = new RequestHeader(match[1], match[2], match[3])
		}
		//否则转换其他数据
		else {
			let match = line.match(/^(\S+?):\s*([\s\S]+)$/)
			if (!match) {
				fire('error', new Error(`can't parse http header of [${line}]`))
				return
			}
			header.put(match[1], match[2])
		}
	}
	//得到和cache拼接后的数据
	function add2cache(data: Buffer) {
		if (cache) return Buffer.concat([cache, data])
		return data
	}
	//触发事件
	function fire<K extends keyof typeof handleFuncs>(type: K, ...data: TFuncArgs<ArrayType<typeof handleFuncs[K]>>) {
		//调用数据
		(handleFuncs[type] as Array<any>).forEach(func => func(...data))
		//如果结束则应删除数据
		if (type == 'end') {
			Object.keys(handleFuncs).forEach(key => {
				delete (handleFuncs as any)[key]
			})
		}
	}
	/**
	 * 监听事件
	 * @param type 事件类型
	 * @param cb 回调函数
	 */
	function on(type: 'header', cb: ArrayType<typeof handleFuncs['header']>): void
	function on(type: 'error', cb: ArrayType<typeof handleFuncs['error']>): void
	function on(type: 'end', cb: ArrayType<typeof handleFuncs['end']>): void
	function on(type: 'line', cb: ArrayType<typeof handleFuncs['line']>): void
	function on<K extends keyof typeof handleFuncs>(type: K, cb: ArrayType<typeof handleFuncs[K]>) {
		(handleFuncs[type] as any).push(cb)
	}
	/**
	 * 写入数据
	 * @param data 要写入的数据
	 */
	function write(data: Buffer): number {
		if (isEnd) return 0
		let start = 0;
		for (let i = 0; i < data.length; i++) {
			if (data[i] == 0x0d) continue
			//crlf
			if (data[i] == 0x0a) {
				//遇到连续的换行，则结束
				if (gotCRLF) {
					isEnd = true
					fire('header', header)
					return i + 1
				}
				//得到条目，并转换
				parseLine(i == 0 ? cache : add2cache(data.slice(start, i - 1)))
				cache = undefined!
				if (isEnd) return i + 1
				//继续处理
				start = ++i
				gotCRLF = true
			}
			else {
				gotCRLF = false
			}
		}
		cache = add2cache(data.slice(start))
		return data.length
	}
	//返回操作函数
	return { on, write }
}