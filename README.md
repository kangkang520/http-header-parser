# HTTP-HEADER-PARSER

HTTP请求头转换工具

## 安装
```
npm install --save http-header-parser
```

## 使用
基本用法：

```ts
//导入
import { headerParser } from 'http-header-parser'
//创建转换器
let parser = headerParser()
//监听头消息
parser.on('header', header=>{
	//得到请求头
	console.log(header)
	console.log(header.toString())	//CONNECT home.netscape.com:443 HTTP/1.0\r\nUser-agent: Mozilla/4.0\r\n\r\n
})
//写入数据
let buffer = new Buffer('CONNECT home.netscape.com:443 HTTP/1.0\r\nUser-agent: Mozilla/4.0\r\n\r\n这里的这些数据会被忽略掉')
parser.write(buffer)
```

//也可以将数据一点点写入，例如：
```ts
let bufferList = [
	new Buffer('CONNECT home.netscape.c'),
	new Buffer('om:443 HTTP/1.0\r'),
	new Buffer('\nUser-agent: Mozi'),
	new Buffer('lla/4.0\r\n'),
	new Buffer('\r\n这里的这些数据会被忽略掉'),
]
bufferList.forEach(buf=>parser.write(buf))
```

## 事件

* header 转换完毕，得到头
* error 转换出错
* line 获取到一行数据的时候
* end 转换结束（首行出错时会结束）