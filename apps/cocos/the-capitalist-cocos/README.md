# THE CAPITALIST Cocos Creator 工程

这是移动 App、微信小游戏和抖音小游戏共用的 Cocos Creator 3.8 LTS 工程骨架。游戏规则来自根目录的 `packages/core`，Web 与 Cocos 使用同一套 EV、报价、还价和结算逻辑。

## 导入

1. 安装 Cocos Dashboard，并在 Dashboard 中安装 Cocos Creator 3.8 LTS。
2. 在 Dashboard 的“项目”页面导入当前目录。
3. 回到仓库根目录运行 `npm run sync:cocos-core`，把最新共享规则同步到 `assets/scripts/core`。
4. 首次导入后，打开 `assets/Main.scene` 并点击预览。Cocos Creator 会自动生成 `library`、`temp`、`settings` 等本地目录。

## 已提供脚本

- `CocosBootstrap.ts`：`Main.scene` 的零配置入口，会在运行时创建完整界面并接通选箱、开箱、EV、报价、DEAL、COUNTER、HOLD 和结算。
- `TheCapitalistGame.ts`：编辑器拖拽绑定版控制器，后续改用美术预制体时可以使用。
- `VaultButton.ts`：单个箱子按钮组件。
- `assets/scripts/core`：从共享核心自动生成的 Cocos 兼容副本，不要直接修改。

## 场景

`assets/Main.scene` 已经绑定 `CocosBootstrap`，首次打开即可预览，不需要手工拖拽 20 个按钮。当前场景使用 960 × 640 横屏布局，适合先验证 App、微信小游戏和抖音小游戏构建链路；正式美术版可再替换成预制体和竖屏布局。

角色肖像在 `assets/resources/capitalist-portrait.jpg`。发布前分别在构建面板选择 iOS、Android、微信小游戏或抖音小游戏，并配置各平台自己的 AppID、包名、签名和隐私设置。
