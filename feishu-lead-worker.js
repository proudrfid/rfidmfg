/*
 * Cloudflare Worker — 接收网站询盘并写入飞书多维表格
 * --------------------------------------------------------------
 * 部署后,把它的网址填进 script.js 的 FORM_ENDPOINT,网站表单提交就会
 * 自动在你的飞书多维表格里新增一条询盘记录(并已处理跨域 CORS)。
 *
 * 在 Cloudflare → Worker → Settings → Variables 里配置这些环境变量:
 *   FEISHU_APP_ID      你的飞书 App ID(cli_ 开头)
 *   FEISHU_APP_SECRET  你的飞书 App Secret(建议重置后再用)
 *   APP_TOKEN          多维表格的 app_token(链接 /base/ 后那串)
 *   TABLE_ID           线索表的 table_id(链接 ?table= 后那串)
 *   ALLOW_ORIGIN       你的网站地址(如 https://www.rfidmfg.com),用于限制来源
 *
 * 线索表需要有这些字段(文本即可,提交时间用“日期”类型):
 *   姓名 / 邮箱 / 产品 / 留言 / 来源 / 提交时间
 */
export default {
  async fetch(request, env) {
    const cors = {
      'Access-Control-Allow-Origin': env.ALLOW_ORIGIN || '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Accept',
    };
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (request.method !== 'POST') return json({ ok: false, error: 'Method not allowed' }, 405, cors);

    let data;
    try { data = await request.json(); } catch { return json({ ok: false, error: 'Invalid JSON' }, 400, cors); }

    const name = String(data.name || '').slice(0, 200).trim();
    const email = String(data.email || '').slice(0, 200).trim();
    if (!name || !email) return json({ ok: false, error: 'name and email required' }, 400, cors);
    const product = String(data.product || '').slice(0, 200);
    const message = String(data.message || '').slice(0, 4000);
    const source = String(data.source || 'website').slice(0, 300);

    // 1) tenant_access_token
    const tk = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ app_id: env.FEISHU_APP_ID, app_secret: env.FEISHU_APP_SECRET }),
    }).then((r) => r.json());
    if (tk.code !== 0) return json({ ok: false, error: 'token error: ' + tk.msg }, 502, cors);

    // 2) create a record in the leads table
    const fields = {
      '姓名': name,
      '邮箱': email,
      '产品': product,
      '留言': message,
      '来源': source,
      '提交时间': Date.now(),
    };
    const res = await fetch(
      `https://open.feishu.cn/open-apis/bitable/v1/apps/${env.APP_TOKEN}/tables/${env.TABLE_ID}/records`,
      {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + tk.tenant_access_token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields }),
      }
    ).then((r) => r.json());
    if (res.code !== 0) return json({ ok: false, error: 'bitable error: ' + res.code + ' ' + res.msg }, 502, cors);

    return json({ ok: true }, 200, cors);
  },
};

function json(obj, status, cors) {
  return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json', ...cors } });
}
