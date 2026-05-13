// 夸克网盘链接配置
// 修改这里即可，无需改动页面代码

const LINKS = {
  // 项目配置（哪个项目最火）
  projects: {
    'project1': {
      name: '项目一名称',
      url: 'https://pan.quark.cn/xxxxxxxx',
      desc: '简短描述'
    },
    'project2': {
      name: '项目二名称',
      url: 'https://pan.quark.cn/yyyyyyyy',
      desc: '简短描述'
    }
  },

  // 来源配置（哪个论坛转化高）
  sources: {
    'forumA': '论坛A',
    'forumB': '论坛B',
    'wx': '微信公众号',
    'qq': 'QQ',
    'douyin': '抖音',
    'xiaohongshu': '小红书',
    'zhihu': '知乎',
    'bilibili': '哔哩哔哩',
    'weibo': '微博',
    'baidu': '百度',
    'tieba': '百度贴吧',
    'direct': '直接访问'
  },

  // 自动识别来源（根据 document.referrer 匹配）
  // 优先级：URL参数 s=xxx > 自动识别 > direct
  referrerRules: [
    // 抖音系
    { match: /douyin\.com|iesdouyin\.com|iesdouyin\.cn|douyinvod\.com/i, source: 'douyin', name: '抖音' },
    // 小红书
    { match: /xiaohongshu\.com|xhslink\.com/i, source: 'xiaohongshu', name: '小红书' },
    // 微信公众号/文章
    { match: /mp\.weixin\.qq\.com|weixin\.qq\.com/i, source: 'wx', name: '微信公众号' },
    // 知乎
    { match: /zhihu\.com|zhuanlan\.zhihu\.com/i, source: 'zhihu', name: '知乎' },
    // B站
    { match: /bilibili\.com|bilivideo\.cn|b23\.tv/i, source: 'bilibili', name: '哔哩哔哩' },
    // 微博
    { match: /weibo\.com|weibo\.cn|weibocdn\.com/i, source: 'weibo', name: '微博' },
    // QQ
    { match: /qzone\.qq\.com|mqq\.com|qq\.com/i, source: 'qq', name: 'QQ' },
    // 百度贴吧
    { match: /tieba\.baidu\.com/i, source: 'tieba', name: '百度贴吧' },
    // 百度其他
    { match: /baidu\.com|bdstatic\.com/i, source: 'baidu', name: '百度' },
    // 常见论坛（Discuz/phpwind 特征）
    { match: /bbs\.|forum\.|club\.|tieba\.|zhidao\./i, source: 'forumA', name: '论坛' }
  ],

  // 默认跳转链接
  defaultUrl: 'https://pan.quark.cn/xxxxxxxx'
};

// 统计 API 配置（选一种即可）
const STATS_CONFIG = {
  // 方案1: 自建 Cloudflare Workers + D1（推荐，国内快）
  // apiEndpoint: 'https://你的域名.workers.dev/log',

  // 方案2: Umami 统计（自托管或 umami.is）
  // umamiWebsiteId: 'your-website-id',
  // umamiSrc: 'https://你的umami地址/script.js',

  // 方案3: 百度统计（国内快，免费）
  // baiduId: '你的百度统计ID',

  // 方案4: 友盟+（国内快，免费）
  // cnzzId: '你的CNZZ ID'

  // 当前使用的方案
  type: 'none' // 改为 'cloudflare' / 'umami' / 'baidu' / 'cnzz'
};
