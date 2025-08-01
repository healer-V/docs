# TypeScript 基础
>[!tip] 为什么需要 TypeScript
> - TypeScript 是 JavaScript 的一个超集，强类型的定义。
> 1. **增加类型安全性**：TypeScript 编译器可以检查代码中的类型错误，提高代码的可靠性和可维护性。
> 2. **提高开发效率**：TypeScript 编译器可以自动补全代码，提高开发效率。
> 3. **提高代码可读性**：TypeScript 编译器可以检查代码的格式，提高代码的可读性。
> 4. **提高可维护性和可扩展性**：TypeScript 编译器可以检查代码的结构，提高代码的可维护性。
> 5. **提高代码可重用性**：TypeScript 编译器可以检查代码的依赖关系，提高代码的可重用性。
> 6. **提前捕获错误**: 在编译阶段就可以捕获许多运行时才会出现的错误，减少了生产环境中 bug 的可能性。

>[!warning] TypeScript 的优势
> - 1、规范代码
> - 2、编译阶段就能及时发现代码错误
> - 3、在原生 js 的基础上加上了一层类型定义
>
> 注意：TypeScript 无法在浏览器中运行。需要借助编译器，将 TS 转为 JS。

## 1. TS 与 JS 的关联
>[!tip]关联
> 1. **TS 是 JS 的超集。**
>    - TS 在 JS 的基础上进行了扩展，包含了 JS 的所有语法和功能，并添加了一些新的特性和功能，如类型系统、接口、模块等。
> 2. **TS 编译为 JS。**
>    - TS 代码需要通过编译器编译成 JS 代码才能在浏览器或其他 JS 运行环境中执行。编译过程中，TS 的类型信息会被移除，只保留可执行的 JS 代码，这使得 TS 可以与现有的 JS 生态系统无缝集成。
> 3. **共享生态系统。**
>    - TS 和 JS 共享大部分的生态系统，包括包管理工具、构建工具和代码编辑器等。许多 JS 库和框架都可以在 TS 项目中使用，同时，也有很多 TS 编写的库和框架可供 JS 项目使用。


## 2. TS 与 JS 的区别
>[!tip]区别
> 1. **类型系统**:
>     - JS：弱类型语言，变量的数据类型在运行时确定，变量可以随时被赋予不同类型的值，在代码执行过程中才可能发现类型相关的错误。
>     - TS：强类型语言，要求在声明变量、函数参数和返回值等时指定数据类型，通过类型检查可以在编译阶段发现类型不匹配等错误，提高代码的稳定性和可维护性。
> 2. **语法特性**:
>     - JS：语法灵活，支持函数式编程和面向对象编程的混合编程风格，具有简洁的语法结构和动态特性，如匿名函数、闭包、原型链继承等。
>     - TS：增加了类、接口、模块、枚举等面向对象编程的特性，支持更严格的代码结构和规范，通过接口可以定义对象的结构和行为规范，通过模块可以更好地组织和管理代码。
> 3. **编译与执行**:
>     - JS：解释型语言，浏览器或其他运行环境可以直接执行 JS 代码，代码在运行时逐行解释执行，不需要提前编译。
>     - TS：需要先将 TS 代码编译成 JS 代码，然后再由浏览器或其他 JS 运行环境执行，编译过程可以检查代码中的语法错误和类型错误。



## 3、TS 开发环境

>[!tip] 开发环境
> - 安装 TypeScript 编译器：`npm install -g typescript`
> - 创建 TypeScript 文件：`touch hello.ts`
> - 编译 TypeScript 文件：`tsc hello.ts`
> - 执行编译后的 JS 文件：`node hello.js`


## 6、TS 基础类型
>[!tip] 基础类型
>- 1. `Boolean`: 布尔类型，`true` 或 `false`。
>- 2. `Number`: 数值类型，整数或浮点数（支持二进制、八进制、十进制、十六进制字面量）。
>- 3. `String`: 字符串类型，由零个或多个字符组成的有序序列。
>- 4. `Array`: 数组类型，元素的有序集合。
>- 5. `Object`: 非原始类型,除number,string,boolean,bigint,symbol,null或 undefined 之外的类型
>- 6. `Null` 和 `Undefined`: 空类型，**所有类型的子类型**，表示空值 。
>- 7. `Tuple`: 元组类型，一个已知元素数量和类型的数组，各元素的类型不必相同。
>- 8. `enum`: 枚举类型，可以定义一组命名的常量(为一组数值赋予友好的名字)。
>- 9. `UnKnown`: 未知类型，表示任何类型。
>- 10. `Any`: 任意类型，可以赋值给任意类型。
>- 11. `Void`: 没有任何类型，表示没有任何返回值的函数(与`Any`相反)。
>- 12. `Never`: 永不存在的值的类型，表示永远不会返回值的函数。

::: details 基础类型 示例
```typescript
//  1. Boolean 类型
let isDone: boolean = false;

//  2. Number 类型
let decimal: number = 6;
let hex: number = 0xf00d;
let binary: number = 0b1010;
let octal: number = 0o744;

//  3. String 类型
let color: string = "blue";
let fullName: string = "John Doe";
let sentence: string = `Hello, my name is ${fullName}.`;

//  4. Array 类型
let numbers: number[] = [1, 2, 3];
let people: string[] = ["Alice", "Bob", "Charlie"];
let values: Array<number | string> = [1, "two", true];

//  5. Object 类型
let user: { name: string; age: number } = { name: "John Doe", age: 30 };
let person: { name: string; age: number; hobbies: string[] } = {
  name: "John Doe",
  age: 30,
  hobbies: ["reading", "swimming"],
};

//  6. Null 和 Undefined 类型
let u: undefined = undefined;
let n: null = null;

//  1. Tuple 类型
let tuple: [string, number, boolean] = ["hello", 10, true];

//  2. enum 类型
enum Color {Red, Green, Blue}
let c: Color = Color.Green;

//  3. UnKnown 类型
let notSure: unknown = 4;
notSure = "maybe a string instead";

//  4. Any 类型
let anyValue: any = "hello";
anyValue = 10;

//  5. Void 类型
function log(message: string): void {
  console.log(message);
}

//  6. Never 类型
function error(message: string): never {
  throw new Error(message);
}





```
:::



## 7、类型断言
>[!tip] 类型断言
> - 一种强制类型转换，它允许你告诉编译器，你相信的类型是正确的。
>   - 方式 一：使用尖括号语法，`<类型>值`
>   - 方式 二：使用 as 关键字，`值 as 类型`

::: details 类型断言 两种语法 示例
```typescript
let someValue: any = "hello";

// 方式一：尖括号语法
let strLength: number = (<string>someValue).length;
// 方式二：as 关键字
let strLength2: number = (someValue as string).length;

```
:::



## 8、接口
>[!tip] 接口
> - 接口是一种抽象类型，它定义了对象的形状或行为。
> - 接口可以用来定义函数、类、变量的形状，可以包含属性、方法、构造函数等。
> - 接口可以用来定义第三方库的形状，也可以用来约束函数参数和返回值。

::: details 接口 示例
```typescript
interface Person {
  name: string;
  age: number;
  hobbies: string[];
}

function greet(person: Person): void {
  console.log(`Hello, my name is ${person.name} and I am ${person.age} years old.`);
}

let john: Person = {
  name: "John Doe",
  age: 30,
  hobbies: ["reading", "swimming"],
};

greet(john);
```
:::

### 可选属性

```typescript
interface Person {
  name: string;
  age?: number;
  hobbies?: string[];
}

let john: Person = {
  name: "John Doe",
  hobbies: ["reading", "swimming"],
};

console.log(john.age); // undefined
```

### 只读属性
>[!tip] 只读属性
> - 只读属性只能在对象刚刚创建时被赋值，之后不能被修改。
> - 只读属性必须在属性前使用 `readonly` 关键字声明。
> - 只读属性不能包含可选属性。
> - `readonly` vs `const`
>   - `readonly`: **用来修饰属性**，表示属性只能在对象刚刚创建时被赋值，之后不能被修改。
>   - `const`: **用来修饰变量**，表示变量的值不能被修改。

::: details 只读属性 示例
```typescript
interface Person {
  readonly name: string;
  age?: number;
  hobbies?: string[];
}
```
:::

### 函数类型
>[!tip] 函数类型
> - 函数类型可以用来定义函数的形状，包括参数类型和返回值类型。
> - 函数类型可以作为接口的一部分，也可以单独使用。

::: details 函数类型 示例
```typescript
interface GreetFunction {
  (name: string): string;
}

let greet: GreetFunction = function (name: string): string {
  return `Hello, ${name}!`;
};

```
:::

### 类类型
>[!tip] 类类型
> - 类类型可以用来明确一个类去符合某种契约。

::: details 类类型 示例
```typescript
interface ClockInterface {
  currentTime: Date;
  setTime(d: Date): void;
}

class Clock implements ClockInterface {
  currentTime: Date;
  setTime(d: Date) {
    this.currentTime = d;
  }
  constructor(h: number, m: number, s: number) {
    this.currentTime = new Date();
    this.currentTime.setHours(h);
    this.currentTime.setMinutes(m);
    this.currentTime.setSeconds(s);
  }
}

let clock: ClockInterface = new Clock(12, 30, 0);
console.log(clock.currentTime.toLocaleTimeString());
```
:::

### 继承接口
>[!tip] 继承接口
> - 和接口一样，接口也可以相互继承。
> - 继承接口可以扩展接口的属性和方法，也可以添加新的属性和方法。

::: details 继承接口 示例
```typescript
interface Shape {
  color: string;
}

interface Circle extends Shape {
  radius: number;
}

let circle: Circle = {
  color: "red",
  radius: 10,
};
```
:::

## 9、字面量类型
>[!tip] 字面量类型
> - 字面量类型是指通过字面量来定义类型。
> - 字面量类型可以用来指定一个值的类型，如字符串字面量类型。

::: details 字面量类型 示例
```typescript
//  1. 字符串字面量类型
let str1: "hello" = "hello";
//  2. 数字字面量类型
let num1: 10 = 10;
let num2: 10.5 = 10.5;

//  3. 布尔字面量类型
let bool1: true = true;
let bool2: false = false;

//  4. 数组字面量类型
let arr1: [1, 2, 3] = [1, 2, 3];
let arr2: ["hello", "world"] = ["hello", "world"];

//  5. 元组字面量类型
let tuple1: [string, number, boolean] = ["hello", 10, true];

//  6. 枚举字面量类型
enum Color {Red, Green, Blue}
```
::: 


## 10、泛型
>[!tip] 泛型
> - 泛型是指在定义函数、接口或类时，不预先指定具体的类型，而是在使用时再指定类型的一种特性。
> - 泛型可以让代码更加灵活、可重用、可读性更好。

::: details 泛型 示例
```typescript
function identity<T>(arg: T): T {
  return arg;
}

let output1 = identity<string>("myString");
let output2 = identity<number>(123);
```
::: 

## 11、类型别名
>[!tip] 类型别名
> - 类型别名是给一个类型定义一个新的名称。
> - 类型别名可以用来给复杂的类型定义一个简单的名字，使代码更易读。

::: details 类型别名 示例
```typescript
type Name = string;
type Age = number;
type Person = {
  name: Name;
  age: Age;
  hobbies: string[];
};

let john: Person = {
  name: "John Doe",
  age: 30,
  hobbies: ["reading", "swimming"],
};
```
::: 

## 12、联合类型
>[!tip] 联合类型
> - 联合类型是指可以是多种类型中的一种的类型。
> - 联合类型可以用来表示一个值的类型可以是多种类型中的一种。

::: details 联合类型 示例
```typescript
function greet(name: string | number): string {
  if (typeof name === "string") {
    return `Hello, ${name}!`;
  } else {
    return `Hi, ${name}`;
  }
}

console.log(greet("John Doe")); // Hello, John Doe!
console.log(greet(123)); // Hi, 123
```
::: 

## 13、交叉类型
>[!tip] 交叉类型
> - 交叉类型是指将多个类型合并为一个类型。
> - 交叉类型可以用来表示一个值的类型可以是多个类型中的多个类型。

::: details 交叉类型 示例
```typescript
type Person = {
  name: string;
  age: number;
};

type Address = {
  street: string;
  city: string;
};

type FullPerson = Person & Address;

let john: FullPerson = {
  name: "John Doe",
  age: 30,
  street: "123 Main St",
  city: "Anytown",
};
```
::: 

## 14、实用工具类型

>[!tip] 实用工具类型
> - 实用工具类型是指TypeScript提供的一些内置类型，可以帮助我们更方便地使用TypeScript。
> - 实用工具类型可以用来简化代码，提高代码的可读性和可维护性。
>1. `Partial<T>`：创建一个类型，其中所有属性都是可选的。
>2. `Readonly<T>`：创建一个类型，其中所有属性都是只读的。
>3. `Record<K, T>`：创建一个对象类型，其中所有属性的类型都是T，K是属性的名称。
>4. `Pick<T, K>`：创建一个类型，其中只包含T中指定的属性。
>5. `Omit<T, K>`：创建一个类型，其中排除T中指定的属性。
>6. `Exclude<T, U>`：创建一个类型，其中排除T中所有类型为U的属性。
>7. `Extract<T, U>`：创建一个类型，其中只包含T中所有类型为U的属性。
>8. `NonNullable<T>`：创建一个类型，其中所有值为null和undefined的属性都被排除。
>9. `Parameters<T>`：获取函数类型T的参数类型。
>10. `ConstructorParameters<T>`：获取构造函数类型T的参数类型。
>11. `Return<T>`：获取函数类型T的返回类型。
>12. `InstanceType<T>`：获取构造函数类型T的实例类型。
>13. `Required<T>`：创建一个类型，其中所有属性都是必需的。
>14. `ThisParameterType<T>`：获取函数类型T的this参数类型。
>15. `OmitThisParameter<T>`：创建一个函数类型，其中this参数被排除。
>16. `ThisType<T>`：获取函数类型T的this类型。
>17. `Uppercase<T>`：将类型T中的所有字母转换为大写。
>18. `Lowercase<T>`：将类型T中的所有字母转换为小写。
>19. `Capitalize<T>`：将类型T中的第一个字母转换为大写，其余字母转换为小写。


### Partial`<T>`

>[!tip] 
> - 创建一个类型，其中所有属性都是可选的。
> - 语法：`Partial<T>`

::: details Partial`<T>` 示例
```typescript
interface Person {
  name: string;
  age?: number;
}

type PartialPerson = Partial<Person>;

let john: PartialPerson = {
  name: "John Doe",
};

console.log(john.age); // undefined
```
:::

### Readonly`<T>`

>[!tip] 
> - 创建一个类型，其中所有属性都是只读的。
> - 语法：`Readonly<T>`

::: details Readonly`<T>` 示例
```typescript
interface Person {
  readonly name: string;
  age?: number;
}

type ReadonlyPerson = Readonly<Person>;

let john: ReadonlyPerson = {
  name: "John Doe",
};

john.name = "Jane Doe"; // error: Cannot assign to 'name' because it is a read-only property.
```
:::

### Record`<K, T>`

>[!tip] 
> - 创建一个对象类型，其中所有属性的类型都是T，K是属性的名称。
> - 语法：`Record<K, T>`

::: details Record`<K, T>` 示例
```typescript
type Person = Record<string, string>;

let john: Person = {
  name: "John Doe",
  age: "30",
};

console.log(john.name); // John Doe
console.log(john.age); // 30
```
:::

### Pick`<T, K>`

>[!tip] 
> - 创建一个类型，其中只包含T中指定的属性。
> - 语法：`Pick<T, K>`

::: details Pick`<T, K>` 示例
```typescript
interface Person {
  name: string;
  age: number;
  hobbies: string[];
}

type PersonName = Pick<Person, "name">;

let john: PersonName = {
  name: "John Doe",
};

console.log(john.age); // error: Property 'age' does not exist on type 'Pick<Person, "name">'
```
:::

### Omit`<T, K>`

>[!tip] 
> - 创建一个类型，其中排除T中指定的属性。
> - 语法：`Omit<T, K>`

::: details Omit`<T, K>` 示例
```typescript
interface Person {
  name: string;
  age: number;
  hobbies: string[];
}

type PersonWithoutHobbies = Omit<Person, "hobbies">;

let john: PersonWithoutHobbies = {
  name: "John Doe",
  age: 30,
};

console.log(john.hobbies); // error: Property 'hobbies' does not exist on type 'Omit<Person, "hobbies">'
```
:::

### Exclude`<T, U>`

>[!tip] 
> - 创建一个类型，其中排除T中所有类型为U的属性。
> - 语法：`Exclude<T, U>`

::: details Exclude`<T, U>` 示例
```typescript
type Excluded = Exclude<"a" | "b" | "c" | "d", "a" | "c" | "e">; // "b" | "d"
```
:::

### Extract`<T, U>`

>[!tip] 
> - 创建一个类型，其中只包含T中所有类型为U的属性。
> - 语法：`Extract<T, U>`

::: details Extract`<T, U>` 示例
```typescript
type Extracted = Extract<"a" | "b" | "c" | "d", "a" | "c" | "e">; // "a" | "c"
```
:::

### NonNullable`<T>`

>[!tip] 
> - 创建一个类型，其中所有值为null和undefined的属性都被排除。
> - 语法：`NonNullable<T>`

::: details NonNullable`<T>` 示例
```typescript
type NonNullablePerson = NonNullable<Person>;

let john: NonNullablePerson = {
  name: "John Doe",
  age: null,
};

console.log(john.age); // error: Property 'age' is missing in type 'NonNullablePerson' but required in type 'Person'.
```
:::

### Parameters`<T>`

>[!tip] 
> - 获取函数类型T的参数类型。
> - 语法：`Parameters<T>`

::: details Parameters`<T>` 示例
```typescript
type GreetFunction = (name: string) => string;

type GreetFunctionParameters = Parameters<GreetFunction>; // [string]
```
:::

### ConstructorParameters`<T>`

>[!tip] 
> - 获取构造函数类型T的参数类型。
> - 语法：`ConstructorParameters<T>`

::: details ConstructorParameters`<T>` 示例
```typescript
class Person {
  constructor(public name: string, public age: number) {}
}

type PersonConstructorParameters = ConstructorParameters<typeof Person>; // [string, number]
```
:::

### Return`<T>`

>[!tip] 
> - 获取函数类型T的返回类型。
> - 语法：`Return<T>`

::: details Return`<T>` 示例
```typescript
type GreetFunction = (name: string) => string;

type GreetFunctionReturn = Return<GreetFunction>; // string
```
:::

### InstanceType`<T>`

>[!tip] 
> - 获取构造函数类型T的实例类型。
> - 语法：`InstanceType<T>`

::: details InstanceType`<T>` 示例
```typescript
class Person {
  constructor(public name: string, public age: number) {}
}

type PersonInstanceType = InstanceType<typeof Person>; // Person
```
:::

### Required`<T>`

>[!tip] 
> - 创建一个类型，其中所有属性都是必需的。
> - 语法：`Required<T>`

::: details Required`<T>` 示例
```typescript
interface Person {
  name?: string;
  age: number;
}

type RequiredPerson = Required<Person>;

let john: RequiredPerson = {
  age: 30,
};

console.log(john.name); // error: Property 'name' is missing in type 'RequiredPerson' but required in type 'Person'.
```
:::

### ThisParameterType`<T>`

>[!tip] 
> - 获取函数类型T的this参数类型。
> - 语法：`ThisParameterType<T>`

::: details ThisParameterType`<T>` 示例
```typescript
class Person {
  greet(this: Person, name: string) {
    console.log(`Hello, ${name}!`);
  }
}

type GreetFunction = (name: string) => void;

type GreetFunctionThisParameterType = ThisParameterType<GreetFunction>; // Person
```
:::

### OmitThisParameter`<T>`

>[!tip] 
> - 创建一个函数类型，其中this参数被排除。
> - 语法：`OmitThisParameter<T>`

::: details OmitThisParameter`<T>` 示例
```typescript
class Person {
  greet(this: Person, name: string) {
    console.log(`Hello, ${name}!`);
  }
}

type GreetFunction = OmitThisParameter<typeof Person.prototype.greet>; // (name: string) => void
```
:::

### ThisType`<T>`

>[!tip] 
> - 获取函数类型T的this类型。
> - 语法：`ThisType<T>`

::: details ThisType`<T>` 示例
```typescript
class Person {
  greet(this: ThisType<Person>, name: string) {
    console.log(`Hello, ${name}!`);
  }
}

type GreetFunction = (name: string) => void;

type GreetFunctionThisType = ThisType<GreetFunction>; // Person
```
:::

### Uppercase`<T>`

>[!tip] 
> - 将类型T中的所有字母转换为大写。
> - 语法：`Uppercase<T>`

::: details Uppercase`<T>` 示例
```typescript
type Uppercased = Uppercase<"hello">; // "HELLO"
```
:::

### Lowercase`<T>`

>[!tip] 
> - 将类型T中的所有字母转换为小写。
> - 语法：`Lowercase<T>`

::: details Lowercase`<T>` 示例
```typescript
type Lowercased = Lowercase<"HELLO">; // "hello"
```
:::

### Capitalize`<T>`

>[!tip] 
> - 将类型T中的第一个字母转换为大写，其余字母转换为小写。
> - 语法：`Capitalize<T>`

::: details Capitalize`<T>` 示例
```typescript
type Capitalized = Capitalize<"hello world">; // "Hello world"
```
:::


