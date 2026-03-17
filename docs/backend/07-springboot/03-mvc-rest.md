---
title: "Spring MVC 与 RESTful API"
category: "后端 · Spring Boot"
tags:
  - Spring Boot
  - MVC
  - REST
  - Controller
date: 2026-03-17
excerpt: "Spring MVC 是 Spring 提供的 Web 层框架，基于前端控制器模式，配合丰富的注解体系让 RESTful API 的开发变得直观高效。"
---

# Spring MVC 与 RESTful API

## 一、控制器基础

### 1. @RestController 与 @RequestMapping

`@RestController` 是 `@Controller` 与 `@ResponseBody` 的组合注解，所有方法的返回值直接序列化为 JSON 写入响应体。

::: details Controller 基础结构示例
```java
// src/main/java/com/example/demo/controller/UserController.java
@RestController
@RequestMapping("/api/v1/users")  // 类级别路径前缀
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    // GET /api/v1/users
    @GetMapping
    public List<UserDTO> listUsers() {
        return userService.findAll();
    }

    // GET /api/v1/users/{id}
    @GetMapping("/{id}")
    public UserDTO getUser(@PathVariable Long id) {
        return userService.findById(id);
    }

    // POST /api/v1/users
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)  // 返回 201 状态码
    public UserDTO createUser(@RequestBody @Valid CreateUserRequest request) {
        return userService.create(request);
    }

    // PUT /api/v1/users/{id}
    @PutMapping("/{id}")
    public UserDTO updateUser(@PathVariable Long id,
                              @RequestBody @Valid UpdateUserRequest request) {
        return userService.update(id, request);
    }

    // DELETE /api/v1/users/{id}
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)  // 返回 204 状态码
    public void deleteUser(@PathVariable Long id) {
        userService.delete(id);
    }
}
```
:::

### 2. HTTP 方法映射注解

| 注解 | HTTP 方法 | 语义 |
|------|-----------|------|
| `@GetMapping` | GET | 查询资源 |
| `@PostMapping` | POST | 创建资源 |
| `@PutMapping` | PUT | 全量更新资源 |
| `@PatchMapping` | PATCH | 部分更新资源 |
| `@DeleteMapping` | DELETE | 删除资源 |

---

## 二、参数绑定

### 1. 路径参数（@PathVariable）

从 URL 路径中提取变量，适合资源标识符。

::: details 路径参数示例
```java
// GET /api/v1/orders/2024/100
@GetMapping("/orders/{year}/{orderId}")
public OrderDTO getOrder(
        @PathVariable Integer year,
        @PathVariable("orderId") Long id) {  // 变量名不一致时需指定
    return orderService.findByYearAndId(year, id);
}
```
:::

### 2. 查询参数（@RequestParam）

从 URL 查询字符串中提取参数，适合过滤、分页、搜索场景。

::: details 查询参数示例
```java
// GET /api/v1/users?page=0&size=10&keyword=张三&status=ACTIVE
@GetMapping
public PageResult<UserDTO> listUsers(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size,
        @RequestParam(required = false) String keyword,  // 可选参数
        @RequestParam(required = false) UserStatus status) {
    return userService.findPage(page, size, keyword, status);
}
```
:::

### 3. 请求体（@RequestBody）

将请求体中的 JSON 反序列化为 Java 对象，适合 POST/PUT 请求。

::: details 请求体绑定示例
```java
// src/main/java/com/example/demo/dto/CreateUserRequest.java
public record CreateUserRequest(
    @NotBlank(message = "用户名不能为空")
    String username,

    @Email(message = "邮箱格式不正确")
    String email,

    @Size(min = 8, message = "密码至少 8 位")
    String password
) {}

// Controller 接收
@PostMapping
public ResponseEntity<UserDTO> createUser(
        @RequestBody @Valid CreateUserRequest request) {
    UserDTO user = userService.create(request);
    URI location = URI.create("/api/v1/users/" + user.id());
    return ResponseEntity.created(location).body(user);
}
```
:::

### 4. 请求头与 Cookie

::: details 请求头和 Cookie 参数示例
```java
@GetMapping("/profile")
public UserDTO getProfile(
        @RequestHeader("Authorization") String authHeader,
        @RequestHeader(value = "X-Request-Id", required = false) String requestId,
        @CookieValue(value = "session_id", required = false) String sessionId) {
    // ...
}
```
:::

---

## 三、统一响应封装

### 1. 响应结构设计

统一的返回格式便于前端处理，通常包含状态码、消息和数据三个字段。

::: details 统一响应体定义
```java
// src/main/java/com/example/demo/common/Result.java
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Result<T> {

    private int code;       // 业务状态码，200 表示成功
    private String message; // 提示信息
    private T data;         // 响应数据

    public static <T> Result<T> success(T data) {
        return new Result<>(200, "success", data);
    }

    public static <T> Result<T> success() {
        return new Result<>(200, "success", null);
    }

    public static <T> Result<T> error(int code, String message) {
        return new Result<>(code, message, null);
    }

    public static <T> Result<T> error(ResultCode resultCode) {
        return new Result<>(resultCode.getCode(), resultCode.getMessage(), null);
    }
}
```

```java
// src/main/java/com/example/demo/common/ResultCode.java
@Getter
@AllArgsConstructor
public enum ResultCode {
    SUCCESS(200, "操作成功"),
    BAD_REQUEST(400, "请求参数错误"),
    UNAUTHORIZED(401, "未登录或 Token 已过期"),
    FORBIDDEN(403, "无权限访问"),
    NOT_FOUND(404, "资源不存在"),
    INTERNAL_ERROR(500, "服务器内部错误");

    private final int code;
    private final String message;
}
```
:::

---

## 四、全局异常处理

### 1. @ControllerAdvice + @ExceptionHandler

`@ControllerAdvice` 将异常处理逻辑集中到一个类中，避免在每个 Controller 中重复捕获异常。

::: details 全局异常处理器示例
```java
// src/main/java/com/example/demo/exception/GlobalExceptionHandler.java
@RestControllerAdvice  // = @ControllerAdvice + @ResponseBody
@Slf4j
public class GlobalExceptionHandler {

    // 处理业务异常
    @ExceptionHandler(BusinessException.class)
    public Result<Void> handleBusinessException(BusinessException e) {
        log.warn("业务异常：{}", e.getMessage());
        return Result.error(e.getCode(), e.getMessage());
    }

    // 处理资源不存在
    @ExceptionHandler(ResourceNotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public Result<Void> handleNotFound(ResourceNotFoundException e) {
        return Result.error(404, e.getMessage());
    }

    // 处理参数校验失败（@Valid 触发）
    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Result<Map<String, String>> handleValidation(
            MethodArgumentNotValidException e) {
        Map<String, String> errors = new LinkedHashMap<>();
        e.getBindingResult().getFieldErrors().forEach(error ->
            errors.put(error.getField(), error.getDefaultMessage())
        );
        return new Result<>(400, "参数校验失败", errors);
    }

    // 处理未知异常（兜底）
    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public Result<Void> handleException(Exception e) {
        log.error("未知异常", e);
        return Result.error(500, "服务器内部错误，请稍后重试");
    }
}
```

```java
// src/main/java/com/example/demo/exception/BusinessException.java
@Getter
public class BusinessException extends RuntimeException {
    private final int code;

    public BusinessException(int code, String message) {
        super(message);
        this.code = code;
    }

    public BusinessException(ResultCode resultCode) {
        super(resultCode.getMessage());
        this.code = resultCode.getCode();
    }
}
```
:::

---

## 五、数据校验

### 1. Hibernate Validator 常用注解

在 Spring Boot 中引入 `spring-boot-starter-validation` 即可使用。

| 注解 | 说明 |
|------|------|
| `@NotNull` | 不为 null（允许空字符串） |
| `@NotBlank` | 字符串不为 null 且去除空格后长度 > 0 |
| `@NotEmpty` | 集合/字符串不为 null 且不为空 |
| `@Size(min, max)` | 字符串/集合长度范围 |
| `@Min` / `@Max` | 数值范围 |
| `@Email` | 邮箱格式 |
| `@Pattern(regexp)` | 正则表达式 |
| `@Positive` | 正数 |
| `@Future` / `@Past` | 未来/过去的日期 |

### 2. 分组校验

创建和更新场景的校验规则不同时，使用分组校验区分。

::: details 分组校验示例
```java
// src/main/java/com/example/demo/dto/UserRequest.java

// 定义校验分组
public interface ValidationGroups {
    interface Create {}
    interface Update {}
}

public class UserRequest {

    // 创建时必填，更新时不校验
    @NotBlank(groups = ValidationGroups.Create.class, message = "用户名不能为空")
    private String username;

    @NotBlank(groups = {ValidationGroups.Create.class, ValidationGroups.Update.class},
              message = "邮箱不能为空")
    @Email(message = "邮箱格式不正确")
    private String email;

    @NotNull(groups = ValidationGroups.Update.class, message = "ID 不能为空")
    private Long id;
}

// Controller 中使用 @Validated 指定分组
@PostMapping
public Result<UserDTO> create(
        @RequestBody @Validated(ValidationGroups.Create.class) UserRequest request) {
    return Result.success(userService.create(request));
}

@PutMapping("/{id}")
public Result<UserDTO> update(@PathVariable Long id,
        @RequestBody @Validated(ValidationGroups.Update.class) UserRequest request) {
    return Result.success(userService.update(id, request));
}
```
:::

---

## 六、文件上传与下载

### 1. 文件上传

Spring Boot 内置了 `MultipartFile` 支持，默认限制单文件 1MB，可通过配置修改。

::: details 文件上传配置与实现
```yaml
# src/main/resources/application.yml
spring:
  servlet:
    multipart:
      max-file-size: 10MB       # 单文件最大大小
      max-request-size: 50MB    # 整个请求最大大小
      enabled: true
```

```java
// src/main/java/com/example/demo/controller/FileController.java
@RestController
@RequestMapping("/api/v1/files")
public class FileController {

    private static final String UPLOAD_DIR = "/var/uploads/";

    // 单文件上传
    @PostMapping("/upload")
    public Result<String> uploadFile(
            @RequestParam("file") MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            throw new BusinessException(400, "文件不能为空");
        }
        // 使用 UUID 重命名，防止文件名冲突
        String originalName = StringUtils.getFilenameExtension(
            file.getOriginalFilename());
        String fileName = UUID.randomUUID() + "." + originalName;
        Path targetPath = Paths.get(UPLOAD_DIR, fileName);
        Files.copy(file.getInputStream(), targetPath,
            StandardCopyOption.REPLACE_EXISTING);
        return Result.success("/files/" + fileName);
    }

    // 多文件上传
    @PostMapping("/upload/batch")
    public Result<List<String>> uploadFiles(
            @RequestParam("files") List<MultipartFile> files) {
        List<String> urls = files.stream()
            .map(file -> /* 处理逻辑 */ "url")
            .toList();
        return Result.success(urls);
    }
}
```
:::

### 2. 文件下载

::: details 文件下载实现
```java
// 文件下载：返回二进制流
@GetMapping("/download/{fileName}")
public ResponseEntity<Resource> downloadFile(
        @PathVariable String fileName) throws IOException {
    Path filePath = Paths.get(UPLOAD_DIR, fileName);
    Resource resource = new UrlResource(filePath.toUri());

    if (!resource.exists()) {
        throw new ResourceNotFoundException("文件不存在：" + fileName);
    }

    return ResponseEntity.ok()
        .header(HttpHeaders.CONTENT_DISPOSITION,
            "attachment; filename=\"" + resource.getFilename() + "\"")
        .contentType(MediaType.APPLICATION_OCTET_STREAM)
        .body(resource);
}
```
:::

::: tip 生产环境文件存储建议
生产环境不建议将文件存储在应用服务器本地磁盘，推荐使用对象存储服务（OSS/MinIO/S3），通过 SDK 上传并返回访问 URL。
:::
