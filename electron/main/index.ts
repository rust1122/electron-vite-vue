import { app, BrowserWindow, shell, ipcMain } from 'electron'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import os from 'node:os'
// import puppeteer from 'puppeteer'
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';


const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))
// 使用 Stealth 插件
puppeteer.use(StealthPlugin());

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
process.env.APP_ROOT = path.join(__dirname, '../..')

// 持久化用户数据目录
const USER_DATA_DIR = path.join(__dirname, 'user_data');
console.log(__dirname)

// 辅助函数
const randomDelay = (min = 100, max = 300) => {
  return new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * (max - min + 1)) + min));
};

const simulateHumanClick = async (page, selector) => {
  const element = await page.$(selector);
  if (element) {
    const box = await element.boundingBox();
    if (box) {
      const x = box.x + box.width / 2 + (Math.random() * 10 - 5); // 添加随机偏移
      const y = box.y + box.height / 2 + (Math.random() * 10 - 5);
      await page.mouse.move(x, y, { steps: 10 });
      await page.mouse.click(x, y);
    }
  }
};


export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')
export const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST

// Disable GPU Acceleration for Windows 7
if (os.release().startsWith('6.1')) app.disableHardwareAcceleration()

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName())

if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}

let win: BrowserWindow | null = null
const preload = path.join(__dirname, '../preload/index.mjs')
const indexHtml = path.join(RENDERER_DIST, 'index.html')

async function createWindow() {
  win = new BrowserWindow({
    title: 'Main window',
    icon: path.join(process.env.VITE_PUBLIC, 'favicon.ico'),
    webPreferences: {
      preload,
      // Warning: Enable nodeIntegration and disable contextIsolation is not secure in production
      // nodeIntegration: true,

      // Consider using contextBridge.exposeInMainWorld
      // Read more on https://www.electronjs.org/docs/latest/tutorial/context-isolation
      // contextIsolation: false,
    },
  })

  if (VITE_DEV_SERVER_URL) { // #298
    win.loadURL(VITE_DEV_SERVER_URL)
    // Open devTool if the app is not packaged
    win.webContents.openDevTools()
  } else {
    win.loadFile(indexHtml)
  }

  // Test actively push message to the Electron-Renderer
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString())
  })

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url)
    return { action: 'deny' }
  })
  // win.webContents.on('will-navigate', (event, url) => { }) #344
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  win = null
  if (process.platform !== 'darwin') app.quit()
})

app.on('second-instance', () => {
  if (win) {
    // Focus on the main window if the user tried to open another
    if (win.isMinimized()) win.restore()
    win.focus()
  }
})

app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows()
  if (allWindows.length) {
    allWindows[0].focus()
  } else {
    createWindow()
  }
})

// New window example arg: new windows url
ipcMain.handle('open-win', (_, arg) => {
  const childWindow = new BrowserWindow({
    webPreferences: {
      preload,
      nodeIntegration: true,
      contextIsolation: false,
    },
  })

  if (VITE_DEV_SERVER_URL) {
    childWindow.loadURL(`${VITE_DEV_SERVER_URL}#${arg}`)
  } else {
    childWindow.loadFile(indexHtml, { hash: arg })
  }
})


// interface 
// 处理来自渲染进程的爬取请求
ipcMain.handle('fetch-instagram-posts', async (event, searchQuery, searchConfig = {
  crawlNumber: 40,
  pageNumber: 2
}) => {


  const infoList = [
    {
      username: '17720274160',
      password: 'Zxc2687412'
    },
    {
      username: '519268754@qq.com',
      password: 'Zxc2687412'
    }
  ]
  const run = async ({
    username,
    password
  })=> {
    try {
      const browser = await puppeteer.launch({
        headless: false, // 显示浏览器窗口
        slowMo: 50, // 每个 Puppeteer 操作延迟 50 毫秒，便于观察
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-blink-features=AutomationControlled', // 禁用自动化控制特征
          '--disable-notifications=true', // 禁止弹出框
          '--blink-settings=imagesEnabled=false', // 禁止图片
          '--blink-settings=videosEnabled=false', // 禁止视频
          // '--proxy-server=http://your-proxy-server:port', // 如果使用代理，取消注释并设置代理服务器
        ],
        // userDataDir: USER_DATA_DIR, // 使用持久化用户数据目录
      });
      const page = await browser.newPage();
  
      // 设置用户代理
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
        'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36');
  
      // 设置视口大小（手机尺寸）
      await page.setViewport({ width: 1280, height: 960, isMobile: true });
  
     
  
      // 启用请求拦截
      await page.setRequestInterception(true);
  
      // 监听请求事件
      page.on('request', (request) => {
        const resourceType = request.resourceType();
        const url = request.url();
  
        // 判断资源类型是否为媒体（视频或音频）
        if (resourceType === 'media') {
          console.log(`阻止视频资源加载: ${url}`);
          request.abort();
        }
        // 你也可以根据 URL 阻止特定的视频格式，例如 .mp4, .webm 等
        // else if (url.endsWith('.mp4') || url.endsWith('.webm')) {
        //   console.log(`阻止特定视频格式加载: ${url}`);
        //   request.abort();
        // }
        else {
          request.continue();
        }
      });
  
      // 递归函数来过滤数据
      const filterData = (obj, fieldName) => {
        if (Array.isArray(obj)) {
          // 如果是数组，遍历每个元素
          return obj.map(item => filterData(item, fieldName)).filter(item => item !== null);
        } else if (typeof obj === 'object' && obj !== null) {
          // 如果是对象，检查是否包含目标字段
          if (fieldName in obj) {
            return obj; // 返回包含该字段的对象
          }
  
          // 遍历对象的每个属性
          for (const key in obj) {
            const result = filterData(obj[key], fieldName);
            if (result) {
              return result; // 如果找到，返回
            }
          }
        }
        return null; // 如果没有找到，返回 null
      }
  
      const fommterComments = (list)=> {
        if (!list || !list.length) {
          return []
        } else {
          return list.map(item=> {
            const cur = item.node
            return {
              ...cur.author,
              text: cur.body.text
            }
          })
        }
      }
  
      // 监听对特定 URL 的响应
      page.on('response', async (response) => {
        const url = response.url();
  
        // 检查响应的 URL 是否是我们想要的
        if (url.includes('https://www.facebook.com/api/graphql/')) {
          const status = response.status();
          const statusText = response.statusText();
  
          // 处理 JSON 响应
          if (response.ok()) { // 检查响应状态是否为成功
            try {
              const data = await response.json();
  
              // 过滤数据，传入字段名作为参数
              const fieldName = 'comment_rendering_instance_for_feed_location';
              const filteredData = filterData(data, fieldName);
              if (filteredData) {
                console.log(`Filtered response from ${url}:`, fommterComments(filteredData?.comment_rendering_instance_for_feed_location?.comments?.edges));
              }
  
            } catch (error) {
              // console.log(`Response from ${url} is not JSON:`, await response.text());
            }
          } else {
            // console.log(`Response from ${url} failed with status ${status} ${statusText}`);
          }
        }
      });
  
  
      // 导航到 Instagram 视频页面
      await page.goto('https://www.facebook.com/', { waitUntil: 'networkidle2' });
  
      await randomDelay(500, 1500);
  
      // 如果需要登录
      if (page.url().includes('login')) {
        // 等待登录表单加载
        await page.waitForSelector('input[name="email"]', { visible: true });
        await page.waitForSelector('input[name="pass"]', { visible: true });
  
        // 输入用户名和密码
        await page.type('input[name="email"]', username, { delay: 100 });
        await randomDelay(500, 1500);
        await page.type('input[name="pass"]', password, { delay: 100 });
        await randomDelay(500, 1500);
  
        // 模拟点击登录按钮
        await simulateHumanClick(page, 'button[type="submit"]');
  
        // 等待导航到主页或其他页面
        try {
          await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });
        } catch (error) {
          console.log('导航超时，可能需要进一步验证');
        }
      }
  
      // 模拟人类行为，添加随机延迟
      await randomDelay(2000, 5000); // 等待2-5秒
  
      // 导航到指定的标签页
      await page.goto(`https://www.facebook.com/watch/search/?q=${encodeURIComponent(searchQuery)}`, { waitUntil: 'networkidle2' });
  
      // 模拟人类行为，添加随机延迟
      await randomDelay(2000, 5000); // 等待2-5秒
  
      const articleSelectorStr = 'div > div:nth-child(1) > h2 > span > span > a';
      const scrollContainerSelector = 'div[role="feed"]'; // 指定的滚动容器
  
      // 等待页面加载内容
      await page.waitForSelector(articleSelectorStr);
      await page.waitForSelector(scrollContainerSelector);
  
      let posts = [];
      let scrollAttempts = 0;
      const maxScrollAttempts = 30;
  
      console.log(posts.length, searchConfig.crawlNumber)
      console.log(scrollAttempts, maxScrollAttempts);
  
      // 获取帖子链接
      while (posts.length < searchConfig.crawlNumber && scrollAttempts < maxScrollAttempts) {
        console.log('--- 开始收集帖子 ---');
  
        // 如果已经收集到足够的帖子，则退出循环
        if (posts.length >= searchConfig.crawlNumber) {
          console.log('如果已经收集到足够的帖子，则退出循环');
          break;
        }
  
        // 获取最后一个帖子元素的链接
        const lastPostLink = await page.evaluate((selector) => {
          const elements = document.querySelectorAll(selector);
          if (elements.length === 0) return null;
          elements[elements.length - 1].scrollIntoView()
          return elements[elements.length - 1].href;
        }, articleSelectorStr);
  
        console.log('获取最后一个帖子元素的链接');
  
        // 等待网络空闲
        // try {
        //   await page.waitForNetworkIdle({
        //     idleTime: 1000, // 等待 1 秒网络空闲
        //     timeout: 60000  // 最长等待 60 秒
        //   });
        // } catch (error) {
        //   console.log('等待网络空闲时发生错误:', error);
        //   scrollAttempts++;
        //   continue;
        // }
        await randomDelay()
        console.log('等待');
  
        // 获取新的帖子链接
        const newPosts = await page.evaluate((selector, crawlNumber) => {
          const elements = Array.from(document.querySelectorAll(selector));
          return elements.slice(0, crawlNumber).map(el => el.href).filter(href => href);
        }, articleSelectorStr, searchConfig.crawlNumber);
  
        if (newPosts.length === posts.length) {
          scrollAttempts++;
        }
        // 更新帖子列表
        posts = newPosts;
  
        console.log(`当前收集到的帖子数量: ${posts.length}`);
  
        if (posts.length >= searchConfig.crawlNumber) {
          break;
        }
      }
      console.log('--- 结束收集帖子  ---');
  
  
      console.log('--- 开始遍历帖子 ---');
  
      // 在收集到的帖子中进行进一步操作
      for (let i = 0; i < posts.length; i++) {
        // 
        const postUrl = posts[i]
        console.log(`当前正在遍历第 ${i + 1} 个帖子, 帖子地址 ${postUrl}`);
  
        await page.goto(postUrl, { waitUntil: 'networkidle2' });
  
        // 找到“查看更多评论”并点击
        let loadMoreExists = true;
        while (loadMoreExists) {
          loadMoreExists = await page.evaluate(() => {
            function findReplyElements(textPatterns) {
              // 将正则表达式中的文本模式组合为一个表达式
              const regexPattern = textPatterns.map(pattern => pattern.replace(/\s+/g, '\\s*')).join('|');
              const regex = new RegExp(regexPattern);
  
              // 查找所有包含给定文本模式的元素
              const repliesElements = [...Array.from(document.querySelectorAll('span'))]
                .filter(span => regex.test(span.textContent));
  
              // 提取每个符合条件的元素的最里层 DOM 元素，并进行去重
              const innermostElements = Array.from(
                new Set(
                  repliesElements.map(span => {
                    // 返回该元素的最里层子元素（如果有的话）
                    return span.querySelector('*:not(:has(*))') || span;
                  })
                )
              );
  
              return innermostElements;
            }
  
            // // 使用函数查找包含“全部X条回复”或“查看 X 条回复”的元素
            // const replyElements = findReplyElements(['全部\\d+条回复', '查看 \\d+ 条回复']);
  
            // // 打印出去重后的最里层的 DOM 元素
            // console.log(replyElements);
  
            const loadMoreButton = findReplyElements(['查看更多评论'])?.[0];
            if (loadMoreButton) {
              loadMoreButton.scrollIntoView()
              loadMoreButton.click();
              return true;
            }
            return false;
          });
  
          if (loadMoreExists) {
            await randomDelay(1000, 2000); // 等待加载更多评论
          }
        }
  
        // 返回上一页
        await page.goBack({ waitUntil: 'networkidle2' });
        await randomDelay(2000, 5000); // 等待2-5秒
      }
      // 重复进入每一个帖子里
  
      // 在每一个帖子里面 先找出“查看更多评论”的dom，点击，直到没有“查看更多评论”的dom为止
  
      // 返回上一页，进入下一个帖子、重复以上操作，直到posts遍历完
  
      // await browser.close();
      return { success: true, data: posts };
    } catch (error) {
      console.error('Error fetching Instagram posts:', error);
      return { success: false, error: error.message };
    }
  }

  for(let i = 0; i< searchConfig.pageNumber; i++) {
    run(infoList[i])
  }
 
});
