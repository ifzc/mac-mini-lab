# Mac mini · Inside

2024 款 M4 Mac mini 的本地 3D 结构探索网页。外观按官方机身比例建模；内部为教学示意，并非精密 CAD 或维修指南。

## 启动

在 macOS 上双击 `启动 Mac mini.command`，然后打开 http://localhost:4317/ 。也可在本目录运行：

```sh
npm ci
npm run dev -- --port 4317
```

需要 Node.js 22.13 或以上版本。首次安装依赖需要网络；模型、材质和字体均在本地生成或加载。中文朗读使用浏览器的语音服务，声音是否可用取决于系统和浏览器。

## 使用

- 拖拽旋转，滚轮或双指缩放；右侧按钮切换前、后、俯视与透视视角。
- 点击「一键拆解」或拖动滑块控制展开程度；点击部件或右侧列表阅读讲解。
- 「逐层讲解」可自动切换，也可用前后箭头手动阅读；喇叭按钮朗读当前部件。朗读时自动导览会暂停。
- 「自动旋转」「部件标注」控制模型辅助显示；圆形箭头复位模型。
- 支持触摸屏及键盘操作。聚焦模型后可按 `+`、`-` 缩放，`Home` 复位；所有部件也可从按钮列表访问。

## 代码

- `app/page.tsx`：交互页面、导览和语音控制。
- `app/components/mac-scene.ts`：Three.js 参数化模型、光照、相机、拾取与拆解动画。
- `app/components/parts.ts`：六个部件的中文讲解。
- `app/globals.css`：自适应页面样式。

```sh
npm run build
npx tsc --noEmit
```

提供可选的浏览器 WebMCP 接口 `get_mac_mini_state` 与 `configure_mac_mini`，不支持此接口的浏览器不受影响。

## 资料来源与范围

- [Apple：Mac mini (2024) 技术规格](https://support.apple.com/zh-cn/121555)
- [iFixit：Mac mini 2024 拆解](https://www.ifixit.com/News/104302/all-hail-the-return-of-upgradeable-storage-mac-mini-2024-teardown)

模型展示外壳、电源板、主板与 M4、存储模块、风扇和散热器、底盖。布局、元件形状与拆解运动经过简化；省略了部分线缆、屏蔽罩与紧固件。拆解展示顺序按功能组织，不等同于真实拆卸顺序。

## 本次验证

已通过生产构建、TypeScript 检查和启动脚本语法检查；本地首页及 3D 模块请求均返回 HTTP 200。未执行浏览器画面或交互验收；当前环境没有提供 WebMCP 运行验证上下文，因此可选的 WebMCP 接口尚未完成运行验证。
