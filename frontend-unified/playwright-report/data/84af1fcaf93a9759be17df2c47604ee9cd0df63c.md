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
  - region "Notifications alt+T"
  - button "Open Next.js Dev Tools" [ref=e19] [cursor=pointer]:
    - img [ref=e20]
  - alert [ref=e23]
```