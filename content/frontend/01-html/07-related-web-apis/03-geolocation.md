---
title: "Geolocation 地理定位 API"
tags:
  - HTML
  - Geolocation
  - 浏览器 API
excerpt: "说明定位接口的规范归属、安全上下文与权限流程，使用一次定位和连续监听示例解释坐标、精度与错误码，并区分模拟位置、真实传感器和不宜保存的敏感数据。"
date: 2026-11-14
---

# Geolocation 地理定位 API

Geolocation 让页面在获得用户许可后请求当前位置。它由独立的 W3C 规范定义，不属于 HTML 元素，也不是 HTML5 新增的标签；页面通过 `navigator.geolocation` 调用它。

它有几个必须正视的边界：只有安全上下文才能请求；权限由用户决定，拒绝后要给出可理解的反馈；返回的是估算位置与精度，不是 GPS 读数；位置属于敏感数据，不应该默认展示、记录或上传。

::: info 本篇的范围
本篇讲一次定位、权限与错误分支、选项和连续监听的停止。安全上下文与页面资源见[文档头部与资源引用](../01-foundation/09-head-resources.md)。地图 SDK、地址解析、轨迹采集、服务端上传和后台定位不在本篇展开。
:::

## 一、能力与规范归属

### 1. 定位接口来自独立规范

Geolocation 有自己的规范与错误模型，浏览器把它挂在 `navigator` 上。学习时应查该规范的接口定义，而不是在 HTML 元素列表里寻找对应标签。

### 2. 先检查接口是否存在

不同环境可能没有暴露定位能力，例如被策略禁用或运行在不支持的环境。访问前先判断：

```js
if (!("geolocation" in navigator)) {
  status.textContent = "当前浏览器没有提供定位接口。";
}
```

直接调用 `navigator.geolocation.getCurrentPosition` 会在接口缺失时抛出异常，页面停在半途。

### 3. 定位结果不等于 GPS

浏览器可能综合 Wi-Fi、基站、IP 地址或系统定位服务估算位置。返回的 `accuracy` 是精度半径的估计，不是误差保证；室内、模拟器或权限受限时，结果可能偏差很大。

## 二、安全上下文、权限与用户触发

### 1. 需要安全上下文

定位接口只在安全上下文中可用：HTTPS，或浏览器认可的本地回环地址（如 `http://localhost`、`http://127.0.0.1`）。普通 HTTP 页面调用会被拒绝，`window.isSecureContext` 可以先行判断。

### 2. 权限由用户决定

第一次请求会触发浏览器权限提示；用户可以允许、拒绝，或在设置中预先阻止。代码无法绕过这个决定，也不应该用反复弹窗逼迫用户同意。

### 3. 只在用户操作后请求

定位应在用户点击按钮、选择菜单之后发起，而不是页面一加载就请求。这样用户知道请求与什么操作相关，也避免无意义的权限提示打断阅读。

### 4. 拒绝后提供替代路径

拒绝定位后，页面应说明原因，并允许用户手动填写城市、邮编或选择范围。不要因为一次拒绝就无限重试，也不要假定用户会改变主意。

::: warning 位置是敏感数据
精确坐标可以推断住址、工作地点和作息。示例与演示应使用模拟位置或公开地标，不要把真实坐标写进页面、日志或 Web Storage，也不要在没有明确目的和告知的情况下上传。
:::

## 三、一次定位的结果与精度

### 1. getCurrentPosition 接收两个回调

```js
navigator.geolocation.getCurrentPosition(onSuccess, onError, options);
```

成功时调用第一个回调并传入位置对象，失败时调用第二个回调并传入错误对象。第三个参数是选项对象，可以省略。两个回调都应处理，只写成功分支会让失败变成静默。

### 2. coords 中的常用字段

位置对象的 `coords` 包含 `latitude`、`longitude`、`accuracy`，可能还有 `altitude`、`heading`、`speed` 等字段。它们不一定都存在，使用前应判断，不要假定每次都有高度或方向。

### 3. accuracy 是半径估计

`accuracy` 以米为单位，表示置信半径的估计。数值越小通常越精确，但它不是“真实误差上界”。展示位置时应同时说明精度，例如“约 100 米范围内”，而不是给出一个看似精确的坐标。

### 4. 错误码分三类

失败回调的 `error.code` 有三个常见值：`1` 表示权限被拒绝，`2` 表示位置不可用，`3` 表示超时。三者原因不同，处理方式也不同：权限问题要引导设置或手工输入，不可用与超时可以提示稍后重试。

## 四、选项与连续监听

### 1. timeout、maximumAge 与 enableHighAccuracy

`timeout` 是等待位置的最长时间（毫秒）；`maximumAge` 允许接受多久以内的缓存位置，`0` 表示尽量取新值；`enableHighAccuracy` 提示希望更高精度，可能增加耗电与等待时间。三者都是请求参数，浏览器可以按设备与策略调整实际行为。

### 2. watchPosition 持续观察

`watchPosition` 与一次定位参数相同，但会在位置变化时反复调用成功回调，并返回一个用于停止的编号：

```js
const watchId = navigator.geolocation.watchPosition(onSuccess, onError, options);
```

它适合导航、运动记录等需要持续更新的场景；普通“显示我的城市”不需要持续监听。

### 3. clearWatch 必须成对调用

停止监听要调用 `navigator.geolocation.clearWatch(watchId)`。不停止的监听会持续消耗电量和权限，页面关闭前应清理；重复点击开始按钮时先判断是否已有监听编号。

### 4. 监听不等于后台任务

页面隐藏、标签页关闭或浏览器挂起时，监听可能暂停或停止。它不能替代原生应用的后台定位，也不保证按固定间隔回调。

## 五、从空目录请求并验证

### 1. 创建 geo.html

新建空目录 `html-geo`，创建 UTF-8 文件 `geo.html`。页面只有三个按钮与状态区域，点击后才请求权限：

::: details 查看 geo.html 完整内容

```html [geo.html]
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>请求当前位置</title>
</head>
<body>
  <h1>请求当前位置</h1>
  <p>只有点击按钮后才会请求定位权限。</p>
  <p>
    <button id="locate" type="button">获取一次位置</button>
    <button id="watch" type="button">开始连续监听</button>
    <button id="stop" type="button">停止监听</button>
  </p>
  <p id="status" role="status">尚未请求。</p>
  <p>坐标：<span id="coords">—</span></p>
  <p>精度：<span id="accuracy">—</span></p>
  <ol id="log"></ol>
  <script>
    const status = document.getElementById("status");
    const coords = document.getElementById("coords");
    const accuracy = document.getElementById("accuracy");
    const log = document.getElementById("log");
    let watchId = null;

    /** 追加一条记录；无返回值。 */
    function record(text) {
      const item = document.createElement("li");
      item.textContent = text;
      log.append(item);
    }

    /** 把位置结果显示到页面；只保留四位小数，不写入存储。 */
    function showPosition(position) {
      const c = position.coords;
      coords.textContent = c.latitude.toFixed(4) + ", " + c.longitude.toFixed(4);
      accuracy.textContent = Math.round(c.accuracy) + " 米";
      status.textContent = "已取得位置。";
      record("成功：精度约 " + Math.round(c.accuracy) + " 米");
    }

    /** 把错误码翻译成可操作的原因；无返回值。 */
    function showError(error) {
      const reasons = {
        1: "用户或浏览器拒绝了定位权限",
        2: "暂时无法确定位置",
        3: "在规定时间内没有取得位置",
      };
      status.textContent = "定位失败：" + (reasons[error.code] || "未知原因");
      record("失败：code " + error.code + "，" + error.message);
    }

    if (!("geolocation" in navigator)) {
      status.textContent = "当前浏览器没有提供定位接口。";
    } else if (!window.isSecureContext) {
      status.textContent = "当前页面不是安全上下文，定位请求会被拒绝。";
    }

    document.getElementById("locate").addEventListener("click", () => {
      status.textContent = "正在请求位置……";
      navigator.geolocation.getCurrentPosition(showPosition, showError, {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 0,
      });
    });

    document.getElementById("watch").addEventListener("click", () => {
      if (watchId !== null) {
        status.textContent = "已经在监听中。";
        return;
      }
      status.textContent = "开始连续监听……";
      watchId = navigator.geolocation.watchPosition(showPosition, showError, {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 0,
      });
      record("开始监听，watchId 为 " + watchId);
    });

    document.getElementById("stop").addEventListener("click", () => {
      if (watchId === null) {
        status.textContent = "当前没有监听。";
        return;
      }
      navigator.geolocation.clearWatch(watchId);
      record("已停止监听 " + watchId);
      watchId = null;
      status.textContent = "已停止监听。";
    });
  </script>
</body>
</html>
```

:::

### 2. 用模拟位置完成成功分支

在 `html-geo` 目录启动静态服务：

```bash
python3 -m http.server 8130
```

访问 `http://127.0.0.1:8130/geo.html`。在 Chrome 开发者工具的 Sensors 面板选择自定义位置，填入公开演示坐标，例如纬度 `31.2304`、经度 `121.4737`、精度 `100`；然后点击“获取一次位置”并允许权限。页面应显示 `31.2304, 121.4737`、精度“100 米”，并记录一条成功信息。

使用开发者工具模拟时，结果来自你填入的坐标，不是设备的真实位置；验证记录必须写明这一点。

### 3. 观察连续监听与停止

点击“开始连续监听”，记录列表应出现开始信息。在 Sensors 面板把位置改为邻近坐标，页面坐标应随之更新并新增记录。点击“停止监听”后再次修改模拟位置，坐标与记录不再变化，状态显示“已停止监听”。

### 4. 对照拒绝分支

在页面权限设置中把定位改为“阻止”，刷新后点击“获取一次位置”。本次应得到 `code 1`，页面显示“用户或浏览器拒绝了定位权限”，并记录 `User denied Geolocation`。恢复权限后可重新请求。

| 观察项 | 条件 | 本次结果 |
|--------|------|----------|
| 安全上下文 | `window.isSecureContext` | `true` |
| 一次定位 | 模拟 `31.2304, 121.4737`、精度 100 | 坐标 `31.2304, 121.4737`，精度“100 米” |
| 连续监听 | 更新模拟位置 | 坐标更新为 `31.2305, 121.4738` |
| 停止监听 | 点击停止后再改位置 | 坐标不变，状态“已停止监听” |
| 拒绝授权 | 不授予定位权限 | `code 1`，`User denied Geolocation` |
| 极短超时 | `timeout: 1` | 本次仍立即返回位置，未复现超时分支 |

## 六、验证记录与边界

以上文件于 2026-11-14 在 macOS 的 Chrome 157.0.8103.79 中核对。页面通过 `python3 -m http.server` 在回环地址访问，`isSecureContext` 为 `true`；成功分支使用浏览器调试协议注入的模拟位置 `31.2304, 121.4737`、精度 100 米，页面读数与之一致；连续监听在模拟位置更新后刷新坐标，调用 `clearWatch` 后不再变化；拒绝权限时得到 `code 1` 与 `User denied Geolocation`。

`timeout: 1` 的请求在本次环境中仍立即返回位置，未复现超时错误；非安全上下文、位置不可用、真实设备传感器、其他浏览器与移动端后台行为均未验证。示例只显示四位小数且不写入存储，验证记录中的坐标是公开演示值，不是真实位置。`geo.html` 经本地 Nu HTML Checker 26.11.9（0f0f1f9）检查无错误、无警告。
