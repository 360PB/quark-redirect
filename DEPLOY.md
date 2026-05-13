# 夸克网盘跳转页 - 部署教程

## 方案对比

| 方案 | 成本 | 国内速度 | 统计能力 | 适合人群 |
|------|------|----------|----------|----------|
| Cloudflare Pages + Workers | 免费 | 较快 | 实时 API | **推荐，最全功能** |
| 仅 Cloudflare Pages | 免费 | 较快 | 本地看板 | 不想折腾 API |
| GitHub Pages | 免费 | 较慢 | 本地看板 | 已有 GitHub 账号 |

以下以 **Cloudflare Pages + Workers** 为例，一步步操作。

---

## 第一步：注册 Cloudflare 账号

1. 打开 https://dash.cloudflare.com/sign-up
2. 用邮箱注册（国内邮箱可用）
3. 验证邮箱，登录 Dashboard

---

## 第二步：代码推送到 GitHub

### 2.1 注册 GitHub 账号
https://github.com/signup

### 2.2 创建仓库
1. 登录 GitHub → 右上角 `+` → `New repository`
2. Repository name 填 `quark-redirect`
3. 选 `Public`（免费部署 Pages 必须是公开的）
4. 点击 `Create repository`

### 2.3 上传代码

**方式 A：用 Git 命令**

在代码文件夹里打开终端，依次执行：

```bash
# 进入项目目录
cd quark-redirect

# 初始化 git
git init

# 添加所有文件
git add .

# 提交
git commit -m "init quark redirect"

# 关联远程仓库（把 YOUR_USERNAME 换成你的 GitHub 用户名）
git remote add origin https://github.com/YOUR_USERNAME/quark-redirect.git

# 推送
git push -u origin main
```

**方式 B：网页上传（不用装 Git）**

1. 在 GitHub 仓库页面点击 `uploading an existing file`
2. 把 `index.html`、`stats.html`、`config/links.js`、README.md 等文件拖进去
3. 点 `Commit changes`

---

## 第三步：部署 Cloudflare Pages

1. 登录 https://dash.cloudflare.com
2. 左侧菜单 → `Pages`（或 `Workers & Pages`）
3. 点击 `Create a project`
4. 选 `Connect to Git`
5. 授权 Cloudflare 访问你的 GitHub 账号 → 选刚才创建的 `quark-redirect` 仓库
6. 点击 `Begin setup`
7. **构建配置**（关键步骤）：
   - Build command（构建命令）：**留空**
   - Build output directory（输出目录）：填 `/`
   - 点击 `Save and Deploy`
8. 等 1~2 分钟，显示 `Your site was deployed` 即成功
9. 得到一个类似 `https://quark-redirect-xxx.pages.dev` 的链接

### 测试
浏览器打开 `https://你的链接.pages.dev/?p=project1`，看能否正常跳转。

---

## 第四步：绑定自定义域名（强烈推荐）

`xxx.pages.dev` 用户不信任，转化率低。建议绑定自己的域名（如 `pan-share.com`、`zi-yuan.com`）。

### 4.1 买域名
推荐：
- **腾讯云 DNSPod**：https://dnspod.cloud.tencent.com/ （国内备案方便，.com 约 60元/年）
- **Cloudflare Registrar**：https://dash.cloudflare.com → `Registrar`（价格透明，约 10美元/年）
- **阿里云**：https://wanwang.aliyun.com/

### 4.2 在 Cloudflare 添加域名
1. Dashboard 左侧 → `Websites` → `Add a site`
2. 输入你买的域名，选 Free plan
3. 按提示修改域名 DNS 服务器到 Cloudflare（在购买域名的平台修改）

### 4.3 Pages 绑定自定义域
1. 进入 Pages 项目 → `Custom domains`
2. 点击 `Set up a custom domain`
3. 输入你的域名（如 `pan-share.com`）
4. 按提示添加 DNS 记录（通常自动完成）
5. 等几分钟，显示 `Active` 即可用

**最终效果**：
```
https://pan-share.com/?p=project1   ← 用户访问这个链接
```

---

## 第五步：部署统计 API（可选，但强烈推荐）

如果不部署 API，统计只能存在浏览器本地，换电脑就没了。部署后可以实时看数据。

### 5.1 安装 Wrangler CLI

```bash
# 需要 Node.js（https://nodejs.org 下载安装）
npm install -g wrangler

# 登录 Cloudflare
npx wrangler login
# 会弹出浏览器让你授权，点击 Allow
```

### 5.2 创建 D1 数据库

```bash
npx wrangler d1 create quark-stats
```

执行后会返回类似：
```
✅ Successfully created DB 'quark-stats'
   database_id = xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```
**复制这串 `database_id`，下一步要用。**

### 5.3 初始化数据库表

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

### 5.4 创建 wrangler.toml

在项目根目录创建 `wrangler.toml` 文件：

```toml
name = "quark-stats-api"
main = "worker.js"
compatibility_date = "2024-01-01"

[[d1_databases]]
binding = "DB"
database_name = "quark-stats"
database_id = "粘贴你的 database_id"
```

### 5.5 部署 Worker

```bash
npx wrangler deploy
```

部署成功后会显示：
```
✨ Successfully published quark-stats-api
   https://quark-stats-api.你的子域名.workers.dev
```

### 5.6 配置前端使用 API

编辑 `config/links.js`：

```js
const STATS_CONFIG = {
  type: 'cloudflare',
  apiEndpoint: 'https://quark-stats-api.你的子域名.workers.dev/log'
};
```

然后把修改提交到 GitHub，Cloudflare Pages 会自动重新部署：

```bash
git add config/links.js
git commit -m "add stats api"
git push
```

---

## 第六步：查看统计数据

### 6.1 在线查询（部署了 Workers 后）

在浏览器直接访问：

| 查询内容 | 地址 |
|----------|------|
| 汇总数据 | `https://你的worker域名/stats?type=summary` |
| 项目排行（哪个最火） | `https://你的worker域名/stats?type=projects` |
| 来源排行（哪转化高） | `https://你的worker域名/stats?type=sources` |
| 24小时分布 | `https://你的worker域名/stats?type=hours` |
| 今日明细 | `https://你的worker域名/stats?type=today` |
| 7天趋势 | `https://你的worker域名/stats?type=trend` |

### 6.2 本地看板（不部署 Workers 也能用）

把 `stats.html` 用浏览器打开，可以看到：
- 总点击数、今日点击
- 项目排行、来源排行
- 24小时时段分布图
- 最近点击记录

**注意**：数据存在浏览器 localStorage，清缓存或换电脑会丢失。

---

## 第七步：日常发链接

配置好项目后，日常只需要改 URL 参数即可：

```
https://你的域名/?p=project1
```

不用传 `s=`，系统会自动识别用户从哪个平台点过来的。

如果想测试某个来源的效果：
```
https://你的域名/?p=project1&s=douyin   # 强制标记为抖音来源
```

---

## 常见问题

**Q: Cloudflare Pages 国内访问快吗？**
> 比 GitHub Pages 快很多。如果还觉得慢，可以绑自定义域名 + 备案后开启 Cloudflare 中国网络。

**Q: Workers 免费额度够用吗？**
> 每天 10 万次请求，一般拉新场景完全够用。

**Q: 微信内打开不显示来源？**
> 微信内置浏览器通常不传递 referer，这是正常现象。建议微信场景手动加 `s=wx` 参数。

**Q: 想换网盘链接怎么办？**
> 直接改 `config/links.js` 里的 `url`，提交到 GitHub，Pages 自动重新部署，不用重新配置。
