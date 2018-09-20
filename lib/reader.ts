//内容读取器

export function createReader() {
	//处理函数
	let handleFuncs: { [i: string]: Array<(...args: Array<any>) => any> } = {
		error: [],			//发生错误
		line: [],			//取得一行
		end: [], 			//转换结束
		done: []			//读取完成
	}
	//是否读取到换行
	let gotCRLF = false
	//是否解析头完毕
	let isEnd = false
	//缓存数据
	let cache: Buffer
	//得到和cache拼接后的数据
	function add2cache(data: Buffer) {
		if (cache) return Buffer.concat([cache, data])
		return data
	}
	//触发事件
	function fire(type: string, ...data: Array<any>) {
		//调用数据
		handleFuncs[type].forEach(func => func(...data))
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
	function on(type: string, cb: (...args: Array<any>) => any) {
		handleFuncs[type].push(cb)
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
					fire('done')
					fire('end')
					return i + 1
				}
				//得到条目，并转换
				try {
					fire('line', i == 0 ? cache : add2cache(data.slice(start, i - 1)))
				} catch (e) {
					//报错
					fire('error', e)
					//如果不需要继续则直接退出
					if (!e.goon) {
						isEnd = true
						fire('end')
						return i + 1
					}
				}
				cache = undefined!
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

	/**
	 * 结束渲染
	 */
	function end() {
		isEnd = true
		fire('end')
	}

	//返回操作函数
	return { on, write, end }
}