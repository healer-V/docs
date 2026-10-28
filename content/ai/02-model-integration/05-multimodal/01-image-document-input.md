---
title: "图像与文档输入"
tags:
  - OpenAI API
  - Vision
  - 文件输入
excerpt: "通过 URL、Data URL 或文件引用向 Responses API 提交图像和文档，核对 MIME 类型、模型能力、文件处理方式与附件中的可验证事实。"
date: 2026-09-28
---

# 图像与文档输入

图像和文档不是普通文本字符串。应用需要选择正确的内容类型、传输方式和兼容模型，并用只存在于附件中的事实验证模型是否真正读取了输入。**接口接受文件不等于视觉结论必然正确，也不等于适合建立大规模知识检索。**

本文在空目录生成一张带工单编号的 PNG 和一份两页 PDF，然后分别提问附件中的确定事实。示例不使用真实客户截图或业务文档。

## 一、输入方式

### 1. 图像输入

Responses API 的图像内容部件使用 `input_image`。常见来源包括：

| 方式 | 字段 | 适用场景 | 主要风险 |
|------|------|----------|----------|
| 公网 URL | `image_url` | 已有稳定、可访问资源 | URL 失效、鉴权和外部泄露 |
| Base64 Data URL | `image_url` | 小型本地测试文件 | 请求体膨胀、日志误记录 |
| Files API 引用 | `file_id` | 复用已上传文件 | 文件生命周期与权限管理 |

Base64 方式必须包含真实 MIME 类型前缀，例如 `data:image/png;base64,`。仅传 Base64 字符串不能说明内容格式。

```python
{
    "type": "input_image",
    "image_url": f"data:image/png;base64,{encoded_image}",
    "detail": "high",
}
```

`detail` 影响视觉处理精度和 Token 使用。文字较小、图表密集或需要读取细节时才使用较高等级；简单对象识别不应默认使用最高成本配置。

### 2. 文档输入

Responses API 的文档内容部件使用 `input_file`。文件可以通过 Base64 数据、上传后的 `file_id` 或外部 `file_url` 提交，具体支持范围取决于端点。

```python
{
    "type": "input_file",
    "filename": "case-summary.pdf",
    "file_data": f"data:application/pdf;base64,{encoded_pdf}",
}
```

PDF 会同时提供提取文本与页面图像给具备视觉能力的模型。非 PDF 文档通常只提取文本，嵌入其中的图片和图表不会自动进入模型上下文；需要保留版面或图表时，应转换为 PDF 后再验证。

::: warning 文件输入不等于 RAG
直接附加文件适合有界、少量、单次请求。大量文档、权限过滤、增量更新和引用检索应使用专门的 RAG 链路，不能把所有文件塞进一次模型请求。
:::

## 二、格式与能力

### 1. MIME 类型

扩展名、MIME 类型和真实文件内容必须一致。把 PNG 改名为 `.jpg` 不会改变编码格式；服务端或中间网关可以据此拒绝请求。

| 文件 | 正确 MIME 类型 | 识别方式 |
|------|----------------|----------|
| PNG | `image/png` | 文件签名与解码器 |
| JPEG | `image/jpeg` | 文件签名与解码器 |
| WEBP | `image/webp` | 文件签名与解码器 |
| PDF | `application/pdf` | `%PDF-` 文件头 |

正文中的大小和数量限制以 2026-09-28 官方文档为核对基线。图像输入支持 PNG、JPEG、WEBP 和非动画 GIF；当前官方页面给出的单请求总载荷上限与图片数量仍需在上线前重新核对，因为模型上下文、组织策略和兼容网关可以施加更小限制。

### 2. 模型兼容性

文本模型名称相似不代表都支持视觉或文件输入。调用前应核对：

1. 模型是否接受 `input_image` 或 `input_file`；
2. 当前 API 端点是否支持对应字段；
3. 文件类型和大小是否在限制内；
4. 总输入是否超出上下文窗口；
5. 数据保留策略是否允许上传该文件。

能力错误应在接入测试中暴露，不能依靠模型文本回答推断“附件已读取”。

## 三、测试资产

示例使用 Pillow 生成 PNG，使用 ReportLab 生成 PDF。两个文件都含有显式、可核对的虚构事实。

::: details 查看测试图片与 PDF 生成程序

```python
# create_assets.py
from pathlib import Path

from PIL import Image, ImageDraw
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas


def create_case_image(path: Path) -> None:
    """生成包含虚构工单编号和状态的 PNG 图片。

    Args:
        path: 输出 PNG 路径，父目录必须已经存在。

    Returns:
        无返回值；成功时创建一张 900×360 图片。
    """
    image = Image.new("RGB", (900, 360), "white")
    draw = ImageDraw.Draw(image)
    draw.rectangle((40, 40, 860, 320), outline="black", width=4)
    draw.text((90, 100), "SUPPORT CASE: CASE-1042", fill="black")
    draw.text((90, 170), "EXPORT STATUS: PROCESSING", fill="black")
    draw.text((90, 240), "RETRY COUNT: 3", fill="black")
    image.save(path, format="PNG")


def create_case_pdf(path: Path) -> None:
    """生成包含两页虚构工单事实的 PDF。

    Args:
        path: 输出 PDF 路径，父目录必须已经存在。

    Returns:
        无返回值；成功时创建两页 A4 文档。
    """
    document = canvas.Canvas(str(path), pagesize=A4)
    document.drawString(72, 760, "Support Case CASE-1042")
    document.drawString(72, 730, "Assigned queue: EXPORT-OPS")
    document.showPage()
    document.drawString(72, 760, "Recovery code: RC-731")
    document.drawString(72, 730, "Customer data: synthetic test only")
    document.save()


def main() -> None:
    """创建并检查两个非敏感多模态测试资产。"""
    create_case_image(Path("case-screen.png"))
    create_case_pdf(Path("case-summary.pdf"))
    assert Path("case-screen.png").read_bytes().startswith(b"\x89PNG")
    assert Path("case-summary.pdf").read_bytes().startswith(b"%PDF-")
    print("created case-screen.png and case-summary.pdf")


if __name__ == "__main__":
    main()
```

:::

创建环境与资产：

```powershell
mkdir multimodal-input-demo
cd multimodal-input-demo
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install openai==3.19.2 pillow==11.3.0 reportlab==4.4.4
python create_assets.py
```

预期输出：

```text
created case-screen.png and case-summary.pdf
```

## 四、完整调用

程序把两个本地文件转换为 Data URL，并在同一次请求中分别询问图片状态和 PDF 恢复码。

::: details 查看图像与 PDF 输入完整程序

```python
# inspect_attachments.py
import base64
import os
from pathlib import Path

from openai import OpenAI


def to_data_url(path: Path, mime_type: str) -> str:
    """将本地测试文件编码为带 MIME 类型的 Data URL。

    Args:
        path: 已存在且只包含非敏感测试数据的文件。
        mime_type: 与文件真实格式一致的 MIME 类型。

    Returns:
        可用于 Responses 内容部件的 Data URL。

    Raises:
        FileNotFoundError: 文件不存在。
        ValueError: MIME 类型为空。
    """
    if not mime_type:
        raise ValueError("mime_type must not be empty")
    encoded = base64.b64encode(path.read_bytes()).decode("ascii")
    return f"data:{mime_type};base64,{encoded}"


def inspect_attachments(client: OpenAI, model: str) -> str:
    """提交测试图片和 PDF，并返回模型的核对结果。

    Args:
        client: 已配置非生产凭据的 OpenAI 客户端。
        model: 同时支持图像与文件输入的模型标识。

    Returns:
        完成响应中的文本；调用方仍需核对附件事实。
    """
    image_url = to_data_url(Path("case-screen.png"), "image/png")
    pdf_url = to_data_url(Path("case-summary.pdf"), "application/pdf")
    response = client.responses.create(
        model=model,
        input=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "input_text",
                        "text": (
                            "只回答附件中的两个事实：图片里的 EXPORT STATUS 是什么，"
                            "PDF 第二页的 Recovery code 是什么？"
                        ),
                    },
                    {
                        "type": "input_image",
                        "image_url": image_url,
                        "detail": "high",
                    },
                    {
                        "type": "input_file",
                        "filename": "case-summary.pdf",
                        "file_data": pdf_url,
                    },
                ],
            }
        ],
    )
    if response.status != "completed" or not response.output_text:
        raise RuntimeError(f"attachment response unavailable: {response.status}")
    return response.output_text


def main() -> None:
    """运行附件核对，并验证两个确定事实都出现在结果中。"""
    text = inspect_attachments(
        OpenAI(),
        os.environ.get("OPENAI_VISION_MODEL", "gpt-6-luna"),
    )
    normalized = text.upper()
    assert "PROCESSING" in normalized
    assert "RC-731" in normalized
    print(text)


if __name__ == "__main__":
    main()
```

:::

配置兼容模型并执行：

```powershell
$env:OPENAI_VISION_MODEL = "gpt-6-luna"
python inspect_attachments.py
```

验收不要求回答措辞固定，但必须同时包含图片中的 `PROCESSING` 和 PDF 第二页的 `RC-731`。这两个值没有出现在提示文本中，可以证明结果确实依赖附件。

::: tip 当前环境已完成附件核对
在 Python 3.12.14、OpenAI SDK 3.19.2 和当前 `gpt-6-luna` 兼容端点下，在线结果同时返回了 `PROCESSING` 与 `RC-731`。该结果只证明本次测试资产与端点可用；更换模型、网关、文件类型或 detail 后仍需重新验证。
:::

## 五、上传文件引用

大型或需要复用的文件可以先上传，再通过 `file_id` 引用。上传目的与生命周期要按当前 Files API 文档核对。

```python
with open("case-summary.pdf", "rb") as file_handle:
    uploaded = client.files.create(file=file_handle, purpose="user_data")
```

随后在 `input_file` 中设置 `file_id`。文件 ID 不应暴露给无权访问该任务的用户，也不能假定上传文件永久存在。

## 六、失败诊断

| 现象 | 证据 | 处理 |
|------|------|------|
| 无效图片 | 解码或格式错误 | 核对文件签名、MIME 类型和编码 |
| 模型不支持输入 | 请求校验错误 | 更换兼容模型，不修改扩展名规避 |
| PDF 图表未识别 | 细节不足或页面过密 | 提高 detail、裁剪关键页或预处理 |
| 非 PDF 图表丢失 | 端点只提取文本 | 转为 PDF 或单独提交图片 |
| 文件过大 | 请求大小或上下文错误 | 分页、压缩或改用检索系统 |
| 回答包含附件外事实 | 模型推断或补全 | 使用确定问题并做业务核验 |

::: danger 不上传生产敏感文件做试验
多模态验证应使用合成数据。真实客户截图、身份证件、录音、合同和内部报表必须先经过权限、脱敏、保留策略与供应商数据边界评审。
:::

## 七、验证结论

图像与文档接入的闭环包括真实格式、正确内容类型、兼容模型、确定性附件问题和结果核对。本文生成的 PNG 与 PDF 可以独立复现，并使用附件独有值验证读取链路。

视觉结果仍是模型生成结果，不应直接替代 OCR 法定提取、财务数据录入或身份核验。大规模文档知识访问应进入 RAG，而不是持续扩大单次附件请求。

## 八、参考资料

- [Images and vision](https://developers.openai.com/api/docs/guides/images-vision)
- [File inputs](https://developers.openai.com/api/docs/guides/file-inputs)
