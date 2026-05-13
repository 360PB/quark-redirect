# 夸克网盘拉新跳转页

极速跳转 + 多维度统计，部署在 Cloudflare Pages（国内访问快 + 免费）。

## 文件结构

```
quark-redirect/
├── index.html          # 跳转页（用户访问的页面）
├── stats.html          # 本地统计看板（查看效果）
├── config/
│   └── links.js        # 链接和统计配置
└── worker.js           # Cloudflare Workers 统计API（可选）
```

## 快速开始

### 1. 配置链接

编辑 `config/links.js`：

```js
const LINKS = {
  projects: {
    'project1': {
      name: 'Python入门教程',
      url: 'https://pan.quark.cn/你的链接1',
      desc: '适合零基础'
    },
    'project2': {
      name: 'AI绘图资源包',
      url: 'https://pan.quark.cn/你的链接2',
      desc: 'Stable Diffusion'
    }
  },
  defaultUrl: 'https://pan.quark.cn/默认链接'
};
```

### 2. 选择统计方案

#### 方案A：Cloudflare Workers + D1（推荐）
- 国内快、免费额度够用
- 支持实时查看哪个项目最火、哪个论坛转化高、哪个时段流量大
- 见下方「部署统计API」

#### 方案B：百度统计（最简单）
- 去 [tongji.baidu.com](https://tongji.baidu.com) 申请站点
- 把统计ID填到 `STATS_CONFIG.baiduId`
- 事件追踪：`项目_来源` 格式，直接在百度后台看转化

#### 方案C：本地存储（零成本，但只能本机看）
- 不用改任何配置，默认就是
- 打开 `stats.html` 即可看效果
- 数据存在浏览器 localStorage，换电脑/清缓存会丢

### 3. 部署到 Cloudflare Pages

```bash
# 1. 把项目推送到 GitHub
git init
git add .
git commit -m "init"
git remote add origin https://github.com/你的用户名/quark-redirect.git
git push -u origin main

# 2. 去 Cloudflare Dashboard → Pages → 连接 GitHub 仓库
# 3. 构建命令留空，输出目录填 "/"，保存即部署
# 4. 得到一个 https://xxx.pages.dev 的域名（国内访问快）
```

### 4. 使用方式

**通用链接（自动识别来源）**
```
https://你的域名.pages.dev/?p=project1
```
跳转页会自动读取 `document.referrer`，识别用户是从哪个平台点击过来的，已内置规则：
- 抖音、小红书、微信公众号、知乎、B站、微博、QQ、百度贴吧/百度
- 论坛类（bbs、forum、club、tieba、zhidao 等域名特征）

**手动指定来源（优先级最高）**
```
https://你的域名.pages.dev/?p=project1&s=douyin
```

参数说明：
- `p` 或 `project`：项目标识（对应 links.js 里的 key）
- `s` 或 `source`：来源标识（手动指定时覆盖自动识别）

示例：
```
https://xxx.pages.dev/?p=project1              # 自动识别来源
https://xxx.pages.dev/?p=project1&s=douyin     # 强制标记为抖音
https://xxx.pages.dev/?p=project2&s=forumA     # 论坛A发帖
```

> 自动识别依赖浏览器的 `referrer` 机制，微信内、部分App内置浏览器可能不传递来源信息，建议同时保留手动 `s=` 参数作为兜底方案。

---

## 部署统计API（Cloudflare Workers + D1）

### 1. 创建 D1 数据库

```bash
npx wrangler d1 create quark-stats
```

记录返回的 `database_id`。

### 2. 初始化表

```bash
npx wrangler d1 execute quark-stats --command "
CREATE TABLE IF NOT EXISTS clicks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project TEXT,
  project_name TEXT,
  source TEXT,
  source_name TEXT,
  url TEXT,
  ua TEXT,
  ip TEXT,
  created_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_project ON clicks(project);
CREATE INDEX IF NOT EXISTS idx_source ON clicks(source);
CREATE INDEX IF NOT EXISTS idx_time ON clicks(created_at);
"
```

### 3. 部署 Worker

编辑 `wrangler.toml`：

```toml
name = "quark-stats-api"
main = "worker.js"
compatibility_date = "2024-01-01"

[[d1_databases]]
binding = "DB"
database_name = "quark-stats"
database_id = "你的database_id"
```

然后部署：
```bash
npx wrangler deploy
```

### 4. 配置前端

把 Worker 域名填到 `config/links.js`：

```js
const STATS_CONFIG = {
  type: 'cloudflare',
  apiEndpoint: 'https://quark-stats-api.你的子域名.workers.dev/log'
};
```

---

## 查看统计效果

### 实时API查询（需要部署Worker）

```bash
# 查看项目排行
https://你的worker域名/stats?type=projects

# 查看来源排行
https://你的worker域名/stats?type=sources

# 查看24小时分布
https://你的worker域名/stats?type=hours

# 查看今日数据
https://你的worker域名/stats?type=today
```

### 本地看板（无需Worker）

直接打开 `stats.html`，可以看到：
- 总点击数、今日点击
- 哪个项目最火（排行）
- 哪个论坛转化最高（排行）
- 哪个时间段流量大（24小时分布图）
- 最近点击记录

---

## 国内加速建议

1. **Cloudflare Pages 自带国内CDN**，通常比 GitHub Pages 快
2. 如果还不够快，可以给自定义域名开启 **Cloudflare 中国网络**（需备案）
3. 跳转页本身只有几KB，300ms延迟对用户几乎无感知

## 自定义域名（可选）

Cloudflare Pages → 自定义域 → 绑定你自己的域名（如 `pan-share.com`），用户更信任，转化率更高。
