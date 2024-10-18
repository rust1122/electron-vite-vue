import type { Page, Locator } from "playwright";

// 随机延迟函数
export const randomDelay = (min = 100, max = 300) => {
  return new Promise((resolve) =>
    setTimeout(resolve, Math.floor(Math.random() * (max - min + 1)) + min)
  );
};

// 模拟鼠标的平滑移动
const smoothMouseMove = async (page, startX, startY, endX, endY) => {
  const steps = 15 + Math.floor(Math.random() * 10); // 随机步数
  for (let i = 0; i < steps; i++) {
    const x = startX + ((endX - startX) * i) / steps + Math.random() * 2 - 1; // 随机抖动
    const y = startY + ((endY - startY) * i) / steps + Math.random() * 2 - 1;
    await page.mouse.move(x, y);
    await randomDelay(20, 50); // 微小的延迟，模拟自然移动
  }
};

// 模拟人类点击/输入函数
export const simulateHumanClick = async (
  page: Page,
  selector: string | Locator,
  options: {
    button?: "left" | "right" | "middle";
    modifiers?: Array<"Alt" | "Control" | "ControlOrMeta" | "Meta" | "Shift">;
    delay?: number;
  } = {}
) => {
  let element: Locator;
  if (typeof selector === "string") {
    element = page.locator(selector);
  } else {
    element = selector;
  }

  if ((await element.count()) > 0) {
    // 获取元素的 bounding box
    const box = await element.boundingBox();
    if (box) {
      // 计算点击位置，带有随机偏移以模拟人类点击
      const targetX = box.x + box.width / 2 + (Math.random() * 10 - 5); // 随机偏移 x
      const targetY = box.y + box.height / 2 + (Math.random() * 10 - 5); // 随机偏移 y

      // 假设鼠标起始位置为屏幕左上角
      const startX = Math.random() * 100; // 模拟从随机较近的位置开始移动
      const startY = Math.random() * 100;

      // 平滑移动到目标位置
      await smoothMouseMove(page, startX, startY, targetX, targetY);

      // 模拟随机延迟
      await randomDelay(300, 700);

      // 执行点击操作，带有自定义修饰符和鼠标按钮
      await element.click({
        button: options.button || "left",
        modifiers: options.modifiers || [],
        position: { x: targetX - box.x, y: targetY - box.y },
        delay: options.delay || Math.floor(Math.random() * 200), // 模拟鼠标按下后的延迟
      });

      // 点击后随机延迟
      await randomDelay(200, 600);
    }
  } else {
    console.log(`元素 ${selector} 未找到`);
  }
};

// 模拟随机字符错误（包括替换、遗漏、重复和转置）
const simulateTypingErrors = (text) => {
  const errorTypes = ["replace", "omit", "duplicate", "transpose"];
  const errorChance = 0.05; // 设置出现错误的概率，5% 错误率
  let newText = "";
  for (let i = 0; i < text.length; i++) {
    if (Math.random() < errorChance) {
      const errorType =
        errorTypes[Math.floor(Math.random() * errorTypes.length)];
      switch (errorType) {
        case "replace":
          // 随机替换一个字符
          const replacedChar = String.fromCharCode(
            text.charCodeAt(i) + (Math.random() < 0.5 ? 1 : -1)
          );
          newText += replacedChar;
          newText += "\b"; // 退格符模拟删除
          break;
        case "omit":
          // 跳过当前字符，模拟遗漏
          continue;
        case "duplicate":
          // 重复当前字符
          newText += text[i];
          break;
        case "transpose":
          // 交换当前字符与下一个字符
          if (i < text.length - 1) {
            newText += text[i + 1];
            newText += text[i];
            i++; // 跳过下一个字符
          } else {
            newText += text[i];
          }
          break;
        default:
          newText += text[i];
      }
    }
    newText += text[i];
  }
  return newText;
};

// 模拟人类输入的函数
export const simulateHumanTyping = async (
  page: Page,
  selector: string | Locator,
  text: string,
  options: {
    delay?: number;
  } = {}
) => {
  let element ;
  if (typeof selector === 'string') {
    element = page.locator(selector)
  } else {
    element = selector;
  }
  if ((await element.count()) === 0) {
    console.log(`元素 ${selector} 未找到`);
    return;
  }

  // 将错误率引入文本
  const simulatedText = simulateTypingErrors(text);

  let pauseProbability = 0.05; // 5%的概率在任何时候暂停
  let pauseDurationRange = [500, 2000]; // 停顿时间在0.5秒到2秒之间

  for (let i = 0; i < simulatedText.length; i++) {
    const char = simulatedText[i];

    // 模拟按下 Shift 键以输入大写字母或特殊字符
    const isUpperCase = char === char.toUpperCase() && /[A-Z]/.test(char);
    const needsShift = isUpperCase || /[!@#$%^&*(),.?":{}|<>]/.test(char);

    if (needsShift) {
      await page.keyboard.down("Shift");
    }

    // 输入字符
    await element.type(char);

    if (needsShift) {
      await page.keyboard.up("Shift");
    }

    // 模拟输入的随机延迟
    if (options.delay) {
      // 使用固定延迟
      await new Promise((resolve) => setTimeout(resolve, options.delay));
    } else {
      // 使用随机延迟
      await randomDelay(80, 250);
    }

    // 模拟段落结束或特殊字符后的额外停顿
    if (char === "." || char === "," || char === "!" || char === "?") {
      await new Promise((resolve) =>
        setTimeout(resolve, Math.floor(Math.random() * 400) + 300)
      ); // 0.3秒到0.7秒
    }

    // 随机的间歇性停顿
    if (Math.random() < pauseProbability) {
      const pauseDuration =
        Math.floor(
          Math.random() * (pauseDurationRange[1] - pauseDurationRange[0] + 1)
        ) + pauseDurationRange[0];
      await new Promise((resolve) => setTimeout(resolve, pauseDuration));
    }
  }

  // 模拟输入完成后的随机停顿
  await new Promise((resolve) =>
    setTimeout(resolve, Math.floor(Math.random() * 500) + 500)
  ); // 0.5秒到1秒
};

// 随机获取滚动步长
const randomScrollStep = (min = 50, max = 200) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// 模拟人类滚动
export const simulateHumanScroll = async (page: Page, options: {
  distance?: number,
  duration?: number,
  step?: number
} = {}) => {
  const totalScrollDistance = options.distance || 1500; // 总滚动距离
  const scrollDuration = options.duration || 3000; // 滚动持续时间
  const scrollStep = options.step || randomScrollStep(50, 200); // 每次滚动的随机步长

  const scrollCount = Math.ceil(totalScrollDistance / scrollStep);
  const delayBetweenScrolls = scrollDuration / scrollCount; // 每次滚动之间的延迟

  for (let i = 0; i < scrollCount; i++) {
    // 动态计算当前滚动步长
    const dynamicStep = Math.min(scrollStep, totalScrollDistance - (i * scrollStep));
    
    // 随机选择滚动方向（向下或向上）
    const scrollDirection = Math.random() < 0.2 ? -1 : 1; // 20% 概率向上滚动
    await page.mouse.wheel(0, scrollDirection * dynamicStep); // 向下或向上滚动

    // 模拟随机延迟
    await randomDelay(Math.floor(delayBetweenScrolls * 0.8), Math.floor(delayBetweenScrolls * 1.2));

    // 等待网络空闲状态
    await page.waitForLoadState('networkidle');

    // 偶尔随机停顿
    if (Math.random() < 0.1) { // 10% 的几率进行更长时间的停顿
      const longPause = Math.floor(Math.random() * 3000) + 2000; // 2秒到5秒的长停顿
      await new Promise(resolve => setTimeout(resolve, longPause));
    }
  }
};
