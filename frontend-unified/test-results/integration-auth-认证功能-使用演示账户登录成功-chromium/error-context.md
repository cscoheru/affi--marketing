# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - generic [ref=e5]: 登录
      - generic [ref=e6]: "使用演示账户登录: demo@example.com / password"
    - generic [ref=e8]:
      - generic [ref=e9]:
        - text: 邮箱
        - textbox "邮箱" [ref=e10]: demo@example.com
      - generic [ref=e11]:
        - text: 密码
        - textbox "密码" [ref=e12]: password
      - button "登录" [ref=e13]
  - button "Open Next.js Dev Tools" [ref=e19] [cursor=pointer]:
    - generic [ref=e22]:
      - text: Compiling
      - generic [ref=e23]:
        - generic [ref=e24]: .
        - generic [ref=e25]: .
        - generic [ref=e26]: .
  - alert [ref=e27]
```