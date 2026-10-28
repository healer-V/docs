---
title: "Portal 与浮层组件"
tags:
  - React
  - Portal
  - 模态框
excerpt: "讲解 ReactDOM.createPortal 的参数和树关系，并通过模态框说明事件冒泡、挂载容器、焦点、Esc 关闭、滚动和 SSR 边界。"
date: 2026-07-31
---

# Portal 与浮层组件

## 一、Portal

### 1. createPortal

`ReactDOM.createPortal` 把 React 子内容提交到组件父级 DOM 之外的指定容器。

```text
ReactDOM.createPortal(child, container)
```

| 参数或返回值 | 含义 |
|--------------|------|
| `child` | React 可渲染内容 |
| `container` | 已存在的 DOM 元素 |
| 返回值 | React Portal，可作为组件返回值 |

页面准备两个宿主容器：

```html
<body>
  <div id="root"></div>
  <div id="overlay-root"></div>
</body>
```

组件把提示内容渲染到 `overlay-root`：

```jsx
/**
 * 把提示内容提交到浮层容器。
 * @param {{ children: React.ReactNode }} props 组件属性。
 * @returns {React.ReactPortal} 浮层 Portal。
 */
function Overlay({ children }) {
  const container = document.getElementById("overlay-root");
  return ReactDOM.createPortal(children, container);
}
```

`Overlay` 在 React 树中的位置不变，但其 DOM 出现在 `#overlay-root` 内。

### 2. 容器必须存在

`container` 必须是有效 DOM 节点。找不到容器时应主动报错：

```jsx
const overlayRoot = document.getElementById("overlay-root");

if (overlayRoot === null) {
  throw new Error("页面缺少 #overlay-root 容器");
}
```

不要在每次渲染时随意创建新的容器，否则 Portal 内容会被反复移动。动态创建容器时，需要在挂载时追加、卸载时移除。

## 二、React 树与 DOM 树

### 1. Portal 只改变 DOM 位置

Portal 中的内容仍然是原组件的 React 后代，因此：

- 可以读取原 React 树中的 Context；
- 错误由原 React 树上方的错误边界捕获；
- React 事件按 React 树向上冒泡；
- State 仍属于原组件身份。

```text
React 树
TaskPage
└─ Modal
   └─ DeleteConfirm

DOM 树
body
├─ #root
│  └─ TaskPage DOM
└─ #overlay-root
   └─ DeleteConfirm DOM
```

### 2. 事件按 React 树冒泡

```jsx
/**
 * 演示 Portal 事件仍向 React 父组件冒泡。
 * @returns {React.ReactElement} 页面与浮层按钮。
 */
function EventDemo() {
  /**
   * 接收页面 React 子树中的单击事件。
   * @returns {void}
   */
  function handlePageClick() {
    console.log("TaskPage 收到单击");
  }

  return (
    <div onClick={handlePageClick}>
      <Overlay>
        <button type="button">Portal 按钮</button>
      </Overlay>
    </div>
  );
}
```

按钮 DOM 不在外层 `div` 内，但单击仍会触发 `handlePageClick`。如果浮层需要阻止上层 React 事件，应在合适位置调用 `event.stopPropagation()`。

原生 `document.addEventListener` 仍按真实 DOM 路径观察事件，两套传播路径不能混为一谈。

## 三、模态框

### 1. 基本结构

模态框不仅是“Portal + 遮罩”，还需要：

- `role="dialog"`；
- `aria-modal="true"`；
- 可访问标题；
- Esc 关闭；
- 初始焦点；
- 关闭后恢复焦点；
- 遮罩点击策略；
- 页面滚动处理。

下面示例假定页面已存在 `#overlay-root`：

```jsx
/**
 * 显示确认模态框。
 * @param {{
 *   title: string,
 *   children: React.ReactNode,
 *   onConfirm: () => void,
 *   onClose: () => void
 * }} props 组件属性。
 * @returns {React.ReactPortal} 模态框 Portal。
 */
function ConfirmDialog({
  title,
  children,
  onConfirm,
  onClose
}) {
  const confirmButtonRef = React.useRef(null);
  const titleId = "confirm-dialog-title";
  const overlayRoot = document.getElementById("overlay-root");

  React.useEffect(
    /**
     * 挂载后聚焦确认按钮并监听 Esc。
     * @returns {() => void} 移除键盘监听的清理函数。
     */
    () => {
      confirmButtonRef.current.focus();

      /**
       * 按 Esc 时关闭模态框。
       * @param {KeyboardEvent} event 键盘事件。
       * @returns {void}
       */
      function handleKeyDown(event) {
        if (event.key === "Escape") {
          onClose();
        }
      }

      document.addEventListener("keydown", handleKeyDown);

      /**
       * 移除键盘监听。
       * @returns {void}
       */
      function cleanupKeyDown() {
        document.removeEventListener("keydown", handleKeyDown);
      }

      return cleanupKeyDown;
    },
    [onClose]
  );

  /**
   * 阻止对话框内部单击触发遮罩关闭。
   * @param {React.MouseEvent<HTMLDivElement>} event React 单击事件。
   * @returns {void}
   */
  function handleDialogClick(event) {
    event.stopPropagation();
  }

  if (overlayRoot === null) {
    throw new Error("页面缺少 #overlay-root 容器");
  }

  return ReactDOM.createPortal(
    <div className="dialog-backdrop" onClick={onClose}>
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={handleDialogClick}
      >
        <h2 id={titleId}>{title}</h2>
        <div>{children}</div>
        <div className="dialog__actions">
          <button type="button" onClick={onClose}>取消</button>
          <button
            ref={confirmButtonRef}
            type="button"
            onClick={onConfirm}
          >
            确认
          </button>
        </div>
      </div>
    </div>,
    overlayRoot
  );
}
```

显示后焦点进入确认按钮，按 Esc 或单击遮罩触发 `onClose`，单击对话框内部不会关闭。

### 2. 恢复焦点

打开模态框的组件应保存触发元素，关闭后把焦点返回原位置。最直接的方式是为打开按钮保存 Ref：

```jsx
const openButtonRef = React.useRef(null);

/**
 * 关闭模态框并恢复触发按钮焦点。
 * @returns {void}
 */
function handleCloseDialog() {
  setDialogOpen(false);

  window.requestAnimationFrame(
    /**
     * DOM 提交后恢复焦点。
     * @returns {void}
     */
    () => {
      if (openButtonRef.current) {
        openButtonRef.current.focus();
      }
    }
  );
}
```

复杂模态框还需要焦点圈定，使 Tab 不会移动到背景页面。生产项目通常使用经过无障碍验证的对话框库，而不是只实现视觉遮罩。

## 四、布局与层叠

### 1. 解决 overflow 裁剪

Portal 常用于把浮层移出具有 `overflow: hidden` 的祖先。移出后要重新考虑：

- 定位参照；
- `z-index` 和层叠上下文；
- 页面滚动；
- 主题样式；
- 浮层与触发元素的几何关系。

Portal 不会自动计算弹出位置。菜单、气泡和下拉框需要读取触发元素位置，并处理滚动和窗口尺寸变化。

### 2. 页面滚动锁定

模态框打开时可以在 Effect 中保存并修改 `document.body.style.overflow`：

```jsx
React.useEffect(
  /**
   * 模态框挂载期间锁定页面滚动。
   * @returns {() => void} 恢复原样式的函数。
   */
  () => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    /**
     * 恢复打开前的 overflow。
     * @returns {void}
     */
    function cleanupScrollLock() {
      document.body.style.overflow = previousOverflow;
    }

    return cleanupScrollLock;
  },
  []
);
```

直接恢复为空字符串可能覆盖页面原有行内样式，因此需要保存旧值。

## 五、动态容器

第三方页面无法预先提供容器时，可以让组件实例创建自己的 DOM 节点：

```jsx
/**
 * 创建并管理独立 Portal 容器。
 * @param {{ children: React.ReactNode }} props 组件属性。
 * @returns {React.ReactPortal | null} Portal 或挂载前的空渲染。
 */
function DynamicPortal({ children }) {
  const containerRef = React.useRef(null);

  if (containerRef.current === null) {
    containerRef.current = document.createElement("div");
  }

  React.useEffect(
    /**
     * 把容器加入 body。
     * @returns {() => void} 移除容器的清理函数。
     */
    () => {
      const container = containerRef.current;
      document.body.appendChild(container);

      /**
       * 从 body 移除当前容器。
       * @returns {void}
       */
      function cleanupContainer() {
        document.body.removeChild(container);
      }

      return cleanupContainer;
    },
    []
  );

  return ReactDOM.createPortal(children, containerRef.current);
}
```

这里的 Ref 初始化具有可预测的一次性结果。容器追加和移除仍放在 Effect 中。

## 六、服务端渲染

服务端没有 `document`。组件在渲染期间直接访问 `document.getElementById` 会导致服务端报错。

支持 SSR 时可以：

- 在客户端挂载后再查找 Portal 容器；
- 服务端返回 `null` 或与客户端一致的占位结构；
- 保证客户端激活前后 DOM 结构一致；
- 避免在服务端调用布局和焦点 API。

Portal 内容本身不会自动解决服务端浮层容器与客户端激活问题。

## 七、常见问题

| 问题 | 原因 | 处理方式 |
|------|------|----------|
| Portal 内容不显示 | 容器不存在或被样式隐藏 | 验证 DOM 容器和层叠样式 |
| 单击浮层触发页面处理 | 事件按 React 树冒泡 | 在明确边界阻止传播 |
| 关闭后键盘焦点丢失 | 没有恢复触发元素焦点 | 保存触发按钮 Ref |
| 背景仍可滚动或操作 | 只实现视觉遮罩 | 增加滚动锁定、焦点圈定和背景隔离 |
| SSR 报 `document is not defined` | 服务端渲染访问浏览器 API | 延迟到客户端 Effect |
| 动态容器残留 | 卸载时没有移除节点 | 在 cleanup 中移除 |

Portal 只负责改变 DOM 提交位置；浮层的交互、无障碍、定位和资源清理仍由组件完整实现。
