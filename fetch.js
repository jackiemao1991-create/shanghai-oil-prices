// fetch.js  —— Node 18+ 环境（Actions 默认可用）
const fs = require('fs').promises;

async function main(){
  const token = process.env.OIL_API_TOKEN || ''; // 从 GitHub Secret 读取
  // 默认使用起零数据的“全部省份油价”接口（可用 token）
  const url = `https://api.istero.com/resource/all/oilprice?token=${token}`;

  console.log('Fetching', url);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();

  const today = new Date().toISOString().slice(0,10); // YYYY-MM-DD
  let prices = { "92h":"", "95h":"", "98h":"", "0h":"" };

  // 试着兼容常见返回格式（不同 API 结构不一）
  const list = json.data || json.result || json; // 可能是数组或对象
  if (Array.isArray(list)) {
    const sh = list.find(item =>
      (item.city && item.city.includes('上海')) ||
      (item.province && item.province.includes('上海')) ||
      (item.name && item.name.includes('上海'))
    );
    if (sh) {
      prices['92h'] = sh['92h'] || sh['p92'] || sh['p92price'] || sh['p92price'] || sh['p0'] || '';
      prices['95h'] = sh['95h'] || sh['p95'] || sh['p95price'] || '';
      prices['98h'] = sh['98h'] || sh['p98'] || sh['p98price'] || '';
      prices['0h']  = sh['0h']  || sh['p0']  || sh['diesel'] || '';
    }
  } else if (typeof list === 'object') {
    // 某些 API 直接以 city 为键
    const sh = list['上海'] || list['shanghai'] || list;
    if (sh && typeof sh === 'object') {
      prices['92h'] = sh['92h'] || sh['p92'] || '';
      prices['95h'] = sh['95h'] || sh['p95'] || '';
      prices['98h'] = sh['98h'] || sh['p98'] || '';
      prices['0h']  = sh['0h']  || sh['p0']  || '';
    }
  }

  const out = {
    city: '上海',
    updated: today,
    prices,
    unit: '元/升'
  };

  await fs.mkdir('data', {recursive:true});
  await fs.writeFile('data/shanghai.json', JSON.stringify(out, null, 2), 'utf8');
  console.log('Wrote data/shanghai.json', out);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
