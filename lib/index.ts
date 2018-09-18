//处理http头

interface IRequestHeader {
	type: string
	host: string
	version: string
	[i: string]: string
}

//取函数参数列表
type TFuncArgs<F extends (...args: Array<any>) => any> = F extends (...args: infer R) => any ? R : never

/**
 * 创建一个请求头转换器
 */
export function headerParser() {
	//处理函数
	let handleFuncs = {
		header: undefined! as (req: IRequestHeader) => void,			//获得请求
		error: undefined! as (err: Error) => void,			//发生错误
		line: undefined! as (line: string) => void,			//取得一行
		end: undefined! as () => void						//转换结束
	}
	//是否读取到换行
	let gotCRLF = false
	//是否解析头完毕
	let isEnd = false
	//请求头
	let req: IRequestHeader = {} as any
	//缓存数据
	let cache: Buffer
	//写入缓存并处理
	function parseLine(data: Buffer) {
		let line = (data + '').trim()
		fire('line', line)
		//如果没有转换第一行数据则转换第一行数据
		if (!req.type) {
			let match = line.match(/^(\S+)\s+(\S+)\s+(\S+)$/)
			if (!match) {
				fire('error', new Error(`can't parse http header of [${line}]`))
				fire('end')
				isEnd = true
				return false
			}
			req.type = match[1]
			req.host = match[2]
			req.version = match[3]
		}
		//否则转换其他数据
		else {
			let match = line.match(/^(\S+?):\s*([\s\S]+)$/)
			if (!match) {
				fire('error', new Error(`can't parse http header of [${line}]`))
				return
			}
			req[match[1]] = match[2]
		}
	}
	function add2cache(data: Buffer) {
		if (cache) return Buffer.concat([cache, data])
		return data
	}
	function fire<K extends keyof typeof handleFuncs>(type: K, ...data: TFuncArgs<typeof handleFuncs[K]>) {
	}
	//具体操作
	return {
		/**
		 * 监听事件
		 * @param type 事件类型
		 * @param cb 回调函数
		 */
		once<K extends keyof typeof handleFuncs>(type: K, cb: typeof handleFuncs[K]) {
			handleFuncs[type] = cb
		},
		/**
		 * 写入数据
		 * @param data 要写入的数据
		 */
		write(data: Buffer) {
			if (isEnd) return
			let start = 0;
			for (let i = 0; i < data.length; i++) {
				if (data[i] == 0x0d) continue
				//crlf
				if (data[i] == 0x0a) {
					//遇到连续的换行，则结束
					if (gotCRLF) {
						isEnd = true
						fire('header', req)
						return
					}
					//得到条目，并转换
					parseLine(i == 0 ? cache : add2cache(data.slice(start, i - 1)))
					cache = undefined!
					if (isEnd) return
					//继续处理
					start = ++i
					gotCRLF = true
				}
				else {
					gotCRLF = false
				}
			}
			cache = add2cache(data.slice(start))
		}
	}
}