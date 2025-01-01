# 一、Javascript基础

## 1、数据类型

JavaScript 有七种基本的数据类型：
>[!TIP]
>JavaScript 中的数据类型分为：
>1. 基本数据类型：包括`数值`、`字符串`、`布尔值`、`null`、`undefined`。
>2. 复杂数据类型：包括`对象`、`数组`、`函数`、`正则表达式`。
>
>**[注:]**
> - ES6 新增了 `Symbol` 数据类型。(解决属性名冲突问题,以及实现私有属性和方法)
> - ES11 新增了 `BigInt` 数据类型。(解决 Number类型的安全整数范围有限的问题)

### 1.1、Number类型
#### 1.1.1、定义
:::tip 数值类型
JavaScript 中的数值类型有四种：`Number`、`String`、`Boolean`、`BigInt`。
:::

#### 1.1.2、Number类型方法

| 方法名称      | 描述                                                         |
| ------------- | ---------- |
| toFixed()     | 返回字符串形式的数值，其中小数点后有指定位数的数字             |
| toExponential() | 返回字符串形式的数值，其中指数计数法表示的数字                 |
| toPrecision() | 返回字符串形式的数值，其中数字的精度由参数指定                 |
| toString()    | 返回字符串形式的数值                                           |
| valueOf()     | 返回数值本身                                                   |

### 1.2、Boolean类型
#### 1.2.1、定义
:::tip 布尔类型
JavaScript 中的布尔类型只有两个值：`true` 和 `false`。
:::

#### 1.2.2、注意事项
>[!NOTE]
>通过布尔运算结果为`false`的值有：
>1. `undefined`
>2. `null`
>3. `0`
>4. `NaN`
>5. `''`（空字符串）。



### 1.3、String类型
#### 1.3.2、定义
:::tip 字符串类型
JavaScript 中的字符串类型是一系列字符组成的序列，每个字符都用单引号或双引号括起来。
:::

#### 1.3.3、String类型方法

| 方法名称      | 描述                                                         |
| ------------- | ---------- |
| charAt()      | 返回指定位置的字符                                             |
| charCodeAt()  | 返回指定位置的字符的 Unicode 编码                               |
| concat()      | 连接两个或多个字符串，并返回连接后的字符串                     |
| fromCharCode() | 将 Unicode 编码转换成对应的字符                               |
| indexOf()     | 返回指定字符串在当前字符串中第一次出现的位置，如果不存在则返回-1 |
| lastIndexOf() | 返回指定字符串在当前字符串中最后一次出现的位置，如果不存在则返回-1 |
| localeCompare() | 比较两个字符串，并返回一个数字，表示它们的排序关系             |
| match()       | 用于检索字符串中符合正则表达式的子串，返回一个数组，其中存放匹配的结果 |
| replace()     | 用于替换字符串中符合正则表达式的子串，返回替换后的字符串         |
| search()      | 用于检索字符串中符合正则表达式的子串，返回匹配的第一个位置       |
| slice()       | 用于从字符串中提取子串，并返回子串                             |
| split()       | 用于分割字符串，将字符串分割成多个子串，并将结果存入数组         |
| substr()      | 用于从字符串中提取子串，并返回子串                             |
| substring()   | 用于从字符串中提取子串，并返回子串                             |
| toLocaleLowerCase() | 将字符串转换成小写，根据本地语言环境                           |
| toLocaleUpperCase() | 将字符串转换成大写，根据本地语言环境                           |
| toLowerCase() | 将字符串转换成小写                                           |
| toUpperCase() | 将字符串转换成大写                                           |
| trim()        | 用于去除字符串两端的空格                                       |

### 1.4、Array类型
#### 1.4.1、定义
:::tip 数组类型
JavaScript 中的数组类型是一系列按顺序排列的元素组成的序列，每个元素都用方括号括起来。
:::


#### 1.4.2、核心方法（改变原数组)

| 方法名称  | 描述                                                       |
| :-------- | :--------------------------------------------------------- |
| push()    | 尾部添加                                                   |
| pop()     | 尾部删除                                                   |
| unshift() | 头部添加                                                   |
| shift()   | 头部删除                                                   |
| splice()  | **截取**或者**添加**、**删除**数组的元素                   |
| reverse() | **颠倒数组**中元素的顺序                                   |
| sort()    | 用于数组排序（涉及到函数知识，在函数一节再进行详细的讲解） |



####  1.4.3、常规方法（不改变原数组)

| 方法名称      | 描述                                                         |
| ------------- | ------------------------------------------------------------ |
| concat()      | 合并多个数组                                                 |
| indexOf()     | 根据下标找元素，从前往后查找，返回指定元素的**索引值**，如果不存在返回-1 |
| lastIndexOf() | 根据下标找元素，从后往前查找，返回指定元素的**索引值**，如果不存在返回-1 |
| slice()       | 截取数组中的元素                                             |
| join()        | 将数组转成字符串                                             |



####  1.4.4、高阶方法

| 方法名称      | 描述                                                         |
| ------------- | ------------------------------------------------------------ |
| forEach()     | 遍历数组，没有返回值                                         |
| map()         | 映射数组，批量加工数组，返回值为加工后的数组                 |
| filter()      | 过滤数组，过滤掉不满足的内容，返回满足条件的新数组           |
| every()       | 判断数组中**所有元素**是否满足某个条件，全部满足则返回true，有一个不满足就返回false |
| some()        | 判断数组中**是否存在**,满足某个条件的元素，有一个满足就返回true，全不满足则返回false |
| find（）      | 查找数组中**满足条件的元素**，找到了就返回对应的**元素**，找不到就返回undefined |
| findIndex（） | 查找数组中**满足条件的元素**，找到了就返回对应的**下标**，找不到就返回undefined |
| reduce（）    | 统计数组，计算叠加后的值  `数组.reduce(function (prev,item,index,arr) {},初始值)` |



####  1.4.5、其他方法

| 方法名称        | 描述                                                       |
| --------------- | ---------------------------------------------------------- |
| includes()      | 判断一个数组是否包含指定的值，返回布尔值                   |
| valueOf()       | 返回**数组本身**，所有对象都拥有的方法,表示对该对象求值    |
| Array.from()    | 从`可迭代`或`类数组`对象创建一个新的浅拷贝的数组实例       |
| Array.isArray() | 判断传递的值是否是一个数组                                 |
| Array.values()  | 返回一个新的`数组迭代器对象`，该对象迭代数组中每个元素的值 |






## 2、运算符

>[!TIP]javascript中的运算符分为：
>1. 算术运算符：`+`加、`-`减、`*`乘、`/`除、`%`模、`++`加加、`--`减减
>2. 赋值运算符：`=`、`+=`、`-=`、`*=`、`/=`、`%=`
>3. 关系运算符：`==`、`===`、`!=`、`!==`、`>`、`>=`、`<=`
>4. 逻辑运算符：`&&`与、`||`或、`!`非
>5. 条件运算符：`?:`
>6. 位运算符：`&`、`|`、`^`、`~`、`<<`、`>>`、`>>>`


## 4、注释

JavaScript 有以下注释：
>[!TIP]
>JavaScript 中的注释分为：
>1. 单行注释：以两个斜线开头的注释，直到行尾。
>2. 多行注释：以 `/*` 开头，以 `*/` 结尾的注释，可以跨越多行。

## 5、变量
### 5.1、定义
:::warning 变量
用于存储数据的占位符。
:::

### 5.2、变量声明
>[!TIP] 变量声明方式
> - `var`
> - `let`
> - `const`

#### 5.2.1、var声明
>[!TIP] 定义
>   1. 具有函数作用域或全局作用域，可以跨越多个作用域。
>   2. 可以重复声明同一变量。
>   3. 声明变量时可以不赋值。
>   4. 会进行变量提升。

#### 5.2.2、let声明
>[!TIP] 定义
>   1. 具有块级作用域
>   2. 不能重复声明同一变量。
>   3. 声明变量时可以不赋值。
>   4. 只能在当前代码块内重复声明，不能跨越多个作用域。
#### 5.2.2、const声明
>[!TIP] 定义
>   1. 具有块级作用域。
>   2. 不能重复声明同一变量。
>   3. 声明变量时必须赋值。
>   4. 不能修改值，不能跨越多个作用域。

### 5.3、变量命名规范
>[!TIP] JavaScript变量命名规范
>1. 变量的命名必须由 `数字`,`字母`,`下划线`,`$`组成
>2. 不能以数字开头
>3. 不能使用关键字



## 7、作用域

JavaScript 有以下作用域：
>[!TIP]
>JavaScript 中的作用域分为：
>1. 全局作用域：是指在`函数外部`定义的变量和函数。
>2. 函数作用域：是指在`函数内部`定义的变量和函数。  
>3. 块作用域：是指在`代码块中`定义的变量和函数。


## 9、严格模式

JavaScript 有两种严格模式：
>[!TIP]
>JavaScript 有两种严格模式：
>1. 非严格模式：非严格模式是默认的运行模式，它不要求函数的参数必须使用命名参数。
>2. 严格模式：严格模式是一种特殊的运行模式，它要求函数的参数`必须使用命名参数`。

## 10、事件

JavaScript 有以下事件：
>[!TIP]
>JavaScript 中的事件分为：
>1. 鼠标事件：鼠标事件是指鼠标的各种事件，如点击、双击、拖动等。
>2. 键盘事件：键盘事件是指键盘的各种事件，如按下、松开、按住等。
>3. 表单事件：表单事件是指表单的各种事件，如输入、提交等。
>4. 文档事件：文档事件是指文档的各种事件，如加载、卸载等。

## 11、DOM
>[!TIP] DOM 方法
>1. 获取元素：`getElementById()`、`getElementByTagName()`、`getElementByClassName()`、`querySelector()`、`querySelectorAll()`。
>2. 创建元素：`createElement()`、`createTextNode()`、`createDocumentFragment()`。
>3. 操作元素：`appendChild()`、`insertBefore()`、`removeChild()`、`replaceChild()`、`cloneNode()`。
>4. 操作样式：`getComputedStyle()`、`style.property`、`classList.add()`、`classList.remove()`、`classList.toggle()`。
>5. 操作属性：`getAttribute()`、`setAttribute()`、`removeAttribute()`。
>6. 操作文本：`textContent`、`innerText`、`innerHTML`。
>7. 操作表单：`value`、`checked`、`selected`。
>8. 操作位置：`offsetTop`、`offsetLeft`、`offsetWidth`、`offsetHeight`、`scrollLeft`、`scrollTop`。
>9. 操作事件：`addEventListener()`、`removeEventListener()`、`dispatchEvent()`。

## 12、BOM

JavaScript 有以下：
>[!TIP] BOM 方法
>JavaScript 中的 BOM 方法分为：
>1. 屏幕：`screen.width`、`screen.height`、`screen.colorDepth`。
>2. 历史：`history.length`、`history.back()`、`history.forward()`、`history.go()`。
>3. 窗口：`window.open()`、`window.close()`、`window.moveTo()`、`window.resizeTo()`、`window.scrollBy()`、`window.scrollTo()`。
>4. 导航：`navigator.appName`、`navigator.appVersion`、`navigator.userAgent`。
>5. 客户端：`clientInformation.language`、`clientInformation.platform`。

## 13、JSON

JavaScript 有以下 JSON 方法：
>[!TIP]
>JavaScript 中的 JSON 方法分为：
>1. 解析：`JSON.parse()`。
>2. 字符串化：`JSON.stringify()`。

## 14、正则表达式

JavaScript 有以下正则表达式方法：
>[!TIP]
>JavaScript 中的正则表达式方法分为：
>1. 创建正则表达式：`RegExp()`。
>2. 匹配字符串：`test()`。
>3. 全局匹配字符串：`exec()`。
>4. 替换字符串：`replace()`。
>5. 捕获组：`match()`。

## 15、其他

JavaScript 有以下其他方法：
>[!TIP]
>JavaScript 中的其他方法分为：
>1. 定时器：`setTimeout()`、`clearTimeout()`、`setInterval()`、`clearInterval()`。
>2. 错误处理：`try...catch`、`throw`、`Error()`。
>3. 编码转换：`encodeURI()`、`decodeURI()`、`encodeURIComponent()`、`decodeURIComponent()`。
>4. 数学方法：`Math.abs()`、`Math.ceil()`、`Math.floor()`、`Math.round()`、`Math.max()`、`Math.min()`、`Math.random()`。
>5. 日期方法：`Date()`、`Date.now()`、`Date.parse()`、`Date.UTC()`。
>6. 全局对象：`globalThis`。
>7. 其他：`eval()`、`arguments`、`Intl`、`Proxy`、`Symbol`。    





## 5、Date类型
### 5.1、定义
:::tip 日期类型
JavaScript 中的日期类型是用来表示日期和时间的对象，它提供了一些方法来操作日期和时间。
:::

### 5.2、Date类型方法

| 方法名称      | 描述                                                         |
| ------------- | ---------- |
| Date()        | 创建一个日期对象                                               |
| getDate()     | 获取日期中的天（1-31）                                       |
| getDay()      | 获取日期中的星期（0-6），0 表示星期日                          |
| getFullYear() | 获取四位数的年份                                              |
| getHours()    | 获取日期中的小时（0-23）                                      |
| getMilliseconds() | 获取日期中的毫秒（0-999）                                    |
| getMinutes()  | 获取日期中的分钟（0-59）                                      |
| getMonth()    | 获取日期中的月份（0-11）                                      |
| getSeconds()  | 获取日期中的秒（0-59）                                        |
| getTime()     | 获取日期的毫秒表示                                            |
| getTimezoneOffset() | 获取本地时间与格林威治标准时间的时差（分钟）                   |
| getUTCDate()  | 获取日期（UTC 时间）中的天（1-31）                            |
| getUTCDay()   | 获取日期（UTC 时间）中的星期（0-6），0 表示星期日              |
| getUTCFullYear() | 获取日期（UTC 时间）中的年份                                  |
| getUTCHours() | 获取日期（UTC 时间）中的小时（0-23）                           |
| getUTCMilliseconds() | 获取日期（UTC 时间）中的毫秒（0-999）                         |
| getUTCMinutes() | 获取日期（UTC 时间）中的分钟（0-59）                           |
| getUTCMonth() | 获取日期（UTC 时间）中的月份（0-11）                           |
| getUTCSeconds() | 获取日期（UTC 时间）中的秒（0-59）                             |
| getYear()     | 获取日期的年份（2-3 位）                                      |
| parse()       | 将一个字符串解析为日期对象                                     |
| setDate()     | 设置日期中的天（1-31）                                       |
| setFullYear() | 设置日期中的年份                                              |
| setHours()    | 设置日期中的小时（0-23）                                      |
| setMilliseconds() | 设置日期中的毫秒（0-999）                                    |
| setMinutes()  | 设置日期中的分钟（0-59）                                      |
| setMonth()    | 设置日期中的月份（0-11）                                      |
| setSeconds()  | 设置日期中的秒（0-59）                                        |
| setTime()     | 设置日期的毫秒表示                                            |
| setUTCDate()  | 设置日期（UTC 时间）中的天（1-31）                            |
| setUTCFullYear() | 设置日期（UTC 时间）中的年份                                  |
| setUTCHours() | 设置日期（UTC 时间）中的小时（0-23）                           |
| setUTCMilliseconds() | 设置日期（UTC 时间）中的毫秒（0-999）                         |
| setUTCMinutes() | 设置日期（UTC 时间）中的分钟（0-59）                           |
| setUTCMonth() | 设置日期（UTC 时间）中的月份（0-11）                           |
| setUTCSeconds() | 设置日期（UTC 时间）中的秒（0-59）                             |
| setYear()     | 设置日期的年份（2-3 位）                                      |
| toDateString() | 返回日期的字符串表示（日期部分）                               |
| toGMTString() | 返回日期的字符串表示（日期部分），使用 GMT 时间                  |
| toISOString() | 返回日期的字符串表示（日期部分），使用 ISO 8601 格式            |
| toJSON()      | 返回日期的字符串表示（日期部分），使用 JSON 序列化              |
| toLocaleDateString() | 返回日期的字符串表示（日期部分），根据本地语言环境               |
| toLocaleString() | 返回日期的字符串表示（日期部分），根据本地语言环境               |
| toLocaleTimeString() | 返回日期的字符串表示（时间部分），根据本地语言环境               |
| toTimeString() | 返回日期的字符串表示（时间部分）                               |
| toUTCString() | 返回日期的字符串表示（日期部分），使用 UTC 时间                  |

## 6、Math类型
### 6.1、定义
:::tip 数学类型
JavaScript 中的数学类型提供了一些常用的数学函数。
:::

### 6.2、Math类型方法

| 方法名称      | 描述                                                         |
| ------------- | ---------- |
| abs()         | 返回数字的绝对值                                               |
| acos()        | 返回数字的反余弦值                                             |
| asin()        | 返回数字的反正弦值                                             |
| atan()        | 返回数字的反正切值                                             |
| atan2()       | 返回两个坐标之间的反正切值                                     |
| ceil()        | 返回大于或等于该数字的最小的整数                               |
| cos()         | 返回数字的余弦值                                               |
| exp()         | 返回 e 的指数值                                                |
| floor()       | 返回小于或等于该数字的最大的整数                               |
| log()         | 返回数字的自然对数                                             |
| max()         | 返回给定参数中的最大值                                         |
| min()         | 返回给定参数中的最小值                                         |
| pow()         | 返回第一个参数的第二个参数的幂值                               |
| random()      | 返回 0 到 1 之间的随机数                                       |
| round()       | 返回数字的四舍五入值                                           |
| sin()         | 返回数字的正弦值                                               |
| sqrt()        | 返回数字的平方根                                               |
| tan()         | 返回数字的正切值                                               |

## 7、RegExp类型
### 7.1、定义
:::tip 正则表达式类型
JavaScript 中的正则表达式类型是用来表示正则表达式的对象，它提供了一些方法来操作正则表达式。
:::

### 7.2、RegExp类型方法

| 方法名称      | 描述                                                         |
| ------------- | ---------- |
| exec()        | 用于检索字符串中符合正则表达式的子串，返回一个数组，其中存放匹配的结果 |
| test()        | 用于检测字符串是否符合正则表达式，返回 true 或 false。      |
| toString()    | 返回正则表达式的字符串形式。                                 |

## 8、JSON类型
### 8.1、定义
:::tip JSON类型
JavaScript 中的 JSON 类型是用来表示 JSON 对象的对象，它提供了一些方法来操作 JSON 对象。
:::

### 8.2、JSON类型方法

| 方法名称      | 描述                                                         |
| ------------- | ---------- |
| parse()       | 将一个 JSON 字符串转换为一个 JavaScript 对象。               |
| stringify()   | 将一个 JavaScript 对象转换为一个 JSON 字符串。               |    
## 9、全局对象
### 9.1、定义
:::tip 全局对象
JavaScript 中的全局对象是一些预定义的对象，它们在任何地方都可以访问。
:::

### 9.2、全局对象

| 对象名称      | 描述                                                         |
| ------------- | ---------- |
| Object        | 用于处理对象及其原型的构造函数。                             |
| Function      | 用于创建函数的构造函数。                                       |
| Boolean       | 用于处理布尔值的构造函数。                                     |
| Symbol        | 用于创建唯一的标识符的构造函数。                               |
| Error         | 用于创建错误对象的构造函数。                                   |
| EvalError     | 用于创建 EvalError 对象的构造函数。                             |
| RangeError    | 用于创建 RangeError 对象的构造函数。                            |
| ReferenceError | 用于创建 ReferenceError 对象的构造函数。                         |
| SyntaxError   | 用于创建 SyntaxError 对象的构造函数。                           |
| TypeError     | 用于创建 TypeError 对象的构造函数。                             |
| URIError      | 用于创建 URIError 对象的构造函数。                              |
| Number        | 用于处理数字值的构造函数。                                     |
| Math          | 用于处理数学计算的对象。                                       |
| Date          | 用于处理日期和时间的构造函数。                                 |
| String        | 用于处理字符串的构造函数。                                     |
| RegExp        | 用于处理正则表达式的构造函数。                                 |
| Array         | 用于处理数组的构造函数。                                       |
| Map           | 用于处理 Map 数据结构的构造函数。                               |
| Set           | 用于处理 Set 数据结构的构造函数。                               |
| WeakMap       | 用于处理弱 Map 数据结构的构造函数。                             |
| WeakSet       | 用于处理弱 Set 数据结构的构造函数。                             |
| JSON          | 用于处理 JSON 对象及其字符串的构造函数。                       |
| console       | 用于提供控制台输出的对象。                                     |
| window        | 全局对象，表示当前的浏览器窗口。                               |
| document      | 全局对象，表示当前的 HTML 文档。                              |
| localStorage  | 用于存储本地数据（浏览器关闭后将被清除）的对象。                 |
| sessionStorage | 用于存储会话数据（页面关闭后将被清除）的对象。                 |





## 3、字符串的常用方法


| 方法名        | 描述                                                         |
| ------------- | ------------------------------------------------------------ |
| charAt()      | 根据下标找字符串                                             |
| charCodeAt()  | 根据下标找字符串的编码                                       |
| toUpperCase() | 将字符串中的字母转换成大写                                   |
| toLowerCase() | 将字符串中的字母转换成小写                                   |
| slice()       | 截取字符串，方法返回的子串**包括开始处的字符**，但**不包括结束处的字符** `slice(start,end)` |
| substr()      | 截取字符串，方法返回的子串**包括开始处的字符** 且规定**截取长度**`substr(start,length)` |
| substring()   | 截取字符串中位于两个指定下标之间的字符 `substring(from, to)` |
| trim()        | 去除字符串`两边`的空格                                         |
| trimStart()   | 去除字符串`开头`的空格                                         |
| trimEnd()     | 去除字符串`结尾`的空格                                         |
| trimLeft()    | 去除字符串`左边`的空格                                         |
| trimRight()   | 去除字符串`右边`的空格                                         |
| replace()     | 用一些字符替换另一些字符，或替换一个与`正则表达式`匹配的子串 |
| replaceAll()  | `批量替换`字符串                                               |
| startsWith()  | 判断字符串是否`以某某开头`                                     |
| endsWidth()   | 判断字符串是否`以某某结尾`                                     |
| split()       | 将字符串转成`数组`                                             |
| includes()    | 判断字符串是否`包含`某一个字符                                 |
| concat()      | `合并`字符串                                                   |
| indexOf()     | 根据字符串找`下标`,从`前`往后找                                  |
| lastIndexOf() | 根据字符串找`下标`,从`后`往前找                                  |





## 3、函数方法

| 方法名称            | 描述                                                         |
| ------------------- | ------------------------------------------------------------ |
| Function.apply()    | 以给定的 `this` 值和作为数组（或`类数组对象`)提供的 `arguments` 调用该函数。 |
| Function.bind()     | 创建一个新函数，当调用该新函数时，它会调用原始函数并将其 `this` 关键字设置为给定的值，同时，还可以传入一系列指定的参数，这些参数会插入到调用新函数时传入的参数的前面。 |
| Function.call()     | 以给定的 `this` 值和逐个提供的参数调用该函数。               |
| Function.toString() | 返回一个表示该函数源码的字符串。                             |





## 4、对象方法
| 方法名称                  | 描述                                                         |
| ------------------------- | ------------------------------------------------------------ |
| Object.assign()           | 将一个或者多个*源对象*中所有`可枚举`的`自有属性`复制到**目标对象**，并返回修改后的目标对象。 |
| Object.create()           | 以一个现有对象作为原型，创建一个新对象                       |
| `Object.defineProperty()` | 数据劫持，直接在一个对象上定义一个新属性，或修改其现有属性，并返回此对象。 |
| Object.entries()          | 返回一个数组，包含给定对象自有的可枚举字符串键属性的键值对。 |
| Object.hasOwn()           | 如果指定的对象**自身**有指定的属性，则返回 true。如果属性是**继承**的或者**不存在**，该方法返回 false。 |
| Object.is()               | 确定两个值是否为**相同值**。                                 |
| Object.keys()             | 返回一个由给定对象自身的可枚举的字符串键`属性名`组成的数组。 |
| Object.values()           | 返回一个给定对象的自有可枚举字符串键`属性值`组成的数组       |
| Object.valueOf()          | 将 `this` 值转换成对象。该方法旨在被派生对象重写，以实现自定义类型转换逻辑。 |
| Object.setPrototypeOf()   | 可以将一个指定对象的原型（即内部的 `[[Prototype]]` 属性）设置为另一个对象或者 [`null`](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Operators/null)。 |

## 5、正则表达式方法

| 方法名称                  | 描述                                                         |
| ------------------------- | ---------- |
| RegExp.prototype.exec()   | 用于检索字符串中符合正则表达式的子串，返回一个数组，其中存放匹配的结果。 |
| RegExp.prototype.test()   | 用于检测字符串是否符合正则表达式，返回 true 或 false。      |
| RegExp.prototype.toString() | 返回正则表达式的字符串形式。                                 |
| String.prototype.match()   | 用于检索字符串中符合正则表达式的子串，返回一个数组，其中存放匹配的结果。 |
| String.prototype.replace() | 用于替换字符串中符合正则表达式的子串，返回替换后的字符串。     |
| String.prototype.search()  | 用于检索字符串中符合正则表达式的子串，返回匹配的第一个位置。  |
| String.prototype.split()   | 用于分割字符串，将字符串分割成多个子串，并将结果存入数组。      |    