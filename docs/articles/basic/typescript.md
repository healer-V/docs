# TypeScript 基础

> 认识 TypeScript
>
> TypeScript 是 JavaScript 的一个超集，强类型的定义。
>
> - 1、规范我们的代码
> - 2、代码编译阶段就能及时发现错误
> - 3、在原生 js 的基础上加上了一层类型定义
>
> 注意：TypeScript 无法在浏览器中运行。需要借助编译器，将 TS 转为 JS。

## 1. TypeScript 与JS的关联
>[!tip]关联
> 1. TypeScript 是 JavaScript 的超集。
>   - TS 在 JS 的基础上进行了扩展，包含了 JS 的所有语法和功能，并添加了一些新的特性和功能，如类型系统、接口、模块等。
> 2. TS 编译为 JS。
>   - TS 代码需要通过编译器编译成 JS 代码才能在浏览器或其他 JS 运行环境中执行。编译过程中，TS 的类型信息会被移除，只保留可执行的 JS 代码，这使得 TS 可以与现有的 JS 生态系统无缝集成。
> 3. 共享生态系统。
>   - TS 和 JS 共享大部分的生态系统，包括包管理工具（如 npm、yarn）、构建工具（如 webpack、gulp）和代码编辑器（如 Visual Studio Code）等。许多 JS 库和框架都可以在 TS 项目中使用，同时，也有很多 TS 编写的库和框架可供 JS 项目使用。


## 2. TypeScript 与JS的区别
>[!tip]区别
> 1. 类型系统。
>   - JS：弱类型语言，变量的数据类型在运行时确定，变量可以随时被赋予不同类型的值，在代码执行过程中才可能发现类型相关的错误。
>   - TS：强类型语言，要求在声明变量、函数参数和返回值等时指定数据类型，通过类型检查可以在编译阶段发现类型不匹配等错误，提高代码的稳定性和可维护性。
> 2. 语法特性。
>   - JS：语法灵活，支持函数式编程和面向对象编程的混合编程风格，具有简洁的语法结构和动态特性，如匿名函数、闭包、原型链继承等。
>   - TS：增加了类、接口、模块、枚举等面向对象编程的特性，支持更严格的代码结构和规范，通过接口可以定义对象的结构和行为规范，通过模块可以更好地组织和管理代码。
> 3. 编译与执行。
>   - JS：解释型语言，浏览器或其他运行环境可以直接执行 JS 代码，代码在运行时逐行解释执行，不需要提前编译。
>   - TS：需要先将 TS 代码编译成 JS 代码，然后再由浏览器或其他 JS 运行环境执行，编译过程可以检查代码中的语法错误和类型错误。




## 3、TypeScript 开发环境

| 名称                | 描述                                                         |
| :------------------ | :----------------------------------------------------------- |
| TypeScript 官方地址 | https://www.typescriptlang.org/                              |
| 开发环境 node.js    | 搭建代码的运行环境（在官网下载傻瓜式安装即可）               |
| node 指令           | `node -v` 查看 node 版本；可以用来检查 node 是否安装成功，如果显示出版本号，则说明安装成功了。 |
| TypeScript 环境     | `npm install -g typescript` 全局安装 TypeScript 编译器       |
| TypeScript 指令     | `tsc -v`查看 TypeScript 版本； 可以用来检查 ts 是否安装成功，如果显示出版本号，则说明安装成功了。 |
| 开发工具            | vscode 支持 TypeScript 的代码编辑器                          |
| 创建 ts 文件        | 文件名 `.ts` 以后缀`.ts`结尾表示 TypeScript 文件格式。例如：`main.ts` |
| 编译 ts 文件        | `tsc xxx.ts` 将 ts 文件编译成 js 文件，会出现 main.js 文件。 例如：`tsc main.js` 编译后会生成 main.js 文件 |
| 执行 js 文件        | `node xxx.js` 通过 node 执行 js 文件。例如：`node main.js`，执行 main.js 文件 |

## 4、TypeScript 工作流

| 名称         | 描述                                                         |
| :----------- | :----------------------------------------------------------- |
| 工作流       | 写好 ts 代码后，通过 TypeScript 编译器编译为 js，然后再使用 js |
| 初始化项目   | `npm init;` npm 管理项目，npm init 执行后， 可以一直回车，使用默认选项， 结束后生成 package.json 文件 |
| 安装插件     | `npm install --save-dev lite-server；` lite-server 用于开发环境的轻量级服务器。 此服务器可以根据项目根目录下 index.js 文件自动部署在 localhost:3000 上，当编译完成以后会自动刷新页面。 |
| 依赖安装位置 | devDependencies：依赖只参与项目开发，上线不需要打包到生产环境中; dependencies：依赖参与项目开发，也会打包到生产环境中 |

## 5、定义变量/常量

| 名称            | 描述                                                         |
| :-------------- | :----------------------------------------------------------- |
| let，const，var | const：声明常量 let：声明变量，解决 var 带来的作用域困难的问题 var：声明变量 |

## 6、TypeScript 基本类型

| 名称      | 描述                                                         |
| :-------- | :----------------------------------------------------------- |
| number    | **数字类型：** ① 可以表示整数，浮点数以及正负数 ② 写法：let num:number=1； |
| string    | **字符串类型：** ① 可以用单引号，双引号，以及反引号表示字符串 ② 写法: `let str:string='cuihua'` |
| boolean   | **布尔类型：** `true，false` **写法：** `let isTrue=true;` **会自动映射类型** `let b:boolean=false;` **手动映射类型** |
| Enum      | **枚举类型：** ① 写法： enum Color{red,green,blue}; let color = Color.blue ; console.log(color); 结果是索引 2 ② 自定义数字顺序： enum Color{red=5,green,blue}; ③ 或者是不用数字： enum Color{red='red',green,blue}; |
| any       | **任意类型：** ① 不知道是什么类型的时候，可以用 any ② 写法： let randomValue :any = 666; 可以修改为任意类型 |
| unkown    | **未知类型：** ① 不保证类型，但是能保证类型安全 ② 写法： let randomValue:unkown =666 |
| void      | 不存在：函数在没有返回值的时候，为 void 类型 function fn() : void {} |
| undefined | 存在，但是没有值： function fn():undefined {return;} 返回值空值 |
| never     | 不能停止，never 类型：例如一个函数永远执行不完 function fn(a:string):never{throw{message}} 函数中抛出异常 while 循环（执行不完的代码） |

### 6.1、Array 数组

```tsx
// ①  []
// ②  数组中可以存放任意类型的数据
let b: boolean = false;
// ③  js中数组的宽容度非常大，而ts也继承了这一点
// 写法：
let list1: number[] = [1, 2, 3, 4];
let list2: Array<number> = [1, 2, 3, 4];
let list3 = [1, 2, 3, 4];
let list5: any[] = [1, 2, "4"];
// 存放任何类型的数据
```

## 7、高级类型

| 名称     | 描述                                                         |
| :------- | :----------------------------------------------------------- |
| union    | 联合类型： 写法： let union:string \| number （定义多种类型，中间用\|隔开） let union1: 0 \| 1 \| 2 （固定取值类型） |
| literal  | 预定义（字面量）类型：写法：let literal: 1\| '2' \| true \| [1,2,3,4] |
| nullable | 可控类型                                                     |

## 8、类型适配（类型断言）

| 名称            | 描述                                                         |
| :-------------- | :----------------------------------------------------------- |
| Type Assertions | ① 通知 typescript 进行类型适配的过程就叫做类型断言 ② 写法： let message: any; message = 'jack'; message.endsWith('k') (1) 方式 `let ddd = (<string>message).endsWith("k")` (2) 方式 let dd2 = (message as string).endsWith("k") 注释：message 初始 any 类型，即使赋值为字符串，也是 any 类型，无法使用编辑器内置的联想功能，给出字符串相关的属性和方法提示信息。所以需要进行类型适配(`<string>message`)或者(message as string) |

## 9、函数类型

| 名称     | 描述                                                         |
| :------- | :----------------------------------------------------------- |
| function | ① 基本用法与 es6 一样 ② 参数绑定类型 let log = (message: string) => console.log(message) log('jack') ③ 使用?可以省略参数，不传值默认为 undefined let log = (message: string, code?: number) => console.log(message) log('jack') ④ 设置参数默认值 let log = (message: string, code: number = 0) => console.log(message) log('jack') 注意：不管是可选参数，还是默认参数，都必须在参数列表末尾，按照从后往前的顺序进行排列 |

## 10、对象类型

| 名称   | 描述                                                         |
| :----- | :----------------------------------------------------------- |
| object | **对象类型：** ① key to type 键类型对。编辑器会自动匹配类型，或者手动进行类型匹配 ② 不能使用 object 来笼统定义{}，调用的时候会报错 ③ object 类型可以认为是 any 类型的一个子集 |

## 11、接口

| 名称      | 描述                                                         |
| :-------- | :----------------------------------------------------------- |
| interface | **接口：高内聚，低耦合** ① 功能相关的事务放在一个集合中形成一个模块，模块之间应该是相互独立的，保持低耦合的状态 ② 使用方式：给函数参数定义接口类型 interface Point { x: number, y: number } let drawPoint = (point: Point) => { console.log({ x: point.x, y: point.y }) } drawPoint({ x: 23, y: 34 }) 把所有相关联的属性和方法放在一个集合中 |

## 12、类

| 名称  | 描述                                                         |
| :---- | :----------------------------------------------------------- |
| class | 使用 class 关键字定义的称之为类。可以使用 implements 关键字，通过类来实现某个接口 interface ① 写法： interface xx{} class x implements xx{} ② js 中构造函数不能重载，一个类有且仅有一个 constructor。如果实例化的时候不知道传入的值，可以使用?(可选项)，或者赋值默认值 ③ 访问修饰符（public，private，protected），在声明构造函数的同时，顺便完成成员变量的声明以及初始化 |

## 13、访问修饰符

| 名称      | 描述                                                         |
| :-------- | :----------------------------------------------------------- |
| public    | 公有的（属性和方法默认是公有的）                             |
| private   | 私有的 ① 私有变量一般以下划线开头来表示，例如： _x ② set 和 get 处理私有变量（编译器版本需要在 es5 以上）`tsc -t es5 xx.ts` |
| protected | 保护的                                                       |

## 14、模块

| 名称   | 描述                                                         |
| :----- | :----------------------------------------------------------- |
| module | ① 一个文件可以理解为一个模块 ② 与 es6 中的 module 相似，有两种导入导出方式。模块内的代码需要 export 导出，然后其他文件中使用 import 导入 |

## 15、泛型

| 名称     | 描述                    |
| :------- | :---------------------- |
| Generics | ① 类型+<> 泛型 ② 多泛型 |

```tsx
// 具体写法
let lastInArray = <T,>(arr: Array<T>) => {
  return arr[arr.length - 1];
};
// 或者
let lastInArray = <T,>(arr: T[]) => {
  return arr[arr.length - 1];
};
const l1 = lastInArray([1, 2, 3, 4]);
const l2 = lastInArray(["a", "s"]);
// 多泛型
let makeTuple = <T, Y>(x: T, y: Y) => [x, y];
const v1 = makeTuple(1, "i");
```