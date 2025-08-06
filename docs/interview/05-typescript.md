# TypeScript 面试题

## 1、TS 与 JS 的区别
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

## 2、Interface 和 Type
- `interface`：适用于定义对象的类型和形状。
- `type`：适用于定义类型别名、联合类型、交叉类型。
>[!tip]联系
> 1. 都可以描述一个对象或者函数的类型。
> 2. 都允许扩展 :
>     - `type`扩展使用`&`符号。
>     - `interface`扩展使用`extends`关键字。
> 3. 都可以使用`implements`来实现接口。

:::details 示例
```typescript
// type extends type
type Name = {
    firstName: string;
    lastName: string;
}
type Person = Name & { hobbies: string[]; }

// interface extends interface
interface Name {
    firstName: string;
    lastName: string;
}
interface Person extends Name {
    hobbies: string[];
}
// 
```
:::

>[!tip]区别
>1. type：
>    - 可以声明基本类型，联合类型，元组类型，类型别名，类型变量等。
>    - 可以使用 typeof 获取实例的 类型进行赋值。
>    - type不能重复声明。
>2. interface：
>    - 只能声明对象类型。
>    - interface重复声明时，会合并成一个类型。

## 3、常用类型工具
>[!tip] 常用类型工具
>1. `Parameters<T>`：获取函数类型T的参数类型。
>2. `ConstructorParameters<T>`：获取构造函数类型T的参数类型。
>3. `ReturnType<T>`：获取函数类型T的返回类型。
>4. `InstanceType<T>`：获取构造函数类型T的实例类型。
>5. `typeof`：获取变量的类型。
>6. `keyof`：获取对象类型的所有属性的名称。