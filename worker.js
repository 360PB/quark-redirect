// Cloudflare Workers + D1 统计API
// 部署后把域名填到 config/links.js 的 apiEndpoint

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS 允许所有来源（如需限制，可改成你的域名）
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json'
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // 接收点击日志
      if (path === '/log' && request.method === 'POST') {
        const data = await request.json().catch(() => ({}));
        const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
        const now = Date.now();

        await env.DB.prepare(`
          INSERT INTO clicks (project, project_name, source, source_name, url, ua, ip, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          data.project || 'unknown',
          data.projectName || 'unknown',
          data.source || 'unknown',
          data.sourceName || 'unknown',
          data.url || '',
          data.ua || '',
          ip,
          now
        ).run();

        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
      }

      // 统计查询
      if (path === '/stats') {
        const type = url.searchParams.get('type') || 'summary';
        let result;

        switch(type) {
          case 'summary':
            result = await env.DB.prepare(`
              SELECT
                COUNT(*) as total,
                COUNT(DISTINCT project) as projects,
                COUNT(DISTINCT source) as sources,
                COUNT(CASE WHEN created_at > ? THEN 1 END) as today
              FROM clicks
            `).bind(Date.now() - 86400000).first();
            break;

          case 'projects':
            // 哪个项目最火
            result = await env.DB.prepare(`
              SELECT project_name as name, COUNT(*) as count
              FROM clicks
              GROUP BY project_name
              ORDER BY count DESC
              LIMIT 20
            `).all();
            break;

          case 'sources':
            // 哪个论坛转化高
            result = await env.DB.prepare(`
              SELECT source_name as name, COUNT(*) as count
              FROM clicks
              GROUP BY source_name
              ORDER BY count DESC
              LIMIT 20
            `).all();
            break;

          case 'hours':
            // 哪个时间段流量大
            result = await env.DB.prepare(`
              SELECT
                CAST(strftime('%H', datetime(created_at/1000, 'unixepoch')) AS INTEGER) as hour,
                COUNT(*) as count
              FROM clicks
              WHERE created_at > ?
              GROUP BY hour
              ORDER BY hour
            `).bind(Date.now() - 7 * 86400000).all(); // 最近7天
            break;

          case 'today':
            result = await env.DB.prepare(`
              SELECT * FROM clicks
              WHERE created_at > ?
              ORDER BY created_at DESC
              LIMIT 100
            `).bind(Date.now() - 86400000).all();
            break;

          case 'trend':
            // 最近7天趋势
            result = await env.DB.prepare(`
              SELECT
                date(created_at/1000, 'unixepoch') as day,
                COUNT(*) as count
              FROM clicks
              WHERE created_at > ?
              GROUP BY day
              ORDER BY day DESC
              LIMIT 7
            `).bind(Date.now() - 7 * 86400000).all();
            break;

          default:
            result = { error: 'Unknown type' };
        }

        return new Response(JSON.stringify(result), { headers: corsHeaders });
      }

      return new Response(JSON.stringify({ ok: true, msg: 'Quark Stats API' }), { headers: corsHeaders });

    } catch(e) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
    }
  }
};
