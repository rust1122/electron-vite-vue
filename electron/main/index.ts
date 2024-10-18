import { app, BrowserWindow, shell, ipcMain } from "electron";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import os from "node:os";
import fs from "node:fs";
import { devices } from "playwright"; // 从 Playwright 导入
import { chromium } from "playwright-extra";
import stealth from "puppeteer-extra-plugin-stealth";
import type { BrowserContext, BrowserContextOptions } from "playwright";
import { test, expect } from "@playwright/test";
import { simulateHumanClick, randomDelay, simulateHumanTyping, simulateHumanScroll } from './utils'

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main
// │ │ └── index.js    > Electron-Main
// │ └─┬ preload
// │   └── index.mjs   > Preload-Scripts
// ├─┬ dist
// │ └── index.html    > Electron-Renderer
//
process.env.APP_ROOT = path.join(__dirname, "../..");

console.log(__dirname);

export const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
export const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, "public")
  : RENDERER_DIST;

// Disable GPU Acceleration for Windows 7
if (os.release().startsWith("6.1")) app.disableHardwareAcceleration();

// Set application name for Windows 10+ notifications
if (process.platform === "win32") app.setAppUserModelId(app.getName());

if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

let win: BrowserWindow | null = null;
const preload = path.join(__dirname, "../preload/index.mjs");
const indexHtml = path.join(RENDERER_DIST, "index.html");

async function createWindow() {
  win = new BrowserWindow({
    title: "Main window",
    icon: path.join(process.env.VITE_PUBLIC, "favicon.ico"),
    webPreferences: {
      preload,
      // Warning: Enable nodeIntegration and disable contextIsolation is not secure in production
      // nodeIntegration: true,

      // Consider using contextBridge.exposeInMainWorld
      // Read more on https://www.electronjs.org/docs/latest/tutorial/context-isolation
      // contextIsolation: false,
    },
  });

  if (VITE_DEV_SERVER_URL) {
    // #298
    win.loadURL(VITE_DEV_SERVER_URL);
    // Open devTool if the app is not packaged
    win.webContents.openDevTools();
  } else {
    win.loadFile(indexHtml);
  }

  // Test actively push message to the Electron-Renderer
  win.webContents.on("did-finish-load", () => {
    win?.webContents.send("main-process-message", new Date().toLocaleString());
  });

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https:")) shell.openExternal(url);
    return { action: "deny" };
  });
  // win.webContents.on('will-navigate', (event, url) => { }) #344
}

app.whenReady().then(createWindow);

app.on("activate", () => {
  const allWindows = BrowserWindow.getAllWindows();
  if (allWindows.length) {
    allWindows[0].focus();
  } else {
    createWindow();
  }
});

app.on("window-all-closed", () => {
  win = null;
  if (process.platform !== "darwin") app.quit();
});

app.on("second-instance", () => {
  if (win) {
    // Focus on the main window if the user tried to open another
    if (win.isMinimized()) win.restore();
    win.focus();
  }
});

// New window example arg: new windows url
ipcMain.handle("open-win", (_, arg) => {
  const childWindow = new BrowserWindow({
    webPreferences: {
      preload,
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  if (VITE_DEV_SERVER_URL) {
    childWindow.loadURL(`${VITE_DEV_SERVER_URL}#${arg}`);
  } else {
    childWindow.loadFile(indexHtml, { hash: arg });
  }
});

// 初始化 Playwright Extra，并使用 Stealth 插件
chromium.use(stealth()); // PlaywrightExtra 直接访问浏览器类型
// playwright.use(StealthPlugin());

const iPhone = devices["iPhone 14 Pro Max"];
console.log('iPhone',iPhone)
const STORAGE_STATE_FILE = "storageState.json"; // 存储状态文件
const baseContextOptions: BrowserContextOptions = {
  // channel: "chrome",
  screen: {
    width: 800,
    height: 600
  },
  viewport: {
    width: 800,
    height: 600
  }
};

let browserContext: BrowserContext; // 用于存储浏览器上下文

ipcMain.handle("login-instagram", async () => {
  const browser = await chromium.launch({ 
    headless: false, 
   });

  // 加载存储状态
  if (!browserContext) {
    // 如果存储状态文件存在，则加载存储状态
    // 这种场景是用户打开app，点击过登录过之后，再点一次登录
    if (fs.existsSync(STORAGE_STATE_FILE)) {
      browserContext = await browser.newContext({
        ...baseContextOptions,
        storageState: STORAGE_STATE_FILE, // 加载存储状态
      });
    } else {
      // 这种场景是用户打开app，第一次点登录
      // 创建新的上下文
      browserContext = await browser.newContext(baseContextOptions);
    }
  }
  browserContext.setDefaultTimeout(0);
  const page = await browserContext.newPage();

  await page.goto("https://www.instagram.com");

  // 等待用户输入

  // 等待出现头像元素
  console.log("等待出现头像元素 start");
  const avaterDom = page.locator(
    "div > span > div > a > div > div > div > div > span > img"
  );
  await avaterDom.waitFor();
  console.log("等待出现头像元素 end");
  // avaterDom.click();
  simulateHumanClick(page, avaterDom)
  browserContext.storageState({ path: STORAGE_STATE_FILE });
});

// main.js 中的 IPC 处理部分
ipcMain.handle("fetch-instagram-posts", async (event, { keyword }) => {
  try {
    // 加载存储状态
    if (!fs.existsSync(STORAGE_STATE_FILE)) {
      return { success: false, error: "请先登录" };
    } else {
      // 加载存储状态
      if (!browserContext) {
        // 这种场景是用户登录之后退出了app，再次打开app的时候
        const browser = await chromium.launch({ headless: false });
        const contextOptions = {
          ...baseContextOptions
        };

        browserContext = await browser.newContext({
          ...contextOptions,
          storageState: STORAGE_STATE_FILE, // 加载存储状态
        });
      }
    }
    const page = await browserContext.newPage();

    await page.goto("https://www.instagram.com", {waitUntil: 'networkidle'});

    const searchMenuDom = await page.locator('div:nth-child(2) > span > div > a > div > div > div > div > svg')
    console.log('找到搜索菜单dom', searchMenuDom)
    simulateHumanClick(page, searchMenuDom)

    await randomDelay()

    const searchInputDom = await page.locator('div > div > div > div > div > input')
    console.log('找到搜索inputdom', searchInputDom)
    // 模拟输入关键词
    await simulateHumanTyping(page, searchInputDom, keyword)

    await randomDelay()

    // // 点击第一个话题
    // const searchResultDom = await page.locator('header > div > div > div.xq8finb > div > div > div > div > div > div > div > div > div > div > div > div > a:nth-child(1)')
    // if (await searchResultDom.count() > 0) {
    //   await simulateHumanClick(page, searchResultDom);
    // } else {
    //   // 没有相关帖子
    // }

    // await page.waitForLoadState('networkidle')
    
    // const post = []

    // page.on('response', data => {
    //   console.log(data.url)
    // })
    // while(post)
    // // 开始滚动
    // await simulateHumanScroll(page)

    return { success: true, comments: [] };
  } catch (error) {
    console.error(error);
    return { success: false, error: error.message };
  }
});
