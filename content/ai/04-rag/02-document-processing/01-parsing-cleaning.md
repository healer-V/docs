---
title: "解析与清洗"
tags:
  - RAG
  - 文档解析
  - Python
excerpt: "将 UTF-8 文本和受约束的 HTML 政策转换为可定位的正文区块，保留标题、段落、条件和原始版本信息，验证导航噪声、否定词、空内容、编码错误与不支持的结构。"
date: 2026-09-29
---

# 解析与清洗

解析把原始文件转换为正文和结构，清洗依据来源规则移除与知识无关的噪声。RAG 需要的结果是能够解释和回查的资料，而不仅是一串去掉标签的文字。标题、否定词、适用条件和原文位置都可能影响回答是否成立。

例如，配送政策页面有重复导航，也有“未经审批不得退款”的限制。导航可以按结构排除，限制中的“不”必须保留。清洗若把这类词当作低价值词删除，检索与生成都会基于已经失真的资料工作。

## 一、原文与解析结果

### 1. 原始资料的身份

原文应具有来源、逻辑文档 ID 和版本。解析结果还需要记录处理器版本，说明同一份资料经过了什么规则。内容哈希是根据文件字节计算的摘要，用于识别变化；它不能证明资料权威或已经获得处理许可。

| 对象 | 本例记录 | 用途 |
|------|----------|------|
| 逻辑资料 | `doc_id=shipping-policy`、`version=1` | 区分资料身份与版本 |
| 原始文件 | `shipping.html` 或 `shipping.txt` | 回查当前解析输入 |
| 原始摘要 | `raw_sha256` | 识别字节变化 |
| 处理规则 | `parser_version=policy-parser-1` | 识别解析行为变化 |
| 正文区块 | 类型、标题级别、文字、起止行 | 支撑切分及来源定位 |

正文区块是一个具有语义边界的单元，例如标题或段落。区块还不是最终检索片段；是否组合、重叠或进一步切分，需要结合检索输入限制决定。

### 2. 定位信息

本例的行号从 1 开始，覆盖区块对应的原始文件行。HTML 去标签、实体转换和空白整理会改变字符位置，所以这些行号只用于定位来源区域，不声称清洗后文字与原始字节存在逐字符对应关系。

需要精确引用时，应保存原始快照并维护更细的映射。只保存清洗文字而丢弃输入和处理规则，会让后续引用无法解释变化发生在哪一步。

## 二、清洗规则

### 1. 编码与空白

编码决定文件字节怎样变成字符。本例只接受 UTF-8，允许 UTF-8 BOM，即文件开头的编码标记；无法解码时明确失败，不使用 `errors="ignore"` 丢弃未知字节。

文本中的空行用于分隔段落。HTML 段落内部的布局空白可以合并，但段落和标题之间的结构不能消失。货币符号、否定词和数字也不能因清洗偏好而删除。

::: warning 编码失败不能静默修复
忽略解码错误可能删掉关键字符，让程序继续输出看似完整的政策。应保留原始输入，核对来源编码，使用经过验证的适配器重新处理；不要把乱码或空输出标成成功。
:::

### 2. HTML 的结构边界

HTML 应由解析器处理，而不是用一个正则表达式删除全部标签。本例使用标准库 `HTMLParser`，针对约定的政策页面提取 `<main>` 中的标题、段落和列表项，并排除导航、页脚、侧栏、脚本及样式。

这是一份受约束的来源适配器：页面必须有一个闭合的 `<main>`，正文只支持指定区块与内联标签。表格、图片和其他未适配结构会失败，避免把缺失正文当作完整结果。

通用网页、PDF、扫描件和办公文件需要各自的适配器。扫描件还可能需要 OCR，即从图像识别文字；识别准确率和表格关系需要独立验证，不能从此例推断。

### 3. 噪声与重复

可以按来源结构排除重复菜单，但不应按“相同文字出现过”全局删除段落。同一限制可能分别适用于不同地区或渠道，重复本身不等于无价值。

清洗规则应保留证据：排除了什么节点、哪些区块无法处理、处理前后有哪些语义变化。对新来源先抽样核对否定词、金额、时间和条件，确认后再批量运行。

## 三、独立政策解析

### 1. 环境与输入

使用 Python 3.12 标准库，在空目录创建 `parse_policies.py`：

```powershell
mkdir policy-parser-demo
cd policy-parser-demo
python --version
```

程序在临时目录创建虚构政策文件，验证结束后自动清理，不覆盖当前目录的既有文件。HTML 包含重复导航、两级标题、带内联标签的否定句和配送时效。

::: info 文件及结构限制
只处理 `.txt`、`.html` 和 `.htm`，单文件最多 1 MiB，即 1,048,576 字节。HTML 适配范围在代码中明确列出；不支持的文件或正文结构会返回异常，不降级为空知识。
:::

### 2. 完整实现

解析器回调记录原始行号，保留标题级别和段落边界。文件层负责格式、大小及编码检查，防止把读取失败与“没有正文”混为一谈。

::: details 查看政策解析器与八个验证用例

```python
# parse_policies.py
import hashlib
from html.parser import HTMLParser
from pathlib import Path
from tempfile import TemporaryDirectory


RAW_HTML = """<html><body>
<nav>Shipping menu Shipping menu</nav>
<main>
<h1>Shipping policy</h1>
<h2>Refund limits</h2>
<p>Do <strong>not</strong> refund before approval.</p>
<p>Standard shipping takes 3 to 5 business days after dispatch.</p>
</main>
<footer>Site navigation</footer>
<script>console.log('tracking only')</script>
</body></html>
"""


class PolicyHTMLParser(HTMLParser):
    """提取受约束政策页的 main 正文，不作为通用 HTML 修复器。"""

    def __init__(self) -> None:
        """初始化单文档解析状态。

        Returns:
            无返回值；创建区块、来源位置与排除子树状态。
        """
        super().__init__(convert_charrefs=True)
        self.blocks = []
        self.main_count = 0
        self.in_main = False
        self.ignored = []
        self.block_tag = None
        self.parts = []
        self.start_line = 0

    def handle_starttag(self, tag: str, attrs: list[tuple]) -> None:
        """处理正文标签，排除噪声并拒绝未适配结构。

        Args:
            tag: HTMLParser 规范化后的标签名。
            attrs: 解析器提供的属性，本例不依赖其内容决定权限或正文。

        Returns:
            无返回值；更新解析状态，不支持的正文结构抛出 ValueError。
        """
        void_tags = {"br", "img", "hr", "input", "meta", "link", "source", "wbr"}
        if self.ignored:
            if tag not in void_tags:
                self.ignored.append(tag)
            return
        if tag == "main":
            self.main_count += 1
            if self.in_main or self.main_count != 1:
                raise ValueError("exactly one main required")
            self.in_main = True
            return
        if not self.in_main:
            return
        if tag in {"nav", "footer", "aside", "script", "style"}:
            self.ignored.append(tag)
        elif tag in {"h1", "h2", "h3", "p", "li"}:
            if self.block_tag is not None:
                raise ValueError("nested content block")
            self.block_tag = tag
            self.start_line = self.getpos()[0]
            self.parts = []
        elif tag == "br":
            if self.block_tag is not None:
                self.parts.append(" ")
        elif tag not in {"div", "section", "article", "ul", "ol", "a", "span", "strong", "em", "code"}:
            raise ValueError("unsupported body structure")

    def handle_endtag(self, tag: str) -> None:
        """结束区块并保留原始行号，检查排除子树闭合。

        Args:
            tag: 当前结束标签；噪声子树必须按开始顺序反向闭合。

        Returns:
            无返回值；保存非空区块，结构不一致时抛出 ValueError。
        """
        if self.ignored:
            if tag in {"br", "img", "hr", "input", "meta", "link", "source", "wbr"}:
                return
            if tag != self.ignored[-1]:
                raise ValueError("unbalanced ignored structure")
            self.ignored.pop()
            return
        if not self.in_main:
            return
        if tag == "main":
            if self.block_tag is not None:
                raise ValueError("unclosed content block")
            self.in_main = False
        elif tag in {"h1", "h2", "h3", "p", "li"}:
            if tag != self.block_tag:
                raise ValueError("unbalanced content block")
            text = " ".join("".join(self.parts).split())
            if text:
                self.blocks.append({
                    "kind": "heading" if tag.startswith("h") else "paragraph",
                    "level": int(tag[1]) if tag.startswith("h") else None,
                    "text": text, "line_start": self.start_line,
                    "line_end": self.getpos()[0],
                })
            self.block_tag = None
            self.parts = []

    def handle_data(self, data: str) -> None:
        """保留正文字符，拒绝无法归属区块的有效文字。

        Args:
            data: 解析器解码后的文字，不据此删除否定词或赋予权限。

        Returns:
            无返回值；正文追加到当前区块，未包装正文抛出 ValueError。
        """
        if not self.in_main or self.ignored:
            return
        if self.block_tag is not None:
            self.parts.append(data)
        elif data.strip():
            raise ValueError("body text requires a content block")


def text_blocks(text: str) -> list[dict]:
    """以空行区分 UTF-8 文本段落并记录行区间。

    Args:
        text: 已解码的文本，保留段落内换行，不推断 Markdown 标题。

    Returns:
        非空段落列表；行号从 1 开始，空文档得到空列表。
    """
    blocks = []
    pending = []
    start = 0
    for number, line in enumerate([*text.splitlines(), ""], start=1):
        if line.strip():
            if not pending:
                start = number
            pending.append(line.strip())
        elif pending:
            blocks.append({"kind": "paragraph", "level": None,
                           "text": "\n".join(pending), "line_start": start, "line_end": number - 1})
            pending = []
    return blocks


def parse_source(path: Path, doc_id: str, version: int) -> dict:
    """解析一个受约束的政策文件并绑定输入身份。

    Args:
        path: 仅允许 txt/html/htm 的本地非敏感文件，最多 1 MiB。
        doc_id: 应用登记的非空逻辑文档 ID。
        version: 应用确定的正整数版本，布尔值不作为版本。

    Returns:
        原始摘要、处理器版本和正文区块；读取、编码或结构失败向调用方抛出。
    """
    if not doc_id.strip() or type(version) is not int or version < 1:
        raise ValueError("invalid document identity")
    if path.suffix.lower() not in {".txt", ".html", ".htm"}:
        raise ValueError("unsupported file format")
    raw = path.read_bytes()
    if len(raw) > 1048576:
        raise ValueError("file too large")
    text = raw.decode("utf-8-sig")
    if path.suffix.lower() == ".txt":
        blocks = text_blocks(text)
    else:
        parser = PolicyHTMLParser()
        parser.feed(text)
        parser.close()
        if parser.main_count != 1 or parser.in_main or parser.block_tag or parser.ignored:
            raise ValueError("incomplete policy structure")
        blocks = parser.blocks
    if not blocks:
        raise ValueError("empty content")
    return {"doc_id": doc_id, "version": version, "source": path.name,
            "raw_sha256": hashlib.sha256(raw).hexdigest(),
            "parser_version": "policy-parser-1", "blocks": blocks}


def run_tests() -> None:
    """验证八条正文保留与失败路径，仅使用临时虚构文件。

    Returns:
        无返回值；失败抛出断言错误，通过输出结果，临时文件自动清理。
    """
    with TemporaryDirectory(prefix="policy-parser-") as directory:
        root = Path(directory)
        html = root / "shipping.html"
        html.write_text(RAW_HTML, encoding="utf-8")
        parsed = parse_source(html, "shipping-policy", 1)
        blocks = parsed["blocks"]
        assert len(blocks) == 4 and [block["level"] for block in blocks[:2]] == [1, 2]
        assert not any("menu" in block["text"] for block in blocks)
        assert blocks[2]["text"] == "Do not refund before approval."
        assert blocks[2]["line_start"] == blocks[2]["line_end"] == 6
        assert parsed["raw_sha256"] == hashlib.sha256(html.read_bytes()).hexdigest()
        plain = root / "shipping.txt"
        plain.write_text("Shipping policy\n\nRefunds require approval.\nDo not skip approval.\n", encoding="utf-8")
        paragraphs = parse_source(plain, "shipping-policy", 1)["blocks"]
        assert len(paragraphs) == 2 and paragraphs[1]["line_start"] == 3
        assert paragraphs[1]["line_end"] == 4 and "\n" in paragraphs[1]["text"]
        failures = [
            ("empty.txt", b" \n", ValueError),
            ("invalid.txt", b"\xff\xfe", UnicodeDecodeError),
            ("policy.pdf", b"unsupported", ValueError),
            ("table.html", b"<main><table><tr><td>Rule</td></tr></table></main>", ValueError),
            ("broken.html", b"<main><p>Do not refund.", ValueError),
        ]
        for filename, content, error_type in failures:
            path = root / filename
            path.write_bytes(content)
            try:
                parse_source(path, "shipping-policy", 1)
            except error_type:
                continue
            raise AssertionError(f"failure accepted: {filename}")
        print("parser_tests=passed cases=8")
        print(f"html_blocks={len(blocks)} negation=preserved source_line={blocks[2]['line_start']}")


if __name__ == "__main__":
    run_tests()
```

:::

### 3. 执行与结果

运行当前文件：

```powershell
python parse_policies.py
```

通过时输出：

```text
parser_tests=passed cases=8
html_blocks=4 negation=preserved source_line=6
```

四个 HTML 区块分别是两个标题和两个段落。退款限制完整保留 `not`，并能定位到输入第 6 行；导航文字未进入区块。文本路径保留段落内换行，五个失败夹具都被拒绝。

这些结果证明固定来源规则下的结构和文字保留，没有证明通用网页解析或业务事实正确。程序对列表保留项边界，但未保存复杂嵌套列表、页面布局或内联链接的全部属性。

## 四、排查与修复

| 现象 | 定位证据 | 处理 |
|------|----------|------|
| 正文少了限制词 | 对照原始快照与区块文字 | 移除删除停用词等改变含义的规则，重新处理受影响资料 |
| 菜单反复出现 | 区块来源位于导航节点 | 为实际来源建立结构排除规则，避免全局删重复句 |
| 返回空区块 | 页面没有 main、正文为空或结构未适配 | 区分来源变化与空资料，失败不发布 |
| UTF-8 解码失败 | `UnicodeDecodeError` 与原始字节 | 核对编码，增加明确适配器，保留失败样本 |
| 表格没有进入正文 | `unsupported body structure` | 使用能够保留行列及表头的适配器，不直接去标签拼接 |
| 引用行号找不到正文 | 原始快照或处理器版本不同 | 绑定来源版本，重新建立定位映射 |

修复解析规则后，应重跑成功与失败夹具，并对照关键限制，再发布新处理结果。历史结果是否重建取决于处理器版本及影响范围；检索命中率提高不能替代语义保留检查。

## 五、参考资料

- [Python HTMLParser](https://docs.python.org/3.12/library/html.parser.html)：事件回调、实体转换和解析边界。
- [Python pathlib](https://docs.python.org/3.12/library/pathlib.html)：文件读取及编码接口。
- [数据来源与权限](../01-knowledge-boundary/02-data-sources-permissions.md)：原始资料的处理许可。
- [切分与元数据](./02-chunking-metadata.md)：解析区块如何形成可追溯片段。
