---
title: "TypeScript 面试题"
category: "面试题"
tags:
  - TypeScript
excerpt: "围绕 TypeScript 与 JavaScript 的关系、类型推断、接口和别名、结构兼容、泛型及常用类型工具等面试问题，解释编译期约束、实际用法与运行时边界，并给出可独立检查的示例。"
---

# TypeScript 面试题

TypeScript 在 JavaScript 基础上提供静态类型检查。类型描述用于检查代码中的值与操作是否兼容，通常在生成 JavaScript 时被擦除；网络响应和用户输入仍需运行时验证，不能仅凭类型声明就认定数据正确。

::: info 类型示例的版本基线
以下类型行为以 TypeScript 5.9、`strict` 模式为基线。泛型表示“用类型作为参数”，联合表示值可属于多个候选类型。需要类型检查的片段不应直接粘贴到浏览器 JavaScript 控制台。
:::

## 一、类型基础与运行边界

静态类型描述开发阶段的约束；数据在运行时是否真实有效，需要另外验证。先明确这个边界，再比较推断与基础类型。

### 1. TypeScript 的类型为什么不能保证运行时数据正确？

#### 1.1 静态类型如何参与编译

1. **TypeScript 增加开发阶段的类型约束，JavaScript 承担生成后代码的运行。** 类型推断允许不显式写出每个类型；JavaScript 本身也有 class 和模块，不能将这些都说成 TS 独有能力。

   | 维度 | JavaScript | TypeScript |
   |------|------------|------------|
   | 类型判断 | 值在运行时有类型，操作按语言规则执行 | 在运行前检查声明、推断与使用是否兼容 |
   | 类型标注 | 通常无 TS 类型语法 | 可以标注，也可以推断 |
   | 执行 | 由浏览器、Node 等环境执行，引擎可进行编译优化 | 通常先转换为 JavaScript，再执行 |
   | 运行时数据 | 必须按业务验证 | 类型声明不会替代输入验证 |

   安装 Node.js 22 或更高版本。在空目录运行以下 PowerShell 命令准备编译器：

   ```powershell
   npm init -y
   npm install --save-dev typescript@5.9.3
   ```

   创建 `order.ts`：

   ```typescript
   // order.ts
   type Order = { id: string; quantity: number };
   const order: Order = { id: "A-42", quantity: 2 };
   console.log(order.id, order.quantity);
   ```

   编译并运行：

   ```powershell
   npx tsc order.ts --strict --target ES2022 --module commonjs --outDir dist
   node dist/order.js
   ```

   预期输出如下，生成的 JS 不包含 Order 类型别名：

   ```text
   A-42 2
   ```

#### 1.2 运行时数据为何仍需校验

1. **静态边界：** 把 `quantity` 改成字符串会在编译时出错；但类型声明通常不保留为运行时校验代码。编译通过只能说明已检查的代码按声明使用数据，不能证明接口响应真实符合声明，也不能证明库存、金额等业务规则成立。`any` 和断言还能主动绕过部分检查。

::: warning 类型声明不是接口数据的验收证明
把外部 JSON 写成 `Order` 或强行断言为 `Order`，不会检查字段。应在不可信数据进入业务前进行运行时校验与必要转换，再把确认后的结果交给类型系统约束后续使用。
:::

参考：[TypeScript：基础](https://www.typescriptlang.org/docs/handbook/2/basic-types.html)。

### 2. 类型推断与类型标注如何选择，const 会让对象属性成为字面量吗？

#### 2.1 推断、标注与 const 的行为

1. **可从初值和上下文确定的局部类型通常交给推断，公共边界与需要限定的范围应明确标注。** const 固定变量绑定，不自动固定对象全部属性的值和类型。

   以下是独立类型检查片段，可保存为 `inference.ts` 后，用本篇准备的编译器执行 `npx tsc inference.ts --strict --noEmit --target ES2022`：

   ```typescript
   // inference.ts
   let quantity = 2; // 推断为 number
   const orderStatus = "paid"; // 保留字面量类型 "paid"
   const order = { status: "paid" }; // 属性通常拓宽为 string
   const fixedOrder = { status: "paid" } as const; // readonly 且保留字面量
   type OrderStatus = "pending" | "paid";
   const selectedStatus: OrderStatus = "pending";
   ```

#### 2.2 字面量拓宽和只读边界

1. 字面量类型表示某个特定值，例如只允许 `"paid"`。对象属性可被修改，所以普通对象属性常被拓宽，而不是因为变量用了 const 就固定。

2. as const 表达编译期的只读与字面量信息，不会运行时冻结对象。函数参数、对外返回值和空集合等缺少足够信息的位置，标注可以减少意外拓宽和隐式 any。

参考：[TypeScript：类型推断](https://www.typescriptlang.org/docs/handbook/type-inference.html)。

### 3. any、unknown、never 如何分别影响类型安全与控制流？

#### 3.1 三种类型的约束差异

1. **any 允许绕过大量检查，unknown 要求先证明可用类型，never 表示不可能产生正常值的类型。** 三者不是同一类“任意类型”。

   | 类型 | 可进行的操作 | 典型用途 |
   |------|--------------|----------|
   | any | 几乎任意访问与赋值，错误可继续传播 | 迁移边界等确需暂时退出检查的地方 |
   | unknown | 可以接收任意值，使用前必须缩小类型范围 | 未验证的外部输入 |
   | never | 不能提供正常值，可被用于穷尽判断 | 始终抛错、不可达分支 |

   下面是独立 `unknown-input.ts` 类型检查片段，展示先判断再使用；不依赖服务端：

   ```typescript
   // unknown-input.ts
   const input: unknown = "A-42";
   if (typeof input === "string") {
     console.log(input.toUpperCase());
   }
   /** 拒绝无效订单状态；始终抛错，不正常返回，因此返回类型为 never。 */
   function rejectStatus(): never { throw new Error("无效订单状态"); }
   ```

#### 3.2 类型缩小与控制流边界

1. **控制流原因：** `unknown` 可以接收外部值，但读取字段前必须经类型缩小；检查器只利用你写出的判断，本身不会验证接口数据。`never` 出现在不可能到达的分支或不会正常返回的函数，能帮助发现联合类型未处理完的情况；`void` 则允许正常返回。

   ::: warning any 会削弱后续约束
   把请求响应标成 any 再传入严格函数，不能证明数据安全。外部输入优先作为 unknown，在业务边界校验后转换为可信类型。
   :::

参考：[TypeScript：unknown 与 never](https://www.typescriptlang.org/docs/handbook/2/functions.html#other-types-to-know-about)。

## 二、类型组织与兼容

对象、接口、联合与交叉类型解决不同的结构表达问题。兼容性判断必须同时考虑字段、分支及声明规则。

### 1. interface 与 type 有何联系和区别？

#### 1.1 对象形状与类型表达能力

1. **二者都能描述对象与函数类型；interface 主要描述可扩展的对象形状，type 可以命名联合、原始类型、元组等更多表达式。** 不存在“interface 一定更好”的通用规则。

   | 维度 | interface | type |
   |------|-----------|------|
   | 对象和可调用形状 | 支持 | 支持 |
   | 联合类型、元组等别名 | 不能直接替代 type 的全部表达 | 支持 |
   | 扩展 | extends | 常使用交叉 `&`，也可组合其他表达 |
   | 同名声明 | 符合规则时可合并 | 别名不能这样重复声明 |

   下面是独立的 `order-types.ts` 类型检查片段：

   ```typescript
   // order-types.ts
   interface Order { id: string; }
   interface Order { quantity: number; }
   type OrderStatus = "pending" | "paid";
   type PaidOrder = Order & { status: "paid" };
   const order: PaidOrder = { id: "A-42", quantity: 2, status: "paid" };
   ```

#### 1.2 声明合并和选型边界

1. 两个 Order 接口合并成同时包含 id 与 quantity 的形状。声明合并需遵守成员兼容规则，不能用同名接口随意覆盖已有字段类型。

2. 库希望开放接口扩展时可以使用 interface；需要表达联合或复杂类型运算时使用 type。二者通常都不生成运行时对象，不能对接口执行 instanceof。

参考：[TypeScript：类型别名与接口](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#differences-between-type-aliases-and-interfaces)。

### 2. extends 与交叉类型 & 如何扩展类型，字段冲突会怎样？

#### 2.1 继承和交叉的冲突结果

1. **extends 声明对象形状的继承关系，交叉类型要求值同时满足各组成类型。** 交叉不是后写字段覆盖前写字段。

   | 情况 | 结果 |
   |------|------|
   | 接口扩展兼容字段 | 形成具有父字段和新增字段的接口 |
   | 接口扩展时把 string 字段改成 number | 在声明处报不兼容错误 |
   | `{ id: string } & { id: number }` | id 必须同时为 string 与 number，通常归为 never |

   以下是 `type-conflict.ts` 的独立类型检查片段，最后一行有预期错误，不应当作正确赋值运行：

   ```typescript
   // type-conflict.ts
   type ConflictedOrder = { id: string } & { id: number };
   // @ts-expect-error：冲突后的 id 无法由普通 string 满足。
   const order: ConflictedOrder = { id: "A-42" };
   ```

#### 2.2 字段替换的正确约束

1. `@ts-expect-error` 表示下一行应有类型错误，错误消失时检查器也会提示。它用于验证错误边界，不是推荐在业务代码中绕过冲突。

2. 接口组合或数据合并前先统一字段含义；若需要替换字段，应明确先移除旧字段，例如 Omit，再添加新定义，不能假定交叉会产生覆盖行为。

参考：[TypeScript：交叉类型](https://www.typescriptlang.org/docs/handbook/2/objects.html#intersection-types)。

### 3. 结构类型与 implements 为何都不能校验接口响应？

#### 3.1 结构兼容与类实现检查

1. **TypeScript 通常按所需成员判断结构兼容，implements 检查类的实例侧是否满足约定。** 它不会自动生成成员，也不会给外部 JSON 加上运行时校验。

   以下独立 `order-class.ts` 可用 strict 编译检查：

   ```typescript
   // order-class.ts
   interface OrderRecord { id: string; }
   /** 保存订单编号，提供符合 OrderRecord 的实例形状。 */
   class Order implements OrderRecord {
     /** 创建订单记录；id 为已验证的非空业务编号，初始化实例，无返回值。 */
     constructor(public id: string) {}
   }
   const record: OrderRecord = { id: "A-42", };
   const instance: OrderRecord = new Order("B-17");
   console.log(record.id, instance.id);
   ```

#### 3.2 运行时响应与额外属性

1. **兼容依据：** 普通对象只要具有要求的成员，就可以满足接口，无需继承某个运行时类。`implements` 检查类的实例侧声明，不检查外部 JSON，也不直接检查类的静态构造签名；接口通常在编译后消失。

2. 对象字面量还有额外属性检查，类的私有或受保护成员也会影响兼容性，不能把“结构类型”说成所有形状相似的值必定兼容。编号非空约束仍需运行时检查或可信构造入口。

::: tip 区分结构兼容与数据可信
一个值“静态上具有 `id: string`”与“服务端确实发送了非空订单号”是两件事。前者由类型系统描述，后者必须通过可信构造过程或运行时校验确认。
:::

参考：[TypeScript：类型兼容](https://www.typescriptlang.org/docs/handbook/type-compatibility.html)、[TypeScript：implements](https://www.typescriptlang.org/docs/handbook/2/classes.html#implements-clauses)。

### 4. 联合类型为什么不能直接访问所有成员，如何做类型缩小？

#### 4.1 联合成员的可访问范围

1. **联合值可能属于任何一个候选类型，只能直接使用对所有候选都合法的操作。** 通过条件判断缩小类型后，才能安全使用分支专属成员。

   以下是可独立检查的 `order-result.ts`；status 是用于辨识分支的字面量字段：

   ::: details 查看订单结果联合类型示例

   ```typescript
   // order-result.ts
   type OrderResult =
     | { status: "success"; orderId: string }
     | { status: "error"; message: string };
   /** 根据已验证的结果状态生成展示文字；返回对应分支的文本。 */
   function describeResult(result: OrderResult): string {
     if (result.status === "success") {
       return result.orderId;
     }
     return result.message;
   }
   console.log(describeResult({ status: "success", orderId: "A-42" }));
   ```

   :::

#### 4.2 类型缩小与非空断言

1. 成功分支可读取 orderId，失败分支可读取 message。typeof、instanceof、in、自定义类型守卫等也能参与缩小，但守卫中的判断必须真实正确。

2. 启用 strictNullChecks 后，null、undefined 必须按声明范围处理。非空断言 `!` 只是告诉检查器相信你，不会插入空值判断；错误断言仍会导致运行时失败。

参考：[TypeScript：类型缩小](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)。

## 三、泛型与类型运算

泛型保留值之间的类型关系，类型运算从已有类型提取信息。它们都不负责执行运行时校验。

### 1. 泛型如何保留输入与输出的关系，约束又保证什么？

#### 1.1 泛型保留的类型关系

1. **泛型保留输入与输出之间的类型关系，any 通常抹掉这种关系。** 约束声明类型参数必须满足的条件，不是运行时检查。

   下面的独立 `order-field.ts` 通过 `K extends keyof T` 限制键名：

   ::: details 查看受约束字段读取函数

   ```typescript
   // order-field.ts
   /**
    * 读取对象中已存在于类型声明的键。
    * @param record 非 null 的记录对象，类型 T 由实参推断。
    * @param key 必须属于 T 的键集合，不能传入未声明的字段名。
    * @returns 该键对应的属性类型 T[K] 的值，不修改记录。
    */
   function readField<T extends object, K extends keyof T>(record: T, key: K): T[K] {
     return record[key];
   }
   const order = { id: "A-42", quantity: 2 };
   const quantity = readField(order, "quantity"); // number
   // @ts-expect-error：price 不在 order 的键类型中。
   readField(order, "price");
   ```

   :::

#### 1.2 约束成立的前提

1. **关系约束：** `K extends keyof T` 把键限制在对象类型的键集合内，返回值 `T[K]` 保留该键对应的具体属性类型。因此读取 `quantity` 可推断为 number；改用 `any` 会抹掉键与返回值的关联。

2. **成立条件：** 泛型参数要表达真实依赖关系，不能只为显得通用而添加。外部对象是否真的含有这些字段仍取决于运行时数据；把任意输入断言为 `T`，只会掩盖前提未验证的问题。

::: info 约束键名不等于创建或验证字段
`K extends keyof T` 只在编译期限制可传入的键，并保留返回类型。函数在运行时仍是读取对象属性；若对象来自不可信输入，仍需先验证其形状。
:::

参考：[TypeScript：泛型](https://www.typescriptlang.org/docs/handbook/2/generics.html)。

### 2. keyof、类型位置的 typeof 和 T[K] 各负责什么？

#### 2.1 三个运算符的类型结果

1. **keyof 获取类型的键集合，类型位置的 typeof 获取已有值的静态类型，T[K] 读取指定键的属性类型。** 这些都是编译期类型表达，不等于实际枚举属性。

   下面是独立 `order-key.ts` 类型检查片段：

   ```typescript
   // order-key.ts
   const order = { id: "A-42", quantity: 2 };
   type Order = typeof order;
   type OrderKey = keyof Order; // "id" | "quantity"
   type Quantity = Order["quantity"]; // number
   const key: OrderKey = "id";
   const quantity: Quantity = 2;
   ```

#### 2.2 编译期键与运行时属性

1. 运行时的 `typeof order` 返回字符串 `"object"`；`type Order = typeof order` 则表达静态对象类型，二者位置和用途不同。

2. 字符串索引签名会改变 keyof 的结果，Object.keys 的运行时结果也不能自动当成任意 T 的精确 keyof 数组。动态数据应先校验，不应到处断言键名来掩盖不确定性。

参考：[TypeScript：keyof](https://www.typescriptlang.org/docs/handbook/2/keyof-types.html)、[TypeScript：typeof 类型运算](https://www.typescriptlang.org/docs/handbook/2/typeof-types.html)、[TypeScript：索引访问类型](https://www.typescriptlang.org/docs/handbook/2/indexed-access-types.html)。

## 四、类型工具与断言

类型工具用于复用约束；断言表达开发者判断。回答时应明确哪些信息被保留、哪些检查被绕过。

### 1. 如何从同一契约派生更新、摘要和只读类型？

#### 1.1 从契约派生类型

1. **这些工具根据已有类型生成新约束，不会修改或复制运行时对象。** 先确定你要改变字段的存在性、可写性、集合还是映射关系。

   | 工具 | 作用 | 场景 |
   |------|------|------|
   | `Partial<T>` | 全部字段变为可选 | 部分更新输入 |
   | `Required<T>` | 全部字段变为必填 | 已补齐的内部记录 |
   | `Readonly<T>` | 属性变为只读 | 对外只读视图 |
   | `Pick<T, K>` | 保留指定字段 | 详情中的摘要类型 |
   | `Omit<T, K>` | 移除指定字段 | 排除内部字段 |
   | `Record<K, V>` | 定义一组键对应的值类型 | 状态与展示文案的映射 |

   以下是独立 `order-utilities.ts` 类型检查片段：

   ```typescript
   // order-utilities.ts
   type Order = { id: string; quantity: number; status: "pending" | "paid" };
   type OrderPatch = Partial<Pick<Order, "quantity" | "status">>;
   type OrderSummary = Pick<Order, "id" | "status">;
   const patch: OrderPatch = { quantity: 3 };
   const statusLabels: Record<Order["status"], string> = { pending: "待支付", paid: "已支付" };
   ```

#### 1.2 浅层处理和接口语义

1. **派生边界：** `Partial`、`Readonly` 默认只处理表层字段；嵌套地址不会自动深层可选或不可变。`Readonly` 也不会冻结运行时对象。`Partial<Order>` 允许空对象，如果更新接口要求至少一个字段，还需额外约束或运行时校验。

2. **接口语义：** 部分更新必须区分“字段未提交”与“字段显式提交为 undefined”。可结合 `exactOptionalPropertyTypes` 和序列化约定确认类型，但服务端仍要按协议处理缺省与清空操作。

::: warning 可选字段不等于可随意清空字段
`Partial<Order>` 描述的是字段可以缺席，不自动定义更新接口如何处理 `undefined`、`null` 或空对象。补丁语义应由接口协议决定，再用类型和运行时校验共同落实。
:::

参考：[TypeScript：对象类型工具](https://www.typescriptlang.org/docs/handbook/utility-types.html)。

### 2. Parameters、ReturnType 和 Awaited 如何复用函数类型？

#### 2.1 函数参数、返回值与等待结果

1. **Parameters 提取参数元组，ReturnType 提取返回类型，Awaited 展开等待结果的类型。** 它们接收的是类型，不是已经调用函数得到的值。

   以下是独立 `function-tools.ts` 类型检查片段：

   ```typescript
   // function-tools.ts
   /** 创建最小订单结果；id 为非空编号，返回已完成的订单 Promise。 */
   async function loadOrder(id: string) {
     return { id, status: "paid" as const };
   }
   type LoadOrderArgs = Parameters<typeof loadOrder>; // [id: string]
   type LoadOrderReturn = ReturnType<typeof loadOrder>; // Promise<{...}>
   type LoadedOrder = Awaited<LoadOrderReturn>; // 已展开的结果类型
   const args: LoadOrderArgs = ["A-42"];
   const order: LoadedOrder = { id: "A-42", status: "paid" };
   ```

#### 2.2 重载和泛型的边界

1. Parameters 保留参数顺序、可选性和 rest 等元组信息；异步返回值直接用 ReturnType 仍是 Promise，不能误认为订单本身。

2. 重载函数的提取一般基于最后的签名，不会自动对某个实参求出精确重载结果。泛型函数也可能需要额外具体化，类型工具不是对运行过程的模拟。

参考：[TypeScript：函数类型工具](https://www.typescriptlang.org/docs/handbook/utility-types.html#parameterstype)。

### 3. ConstructorParameters 与 InstanceType 提取的是哪一侧类型？

#### 3.1 构造侧与实例侧

1. **前者提取构造参数元组，后者提取构造产生的实例类型，输入通常是类值的类型 `typeof Class`。** 类的静态侧与实例侧应分清。

   下面是独立 `constructor-tools.ts` 类型检查片段：

   ```typescript
   // constructor-tools.ts
   /** 保存已验证的订单编号。 */
   class Order {
     /** 初始化实例；id 为非空订单编号，无返回值。 */
     constructor(public id: string) {}
   }
   type OrderArgs = ConstructorParameters<typeof Order>; // [id: string]
   type OrderInstance = InstanceType<typeof Order>; // Order
   const args: OrderArgs = ["A-42"];
   const order: OrderInstance = new Order(...args);
   ```

#### 3.2 工厂约束和运行时边界

1. Order 在类型位置常表示实例，typeof Order 描述运行时类值及其构造能力。把 `InstanceType<Order>` 当作正确调用会因输入不是构造类型而失败。

2. 这些工具可以用于工厂和依赖注入的类型约束，但不会创建实例或检查服务是否存在。私有构造函数、抽象类和重载也需要按实际构造签名处理。

参考：[TypeScript：构造类型工具](https://www.typescriptlang.org/docs/handbook/utility-types.html#constructorparameterstype)。

### 4. as、as const 与 satisfies 各能证明什么，为什么不改变运行时值？

#### 4.1 断言、常量断言与兼容检查

1. **不会。类型断言表达开发者的判断，as const 保留字面量与只读信息，satisfies 检查兼容性并尽量保留表达式自身推断。** 它们都不是运行时转换函数。

   | 写法 | 意图 | 边界 |
   |------|------|------|
   | `value as Order` | 告诉检查器将值视为 Order | 不检查真实字段、不修复数据 |
   | `as const` | 保留字面量并形成只读类型信息 | 不自动深度冻结已有运行时引用 |
   | `satisfies T` | 检查表达式是否满足 T | 保留推断不等于完全不影响上下文类型 |

   以下是独立 `status-map.ts` 类型检查片段，satisfies 从 TypeScript 4.9 开始提供：

   ```typescript
   // status-map.ts
   type OrderStatus = "pending" | "paid";
   const labels = { pending: "待支付", paid: "已支付" } satisfies Record<OrderStatus, string>;
   console.log(labels.paid);
   ```

#### 4.2 数据校验和运行边界

1. **检查差异：** `satisfies Record<OrderStatus, string>` 会检查状态键是否齐全、值是否兼容，并尽量保留表达式推断；强行 `as` 则是在告诉检查器接受开发者的判断，不能用来证明映射完整。

2. **运行边界：** `as const` 不冻结对象，`satisfies` 不转换数据；若接口把 id 返回成 number，`response as Order` 也不会将其变成 string。先确认数据来源并校验、转换，再用类型表达已确认的事实。

::: tip 用 satisfies 核对约束，用校验确认真实数据
常量映射在编写时可用 `satisfies` 检查键与值；网络响应只能在运行时校验后信任。两者处于不同阶段，不能互相替代。
:::

参考：[TypeScript：satisfies](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html#the-satisfies-operator)。

## 五、类型收窄与高级类型

### 1. `strictNullChecks` 为什么是可靠类型检查的基础？

**开启 `strictNullChecks` 后，`null` 和 `undefined` 不再自动兼容所有类型。** 编译器会要求代码在访问可能缺失的值前缩小类型，从而让“接口没返回字段”这类问题在开发期暴露。

1. `find()` 的结果可能是 `undefined`；访问订单字段前，应检查结果，或按业务抛出明确异常。
2. 可选属性本身允许缺失；`?.` 与 `??` 能表达读取和默认值，但不要把“没有数据”和金额 `0` 混为一谈。
3. 非空断言 `!` 只让检查器接受开发者的判断，不增加运行时校验；真正来自网络的数据仍需验证。

::: tip 类型配置要进入 CI
`strict` 会启用一组严格检查，其中包括 `strictNullChecks`。迁移旧项目可逐步处理错误，但最终构建流程应运行真实类型检查，避免只做语法转译。
:::

参考：[TypeScript：strictNullChecks](https://www.typescriptlang.org/tsconfig/strictNullChecks.html)、[TypeScript：strict](https://www.typescriptlang.org/tsconfig/strict.html)。

### 2. 类型守卫与类型断言有什么本质区别？

**类型守卫通过控制流和可观察条件缩小类型；断言 `as` 只是告诉编译器接受一个判断，不改变值。** 例如对 `unknown` 检查 `typeof value === "string"` 后才能安全使用字符串方法；`value as string` 不能让数字变成字符串。

| 方式 | 是否进行运行时检查 | 适用情况 |
|------|--------------------|----------|
| `typeof`、`instanceof`、判别字段检查 | 是，依据实际值判断 | 缩小联合类型 |
| 用户自定义类型谓词 | 取决于函数实现 | 复用经过审查的检查逻辑 |
| `as` 断言 | 否 | 已有外部证据而检查器无法推断 |

自定义类型谓词若错误地总返回 `true`，也会让类型系统相信虚假结论。面试回答要说明**守卫的可靠性来自检查逻辑**，不是函数返回类型写了 `value is Order`。

参考：[TypeScript：类型收窄](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)。

### 3. 判别联合如何让分支穷尽检查发现漏处理状态？

**给联合成员使用相同的字面量判别字段，编译器就能根据该字段缩小其他属性。** 订单状态可以分为 `{ kind: "loading" }`、`{ kind: "ready"; order: Order }` 和 `{ kind: "error"; message: string }`，避免同时出现“已加载却没有订单”等非法组合。

1. 在 `switch (state.kind)` 中，每个分支只访问该状态存在的字段。
2. `default` 分支把剩余值赋给 `never` 类型；新增状态却未加分支时，类型检查会报错。
3. 运行时来自服务器的字符串仍需校验，不能把类型穷尽当成服务端永不新增状态的保证。

相比一个对象上放 `loading?: boolean`、`order?: Order`、`error?: string`，判别联合把**状态约束写进数据形状**，降低跨字段条件判断的成本。

参考：[TypeScript：判别联合与穷尽检查](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions)。

### 4. 条件类型、`infer` 和分布式行为如何配合？

**条件类型按类型关系选分支；`infer` 可从匹配结构中提取部分类型。** 例如 `T extends Promise<infer V> ? V : T` 能提取 Promise 的结果类型，这是 `Awaited` 等工具类型的基础思路。

1. 裸类型参数出现在条件左侧时，联合类型会逐个成员分布计算；`"a" | 1` 可以分别判断，结果再组成联合。
2. 若业务需要把整个联合当一个整体判断，可用元组包裹两侧，例如 `[T] extends [U]`，阻止分布。
3. 条件类型只在编译期运算，不会在运行时检查 Promise 是否真的返回了预期结构。

::: warning 先确认是否需要分布
复杂工具类型出现意外联合结果时，先检查条件左侧是不是裸类型参数，再决定是否用元组包裹。
:::

参考：[TypeScript：条件类型](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html)。

### 5. 映射类型与 `keyof` 怎样避免维护多份字段清单？

**映射类型遍历已有类型的键，并生成相关类型。** `Partial<T>` 把字段改为可选，`Readonly<T>` 把字段标为只读；`Pick<T, K>` 与 `Omit<T, K>` 则表达字段子集和排除。

订单详情、列表摘要与编辑表单若都手写字段，很容易在新增属性后不一致。可以从统一契约派生所需形状，同时保留“哪些字段允许编辑”的明确白名单。键重映射还可以通过 `as` 生成新键名，但复杂转换应考虑可读性。

::: warning 类型派生不改变运行时对象
`Readonly<T>` 不会冻结对象，`Omit<T, "secret">` 也不会从服务器响应里删除 `secret` 字段。向客户端输出敏感字段时必须在运行时显式筛选。
:::

参考：[TypeScript：映射类型](https://www.typescriptlang.org/docs/handbook/2/mapped-types.html)、[TypeScript：工具类型](https://www.typescriptlang.org/docs/handbook/utility-types.html)。

## 六、工程契约与配置

### 1. 为什么对象字面量会报多余属性错误，先存入变量却可能通过？

**TypeScript 主要采用结构类型兼容；新鲜对象字面量还有额外的多余属性检查。** 直接把 `{ id: "A-42", extra: 1 }` 传给只接受 `{ id: string }` 的位置，编译器通常会提示 `extra`；先存到变量再传入，则可能因结构包含所需字段而通过。

1. 这项检查帮助发现字面量拼写错误，但不是“所有对象都禁止额外字段”的封闭对象保证。
2. `satisfies` 可在声明常量时检查目标契约，同时保留更精确的推断；运行时接口仍需校验未知字段是否允许。
3. 真正需要防止额外字段进入 API 时，应在服务端或校验层定义白名单，不能只依赖 TypeScript 的字面量检查。

参考：[TypeScript：多余属性检查](https://www.typescriptlang.org/docs/handbook/2/objects.html#excess-property-checks)。

### 2. `.d.ts`、类型导入与运行时代码有什么关系？

**声明文件描述已有 JavaScript 模块的类型接口，不提供相应运行时实现。** 只安装了类型声明而没有实际依赖，或导入路径与运行模块不一致，类型检查通过也可能在运行时报错。

1. 第三方库自带类型或通过声明包提供类型时，先检查版本是否与真实 API 匹配。
2. `import type` 明确只用于类型位置，输出时不应留下运行时导入；需要枚举对象、函数或类值时不能只做类型导入。
3. 为无类型库编写 `.d.ts` 时，描述真实可观察接口，不要用宽泛 `any` 掩盖未知返回值。

诊断“编译成功却提示模块不存在”时，分别检查**类型解析**和**运行时模块解析**，不要把声明文件当成实现文件。

参考：[TypeScript：声明文件](https://www.typescriptlang.org/docs/handbook/declaration-files/introduction.html)、[TypeScript：import type](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-8.html#type-only-imports-and-export)。
