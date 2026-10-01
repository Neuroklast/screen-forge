import { test, expect, type Page, type Browser } from '@playwright/test';
import { loadTemplate, login as prepLogin } from './support/prep';
async function login(page: Page) {
  await prepLogin(page, 'e2e');
}
async function assign(page: Page, browser: Browser, name: string) {
  await page.getByRole('button',{name:'Geräte',exact:true}).click();
  // Provisioning is a context action, not persistent page content.
  await page.getByRole('button',{name:'Geräte verbinden',exact:true}).click();
  const card = page.locator('.device-card').filter({has: page.getByRole('heading',{name,exact:true})});
  await card.getByRole('button',{name:'QR-Code anzeigen'}).click();
  await expect(page.locator('.qr-panel h3')).toHaveText(name);
  const url = await page.getByRole('link',{name:'Gerätelink öffnen'}).getAttribute('href');
  const ctx = await browser.newContext(); const device = await ctx.newPage(); await device.goto(url!);
  await expect(device.locator('.field-status, .hq-view')).toBeVisible();
  return {ctx,device,url:url!};
}
async function guidedFromTemplate(page: Page, template: string, name: string) {
  await loadTemplate(page, template, name);
}
test('guided setup, one-time QR, diagnostic code, pause/reset and mobile layout', async ({page,browser}) => {
  await login(page);
  await guidedFromTemplate(page,'Search & Rescue','Guided test');
  const {ctx,device,url} = await assign(page,browser,'Sequence terminal');
  try {
    await expect(device.getByText('STANDBY',{exact:true})).toBeVisible();
    await expect(device.locator('.terminal-countdown')).toContainText(/\d\d:\d\d/);
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
    await device.reload(); await expect(device.locator('.field-status')).toBeVisible();
    await device.setViewportSize({width:390,height:844});
    expect(await device.evaluate(()=>document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
    const replay = await browser.newPage(); await replay.goto(url); await expect(replay.getByRole('alert')).toContainText('expired'); await replay.close();
    await page.screenshot({path:'test-results/trainer-setup.png',fullPage:true});
    await device.screenshot({path:'test-results/terminal-mobile.png',fullPage:true});
  } finally { await ctx.close(); }
});
test('MEL timeline shows planned, rescheduled and actual entries with CSV export', async ({page}) => {
  await login(page);
  await page.getByRole('button',{name:'Übung starten',exact:true}).last().click();
  await expect(page.getByRole('button',{name:'Pausieren',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Live-Steuerung',exact:true}).click();
  await expect(page.getByRole('heading',{name:'MEL-Zeitstrahl'})).toBeVisible();
  await page.getByRole('button',{name:'+1 min'}).first().click();
  await expect(page.locator('.mel-timeline')).toContainText('Verschoben');
  await expect(page.getByRole('button',{name:'MEL exportieren (CSV)'})).toBeVisible();
});
test('mission library template loads into the wizard', async ({page}) => {
  await login(page);
  await guidedFromTemplate(page,'Relay Recovery','Relay test');
});
test('dossiers synchronize and trainer patient changes reach the assigned monitor', async ({page,browser}) => {
  await login(page);
  const medic = await assign(page,browser,'Medic 01');
  const hq = await assign(page,browser,'Headquarters');
  try {
    await page.getByRole('button',{name:'Übung starten',exact:true}).last().click();
    await page.getByRole('button',{name:'arrest',exact:true}).click();
    await expect(medic.device.locator('.bio-id b')).toHaveText('ARREST');
    await expect(hq.device.locator('.hq-patient-card')).toContainText('HR 0');
    await page.getByRole('button',{name:'Pausieren',exact:true}).click();
    await page.getByRole('button',{name:'Teilnehmer',exact:true}).click();
    const dossiers = page.locator('.prepare-block').filter({has: page.getByRole('heading',{name:'Akten'})});
    await dossiers.getByRole('button',{name:'Neue Akte',exact:true}).click();
    await dossiers.getByLabel('Name',{exact:true}).fill('Test Person');
    await dossiers.getByLabel('Notizen').fill('Only after release');
    await page.getByRole('button',{name:'Szenario speichern',exact:true}).click();
    await expect(page.locator('.notice[role="status"]')).toContainText('Szenario gespeichert');
    await expect(hq.device.getByText('Test Person',{exact:true})).toHaveCount(0);
    await page.getByRole('button',{name:'Übung starten',exact:true}).last().click();
    await page.getByRole('button',{name:'Test Person freigeben'}).click();
    await expect(hq.device.getByRole('heading',{name:'Test Person'})).toBeVisible();
  } finally { await medic.ctx.close(); await hq.ctx.close(); }
});
test('station presentation is pushed to the assigned field device', async ({page,browser}) => {
  await login(page);
  await page.getByRole('button',{name:'Geräte',exact:true}).click();
  await page
    .locator('.prepare-device')
    .filter({hasText:'Intelligence'})
    .locator('strong')
    .click();
  await page.getByText('Erweitert').click();
  const title = page.locator('.sf-device-inspector').getByLabel('Titel',{exact:true});
  await title.fill('RELAY-07');
  await title.press('Enter');
  await page.getByRole('button',{name:'Szenario speichern',exact:true}).click();
  await expect(page.locator('.notice[role="status"]')).toContainText('Szenario gespeichert');
  const {ctx,device} = await assign(page,browser,'Intelligence');
  try {
    await expect(device.getByText('RELAY-07',{exact:true})).toBeVisible();
  } finally { await ctx.close(); }
});
test('field terminal completion is restored after a reload', async ({page,browser}) => {
  await login(page);
  const {ctx,device} = await assign(page,browser,'Intelligence');
  try {
    await page.getByRole('button',{name:'Übung starten',exact:true}).last().click();
    await expect(device.locator('.field-status')).toContainText('LIVE');
    const input = device.getByLabel('Terminal input');
    for (const command of ['status','scan --local','inspect auth','login --token 07-RELAY']) {
      await input.fill(command);
      await input.press('Enter');
    }
    await expect(device.locator('.terminal-header')).toContainText('COMPLETE');
    await device.reload();
    await expect(device.locator('.terminal-header')).toContainText('COMPLETE');
  } finally { await ctx.close(); }
});
test('field terminal controls stay reachable on a small screen', async ({page,browser}) => {
  await login(page);
  const {ctx,device} = await assign(page,browser,'Sequence terminal');
  try {
    await device.setViewportSize({width:390,height:844});
    await page.getByRole('button',{name:'Übung starten',exact:true}).last().click();
    await device.getByRole('button',{name:'ISOLATION',exact:true}).click();
    const submit = device.getByRole('button',{name:'Submit isolation request'});
    await submit.scrollIntoViewIfNeeded();
    await expect(submit).toBeInViewport();
    await expect(device.getByRole('button',{name:'STATUS',exact:true})).toBeInViewport();
  } finally { await ctx.close(); }
});
test('preparation surfaces hide while the exercise runs', async ({page}) => {
  await login(page);
  await expect(page.getByRole('button',{name:'Geräte',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Übung starten',exact:true}).last().click();
  await expect(page.getByRole('button',{name:'Live-Steuerung',exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Szenario',exact:true})).toHaveCount(0);
  await expect(page.getByRole('button',{name:'Teilnehmer',exact:true})).toHaveCount(0);
  await expect(page.getByRole('button',{name:'Ablauf',exact:true})).toHaveCount(0);
  await expect(page.getByRole('heading',{name:'Verdeckte Ereignisse'})).toBeVisible();
  await page.getByRole('button',{name:'Pausieren',exact:true}).click();
  await expect(page.getByRole('button',{name:'Szenario',exact:true})).toBeVisible();
});
test('field surface is a fixed viewport without a document scroll', async ({page,browser}) => {
  await login(page);
  const {ctx,device} = await assign(page,browser,'Sequence terminal');
  try {
    await page.getByRole('button',{name:'Übung starten',exact:true}).last().click();
    await expect(device.locator('.field-status')).toContainText('LIVE');
    await expect(device.locator('.field-stage')).toBeVisible();
    const overflow = await device.evaluate(() => {
      const root = document.querySelector('.field-app');
      return root ? root.scrollHeight - root.clientHeight : -1;
    });
    expect(overflow).toBeLessThanOrEqual(1);
  } finally { await ctx.close(); }
});
test('instrument module renders as a native field surface, not a scaled stage', async ({page,browser}) => {
  await login(page);
  await guidedFromTemplate(page,'Ordnance Disposal','Instrument test');
  const {ctx,device} = await assign(page,browser,'Data Sheet');
  try {
    await page.getByRole('button',{name:'Übung starten',exact:true}).last().click();
    await expect(device.locator('.field-native')).toBeVisible();
    await expect(device.locator('.role-stage')).toHaveCount(0);
    await expect(device.locator('.field-native .instrument-frame')).toBeVisible();
  } finally { await ctx.close(); }
});

test('runtime controls are scoped to the exercise phase', async ({page}) => {
  await login(page);
  const reset = page.getByRole('button',{name:'Reset',exact:true});
  await expect(reset).toBeVisible();
  const start = page.getByRole('button',{name:'Übung starten',exact:true}).last();
  await expect(start).toBeEnabled({ timeout: 15000 });
  await start.click();
  await expect(
    page.getByRole('button',{name:'Pausieren',exact:true}),
  ).toBeVisible({ timeout: 15000 });
  await expect(reset).toHaveCount(0);
});
