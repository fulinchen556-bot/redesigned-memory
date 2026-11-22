# 陈福临个人作品集网站

一个无需构建工具的静态个人作品集，采用暗色杂志式视觉语言，面向桌面端浏览，内容最大宽度为 1700px。

## 页面模块

- 全屏 Hero：首页专属 3D 数字分身、姓名、定位、求职状态、简历与作品入口
- 精选项目：阿闻宠物 App、安启银行 App、包福记品牌及 AIGC 视觉实验
- 个人经历：两段实习与教育背景
- 个人优势：共情力、执行力、跨界审美、快速学习
- 联系区：邮箱、微信二维码与简历下载

项目卡片可展开完整案例弹窗，包含项目背景、设计决策、结果与项目状态说明。

## 动效参考

交互设计参考并适配了 React Bits 的三个免费组件模式：

- [Split Text](https://reactbits.dev/text-animations/split-text)：Hero 大标题使用遮罩式逐字入场。
- [Spotlight Card](https://reactbits.dev/components/spotlight-card)：项目和优势卡片跟随鼠标显示冷色柔光。
- [Magnet](https://reactbits.dev/animations/magnet)：CTA 与导航按钮在指针靠近时轻微吸附并回弹。

网站保持原生 HTML、CSS 和 JavaScript，没有引入 React 或第三方运行时依赖。

## 首页数字分身

`assets/images/ip-character.webp` 由用户提供的 3D 风格形象图去除背景后生成，仅用于首页 Hero，不重复出现在其他页面模块。

交互包括：

- 鼠标移动时角色会轻微转头，画面同步产生轻微视差。
- 轻微呼吸与漂浮。
- 点击角色或使用键盘回车会触发微笑反馈，并显示 “HELLO, I'M FULIN”。
- CSS 蓝色轨道与原生 WebGL 粒子共同强化 UI/UX + AIGC 身份。
- WebGL 不可用时自动显示静态角色图、轨道和铭牌。
- 页面滚出首屏后停止动画绘制。

## 本地运行

直接用浏览器打开 `index.html` 即可查看。若需要更接近实际网站的运行环境，可在本目录执行：

```bash
python3 -m http.server 4173
```

然后访问：

```text
http://127.0.0.1:4173/
```

## 文件结构

```text
portfolio-site/
├── index.html
├── styles.css
├── script.js
├── ip-interactions.js
├── README.md
└── assets/
    ├── documents/
    │   └── chen-fulin-resume.pdf
    └── images/
        └── *.webp
```

## 修改提示

- 页面文字集中在 `index.html`。
- 全站颜色、字体、间距、卡片和响应式规则集中在 `styles.css`。
- 滚动出现、导航状态、Hero 视差与案例弹窗逻辑集中在 `script.js`。
- 首页数字分身的转头、微笑和 WebGL 粒子逻辑集中在 `ip-interactions.js`。
- 项目图片来自陈福临作品集 PDF，已转为 WebP 以减小加载体积。
- 网站正文不展示手机号、微信号明文和证件照；可下载的简历 PDF 仍保留原简历内容。
- 若需要扩大公开发布范围，建议再次确认作品图片与简历 PDF 的公开权限。
