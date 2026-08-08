# THE CAPITALIST 多端发布路线

## 当前架构

- `packages/core`：唯一规则源，包含奖励池、轮次、EV、报价、还价和结算。
- `src`：React + Vite Web 可玩版，用于快速验证玩法和视觉。
- `apps/cocos/the-capitalist-cocos`：Cocos Creator 3.8.8 工程，用于 iOS、Android、微信小游戏和抖音小游戏。
- `src/extensions`：账号、分享卡、皮肤和虚拟钱包的接口边界。

## 推荐发布顺序

1. 用当前 Web 版完成第一批玩法测试，记录每轮流失、DEAL/HOLD 比例和平均游戏时长。
2. 在 Cocos Creator 3.8.8 打开 `assets/Main.scene`，先构建 Web Mobile 验证场景。
3. 构建 Android 内测包和 iOS TestFlight 包，处理安全区、返回键、音频焦点和隐私授权。
4. 分别构建微信小游戏和抖音小游戏测试包，配置平台 AppID、分包和隐私声明。
5. 最后接匿名账号、分享卡和纯虚拟 CAP；支付、广告和活动系统必须独立评审。

## 产品边界

产品定位使用“概率决策 + 风险管理 + 谈判游戏”。当前版本必须保持：

- CAP 仅为游戏内虚拟分数，不可充值、提现或兑换现金与高价值实物。
- 不允许玩家之间交易 CAP、奖励或道具。
- 不使用“稳赚、下注、提现、投资回报、现金奖”等宣传表达。
- 若未来销售随机道具，购买前展示清晰概率，并为各地区准备年龄分级、家长控制、隐私政策和用户协议。
- 中国大陆版本单独准备规则与概率公示、未成年人保护和内容审核材料。

## Cocos 构建资料

- Cocos Dashboard 与编辑器安装：<https://docs.cocos.com/creator/3.8/manual/en/getting-started/install/>
- 小游戏平台发布入口：<https://docs.cocos.com/creator/3.8/manual/en/editor/publish/publish-mini-game.html>
- 微信小游戏发布：<https://docs.cocos.com/creator/3.8/manual/en/editor/publish/publish-wechatgame.html>
- 小游戏分包：<https://docs.cocos.com/creator/3.8/manual/en/editor/publish/subpackage.html>

## 下一阶段

- 把运行时生成的 Cocos 界面替换为正式 2D 预制体和动画。
- 加入简体中文、日语、韩语和英语本地化资源表。
- 增加完整埋点、崩溃收集和设备性能分级。
- 设计分享卡、赛季任务、非交易型皮肤和纯虚拟成长系统。
- 为中国大陆、韩国、日本及东南亚各目标国家分别做商店与法律审核，避免用一套文本直接跨区发布。
