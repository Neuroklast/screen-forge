import { test, expect, type Page, type Browser } from '@playwright/test';
async function login(page: Page) {
  await page.goto(`/?role=trainer&room=e2e-${Date.now()}`);
  await page.getByLabel('Trainer-Schlüssel').fill('browser-test-key');
  await page.getByRole('button',{name:'Verbinden',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Was möchtest du als Nächstes tun?'})).toBeVisible();
}
async function assign(page: Page, browser: Browser, name: string) {
  await page.getByRole('button',{name:'Geräte vorbereiten',exact:true}).click();
  const card = page.locator('.device-card').filter({has: page.getByRole('heading',{name,exact:true})});
  await card.getByRole('button',{name:'QR-Code anzeigen'}).click();
  await expect(page.locator('.qr-panel h3')).toHaveText(name);
  const url = await page.getByRole('link',{name:'Gerätelink öffnen'}).getAttribute('href');
  const ctx = await browser.newContext(); const device = await ctx.newPage(); await device.goto(url!);
  await expect(device.locator('.field-header, .hq-view')).toBeVisible();
  return {ctx,device,url:url!};
}
test('guided setup, one-time QR, diagnostic code, pause/reset and mobile layout', async ({page,browser}) => {
  await login(page);
  await page.getByRole('button',{name:'Neues Szenario erstellen',exact:false}).click();
  await page.getByRole('button',{name:'Film playback',exact:false}).click();
  await page.getByLabel('Szenarioname',{exact:true}).fill('Film test');
  for (let i=0;i<3;i++) await page.getByRole('button',{name:'Weiter',exact:true}).click();
  await page.getByRole('button',{name:'Szenario anlegen'}).click();
  await expect(page.getByRole('heading',{level:1})).toHaveText('Film test');
  const {ctx,device,url} = await assign(page,browser,'Sequence terminal');
  try {
    await expect(device.getByText('STANDBY',{exact:true})).toBeVisible();
    await page.getByRole('button',{name:'Übung starten',exact:true}).last().click();
    await device.getByRole('button',{name:'DIAGNOSTICS',exact:true}).click();
    await device.getByRole('button',{name:'Read current diagnostics'}).click();
    const code = await device.getByRole('row').filter({hasText:'ACTIVE'}).locator('td').last().textContent();
    await device.getByRole('button',{name:'ISOLATION',exact:true}).click();
    await device.getByLabel('Active shunt identifier').fill(code!);
    await device.getByRole('button',{name:'Submit isolation request'}).click();
    await expect(device.getByText('Isolation confirmed. Task completed.')).toBeVisible();
    await page.getByRole('button',{name:'Pausieren',exact:true}).click();
    page.once('dialog',d=>d.accept()); await page.getByRole('button',{name:'Reset',exact:true}).click();
    await expect(device.getByText('STANDBY',{exact:true})).toBeVisible();
    await device.reload(); await expect(device.locator('.field-header')).toBeVisible();
    await device.setViewportSize({width:390,height:844});
    expect(await device.evaluate(()=>document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
    const replay = await browser.newPage(); await replay.goto(url); await expect(replay.getByRole('alert')).toContainText('expired'); await replay.close();
    await page.screenshot({path:'test-results/trainer-setup.png',fullPage:true});
    await device.screenshot({path:'test-results/terminal-mobile.png',fullPage:true});
  } finally { await ctx.close(); }
});
test('dossiers synchronize and trainer patient changes reach the assigned monitor', async ({page,browser}) => {
  await login(page);
  const medic = await assign(page,browser,'Medic 01');
  const hq = await assign(page,browser,'Headquarters');
  try {
    await page.getByRole('button',{name:'Live-Steuerung',exact:true}).click();
    await page.getByRole('button',{name:'arrest',exact:true}).click();
    await expect(medic.device.locator('.bio-id b')).toHaveText('ARREST');
    await expect(hq.device.locator('.hq-patient-card')).toContainText('HR 0');
    await page.getByRole('button',{name:'Personalakten',exact:true}).click();
    await page.getByRole('button',{name:'Neue Akte',exact:true}).click();
    await page.getByLabel('Name',{exact:true}).fill('Test Person');
    await page.getByLabel('Notizen').fill('Only after release');
    await page.getByRole('button',{name:'Szenario speichern',exact:true}).click();
    await expect(page.getByRole('status')).toContainText('Szenario gespeichert');
    await expect(hq.device.getByText('Test Person',{exact:true})).toHaveCount(0);
    await page.getByRole('button',{name:'Live-Steuerung',exact:true}).click();
    await page.getByRole('button',{name:'Test Person freigeben'}).click();
    await expect(hq.device.getByRole('heading',{name:'Test Person'})).toBeVisible();
  } finally { await medic.ctx.close(); await hq.ctx.close(); }
});
