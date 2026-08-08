# THE CAPITALIST

一款围绕概率、风险和谈判构建的原创电视节目式游戏。玩家从 20 个箱子中保留一个私人箱子，分轮淘汰其余金额，并面对六位 Capitalist 的收购报价。

当前版本只使用虚拟积分 `CAP`，不接真钱、不支持提现、不包含登录或数据库。

## 技术结构

- React 19 + TypeScript + Vite Web 版本
- `packages/core` 共享游戏状态、EV、报价与结算逻辑
- Cocos Creator 3.8 客户端骨架
- Web Audio API 原创合成节目音效
- GitHub Actions 自动执行代码检查、测试与生产构建

## 本地启动

```bash
npm ci
npm run dev
```

浏览器打开 `http://127.0.0.1:5173/`。

提交代码前运行完整检查：

```bash
npm run check
```

## 当前节目流程

1. 全屏轮次字幕提示玩家选择私人箱子。
2. 私人箱子从箱阵跳到页面顶部并独立保留。
3. 玩家选择本轮要打开的箱子。
4. 对应轮次的礼仪主持进入独立开箱画面并揭晓金额。
5. 页面切换到完整金额板，高亮本次被淘汰的金额。
6. 未完成本轮时返回选箱；完成本轮后进入 Capitalist 报价画面。
7. 玩家选择 `DEAL` 或 `NO DEAL`。
8. `DEAL` 立即结束并揭晓私人箱子；`NO DEAL` 进入下一轮或最终揭晓。
9. 最终所得低于最后一次报价时播放小丑动画，否则播放原创冠军庆祝动画和音乐。

## 已实现

- 20 个箱子随机分配奖励
- 六轮开箱节奏：`5 / 4 / 3 / 3 / 2 / 1`
- 根据剩余奖励实时计算 EV 并生成报价
- 八种独立画面及自动节目时间线
- 六位原创礼仪主持和六位原创 Capitalist
- 选箱、转场、开箱、淘汰、报价、胜负原创音效
- 手机、平板和桌面响应式布局
- 为分享卡、账号、皮肤和虚拟货币保留扩展接口

## 项目目录

```text
packages/core/                    共享游戏引擎与自动测试
src/                              React Web 可玩版本
src/assets/cast-sprite-v1.png     六轮主持人与 Capitalist 角色表
src/extensions/                   后续业务扩展接口
apps/cocos/the-capitalist-cocos/  Cocos Creator 项目骨架
tools/sync-cocos-core.mjs         将共享核心同步到 Cocos
docs/platform-roadmap.md          App、微信和抖音版本路线
```

## Cocos 同步

修改 `packages/core` 后运行：

```bash
npm run sync:cocos-core
```

然后使用 Cocos Creator 3.8 LTS 导入 `apps/cocos/the-capitalist-cocos`。
