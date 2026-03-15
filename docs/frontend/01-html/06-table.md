---
title: "HTML表格"
category: "前端 · HTML"
tags:
  - HTML
excerpt: "HTML表格是用于以行和列的形式展示数据的结构化元素，是Web开发中展示二维数据的重要工具。 表格容器：标签，定义表格的范围 表头：标签，包含表格的标题行 表体：标签，包含表格的主要数据 表尾：标签，包含表格的汇总或脚注信息 行：标签，定义..."
---

# HTML表格

## 一、表格概述

### 1.1 表格的基本概念

::: tip 表格定义
HTML表格是用于以行和列的形式展示数据的结构化元素，是Web开发中展示二维数据的重要工具。
:::

#### 表格的基本结构

```html
<!-- 基本表格结构 -->
<table>
    <thead>
        <tr>
            <th>列标题1</th>
            <th>列标题2</th>
            <th>列标题3</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>数据1-1</td>
            <td>数据1-2</td>
            <td>数据1-3</td>
        </tr>
        <tr>
            <td>数据2-1</td>
            <td>数据2-2</td>
            <td>数据2-3</td>
        </tr>
    </tbody>
</table>
```

### 1.2 表格的组成部分

::: info 表格组成部分
1. **表格容器**：`<table>`标签，定义表格的范围
2. **表头**：`<thead>`标签，包含表格的标题行
3. **表体**：`<tbody>`标签，包含表格的主要数据
4. **表尾**：`<tfoot>`标签，包含表格的汇总或脚注信息
5. **行**：`<tr>`标签，定义表格的一行
6. **表头单元格**：`<th>`标签，定义表头单元格
7. **数据单元格**：`<td>`标签，定义数据单元格
:::

## 二、表格的基本元素

### 2.1 表格容器 `<table>`

::: tip 表格容器
`<table>`标签是表格的容器，定义了表格的范围和基本属性。
:::

#### 表格的基本属性

| 属性名 | 描述 | 示例 |
|-------|------|------|
| `border` | 表格边框的宽度（像素） | `border="1"` |
| `width` | 表格的宽度（像素或百分比） | `width="100%"` |
| `height` | 表格的高度（像素或百分比） | `height="300"` |
| `cellpadding` | 单元格内容与边框之间的内边距（像素） | `cellpadding="5"` |
| `cellspacing` | 单元格之间的间距（像素） | `cellspacing="2"` |
| `align` | 表格的水平对齐方式（left/center/right） | `align="center"` |
| `bgcolor` | 表格的背景颜色 | `bgcolor="#f0f0f0"` |

#### 表格容器示例

```html
<!-- 基本表格 -->
<table border="1" width="100%" cellpadding="5" cellspacing="0">
    <tr>
        <th>姓名</th>
        <th>年龄</th>
        <th>城市</th>
    </tr>
    <tr>
        <td>张三</td>
        <td>25</td>
        <td>北京</td>
    </tr>
    <tr>
        <td>李四</td>
        <td>30</td>
        <td>上海</td>
    </tr>
</table>

<!-- 带背景色的表格 -->
<table border="1" width="80%" cellpadding="8" cellspacing="0" bgcolor="#f8f9fa" align="center">
    <tr>
        <th>产品</th>
        <th>价格</th>
        <th>库存</th>
    </tr>
    <tr>
        <td>笔记本电脑</td>
        <td>¥5999</td>
        <td>10</td>
    </tr>
    <tr>
        <td>智能手机</td>
        <td>¥3999</td>
        <td>25</td>
    </tr>
</table>
```

### 2.2 行 `<tr>`

::: tip 表格行
`<tr>`标签定义表格中的一行，包含多个单元格（`<th>`或`<td>`）。
:::

#### 行的基本属性

| 属性名 | 描述 | 示例 |
|-------|------|------|
| `align` | 行内单元格内容的水平对齐方式（left/center/right） | `align="center"` |
| `valign` | 行内单元格内容的垂直对齐方式（top/middle/bottom） | `valign="middle"` |
| `bgcolor` | 行的背景颜色 | `bgcolor="#e9ecef"` |
| `height` | 行的高度（像素） | `height="40"` |

#### 行示例

```html
<table border="1" width="100%" cellpadding="5" cellspacing="0">
    <!-- 表头行 -->
    <tr bgcolor="#343a40" color="white">
        <th>书名</th>
        <th>作者</th>
        <th>出版年份</th>
    </tr>
    
    <!-- 数据行 -->
    <tr align="center" height="40">
        <td>JavaScript高级程序设计</td>
        <td>Matt Frisbie</td>
        <td>2019</td>
    </tr>
    
    <tr align="center" bgcolor="#f8f9fa">
        <td>CSS揭秘</td>
        <td>Lea Verou</td>
        <td>2015</td>
    </tr>
    
    <tr align="center" valign="middle">
        <td>深入理解计算机系统</td>
        <td>Randal E. Bryant</td>
        <td>2019</td>
    </tr>
</table>
```

### 2.3 表头单元格 `<th>`

::: tip 表头单元格
`<th>`标签定义表格的表头单元格，通常包含列标题，默认使用粗体和居中对齐。
:::

#### 表头单元格的基本属性

| 属性名 | 描述 | 示例 |
|-------|------|------|
| `colspan` | 单元格横跨的列数 | `colspan="2"` |
| `rowspan` | 单元格纵跨的行数 | `rowspan="3"` |
| `align` | 单元格内容的水平对齐方式（left/center/right） | `align="left"` |
| `valign` | 单元格内容的垂直对齐方式（top/middle/bottom） | `valign="top"` |
| `width` | 单元格的宽度（像素或百分比） | `width="200"` |
| `height` | 单元格的高度（像素） | `height="40"` |
| `bgcolor` | 单元格的背景颜色 | `bgcolor="#007bff"` |
| `scope` | 表头单元格关联的数据范围（row/col/rowgroup/colgroup） | `scope="col"` |
| `abbr` | 表头单元格的缩写文本（用于屏幕阅读器） | `abbr="姓名"` |

#### 表头单元格示例

```html
<table border="1" width="100%" cellpadding="8" cellspacing="0">
    <tr bgcolor="#007bff" color="white">
        <th width="20%" scope="col">姓名</th>
        <th width="30%" scope="col">邮箱</th>
        <th width="20%" scope="col">电话</th>
        <th width="30%" scope="col">地址</th>
    </tr>
    <tr align="center">
        <td>张三</td>
        <td>zhangsan@example.com</td>
        <td>13800138000</td>
        <td>北京市海淀区</td>
    </tr>
    <tr align="center">
        <td>李四</td>
        <td>lisi@example.com</td>
        <td>13900139000</td>
        <td>上海市浦东新区</td>
    </tr>
</table>
```

### 2.4 数据单元格 `<td>`

::: tip 数据单元格
`<td>`标签定义表格的数据单元格，包含表格的实际数据。
:::

#### 数据单元格的基本属性

| 属性名 | 描述 | 示例 |
|-------|------|------|
| `colspan` | 单元格横跨的列数 | `colspan="3"` |
| `rowspan` | 单元格纵跨的行数 | `rowspan="2"` |
| `align` | 单元格内容的水平对齐方式（left/center/right） | `align="right"` |
| `valign` | 单元格内容的垂直对齐方式（top/middle/bottom） | `valign="bottom"` |
| `width` | 单元格的宽度（像素或百分比） | `width="150"` |
| `height` | 单元格的高度（像素） | `height="50"` |
| `bgcolor` | 单元格的背景颜色 | `bgcolor="#28a745"` |
| `nowrap` | 防止单元格内容换行 | `nowrap` |

#### 数据单元格示例

```html
<table border="1" width="100%" cellpadding="8" cellspacing="0">
    <tr bgcolor="#343a40" color="white">
        <th>产品</th>
        <th>类别</th>
        <th>价格</th>
        <th>库存</th>
    </tr>
    <tr align="center">
        <td>智能手机</td>
        <td>电子产品</td>
        <td align="right">¥3999</td>
        <td>25</td>
    </tr>
    <tr align="center" bgcolor="#f8f9fa">
        <td>笔记本电脑</td>
        <td>电子产品</td>
        <td align="right">¥5999</td>
        <td>10</td>
    </tr>
    <tr align="center">
        <td>无线耳机</td>
        <td>音频设备</td>
        <td align="right">¥999</td>
        <td>50</td>
    </tr>
</table>
```

## 三、表格结构和分组

### 3.1 表头 `<thead>`

::: tip 表头
`<thead>`标签用于定义表格的表头部分，包含表格的标题行，通常包含`<th>`元素。
:::

#### 表头示例

```html
<table border="1" width="100%" cellpadding="8" cellspacing="0">
    <!-- 表头部分 -->
    <thead>
        <tr bgcolor="#343a40" color="white">
            <th>学生ID</th>
            <th>姓名</th>
            <th>性别</th>
            <th>年龄</th>
            <th>班级</th>
        </tr>
    </thead>
    
    <!-- 表体部分 -->
    <tbody>
        <tr align="center">
            <td>001</td>
            <td>张三</td>
            <td>男</td>
            <td>18</td>
            <td>高三(1)班</td>
        </tr>
        <tr align="center" bgcolor="#f8f9fa">
            <td>002</td>
            <td>李四</td>
            <td>女</td>
            <td>17</td>
            <td>高三(2)班</td>
        </tr>
        <tr align="center">
            <td>003</td>
            <td>王五</td>
            <td>男</td>
            <td>18</td>
            <td>高三(1)班</td>
        </tr>
    </tbody>
</table>
```

### 3.2 表体 `<tbody>`

::: tip 表体
`<tbody>`标签用于定义表格的主体部分，包含表格的主要数据行。
:::

#### 表体示例

```html
<table border="1" width="100%" cellpadding="8" cellspacing="0">
    <!-- 表头 -->
    <thead>
        <tr bgcolor="#343a40" color="white">
            <th>订单号</th>
            <th>客户名称</th>
            <th>订单日期</th>
            <th>订单金额</th>
            <th>订单状态</th>
        </tr>
    </thead>
    
    <!-- 表体 -->
    <tbody>
        <!-- 第一组数据 -->
        <tr align="center">
            <td>ORD-001</td>
            <td>张三</td>
            <td>2023-05-15</td>
            <td align="right">¥1,299.00</td>
            <td bgcolor="#28a745" color="white">已完成</td>
        </tr>
        
        <tr align="center" bgcolor="#f8f9fa">
            <td>ORD-002</td>
            <td>李四</td>
            <td>2023-05-18</td>
            <td align="right">¥2,499.00</td>
            <td bgcolor="#28a745" color="white">已完成</td>
        </tr>
        
        <!-- 第二组数据 -->
        <tr align="center">
            <td>ORD-003</td>
            <td>王五</td>
            <td>2023-05-20</td>
            <td align="right">¥899.00</td>
            <td bgcolor="#ffc107" color="black">处理中</td>
        </tr>
        
        <tr align="center" bgcolor="#f8f9fa">
            <td>ORD-004</td>
            <td>赵六</td>
            <td>2023-05-22</td>
            <td align="right">¥1,599.00</td>
            <td bgcolor="#17a2b8" color="white">已发货</td>
        </tr>
    </tbody>
</table>
```

### 3.3 表尾 `<tfoot>`

::: tip 表尾
`<tfoot>`标签用于定义表格的表尾部分，通常包含汇总信息或脚注。
:::

#### 表尾示例

```html
<table border="1" width="100%" cellpadding="8" cellspacing="0">
    <!-- 表头 -->
    <thead>
        <tr bgcolor="#343a40" color="white">
            <th>产品名称</th>
            <th>单价</th>
            <th>数量</th>
            <th>小计</th>
        </tr>
    </thead>
    
    <!-- 表体 -->
    <tbody>
        <tr align="center">
            <td align="left">智能手机</td>
            <td align="right">¥3,999.00</td>
            <td>1</td>
            <td align="right">¥3,999.00</td>
        </tr>
        
        <tr align="center" bgcolor="#f8f9fa">
            <td align="left">无线耳机</td>
            <td align="right">¥999.00</td>
            <td>2</td>
            <td align="right">¥1,998.00</td>
        </tr>
        
        <tr align="center">
            <td align="left">手机壳</td>
            <td align="right">¥99.00</td>
            <td>1</td>
            <td align="right">¥99.00</td>
        </tr>
    </tbody>
    
    <!-- 表尾（汇总信息） -->
    <tfoot>
        <tr bgcolor="#e9ecef">
            <th colspan="3" align="right">商品总额：</th>
            <th align="right">¥6,096.00</th>
        </tr>
        
        <tr bgcolor="#e9ecef">
            <th colspan="3" align="right">运费：</th>
            <th align="right">¥0.00</th>
        </tr>
        
        <tr bgcolor="#343a40" color="white">
            <th colspan="3" align="right">应付总额：</th>
            <th align="right">¥6,096.00</th>
        </tr>
    </tfoot>
</table>
```

### 3.4 列分组 `<colgroup>` 和 `<col>`

::: tip 列分组
`<colgroup>`和`<col>`标签用于定义表格的列组和列属性，可以对表格的列进行统一设置。
:::

#### 列分组示例

```html
<table border="1" width="100%" cellpadding="8" cellspacing="0">
    <!-- 列分组 -->
    <colgroup>
        <col bgcolor="#f8f9fa"> <!-- 第一列背景色 -->
        <col width="200"> <!-- 第二列宽度 -->
        <col align="center"> <!-- 第三列居中对齐 -->
        <col align="right" bgcolor="#e9ecef"> <!-- 第四列右对齐和背景色 -->
    </colgroup>
    
    <!-- 表头 -->
    <thead>
        <tr bgcolor="#343a40" color="white">
            <th>ID</th>
            <th>产品名称</th>
            <th>库存</th>
            <th>价格</th>
        </tr>
    </thead>
    
    <!-- 表体 -->
    <tbody>
        <tr>
            <td>001</td>
            <td>智能手机</td>
            <td>25</td>
            <td>¥3,999.00</td>
        </tr>
        
        <tr bgcolor="#f8f9fa">
            <td>002</td>
            <td>笔记本电脑</td>
            <td>10</td>
            <td>¥5,999.00</td>
        </tr>
        
        <tr>
            <td>003</td>
            <td>无线耳机</td>
            <td>50</td>
            <td>¥999.00</td>
        </tr>
    </tbody>
</table>

<!-- 使用span属性定义多列 -->
<table border="1" width="100%" cellpadding="8" cellspacing="0">
    <!-- 列分组 -->
    <colgroup>
        <col span="2" bgcolor="#f8f9fa"> <!-- 前两列使用相同背景色 -->
        <col span="3" align="center"> <!-- 后三列居中对齐 -->
    </colgroup>
    
    <!-- 表头 -->
    <thead>
        <tr bgcolor="#343a40" color="white">
            <th>姓名</th>
            <th>科目</th>
            <th>期中成绩</th>
            <th>期末成绩</th>
            <th>总评</th>
        </tr>
    </thead>
    
    <!-- 表体 -->
    <tbody>
        <tr>
            <td>张三</td>
            <td>数学</td>
            <td>85</td>
            <td>90</td>
            <td>88</td>
        </tr>
        
        <tr bgcolor="#f8f9fa">
            <td>张三</td>
            <td>英语</td>
            <td>92</td>
            <td>88</td>
            <td>90</td>
        </tr>
        
        <tr>
            <td>李四</td>
            <td>数学</td>
            <td>78</td>
            <td>82</td>
            <td>80</td>
        </tr>
    </tbody>
</table>
```

## 四、单元格合并

### 4.1 水平合并（colspan）

::: tip 水平合并
使用`colspan`属性可以将多个相邻的单元格水平合并为一个单元格。
:::

#### 水平合并示例

```html
<table border="1" width="100%" cellpadding="8" cellspacing="0">
    <tr bgcolor="#343a40" color="white">
        <th colspan="4">公司销售数据（2023年）</th>
    </tr>
    
    <tr bgcolor="#6c757d" color="white">
        <th>季度</th>
        <th>销售额</th>
        <th>同比增长</th>
        <th>目标达成率</th>
    </tr>
    
    <tr align="center">
        <td>第一季度</td>
        <td align="right">¥5,000,000</td>
        <td align="right">10.2%</td>
        <td align="right">105%</td>
    </tr>
    
    <tr align="center" bgcolor="#f8f9fa">
        <td>第二季度</td>
        <td align="right">¥5,500,000</td>
        <td align="right">12.5%</td>
        <td align="right">110%</td>
    </tr>
    
    <tr align="center">
        <td>第三季度</td>
        <td align="right">¥6,000,000</td>
        <td align="right">15.8%</td>
        <td align="right">115%</td>
    </tr>
    
    <tr align="center" bgcolor="#f8f9fa">
        <td>第四季度</td>
        <td align="right">¥7,000,000</td>
        <td align="right">18.3%</td>
        <td align="right">120%</td>
    </tr>
    
    <tr bgcolor="#e9ecef">
        <th colspan="2" align="right">年度总销售额：</th>
        <th colspan="2" align="right">¥23,500,000</th>
    </tr>
</table>
```

### 4.2 垂直合并（rowspan）

::: tip 垂直合并
使用`rowspan`属性可以将多个相邻的单元格垂直合并为一个单元格。
:::

#### 垂直合并示例

```html
<table border="1" width="100%" cellpadding="8" cellspacing="0">
    <tr bgcolor="#343a40" color="white">
        <th>部门</th>
        <th>姓名</th>
        <th>职位</th>
        <th>薪资</th>
    </tr>
    
    <tr align="center">
        <td rowspan="3" bgcolor="#e9ecef">技术部</td>
        <td>张三</td>
        <td>高级工程师</td>
        <td align="right">¥25,000</td>
    </tr>
    
    <tr align="center" bgcolor="#f8f9fa">
        <td>李四</td>
        <td>工程师</td>
        <td align="right">¥18,000</td>
    </tr>
    
    <tr align="center">
        <td>王五</td>
        <td>初级工程师</td>
        <td align="right">¥12,000</td>
    </tr>
    
    <tr align="center">
        <td rowspan="2" bgcolor="#e9ecef">市场部</td>
        <td>赵六</td>
        <td>市场经理</td>
        <td align="right">¥20,000</td>
    </tr>
    
    <tr align="center" bgcolor="#f8f9fa">
        <td>钱七</td>
        <td>市场专员</td>
        <td align="right">¥15,000</td>
    </tr>
    
    <tr align="center">
        <td rowspan="2" bgcolor="#e9ecef">人力资源部</td>
        <td>孙八</td>
        <td>HR经理</td>
        <td align="right">¥19,000</td>
    </tr>
    
    <tr align="center" bgcolor="#f8f9fa">
        <td>周九</td>
        <td>HR助理</td>
        <td align="right">¥10,000</td>
    </tr>
</table>
```

### 4.3 复杂的单元格合并

::: info 复杂合并
可以同时使用`colspan`和`rowspan`属性创建复杂的表格布局。
:::

#### 复杂合并示例

```html
<table border="1" width="100%" cellpadding="8" cellspacing="0">
    <tr bgcolor="#343a40" color="white">
        <th colspan="5">2023年产品销售分析</th>
    </tr>
    
    <tr bgcolor="#6c757d" color="white">
        <th rowspan="2">产品类别</th>
        <th rowspan="2">产品名称</th>
        <th colspan="2">销售额</th>
        <th rowspan="2">市场份额</th>
    </tr>
    
    <tr bgcolor="#6c757d" color="white">
        <th>2023年</th>
        <th>2022年</th>
    </tr>
    
    <tr align="center">
        <td rowspan="3" bgcolor="#e9ecef">电子产品</td>
        <td>智能手机</td>
        <td align="right">¥10,000,000</td>
        <td align="right">¥8,500,000</td>
        <td>15%</td>
    </tr>
    
    <tr align="center" bgcolor="#f8f9fa">
        <td>笔记本电脑</td>
        <td align="right">¥8,000,000</td>
        <td align="right">¥7,200,000</td>
        <td>12%</td>
    </tr>
    
    <tr align="center">
        <td>平板电脑</td>
        <td align="right">¥5,000,000</td>
        <td align="right">¥4,800,000</td>
        <td>8%</td>
    </tr>
    
    <tr align="center">
        <td rowspan="2" bgcolor="#e9ecef">家居用品</td>
        <td>智能音箱</td>
        <td align="right">¥3,000,000</td>
        <td align="right">¥2,500,000</td>
        <td>5%</td>
    </tr>
    
    <tr align="center" bgcolor="#f8f9fa">
        <td>智能灯泡</td>
        <td align="right">¥1,500,000</td>
        <td align="right">¥1,200,000</td>
        <td>3%</td>
    </tr>
    
    <tr bgcolor="#e9ecef">
        <th colspan="2" align="right">总计：</th>
        <th align="right">¥27,500,000</th>
        <th align="right">¥24,200,000</th>
        <th>43%</th>
    </tr>
</table>
```

## 五、表格的样式和设计

### 5.1 基本表格样式

::: tip 表格样式
使用CSS可以对表格进行更灵活和美观的样式设计，包括边框、颜色、间距、对齐等。
:::

#### 基本样式示例

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>表格样式示例</title>
    <style>
        /* 重置默认样式 */
        table {
            border-collapse: collapse;
            width: 100%;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        }
        
        /* 表格边框和背景 */
        table, th, td {
            border: 1px solid #ddd;
        }
        
        /* 表头样式 */
        th {
            background-color: #4CAF50;
            color: white;
            font-weight: bold;
            text-align: left;
        }
        
        /* 单元格样式 */
        td, th {
            padding: 12px 15px;
            text-align: left;
        }
        
        /* 交替行背景色 */
        tr:nth-child(even) {
            background-color: #f8f9fa;
        }
        
        /* 悬停效果 */
        tr:hover {
            background-color: #e9ecef;
        }
        
        /* 表格容器 */
        .table-container {
            max-width: 1000px;
            margin: 0 auto;
            overflow-x: auto;
        }
        
        /* 表格标题 */
        .table-title {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 20px;
            color: #333;
        }
    </style>
</head>
<body>
    <div class="table-container">
        <div class="table-title">员工信息表</div>
        
        <table>
            <thead>
                <tr>
                    <th>员工ID</th>
                    <th>姓名</th>
                    <th>部门</th>
                    <th>职位</th>
                    <th>入职日期</th>
                    <th>薪资</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>EMP001</td>
                    <td>张三</td>
                    <td>技术部</td>
                    <td>高级工程师</td>
                    <td>2020-03-15</td>
                    <td>¥25,000</td>
                </tr>
                <tr>
                    <td>EMP002</td>
                    <td>李四</td>
                    <td>市场部</td>
                    <td>市场经理</td>
                    <td>2019-07-22</td>
                    <td>¥20,000</td>
                </tr>
                <tr>
                    <td>EMP003</td>
                    <td>王五</td>
                    <td>技术部</td>
                    <td>工程师</td>
                    <td>2021-01-10</td>
                    <td>¥18,000</td>
                </tr>
                <tr>
                    <td>EMP004</td>
                    <td>赵六</td>
                    <td>人力资源部</td>
                    <td>HR经理</td>
                    <td>2018-11-05</td>
                    <td>¥19,000</td>
                </tr>
                <tr>
                    <td>EMP005</td>
                    <td>钱七</td>
                    <td>财务部</td>
                    <td>会计</td>
                    <td>2020-09-18</td>
                    <td>¥15,000</td>
                </tr>
            </tbody>
        </table>
    </div>
</body>
</html>
```

### 5.2 高级表格样式

::: info 高级样式
使用CSS可以创建更复杂和美观的表格样式，包括阴影、圆角、渐变等效果。
:::

#### 高级样式示例

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>高级表格样式示例</title>
    <style>
        /* 重置默认样式 */
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background-color: #f5f5f5;
            padding: 20px;
        }
        
        /* 表格容器 */
        .table-container {
            max-width: 1200px;
            margin: 0 auto;
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        
        /* 表格标题 */
        .table-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            text-align: center;
        }
        
        .table-title {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .table-subtitle {
            font-size: 14px;
            opacity: 0.9;
        }
        
        /* 表格 */
        table {
            width: 100%;
            border-collapse: collapse;
        }
        
        /* 表头 */
        th {
            background-color: #f8f9fa;
            color: #495057;
            font-weight: 600;
            text-align: left;
            padding: 15px 20px;
            border-bottom: 2px solid #dee2e6;
            position: relative;
        }
        
        th::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 2px;
            background: linear-gradient(90deg, #667eea, #764ba2);
            transform: scaleX(0);
            transition: transform 0.3s ease;
        }
        
        th:hover::after {
            transform: scaleX(1);
        }
        
        /* 数据单元格 */
        td {
            padding: 15px 20px;
            border-bottom: 1px solid #e9ecef;
            color: #6c757d;
            transition: background-color 0.2s ease;
        }
        
        /* 交替行 */
        tbody tr:nth-child(even) {
            background-color: #fafafa;
        }
        
        /* 悬停效果 */
        tbody tr:hover {
            background-color: #f1f3f5;
        }
        
        tbody tr:hover td {
            background-color: transparent;
        }
        
        /* 状态标签 */
        .status {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 500;
            text-transform: uppercase;
        }
        
        .status.active {
            background-color: #d4edda;
            color: #155724;
        }
        
        .status.inactive {
            background-color: #f8d7da;
            color: #721c24;
        }
        
        .status.pending {
            background-color: #fff3cd;
            color: #856404;
        }
        
        /* 数值样式 */
        .number {
            font-weight: 600;
            color: #495057;
        }
        
        /* 金额样式 */
        .amount {
            font-weight: 600;
            color: #28a745;
        }
        
        /* 响应式设计 */
        @media (max-width: 768px) {
            .table-container {
                border-radius: 0;
                box-shadow: none;
            }
            
            th, td {
                padding: 10px 15px;
                font-size: 14px;
            }
            
            .table-title {
                font-size: 20px;
            }
        }
        
        @media (max-width: 576px) {
            th, td {
                padding: 8px 12px;
                font-size: 13px;
            }
            
            .table-header {
                padding: 15px;
            }
            
            .table-title {
                font-size: 18px;
            }
        }
    </style>
</head>
<body>
    <div class="table-container">
        <div class="table-header">
            <div class="table-title">订单管理系统</div>
            <div class="table-subtitle">最近订单列表</div>
        </div>
        
        <table>
            <thead>
                <tr>
                    <th>订单号</th>
                    <th>客户名称</th>
                    <th>订单日期</th>
                    <th>订单金额</th>
                    <th>订单状态</th>
                    <th>操作</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td class="number">ORD-2023-001</td>
                    <td>张三</td>
                    <td>2023-06-15</td>
                    <td class="amount">¥2,999.00</td>
                    <td><span class="status active">已完成</span></td>
                    <td><button>查看</button></td>
                </tr>
                <tr>
                    <td class="number">ORD-2023-002</td>
                    <td>李四</td>
                    <td>2023-06-16</td>
                    <td class="amount">¥4,599.00</td>
                    <td><span class="status active">已完成</span></td>
                    <td><button>查看</button></td>
                </tr>
                <tr>
                    <td class="number">ORD-2023-003</td>
                    <td>王五</td>
                    <td>2023-06-17</td>
                    <td class="amount">¥1,299.00</td>
                    <td><span class="status pending">处理中</span></td>
                    <td><button>查看</button></td>
                </tr>
                <tr>
                    <td class="number">ORD-2023-004</td>
                    <td>赵六</td>
                    <td>2023-06-18</td>
                    <td class="amount">¥3,799.00</td>
                    <td><span class="status inactive">已取消</span></td>
                    <td><button>查看</button></td>
                </tr>
                <tr>
                    <td class="number">ORD-2023-005</td>
                    <td>钱七</td>
                    <td>2023-06-19</td>
                    <td class="amount">¥899.00</td>
                    <td><span class="status pending">处理中</span></td>
                    <td><button>查看</button></td>
                </tr>
                <tr>
                    <td class="number">ORD-2023-006</td>
                    <td>孙八</td>
                    <td>2023-06-20</td>
                    <td class="amount">¥2,499.00</td>
                    <td><span class="status active">已完成</span></td>
                    <td><button>查看</button></td>
                </tr>
            </tbody>
        </table>
    </div>
</body>
</html>
```

## 六、表格的可访问性

### 6.1 表格可访问性的重要性

::: tip 可访问性
表格的可访问性对于使用屏幕阅读器等辅助技术的用户非常重要，可以帮助他们理解表格的结构和内容。
:::

#### 提高表格可访问性的方法

1. **使用语义化元素**：使用`<thead>`、`<tbody>`、`<tfoot>`等语义化标签
2. **添加表头关联**：使用`scope`属性指定表头与数据的关联关系
3. **提供表格摘要**：使用`<caption>`标签为表格添加描述性标题
4. **避免复杂嵌套**：尽量避免过于复杂的表格结构，简化单元格合并
5. **使用适当的颜色对比度**：确保表格文本与背景的对比度符合WCAG标准

### 6.2 可访问性示例

```html
<!-- 带标题的表格 -->
<table>
    <caption>2023年第一季度销售数据</caption>
    <thead>
        <tr>
            <th scope="col">月份</th>
            <th scope="col">销售额</th>
            <th scope="col">同比增长</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <th scope="row">一月</th>
            <td>¥5,000,000</td>
            <td>10.2%</td>
        </tr>
        <tr>
            <th scope="row">二月</th>
            <td>¥5,500,000</td>
            <td>12.5%</td>
        </tr>
        <tr>
            <th scope="row">三月</th>
            <td>¥6,000,000</td>
            <td>15.8%</td>
        </tr>
    </tbody>
</table>

<!-- 复杂表格的可访问性 -->
<table aria-describedby="table-desc">
    <caption>产品销售分析表</caption>
    <p id="table-desc" style="display: none;">此表格展示了2023年各产品类别的销售数据，包括季度销售额、同比增长和市场份额。</p>
    
    <thead>
        <tr>
            <th rowspan="2" scope="col">产品类别</th>
            <th rowspan="2" scope="col">产品名称</th>
            <th colspan="2" scope="colgroup">销售额</th>
            <th rowspan="2" scope="col">市场份额</th>
        </tr>
        <tr>
            <th scope="col">2023年</th>
            <th scope="col">2022年</th>
        </tr>
    </thead>
    
    <tbody>
        <tr>
            <th rowspan="3" scope="rowgroup" id="electronics">电子产品</th>
            <th scope="row">智能手机</th>
            <td>¥10,000,000</td>
            <td>¥8,500,000</td>
            <td>15%</td>
        </tr>
        <tr>
            <th scope="row">笔记本电脑</th>
            <td>¥8,000,000</td>
            <td>¥7,200,000</td>
            <td>12%</td>
        </tr>
        <tr>
            <th scope="row">平板电脑</th>
            <td>¥5,000,000</td>
            <td>¥4,800,000</td>
            <td>8%</td>
        </tr>
        
        <tr>
            <th rowspan="2" scope="rowgroup" id="home">家居用品</th>
            <th scope="row">智能音箱</th>
            <td>¥3,000,000</td>
            <td>¥2,500,000</td>
            <td>5%</td>
        </tr>
        <tr>
            <th scope="row">智能灯泡</th>
            <td>¥1,500,000</td>
            <td>¥1,200,000</td>
            <td>3%</td>
        </tr>
    </tbody>
</table>
```

## 七、表格的最佳实践

### 7.1 表格设计的最佳实践

::: info 最佳实践
创建高质量表格的一些最佳实践建议。
:::

1. **保持简洁**：尽量保持表格结构简洁，避免过于复杂的单元格合并
2. **使用语义化标签**：使用`<thead>`、`<tbody>`、`<tfoot>`等语义化标签
3. **添加适当的间距**：使用`padding`属性为单元格添加适当的内边距，提高可读性
4. **使用交替行颜色**：为交替行添加不同的背景色，提高可读性
5. **添加悬停效果**：为行添加悬停效果，提高交互体验
6. **确保响应式设计**：确保表格在不同设备上都能良好显示
7. **优化可访问性**：添加适当的ARIA属性和语义化标签，提高可访问性
8. **避免使用表格进行布局**：表格应该只用于展示数据，而不是用于页面布局

### 7.2 响应式表格设计

::: tip 响应式表格
在移动设备上，传统的表格布局可能会导致内容溢出或难以阅读，需要采用特殊的响应式设计方法。
:::

#### 响应式表格示例

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>响应式表格示例</title>
    <style>
        /* 基础样式 */
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f5f5;
            padding: 20px;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        
        /* 表格容器 */
        .table-wrapper {
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            overflow: hidden;
            margin-bottom: 20px;
        }
        
        /* 表格标题 */
        .table-header {
            padding: 20px;
            background-color: #f8f9fa;
            border-bottom: 1px solid #e9ecef;
        }
        
        .table-title {
            font-size: 20px;
            font-weight: 600;
            color: #495057;
        }
        
        /* 滚动容器 */
        .table-scroll {
            overflow-x: auto;
        }
        
        /* 表格 */
        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 14px;
        }
        
        /* 表头 */
        th {
            background-color: #f8f9fa;
            color: #495057;
            font-weight: 600;
            text-align: left;
            padding: 12px 15px;
            border-bottom: 2px solid #dee2e6;
            position: sticky;
            top: 0;
            white-space: nowrap;
        }
        
        /* 数据单元格 */
        td {
            padding: 12px 15px;
            border-bottom: 1px solid #e9ecef;
            color: #6c757d;
            vertical-align: top;
        }
        
        /* 交替行 */
        tbody tr:nth-child(even) {
            background-color: #fafafa;
        }
        
        /* 悬停效果 */
        tbody tr:hover {
            background-color: #f1f3f5;
        }
        
        /* 响应式设计 */
        @media (max-width: 768px) {
            /* 在小屏幕上，将表格转换为卡片式布局 */
            .responsive-table table,
            .responsive-table thead,
            .responsive-table tbody,
            .responsive-table th,
            .responsive-table td,
            .responsive-table tr {
                display: block;
            }
            
            /* 隐藏表头（在移动设备上不显示） */
            .responsive-table thead tr {
                position: absolute;
                top: -9999px;
                left: -9999px;
            }
            
            /* 设置行的样式 */
            .responsive-table tr {
                margin-bottom: 15px;
                border: 1px solid #e9ecef;
                border-radius: 8px;
                background-color: white;
                overflow: hidden;
            }
            
            /* 设置单元格样式 */
            .responsive-table td {
                border: none;
                border-bottom: 1px solid #e9ecef;
                position: relative;
                padding-left: 50%;
                white-space: normal;
                text-align: left;
            }
            
            /* 添加行内标签 */
            .responsive-table td:before {
                position: absolute;
                left: 15px;
                width: 45%;
                padding-right: 10px;
                white-space: nowrap;
                text-align: left;
                font-weight: 600;
                color: #495057;
                content: attr(data-label);
            }
            
            /* 移除最后一个单元格的底边框 */
            .responsive-table td:last-child {
                border-bottom: none;
            }
            
            /* 调整容器样式 */
            .table-wrapper {
                box-shadow: none;
                background-color: transparent;
            }
            
            .table-header {
                background-color: transparent;
                border-bottom: none;
                padding: 0 0 15px 0;
            }
            
            .table-scroll {
                overflow-x: visible;
            }
        }
        
        /* 适配不同尺寸的移动设备 */
        @media (max-width: 480px) {
            body {
                padding: 10px;
            }
            
            .table-title {
                font-size: 18px;
            }
            
            .responsive-table td {
                padding: 10px;
            }
            
            .responsive-table td:before {
                left: 10px;
                font-size: 13px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="table-wrapper">
            <div class="table-header">
                <div class="table-title">产品库存表</div>
            </div>
            
            <div class="table-scroll">
                <table class="responsive-table">
                    <thead>
                        <tr>
                            <th>产品ID</th>
                            <th>产品名称</th>
                            <th>类别</th>
                            <th>供应商</th>
                            <th>单价</th>
                            <th>库存数量</th>
                            <th>状态</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td data-label="产品ID">PRD001</td>
                            <td data-label="产品名称">智能手机</td>
                            <td data-label="类别">电子产品</td>
                            <td data-label="供应商">科技有限公司</td>
                            <td data-label="单价">¥3,999.00</td>
                            <td data-label="库存数量">25</td>
                            <td data-label="状态">有库存</td>
                        </tr>
                        <tr>
                            <td data-label="产品ID">PRD002</td>
                            <td data-label="产品名称">笔记本电脑</td>
                            <td data-label="类别">电子产品</td>
                            <td data-label="供应商">电脑科技公司</td>
                            <td data-label="单价">¥5,999.00</td>
                            <td data-label="库存数量">10</td>
                            <td data-label="状态">有库存</td>
                        </tr>
                        <tr>
                            <td data-label="产品ID">PRD003</td>
                            <td data-label="产品名称">无线耳机</td>
                            <td data-label="类别">音频设备</td>
                            <td data-label="供应商">音频科技公司</td>
                            <td data-label="单价">¥999.00</td>
                            <td data-label="库存数量">50</td>
                            <td data-label="状态">有库存</td>
                        </tr>
                        <tr>
                            <td data-label="产品ID">PRD004</td>
                            <td data-label="产品名称">智能手表</td>
                            <td data-label="类别">可穿戴设备</td>
                            <td data-label="供应商">智能科技公司</td>
                            <td data-label="单价">¥1,999.00</td>
                            <td data-label="库存数量">0</td>
                            <td data-label="状态">缺货</td>
                        </tr>
                        <tr>
                            <td data-label="产品ID">PRD005</td>
                            <td data-label="产品名称">平板电脑</td>
                            <td data-label="类别">电子产品</td>
                            <td data-label="供应商">科技有限公司</td>
                            <td data-label="单价">¥3,499.00</td>
                            <td data-label="库存数量">15</td>
                            <td data-label="状态">有库存</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</body>
</html>
```

## 八、总结

HTML表格是Web开发中用于展示二维数据的重要工具，通过本文的学习，我们了解了：

1. **表格的基本结构**：包括`<table>`、`<tr>`、`<th>`、`<td>`等基本元素
2. **表格的组成部分**：表头、表体、表尾等结构化元素
3. **单元格合并**：使用`colspan`和`rowspan`属性进行单元格的水平和垂直合并
4. **表格样式设计**：使用CSS对表格进行样式化，提高可读性和美观度
5. **表格的可访问性**：通过语义化标签和ARIA属性提高表格的可访问性
6. **响应式表格设计**：确保表格在不同设备上都能良好显示
7. **表格的最佳实践**：保持简洁、使用语义化标签、添加适当的间距和颜色等

创建高质量的表格需要考虑数据的清晰展示、用户体验、可访问性和响应式设计等多个方面。通过合理使用HTML表格元素和CSS样式，可以创建出既美观又实用的表格，有效展示和组织数据。

在实际项目中，我们应该根据具体需求选择合适的表格设计和实现方式，不断优化用户体验，确保表格的可用性和可访问性。