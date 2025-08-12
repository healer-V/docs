# HTTP/HTTPS协议
::: details 网络学习路线
>[!danger] 
>1. 五层网络模型
>2. TCP/IP协议族
>3. HTTP协议
>4. Postman/Apifox
>5. Ajax
>6. 跨域以及解决方案
>7. JWT
>8. cookie
>9. session
>10. 文件上传
>11. 文件下载
>12. 缓存协议
>13. CSRF
>14. XSS
>15. 网络性能优化
>16. 分片传输
>17. 域名与DNS
>18. SSL/TLS/HTTPS
>19. HTTP2
>20. WebSocket
:::


## 一、HTTP协议
>[!tip] HTTP 超文本传输协议
>- 是一种用于从 **服务器** 传输超文本到本地 **浏览器** 的 **应用层** 协议。
>- HTTP协议是建立在TCP/IP协议之上的。
>- **端口号**: 默认端口号为80。
>- **纯文本**：HTTP协议是纯文本协议，信息是明文传输。
>- **持久性**：HTTP协议支持持久连接，可以节省通信时间。
>- **无连接**：HTTP协议是无连接的，服务器不会保持连接状态。
>- **无状态**：HTTP协议是无状态的，即不保存客户端的状态信息。
>- **不安全**：HTTP 本身不提供加密机制，任何由`HTTP`发送的数据都可能被中间人截获、查看或修改。
>- **不受限的数据大小**：HTTP 没有限制在单个请求/响应中传输数据的大小，这可能导致传输大量数据时的性能问题。


### 协议格式
>[!tip] 协议格式
>- 请求行：请求方法、请求URI、HTTP版本。
>- 状态行：HTTP版本、状态码、状态消息。
>- 请求头：请求头字段、值。
>- 空行：请求头与请求体之间的空行。
>- 请求体：请求正文，可以是任意格式。


### 请求方法
>[!tip] 请求方法
>- `GET`：获取资源（只读操作）数据通过 URL 参数传递（长度受限）。
>- `POST`：创建资源或提交非幂等操作,数据通过请求体传输。
>- `PUT`：上传文件到服务器，用于更新资源（读写操作）。
>- `DELETE`：删除资源（写操作）。
>- `DELETE`：请求服务器删除指定的页面。
>- `HEAD`：类似于GET请求，只不过返回的响应中没有具体的内容，用于获取报头。
>- `OPTIONS`：允许客户端查看服务器的性能。
>- `TRACE`：回显服务器收到的请求，主要用于测试或诊断。

### 状态码
>[!tip] 状态码
>- 1xx：指示信息--表示请求已被接收，继续处理。
>- 2xx：成功--表示请求已成功被服务器接收、理解、并接受。
>- 3xx：重定向--要完成请求必须进行更进一步的操作。
>- 4xx：客户端错误--请求有语法错误或请求无法实现。
>- 5xx：服务器错误--服务器未能实现合法的请求。

### 请求参数
>[!tip] 请求参数
>- Query参数: URLencoded形式的参数，在URL中以?分割,以&分割参数和值。例:`?a=1&b=2`
>- Params参数: 动态路由参数，在URL中以冒号`:`分割,以`/`分割参数和值。例:`/user/:id`
>- Body参数: 请求体,以json形式传递body参数,分为 `urlencoded`、`json`、`form-data`(表单数据，文字或者文件）三种形式。

### http报文
>[!tip] http报文
>- 请求报文：客户端在发送请求时，要交给服务器的信息。由请求方法、URL、HTTP版本、请求头、空行和请求体组成。
>- 响应报文：服务器要响应客户端是信息。由HTTP版本、状态码、状态消息、响应头、空行和响应体组成。

::: details http 报文示例
``` shell
# GET 请求报文 
GET /?a=1&b=2 HTTP/1.1   #报文首行。可以看到，get请求的请求参数在报文首行

#报文头
Host: 127.0.0.1:3000
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:86.0) Gecko/20100101 Firefox/86.0
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8
Accept-Language: zh-CN,zh;q=0.8,zh-TW;q=0.7,zh-HK;q=0.5,en-US;q=0.3,en;q=0.2
Accept-Encoding: gzip, deflate
Connection: keep-alive
Upgrade-Insecure-Requests: 1
Pragma: no-cache
Cache-Control: no-cache
                      
                      #空行  (空行就是一行空的东西)
                       
                      #报文体。可以知道，get报文没有请求体

# POST 请求报文

POST /getinfo HTTP/1.1     #报文首行

#报文头
Host: localhost:3000      
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:86.0) Gecko/20100101 Firefox/86.0
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8
Accept-Language: zh-CN,zh;q=0.8,zh-TW;q=0.7,zh-HK;q=0.5,en-US;q=0.3,en;q=0.2
Accept-Encoding: gzip, deflate
Content-Type: application/x-www-form-urlencoded
Content-Length: 25
Origin: http://127.0.0.1:3000
Connection: keep-alive
Referer: http://127.0.0.1:3000/?a=1&b=2
Upgrade-Insecure-Requests: 1
Pragma: no-cache
Cache-Control: no-cache

                          #空行

#报文体，可以看到，post请求的请求体是请求参数
usernum	"123456789"
psd	"123"




# 响应报文
HTTP/1.1 200 OK      # 报文首行

#报文头
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 35
ETag: W/"23-tR+4/Pk+lnFJxMj4dOIh6xp5er8"
Date: Wed, 04 Aug 2021 07:38:28 GMT
Connection: keep-alive
Keep-Alive: timeout=5

                    #空行

#报文体（服务器响应客户端的内容）
status:1
token:'dasdassad'


```

:::


### http报头
>[!tip] 报头
>- Accept：可接受的响应内容类型。
>- Accept-Charset：可接受的字符集。
>- Accept-Encoding：可接受的内容编码。
>- Accept-Language：可接受的语言。
>- Authorization：授权信息。
>- Cache-Control：指定请求或响应的缓存机制。
>- Connection：连接的类型（keep-alive）。
>- Content-Length：请求内容的长度。
>- Content-Type：请求内容的类型。
>- Cookie：服务器发送的Cookie信息。


## 二、HTTPS协议
>[!tip] HTTPS协议
>- **安全传输**：HTTPS协议是HTTP协议的安全版，即HTTP协议的安全版本。
>- **证书认证**：HTTPS协议需要到CA（证书颁发机构）申请证书，并部署SSL证书。
>- **端口号**：HTTPS协议的默认端口号为443。
>- **传输层**：传输层安全协议（TLS/SSL）建立在TCP/IP协议之上，提供安全通信。
>- **加密机制**：HTTPS协议采用公钥加密、数字签名、对称加密、哈希算法等加密机制，确保通信安全。


### 加密方式
>[!tip] 加密方式
>- SSL/TLS协议：即**安全套接层**/**传输层**安全协议。用于在客户端和服务器之间建立一个加密的通信通道。在该通道中，数据传输前先被加密，到达接收方后再解密，增加了数据的隐私性和安全性。
>- 公钥加密：公钥加密是一种非对称加密算法，公钥加密算法使用公钥加密数据，私钥解密数据。
>- 数字签名：数字签名是一种消息认证技术，它可以验证数据完整性、身份认证和不可否认性。

### 非对称加密
>[!tip] 
>- 客户端/用户/浏览器在通信的时候给服务器提供公钥，然后通过公钥进行加密，服务器通过私钥进行解密。
>- 私钥只能在该特定服务器上找到，其他任何人都没有。
>
>- 加密过程
>   - 客户端向服务器发送公钥。
>   - 服务器生成一个随机数，用公钥加密随机数，发送给客户端。
>   - 客户端用私钥解密随机数，生成一个对称密钥。


### 证书
>[!tip] 证书
>- 服务器证书：服务器证书是CA颁发给服务器的，包含服务器的公钥和其他相关信息。
>- 客户端证书：客户端证书是用户颁发给浏览器的，包含用户的公钥和其他相关信息。
>- CA证书：CA证书是CA颁发给其他CA的，包含CA的公钥和其他相关信息。


## 三、HTTP协议的缺陷
>[!tip] HTTP协议的缺陷
>- 无状态：HTTP协议是无状态的，即服务器不会保存客户端的状态信息。
>- 明文传输：HTTP协议是明文传输的，数据在传输过程中容易被窃听、篡改、伪造。
>- 队头阻塞：HTTP协议的队头阻塞问题，即客户端在等待服务器响应时，其他请求只能排队等待。
>- 连接数限制：HTTP协议的连接数限制，即浏览器对同一域名的连接数有限制。

## 四、HTTPS协议的优点
>[!tip] HTTPS协议的优点
>- 加密传输：HTTPS协议是加密传输的，数据在传输过程中被加密，安全性更高。
>- 身份认证：HTTPS协议可以验证服务器的身份，防止中间人攻击。
>- 保护隐私：HTTPS协议可以保护用户的隐私信息，防止数据泄露。
>- 完整性保护：HTTPS协议可以提供数据完整性保护，防止数据被篡改。
>- 缓存机制：HTTPS协议可以提供缓存机制，减少网络流量。

## 五、HTTPS协议的缺点
>[!tip] HTTPS协议的缺点
>- 性能损耗：HTTPS协议的性能损耗，即加密解密的性能损耗。
>- 资源消耗：HTTPS协议的资源消耗，即加密解密的资源消耗。
>- 复杂部署：HTTPS协议的复杂部署，需要购买证书、配置服务器、配置客户端。

## 六、HTTPS协议的部署
>[!tip] HTTPS协议的部署
>- 购买证书：HTTPS协议需要购买证书，证书可以是免费的，也可以是收费的。
>- 配置服务器：HTTPS协议的服务器需要配置SSL证书，并部署SSL证书。
>- 配置客户端：HTTPS协议的客户端需要安装支持SSL的浏览器插件，并配置信任证书。

## 七、HTTPS协议的优化
>[!tip] HTTPS协议的优化
>- 减少资源消耗：HTTPS协议的资源消耗较高，可以采用压缩、缓存等方式减少资源消耗。
>- 减少连接数：HTTPS协议的连接数限制，可以采用长连接、连接池等方式减少连接数。
>- 优化配置：HTTPS协议的配置优化，可以采用自动化脚本、配置管理工具等方式优化配置。