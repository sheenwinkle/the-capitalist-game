# THE CAPITALIST MVP

可直接试玩的概率决策与谈判游戏。当前版本只使用虚拟积分 CAP，不接真钱、不支持提现、不接登录和数据库。

## 本地启动

```bash
npm install
npm run dev
```

打开 `http://127.0.0.1:5173/`。生产构建后的静态文件位于 `dist/client`。运行完整质量检查：

```bash
npm run check
```

## 已实现

- 20 个箱子随机分配奖励，玩家先选择自己的隐藏箱子。
- 6 轮开箱节奏：`5 / 4 / 3 / 3 / 2 / 1`。
- 每轮按剩余奖励实时计算 EV，并生成 Capitalist 报价。
- 支持 DEAL、COUNTER、HOLD；还价可被接受、拒绝或收到反报价。
- 最终揭晓自己的箱子，并用 🤡 / 🗿 评价决策结果。
- 手机、平板和桌面响应式黑金游戏界面，包含原创角色肖像、声音反馈、报价历史和奖励梯度。
- 核心规则自动测试，Web 与 Cocos Creator 共用同一套 TypeScript 逻辑。
- 为分享卡、账号、皮肤和虚拟钱包预留接口，但当前均为本地占位实现。

## 目录

```text
packages/core/                 共享游戏状态机、EV、报价、还价与结算
src/                           React Web 可玩版
src/extensions/                分享、账号、皮肤、虚拟钱包扩展接口
apps/cocos/the-capitalist-cocos/
                               Cocos Creator 3.8 工程骨架
tools/sync-cocos-core.mjs      同步共享核心到 Cocos
docs/platform-roadmap.md       App、微信小游戏、抖音小游戏路线
```

## Cocos 同步

修改 `packages/core` 后运行：

```bash
npm run sync:cocos-core
```

然后用 Cocos Dashboard 导入 `apps/cocos/the-capitalist-cocos`。首次打开场景和平台构建仍需安装 Cocos Creator 3.8 LTS。
