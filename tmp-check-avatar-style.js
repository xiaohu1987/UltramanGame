const {chromium} = require('playwright');
(async()=>{
  const browser = await chromium.launch({headless:true});
  const page = await browser.newPage({viewport:{width:1440,height:900}});
  await page.goto('http://127.0.0.1:8000/?v=fullbody-fix-4', {waitUntil:'networkidle'});
  // select 3 heroes
  await page.click('button:has-text("盖亚奥特曼")');
  await page.click('button:has-text("初代奥特曼")');
  await page.click('button:has-text("迪迦奥特曼")');
  await page.click('#btn-start');
  await page.waitForSelector('#screen-battle.screen.active, #screen-battle.active, #ally-team .avatar', {timeout:5000}).catch(()=>{});
  await page.waitForTimeout(800);
  const styles = await page.evaluate(()=>{
    const img = document.querySelector('#ally-team .avatar');
    const frame = document.querySelector('#ally-team .avatar-frame');
    if(!img) return {error:'no img', html: document.body.innerText.slice(0,200)};
    const cs = getComputedStyle(img);
    const fcs = getComputedStyle(frame);
    return {
      src: img.getAttribute('src'),
      img: {w: cs.width, h: cs.height, fit: cs.objectFit, pos: cs.objectPosition, maxW: cs.maxWidth, maxH: cs.maxHeight, display: cs.display, padding: cs.padding},
      frame: {w: fcs.width, h: fcs.height, overflow: fcs.overflow, display: fcs.display},
      natural: {w: img.naturalWidth, h: img.naturalHeight},
      client: {w: img.clientWidth, h: img.clientHeight},
      sheets: [...document.styleSheets].map(s=>s.href).filter(Boolean)
    };
  });
  console.log(JSON.stringify(styles,null,2));
  await page.screenshot({path:'.codexh/outputs/img-audit/battle-now.png', fullPage:false});
  await browser.close();
})().catch(e=>{console.error(e); process.exit(1);});
