# THE CAPITALIST

一款围绕概率、风险与谈判构建的原创游戏节目原型。玩家从 20 个保险箱中保留一个私人箱子，分轮淘汰其余奖励，并在每轮面对 Capitalist 的收购报价。

当前版本只使用虚拟积分 `CAP`，不接真钱、不支持提现、不包含登录或数据库。

## 技术结构

- React 19 + TypeScript + Vite Web 版本
- `packages/core` 共享游戏状态、EV、报价、还价与结算逻辑
- Cocos Creator 3.8 客户端骨架
- Web Audio API 原创合成音效
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

## 已实现

- 20 个箱子随机分配奖励，玩家先选择自己的隐藏箱子
- 六轮开箱节奏：`5 / 4 / 3 / 3 / 2 / 1`
- 根据剩余奖励实时计算 EV，并生成 Capitalist 报价
- `DEAL / COUNTER / HOLD` 三种操作
- Counter Offer 支持接受、拒绝与反报价
- 大厅、开箱舞台、资本家来电和结算四个独立场景
- 全屏揭晓动画、原创音效和移动端响应式布局
- 最终揭晓私人箱子，并以 clown / moai 评价决策结果
- 为分享卡、账号、皮肤和虚拟货币保留扩展接口

## 项目目录

```text
packages/core/                    共享游戏引擎与自动测试
src/                              React Web 可玩版本
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
