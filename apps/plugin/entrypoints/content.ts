import { defineContentScript } from 'wxt/sandbox';

// 定义内容脚本
export default defineContentScript({
  matches: ['http://*/*', 'https://*/*'], // 匹配所有网页
  runAt: 'document_end', // 在 DOM 加载完成后运行
  main() {
    console.log('AI Assistant content script loaded');

    // 添加划词处理
    setupTextSelectionHandler();

    // 创建截图相关的DOM元素 - 但不立即显示
    createScreenshotElements();

    // 监听来自后台的消息
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log('Content script received message:', message);

      if (message.action === 'getSelectedText') {
        // 获取并返回当前选中的文本
        const selectedText = window.getSelection()?.toString() || '';
        sendResponse({ text: selectedText });
      } else if (message.action === 'startAreaScreenshot') {
        // 直接开始扩展区域截图模式，不再显示选择按钮
        console.log('Starting extended area screenshot mode');
        startExtendedAreaScreenshot();
        sendResponse({ success: true });
      }
      return true;
    });

    // 手动注册调试快捷键
    document.addEventListener('keydown', (e) => {
      // Alt+Shift+S: 触发扩展区域截图模式（用于调试）
      if (e.altKey && e.shiftKey && e.key === 'S') {
        console.log('Debug: Manually triggering extended area screenshot');
        startExtendedAreaScreenshot();
      }
    });
  },
});

// 截图相关变量
let isSelecting = false;
let startX = 0;
let startY = 0;
let endX = 0;
let endY = 0;
let selectionBox: HTMLElement | null = null;
let screenshotOverlay: HTMLElement | null = null;
let screenshotControls: HTMLElement | null = null;
// 滚动截图相关变量
let isScrollCapturing = false;
let scrollCaptureCanvas: HTMLCanvasElement | null = null;
let scrollCaptureContext: CanvasRenderingContext2D | null = null;
let scrollCaptureImages: string[] = [];
let currentScrollPosition = 0;
let totalScrollHeight = 0;
let viewportHeight = 0;
let scrollCaptureProgress: HTMLElement | null = null;
// 拖拽截图相关变量
const isDragScrollCapturing = false;
const dragScrollRect: DOMRect | null = null;
const dragScrollControl: HTMLElement | null = null;

// 添加拖拽和滚动相关变量
let isDragging = false;
let mouseStartY = 0;
let mouseCurrentY = 0;
let scrollStartY = 0;
const autoScrollInterval: number | null = null;
let dragScrollStartTime = 0;
let dragScrollDistance = 0;
let dragScrollHandler: HTMLElement | null = null;
let dragScrollImages: Array<{dataUrl: string, scrollY: number, height: number, timestamp: number}> = [];
let dragScrollInitialRect: DOMRect | null = null;
let dragScrollLastCaptureY = 0;
let dragScrollLastCaptureTime = 0;
let dragScrollCapturing = false;

// 添加自动滚动相关变量
let autoScrolling = false;
let autoScrollSpeed = 0;
let autoScrollDirection = 0; // 0: 无滚动, 1: 向下滚动, -1: 向上滚动
let autoScrollIntervalId: number | null = null;
let extendedSelectionStartY = 0; // 拖拽开始时的文档Y坐标
let extendedSelectionEndY = 0; // 拖拽结束时的文档Y坐标
let isExtendedSelecting = false;

// 创建截图相关的DOM元素
function createScreenshotElements() {
  // 创建选区覆盖层
  screenshotOverlay = document.createElement('div');
  screenshotOverlay.id = 'ai-assistant-screenshot-overlay';
  screenshotOverlay.style.position = 'fixed';
  screenshotOverlay.style.top = '0';
  screenshotOverlay.style.left = '0';
  screenshotOverlay.style.width = '100%';
  screenshotOverlay.style.height = '100%';
  screenshotOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
  screenshotOverlay.style.zIndex = '2147483646';
  screenshotOverlay.style.cursor = 'crosshair';
  screenshotOverlay.style.display = 'none';

  // 创建选区框
  selectionBox = document.createElement('div');
  selectionBox.id = 'ai-assistant-selection-box';
  selectionBox.style.position = 'fixed';
  selectionBox.style.border = '2px dashed #6e59f2';
  selectionBox.style.backgroundColor = 'rgba(110, 89, 242, 0.1)';
  selectionBox.style.display = 'none';
  selectionBox.style.zIndex = '2147483647';
  // 添加阴影以增强边缘可见性
  selectionBox.style.boxShadow = '0 0 0 1px rgba(255, 255, 255, 0.3)';

  // 创建滚动捕获进度指示器
  scrollCaptureProgress = document.createElement('div');
  scrollCaptureProgress.id = 'ai-assistant-scroll-progress';
  scrollCaptureProgress.style.position = 'fixed';
  scrollCaptureProgress.style.top = '20px';
  scrollCaptureProgress.style.left = '50%';
  scrollCaptureProgress.style.transform = 'translateX(-50%)';
  scrollCaptureProgress.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  scrollCaptureProgress.style.color = 'white';
  scrollCaptureProgress.style.padding = '12px 20px';
  scrollCaptureProgress.style.borderRadius = '24px';
  scrollCaptureProgress.style.zIndex = '2147483647';
  scrollCaptureProgress.style.display = 'none';
  scrollCaptureProgress.style.fontSize = '14px';
  scrollCaptureProgress.style.fontWeight = 'bold';
  scrollCaptureProgress.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
  scrollCaptureProgress.style.backdropFilter = 'blur(4px)';
  scrollCaptureProgress.style.transition = 'opacity 0.3s ease';
  scrollCaptureProgress.style.display = 'flex';
  scrollCaptureProgress.style.alignItems = 'center';
  scrollCaptureProgress.style.gap = '10px';
  scrollCaptureProgress.style.display = 'none';

  // 添加图标元素
  const progressIcon = document.createElement('span');
  progressIcon.textContent = '📸';
  progressIcon.style.fontSize = '18px';

  // 添加文本容器
  const progressText = document.createElement('div');
  progressText.id = 'ai-assistant-scroll-progress-text';
  progressText.textContent = '正在捕获区域: 0%';

  // 添加到进度指示器
  scrollCaptureProgress.appendChild(progressIcon);
  scrollCaptureProgress.appendChild(progressText);

  document.body.appendChild(scrollCaptureProgress);

  // 创建控制按钮容器 - 虽然不再显示多个按钮，但保留容器用于取消按钮
  screenshotControls = document.createElement('div');
  screenshotControls.id = 'ai-assistant-screenshot-controls';
  screenshotControls.style.position = 'fixed';
  screenshotControls.style.display = 'none';
  screenshotControls.style.zIndex = '2147483647';
  screenshotControls.style.backgroundColor = 'white';
  screenshotControls.style.borderRadius = '4px';
  screenshotControls.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
  screenshotControls.style.padding = '8px';
  screenshotControls.style.display = 'none';
  screenshotControls.style.gap = '8px';

  // 创建"确认"按钮
  const confirmButton = document.createElement('button');
  confirmButton.textContent = '确认';
  confirmButton.style.backgroundColor = '#6e59f2';
  confirmButton.style.color = 'white';
  confirmButton.style.border = 'none';
  confirmButton.style.borderRadius = '4px';
  confirmButton.style.padding = '4px 12px';
  confirmButton.style.fontSize = '12px';
  confirmButton.style.cursor = 'pointer';
  confirmButton.style.marginRight = '8px';
  confirmButton.onclick = confirmAreaScreenshot;

  // 创建"取消"按钮
  const cancelButton = document.createElement('button');
  cancelButton.textContent = '取消';
  cancelButton.style.backgroundColor = '#f0f0f0';
  cancelButton.style.color = '#333';
  cancelButton.style.border = 'none';
  cancelButton.style.borderRadius = '4px';
  cancelButton.style.padding = '4px 12px';
  cancelButton.style.fontSize = '12px';
  cancelButton.style.cursor = 'pointer';
  cancelButton.onclick = cancelAreaScreenshot;

  // 添加按钮到控制容器
  screenshotControls.appendChild(confirmButton);
  screenshotControls.appendChild(cancelButton);

  // 将元素添加到页面
  document.body.appendChild(screenshotOverlay);
  document.body.appendChild(selectionBox);
  document.body.appendChild(screenshotControls);
}

// 开始区域截图 - 现在直接调用扩展区域截图
function startAreaScreenshot() {
  if (!screenshotOverlay || !selectionBox || !screenshotControls) {
    createScreenshotElements();
  }

  // 清理之前的选择框
  if (selectionBox) {
    selectionBox.style.display = 'none';
  }

  if (screenshotControls) {
    screenshotControls.style.display = 'none';
  }

  // 禁用页面文字选择
  document.body.style.userSelect = 'none';
  document.body.style.webkitUserSelect = 'none';
  // 使用类型断言处理其他浏览器前缀
  (document.body.style as any)['msUserSelect'] = 'none';
  (document.body.style as any)['mozUserSelect'] = 'none';

  // 显示覆盖层
  if (screenshotOverlay) {
    screenshotOverlay.style.display = 'block';

    // 添加鼠标事件监听器
    screenshotOverlay.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('keydown', handleKeyDown);

    // 防止滚动
    document.body.style.overflow = 'hidden';
  }
}

// 处理鼠标按下事件
function handleMouseDown(e: MouseEvent) {
  // 阻止默认行为以防止文本被选中
  e.preventDefault();

  // 移除屏幕上的任何Toast提示，避免影响截图
  const toast = document.getElementById('ai-assistant-drag-capture-toast');
  if (toast) {
    toast.remove();
  }

  console.log('选区开始:', e.clientX, e.clientY);
  isSelecting = true;
  startX = e.clientX;
  startY = e.clientY;
  endX = e.clientX;
  endY = e.clientY;

  updateSelectionBox();

  if (selectionBox) {
    selectionBox.style.display = 'block';
  }
}

// 处理鼠标移动事件
function handleMouseMove(e: MouseEvent) {
  if (!isSelecting) return;

  // 阻止默认行为以防止文本被选中
  e.preventDefault();

  // 更新鼠标当前位置（限制在窗口边界内）
  endX = Math.max(0, Math.min(e.clientX, window.innerWidth - 1));
  endY = Math.max(0, Math.min(e.clientY, window.innerHeight - 1));

  updateSelectionBox();
}

// 处理鼠标松开事件
function handleMouseUp(e: MouseEvent) {
  if (!isSelecting) return;

  console.log('选区结束:', endX, endY);
  isSelecting = false;

  // 检查选择框是否有足够大小
  if (selectionBox) {
    const rect = selectionBox.getBoundingClientRect();
    const minSize = 10; // 最小尺寸（像素）

    if (rect.width < minSize || rect.height < minSize) {
      console.log('选择框太小，取消选择');
      // 选择框太小，重置截图
      if (selectionBox) selectionBox.style.display = 'none';
      return;
    }

    console.log('选择框尺寸:', rect.width, 'x', rect.height);
  }

  // 显示控制按钮
  if (screenshotControls && selectionBox) {
    // 在选区下方显示控制按钮
    const selectionRect = selectionBox.getBoundingClientRect();
    screenshotControls.style.top = `${selectionRect.bottom + 10}px`;
    screenshotControls.style.left = `${selectionRect.left}px`;
    screenshotControls.style.display = 'flex';

    // 确保控制按钮在视口内
    const controlsRect = screenshotControls.getBoundingClientRect();

    // 检查底部空间是否足够
    const bottomSpace = window.innerHeight - selectionRect.bottom;
    const topSpace = selectionRect.top;

    // 没有足够的底部空间，也没有足够的顶部空间时，放在视口中心
    if (controlsRect.bottom > window.innerHeight && topSpace < controlsRect.height) {
      // 上下都没有足够空间，放在视口中心
      screenshotControls.style.top = `${Math.max(10, (window.innerHeight - controlsRect.height) / 2)}px`;
      screenshotControls.style.left = `${Math.max(10, (window.innerWidth - controlsRect.width) / 2)}px`;
    } else if (controlsRect.bottom > window.innerHeight) {
      // 底部空间不足，但顶部有空间，放在选区上方
      screenshotControls.style.top = `${selectionRect.top - controlsRect.height - 10}px`;
    }

    if (controlsRect.right > window.innerWidth) {
      screenshotControls.style.left = `${window.innerWidth - controlsRect.width - 10}px`;
    }

    console.log('显示控制按钮:', controlsRect);
  }

  // 移除鼠标移动监听器
  document.removeEventListener('mousemove', handleMouseMove);
  document.removeEventListener('mouseup', handleMouseUp);
}

// 更新选择框位置和大小
function updateSelectionBox() {
  if (!selectionBox) return;

  // 计算框选的左上角坐标和宽高
  const left = Math.min(startX, endX);
  const top = Math.min(startY, endY);
  const width = Math.abs(endX - startX);
  const height = Math.abs(endY - startY);

  // 边框宽度
  const borderWidth = 2;
  // 额外边距，确保在高DPR屏幕上也有足够空间
  const safeMargin = 4;

  // 确保选区不超出视口右边界，保留边框宽度+安全边距
  const adjustedWidth = Math.min(width, window.innerWidth - left - (borderWidth + safeMargin));

  // 更新选区样式
  selectionBox.style.left = `${left}px`;
  selectionBox.style.top = `${top}px`;
  selectionBox.style.width = `${adjustedWidth}px`;
  selectionBox.style.height = `${height}px`;

  // 当接近边缘时更改边框样式以增强可见性
  if (left + adjustedWidth > window.innerWidth - (borderWidth + safeMargin)) {
    selectionBox.style.borderRight = `${borderWidth}px solid rgba(110, 89, 242, 0.9)`;
  } else {
    selectionBox.style.border = `${borderWidth}px dashed #6e59f2`;
  }
}

// 捕获选定区域
function captureSelectedArea() {
  if (!selectionBox) return;

  // 边框宽度和安全边距
  const borderWidth = 2;
  const safeMargin = 4;

  // 获取选区位置和大小，确保不超出边界
  const rect = selectionBox.getBoundingClientRect();
  // 确保宽度不超出视口右边界
  const adjustedWidth = Math.min(rect.width, window.innerWidth - rect.left - (borderWidth + safeMargin));

  // 使用 chrome.tabs.captureVisibleTab 捕获整个可见页面
  chrome.runtime.sendMessage({ action: 'getTabId' }, (response) => {
    if (response && response.tabId) {
      // 获取截图
      chrome.tabs.captureVisibleTab({ format: 'png' }, (dataUrl) => {
        // 裁剪指定区域
        cropImage(dataUrl, rect.left, rect.top, adjustedWidth, rect.height).then((croppedDataUrl) => {
          // 提取文本（实际应用中可使用OCR API）
          const exampleText = '这是一张选定区域的截图。';

          // 发送到侧边栏
          chrome.runtime.sendMessage({
            action: 'openSidePanel'
          }, () => {
            setTimeout(() => {
              chrome.runtime.sendMessage({
                action: 'addScreenshot',
                imageUrl: croppedDataUrl,
                text: exampleText,
                addToInput: false // 默认不添加到输入框
              });
            }, 500);
          });

          // 清理截图界面
          cleanupScreenshotUI();
        });
      });
    } else {
      console.error('无法获取标签页ID');
      cleanupScreenshotUI();
    }
  });
}

// 捕获整个滚动页面
function captureFullPage() {
  // 初始化滚动截图状态
  isScrollCapturing = true;
  scrollCaptureImages = [];

  // 记录页面信息
  totalScrollHeight = Math.max(
    document.body.scrollHeight,
    document.body.offsetHeight,
    document.documentElement.scrollHeight,
    document.documentElement.offsetHeight
  );

  viewportHeight = window.innerHeight;
  currentScrollPosition = window.scrollY;

  // 保存原始滚动位置，以便之后恢复
  const originalScrollPosition = window.scrollY;

  // 初始化Canvas
  scrollCaptureCanvas = document.createElement('canvas');
  const dpr = window.devicePixelRatio || 1;
  scrollCaptureCanvas.width = document.documentElement.clientWidth * dpr;

  // 显示进度指示器
  if (scrollCaptureProgress) {
    scrollCaptureProgress.style.display = 'flex';
    const progressText = document.getElementById('ai-assistant-scroll-progress-text');
    if (progressText) {
      progressText.textContent = '正在捕获滚动页面: 0%';
    }
  }

  // 清理选区UI，只保留进度指示器
  if (screenshotOverlay) {
    screenshotOverlay.style.display = 'none';
  }

  if (selectionBox) {
    selectionBox.style.display = 'none';
  }

  if (screenshotControls) {
    screenshotControls.style.display = 'none';
  }

  // 防止页面滚动期间的用户交互
  const preventInteractionOverlay = document.createElement('div');
  preventInteractionOverlay.id = 'ai-assistant-prevent-interaction';
  preventInteractionOverlay.style.position = 'fixed';
  preventInteractionOverlay.style.top = '0';
  preventInteractionOverlay.style.left = '0';
  preventInteractionOverlay.style.width = '100%';
  preventInteractionOverlay.style.height = '100%';
  preventInteractionOverlay.style.backgroundColor = 'transparent';
  preventInteractionOverlay.style.zIndex = '2147483645';
  preventInteractionOverlay.style.cursor = 'progress';
  document.body.appendChild(preventInteractionOverlay);

  // 开始滚动捕获过程
  requestCaptureAndScroll(originalScrollPosition);
}

// 请求捕获当前可见区域并滚动
function requestCaptureAndScroll(originalScrollPosition: number) {
  // 确保我们仍在捕获模式
  if (!isScrollCapturing) {
    cleanupScrollCapture(originalScrollPosition);
    return;
  }

  // 更新进度显示
  const progress = Math.min(100, Math.round((currentScrollPosition / (totalScrollHeight - viewportHeight)) * 100));
  if (scrollCaptureProgress) {
    const progressText = document.getElementById('ai-assistant-scroll-progress-text');
    if (progressText) {
      progressText.textContent = `正在捕获滚动页面: ${progress}%`;
    }
  }

  // 通过消息请求背景脚本来捕获当前可见区域
  chrome.runtime.sendMessage({ action: 'captureVisibleTabForScroll' }, (response) => {
    if (!response || !response.dataUrl) {
      console.error('无法捕获屏幕:', response?.error || '未知错误');
      cleanupScrollCapture(originalScrollPosition);
      return;
    }

    // 添加到图片数组
    scrollCaptureImages.push(response.dataUrl);

    // 检查是否已经滚动到底部
    if (currentScrollPosition + viewportHeight >= totalScrollHeight - 50 ||
        currentScrollPosition + viewportHeight >= document.body.scrollHeight - 50) {
      // 已完成所有滚动，合并图片
      finishScrollCapture(originalScrollPosition);
      return;
    }

    // 计算下一个滚动位置，每次滚动90%视口高度以确保有重叠
    const nextScrollY = Math.min(currentScrollPosition + viewportHeight * 0.9, totalScrollHeight - viewportHeight);

    // 滚动到下一个位置
    window.scrollTo({
      top: nextScrollY,
      behavior: 'instant' // 使用即时滚动而不是平滑滚动
    });

    // 更新当前滚动位置
    currentScrollPosition = nextScrollY;

    // 等待一段时间让页面稳定再捕获下一屏
    setTimeout(() => requestCaptureAndScroll(originalScrollPosition), 1000);
  });
}

// 完成滚动捕获并合并图片
function finishScrollCapture(originalScrollPosition: number) {
  if (!isScrollCapturing || scrollCaptureImages.length === 0) {
    cleanupScrollCapture(originalScrollPosition);
    return;
  }

  // 更新进度显示
  if (scrollCaptureProgress) {
    const progressText = document.getElementById('ai-assistant-scroll-progress-text');
    if (progressText) {
      progressText.textContent = '正在处理捕获的图像...';
    }
  }

  // 准备合并图像
  const mergeImages = async () => {
    if (!scrollCaptureCanvas) {
      scrollCaptureCanvas = document.createElement('canvas');
    }

    const dpr = window.devicePixelRatio || 1;
    const canvasWidth = document.documentElement.clientWidth * dpr;

    // 创建临时图像对象来获取尺寸
    const loadImagePromises = scrollCaptureImages.map(imgUrl => {
      return new Promise<HTMLImageElement>((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.src = imgUrl;
      });
    });

    try {
      // 等待所有图像加载
      const images = await Promise.all(loadImagePromises);

      // 计算总高度，考虑90%重叠
      const uniqueHeightPerImage = images[0].height * 0.9;
      const totalCanvasHeight = Math.min(
        (images.length - 1) * uniqueHeightPerImage + images[0].height,
        totalScrollHeight * dpr
      );

      // 设置canvas大小
      scrollCaptureCanvas.width = canvasWidth;
      scrollCaptureCanvas.height = totalCanvasHeight;
      scrollCaptureContext = scrollCaptureCanvas.getContext('2d');

      if (!scrollCaptureContext) {
        throw new Error('无法获取Canvas上下文');
      }

      // 绘制每个图像，按顺序偏移
      images.forEach((img, index) => {
        const yOffset = index * uniqueHeightPerImage;
        scrollCaptureContext?.drawImage(img, 0, yOffset);
      });

      // 获取合并后的图像
      const mergedImageUrl = scrollCaptureCanvas.toDataURL('image/png');

      // 发送合并后的图像到侧边栏
      chrome.runtime.sendMessage({
        action: 'openSidePanel'
      }, () => {
        setTimeout(() => {
          chrome.runtime.sendMessage({
            action: 'addScreenshot',
            imageUrl: mergedImageUrl,
            text: '滚动页面截图',
            addToInput: true // 添加到输入框
          });
        }, 500);
      });

    } catch (error) {
      console.error('合并图像失败:', error);
    } finally {
      cleanupScrollCapture(originalScrollPosition);
    }
  };

  // 执行合并
  mergeImages();
}

// 清理滚动捕获资源
function cleanupScrollCapture(originalScrollPosition?: number) {
  isScrollCapturing = false;
  scrollCaptureImages = [];
  scrollCaptureCanvas = null;
  scrollCaptureContext = null;

  // 滚动回原位置
  if (originalScrollPosition !== undefined) {
    window.scrollTo({
      top: originalScrollPosition,
      behavior: 'instant'
    });
  } else {
    window.scrollTo({
      top: 0,
      behavior: 'instant'
    });
  }

  // 隐藏进度指示器
  if (scrollCaptureProgress) {
    scrollCaptureProgress.style.display = 'none';
  }

  // 移除交互阻止层
  const preventInteractionOverlay = document.getElementById('ai-assistant-prevent-interaction');
  if (preventInteractionOverlay) {
    preventInteractionOverlay.remove();
  }

  // 全部清理
  cleanupScreenshotUI();
}

// 取消区域截图
function cancelAreaScreenshot() {
  cleanupScreenshotUI();
}

// 确认区域截图
function confirmAreaScreenshot() {
  // 隐藏控制按钮
  if (screenshotControls) {
    screenshotControls.style.display = 'none';
  }

  // 开始捕获扩展选择区域
  captureExtendedArea();
}

// 清理截图界面 - 修改以确保清理所有事件监听器
function cleanupScreenshotUI() {
  console.log('清理截图界面');

  // 重置状态
  isSelecting = false;
  isExtendedSelecting = false;
  stopAutoScroll();

  if (screenshotOverlay) {
    screenshotOverlay.style.display = 'none';
    screenshotOverlay.removeEventListener('mousedown', handleExtendedMouseDown);
    screenshotOverlay.removeEventListener('mousedown', handleMouseDown);
  }

  if (selectionBox) {
    selectionBox.style.display = 'none';
  }

  if (screenshotControls) {
    screenshotControls.style.display = 'none';
  }

  // 移除所有事件监听器
  document.removeEventListener('mousemove', handleExtendedMouseMove);
  document.removeEventListener('mouseup', handleExtendedMouseUp);
  document.removeEventListener('mousemove', handleMouseMove);
  document.removeEventListener('mouseup', handleMouseUp);
  document.removeEventListener('keydown', handleKeyDown);

  document.body.style.overflow = '';

  // 恢复文本选择功能
  document.body.style.userSelect = '';
  document.body.style.webkitUserSelect = '';
  (document.body.style as any)['msUserSelect'] = '';
  (document.body.style as any)['mozUserSelect'] = '';
}

// 裁剪图像 - 保留用于可能的后续处理
function cropImage(dataUrl: string, left: number, top: number, width: number, height: number): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = function() {
      // 创建画布
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // 设置画布大小为裁剪区域大小
      canvas.width = width;
      canvas.height = height;

      // 获取设备像素比以处理高分辨率屏幕
      const dpr = window.devicePixelRatio || 1;

      // 计算缩放后的坐标和尺寸
      const scaledLeft = left * dpr;
      const scaledTop = top * dpr;
      const scaledWidth = width * dpr;
      const scaledHeight = height * dpr;

      // 裁剪图像
      if (ctx) {
        ctx.drawImage(
          img,
          scaledLeft, scaledTop, scaledWidth, scaledHeight, // 源图像裁剪区域
          0, 0, width, height // 目标画布区域
        );
      }

      // 将裁剪后的图像转换为 data URL
      const croppedDataUrl = canvas.toDataURL('image/png');
      resolve(croppedDataUrl);
    };

    // 设置图像源
    img.src = dataUrl;
  });
}

// 设置文本选择处理器
function setupTextSelectionHandler() {
  // 当文本被选中时，显示浮动工具栏
  document.addEventListener('mouseup', (event) => {
    // 如果正在进行截图，不要显示文本选择工具栏
    if (isSelecting) return;

    // 获取选中的文本
    const selectedText = window.getSelection()?.toString();

    // 如果有选中的文本，显示浮动工具栏
    if (selectedText && selectedText.trim().length > 0) {
      showFloatingToolbar(event.clientX, event.clientY, selectedText);
    } else {
      // 否则，隐藏浮动工具栏
      hideFloatingToolbar();
    }
  });

  // 点击页面时，如果不是浮动工具栏内部，则隐藏工具栏
  document.addEventListener('mousedown', (event) => {
    const toolbar = document.getElementById('ai-assistant-toolbar');
    if (toolbar && !toolbar.contains(event.target as Node)) {
      hideFloatingToolbar();
    }
  });
}

// 显示浮动工具栏
function showFloatingToolbar(x: number, y: number, selectedText: string) {
  // 移除现有的工具栏（如果有）
  hideFloatingToolbar();

  // 创建工具栏容器
  const toolbar = document.createElement('div');
  toolbar.id = 'ai-assistant-toolbar';
  toolbar.style.position = 'fixed';
  toolbar.style.left = `${x}px`;
  toolbar.style.top = `${y + 20}px`; // 在鼠标下方显示
  toolbar.style.zIndex = '2147483647'; // 最高层级
  toolbar.style.backgroundColor = 'white';
  toolbar.style.border = '1px solid #d9d9d9';
  toolbar.style.borderRadius = '4px';
  toolbar.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
  toolbar.style.padding = '6px 8px';
  toolbar.style.display = 'flex';
  toolbar.style.alignItems = 'center';
  toolbar.style.gap = '8px';

  // 添加"发送到AI助手"按钮
  const sendButton = document.createElement('button');
  sendButton.textContent = '发送到AI助手';
  sendButton.style.backgroundColor = '#6e59f2';
  sendButton.style.color = 'white';
  sendButton.style.border = 'none';
  sendButton.style.borderRadius = '4px';
  sendButton.style.padding = '4px 8px';
  sendButton.style.fontSize = '12px';
  sendButton.style.cursor = 'pointer';

  // 点击按钮时，发送选中的文本到AI助手
  sendButton.addEventListener('click', () => {
    // 先向后台发送打开侧边栏的请求
    chrome.runtime.sendMessage({
      action: 'openSidePanel'
    }, () => {
      // 然后发送选中的文本
      setTimeout(() => {
        chrome.runtime.sendMessage({
          action: 'addSelectedText',
          text: selectedText
        });
      }, 500); // 给侧边栏打开留出时间
    });

    // 隐藏工具栏
    hideFloatingToolbar();
  });

  toolbar.appendChild(sendButton);

  // 添加到页面
  document.body.appendChild(toolbar);

  // 确保工具栏完全在视口内
  const rect = toolbar.getBoundingClientRect();
  if (rect.right > window.innerWidth) {
    toolbar.style.left = `${window.innerWidth - rect.width - 10}px`;
  }
  if (rect.bottom > window.innerHeight) {
    toolbar.style.top = `${y - rect.height - 10}px`;
  }
}

// 隐藏浮动工具栏
function hideFloatingToolbar() {
  const toolbar = document.getElementById('ai-assistant-toolbar');
  if (toolbar) {
    toolbar.remove();
  }
}

// 开始用户拖拽滚动截图
function startUserDragScrollCapture() {
  console.log('开始拖拽滚动截图...');
  // 保存选择区域信息
  if (!selectionBox) {
    console.error('无法找到选择框');
    return;
  }

  // 保存初始选择框位置
  dragScrollInitialRect = selectionBox.getBoundingClientRect();
  console.log('选择框位置:', dragScrollInitialRect);

  // 初始化变量
  dragScrollImages = [];
  dragScrollLastCaptureY = window.scrollY;
  dragScrollLastCaptureTime = Date.now();
  dragScrollCapturing = true;

  // 记录初始滚动位置
  scrollStartY = window.scrollY;

  // 清理选区UI，但保留选择框位置指示
  if (screenshotOverlay) {
    screenshotOverlay.style.display = 'none';
  }

  if (screenshotControls) {
    screenshotControls.style.display = 'none';
  }

  // 创建拖拽处理器
  createDragScrollHandler();

  // 允许页面滚动
  document.body.style.overflow = 'auto';

  // 显示提示
  showDragCaptureToast('向下拖动来滚动页面，释放鼠标停止截图');

  // 显示进度指示器
  if (scrollCaptureProgress) {
    scrollCaptureProgress.style.display = 'flex';
    const progressText = document.getElementById('ai-assistant-scroll-progress-text');
    if (progressText) {
      progressText.textContent = '准备开始拖拽截图，请向下拖动...';
    }
  }

  // 添加ESC键盘监听，用于取消截图
  document.addEventListener('keydown', handleKeyDown);

  // 捕获初始屏幕
  captureViewportForDragScroll();
}

// 创建拖拽滚动处理器
function createDragScrollHandler() {
  console.log('创建拖拽处理器...');
  // 清理已有处理器
  const existingHandler = document.getElementById('ai-assistant-drag-scroll-handler');
  if (existingHandler) {
    existingHandler.remove();
  }

  // 创建新处理器 - 一个覆盖整个屏幕的透明层
  dragScrollHandler = document.createElement('div');
  dragScrollHandler.id = 'ai-assistant-drag-scroll-handler';
  dragScrollHandler.style.position = 'fixed';
  dragScrollHandler.style.top = '0';
  dragScrollHandler.style.left = '0';
  dragScrollHandler.style.width = '100%';
  dragScrollHandler.style.height = '100%';
  dragScrollHandler.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
  dragScrollHandler.style.zIndex = '2147483647';
  dragScrollHandler.style.cursor = 'grab';

  // 添加状态指示器
  const statusIndicator = document.createElement('div');
  statusIndicator.id = 'ai-assistant-drag-status';
  statusIndicator.style.position = 'fixed';
  statusIndicator.style.bottom = '20px';
  statusIndicator.style.right = '20px';
  statusIndicator.style.backgroundColor = 'rgba(33, 150, 243, 0.8)';
  statusIndicator.style.color = 'white';
  statusIndicator.style.padding = '8px 16px';
  statusIndicator.style.borderRadius = '20px';
  statusIndicator.style.fontSize = '14px';
  statusIndicator.style.fontWeight = 'bold';
  statusIndicator.textContent = '✋ 按住并拖动';
  dragScrollHandler.appendChild(statusIndicator);

  // 添加完成按钮
  const finishButton = document.createElement('button');
  finishButton.id = 'ai-assistant-drag-finish';
  finishButton.style.position = 'fixed';
  finishButton.style.bottom = '20px';
  finishButton.style.left = '20px';
  finishButton.style.backgroundColor = '#4CAF50';
  finishButton.style.color = 'white';
  finishButton.style.border = 'none';
  finishButton.style.borderRadius = '4px';
  finishButton.style.padding = '8px 16px';
  finishButton.style.fontSize = '14px';
  finishButton.style.cursor = 'pointer';
  finishButton.style.fontWeight = 'bold';
  finishButton.textContent = '完成截图';
  finishButton.onclick = finishUserDragScrollCapture;
  dragScrollHandler.appendChild(finishButton);

  // 添加取消按钮
  const cancelButton = document.createElement('button');
  cancelButton.id = 'ai-assistant-drag-cancel';
  cancelButton.style.position = 'fixed';
  cancelButton.style.bottom = '20px';
  cancelButton.style.left = '120px'; // 放在完成按钮旁边
  cancelButton.style.backgroundColor = '#F44336';
  cancelButton.style.color = 'white';
  cancelButton.style.border = 'none';
  cancelButton.style.borderRadius = '4px';
  cancelButton.style.padding = '8px 16px';
  cancelButton.style.fontSize = '14px';
  cancelButton.style.cursor = 'pointer';
  cancelButton.style.fontWeight = 'bold';
  cancelButton.textContent = '取消截图';
  cancelButton.onclick = cleanupUserDragScrollCapture;
  dragScrollHandler.appendChild(cancelButton);

  // 添加提示文本
  const hintText = document.createElement('div');
  hintText.id = 'ai-assistant-drag-hint';
  hintText.style.position = 'fixed';
  hintText.style.top = '20px';
  hintText.style.left = '50%';
  hintText.style.transform = 'translateX(-50%)';
  hintText.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  hintText.style.color = 'white';
  hintText.style.padding = '8px 16px';
  hintText.style.borderRadius = '20px';
  hintText.style.fontSize = '14px';
  hintText.style.fontWeight = 'bold';
  hintText.textContent = '按住鼠标并拖动，按ESC退出截图';
  dragScrollHandler.appendChild(hintText);

  console.log('设置拖拽事件监听...');
  // 直接在处理器上添加相应的事件，绕过事件冒泡问题
  dragScrollHandler.onmousedown = handleDragScrollStart;
  dragScrollHandler.ontouchstart = handleDragScrollTouchStart;

  // 添加到页面
  document.body.appendChild(dragScrollHandler);
  console.log('拖拽处理器已添加到页面');
}

// 处理拖拽开始 - 鼠标
function handleDragScrollStart(e: MouseEvent) {
  // 防止文本选择
  e.preventDefault();

  // 移除屏幕上的任何Toast提示，避免影响截图
  const toast = document.getElementById('ai-assistant-drag-capture-toast');
  if (toast) {
    toast.remove();
  }

  console.log('开始拖拽滚动', e.clientX, e.clientY);
  isDragging = true;
  mouseStartY = e.clientY;
  mouseCurrentY = e.clientY;
  scrollStartY = window.scrollY;
  dragScrollStartTime = Date.now();

  // 显示提示
  showDragCaptureToast('向下拖动来滚动页面，释放鼠标停止截图');

  // 设置进度指示器
  if (scrollCaptureProgress) {
    scrollCaptureProgress.style.display = 'flex';
    const progressText = document.getElementById('ai-assistant-scroll-progress-text');
    if (progressText) {
      progressText.textContent = '拖拽滚动截图中...';
    }
  }

  // 设置状态
  dragScrollCapturing = true;
  dragScrollDistance = 0;
  dragScrollLastCaptureY = window.scrollY;
  dragScrollLastCaptureTime = Date.now();
  dragScrollImages = [];

  // 存储初始选框位置
  if (selectionBox) {
    dragScrollInitialRect = selectionBox.getBoundingClientRect();
  }

  // 添加事件监听
  document.addEventListener('mousemove', handleDragScrollMove);
  document.addEventListener('mouseup', handleDragScrollEnd);
}

// 处理拖拽开始 - 触摸
function handleDragScrollTouchStart(e: TouchEvent) {
  if (!dragScrollCapturing || !e.touches[0]) return;

  // 防止默认行为和冒泡
  e.preventDefault();
  e.stopPropagation();

  // 移除屏幕上的任何Toast提示，避免影响截图
  const toast = document.getElementById('ai-assistant-drag-capture-toast');
  if (toast) {
    toast.remove();
  }

  // 记录开始位置
  isDragging = true;
  mouseStartY = e.touches[0].clientY;
  mouseCurrentY = e.touches[0].clientY;
  scrollStartY = window.scrollY;
  dragScrollStartTime = Date.now();
  dragScrollDistance = 0;

  // 更新状态指示器
  const statusIndicator = document.getElementById('ai-assistant-drag-status');
  if (statusIndicator) {
    statusIndicator.textContent = '正在拖拽...';
  }

  // 添加触摸移动和结束事件
  document.addEventListener('touchmove', handleDragScrollTouchMove);
  document.addEventListener('touchend', handleDragScrollTouchEnd);
}

// 处理拖拽移动 - 鼠标
function handleDragScrollMove(e: MouseEvent) {
  if (!isDragging || !dragScrollCapturing) return;

  // 防止默认行为和冒泡
  e.preventDefault();
  e.stopPropagation();

  // 更新当前位置
  mouseCurrentY = e.clientY;

  // 计算拖拽距离和方向
  const deltaY = mouseStartY - mouseCurrentY;

  // 加入灵敏度调整，让滚动更平滑
  const sensitivity = 1.2;
  const adjustedDeltaY = deltaY * sensitivity;

  // 如果拖拽距离足够大，执行滚动
  if (Math.abs(deltaY) > 2) { // 降低阈值，提高灵敏度
    // 计算新滚动位置
    const newScrollY = window.scrollY + adjustedDeltaY;

    // 限制滚动范围，确保不会滚动到页面之外
    const maxScrollY = Math.max(
      document.body.scrollHeight,
      document.documentElement.scrollHeight
    ) - window.innerHeight;

    const boundedScrollY = Math.max(0, Math.min(newScrollY, maxScrollY));

    // 滚动到新位置
    window.scrollTo({
      top: boundedScrollY,
      behavior: 'auto'
    });

    // 累计拖拽距离
    dragScrollDistance += Math.abs(adjustedDeltaY);

    // 重置鼠标开始位置，以便连续滚动
    mouseStartY = mouseCurrentY;

    // 更新进度显示
    updateDragScrollProgress();

    // 检查是否需要捕获新的屏幕
    checkCaptureViewport();
  }
}

// 处理拖拽移动 - 触摸
function handleDragScrollTouchMove(e: TouchEvent) {
  if (!isDragging || !dragScrollCapturing || !e.touches[0]) return;

  // 防止默认行为和冒泡
  e.preventDefault();
  e.stopPropagation();

  // 更新当前位置
  mouseCurrentY = e.touches[0].clientY;

  // 计算拖拽距离和方向
  const deltaY = mouseStartY - mouseCurrentY;

  // 计算滚动速度 - 根据拖拽距离动态调整
  const speed = Math.abs(deltaY) * 1.5;

  // 如果拖拽距离足够大，执行滚动
  if (Math.abs(deltaY) > 5) {
    // 计算新滚动位置
    const newScrollY = window.scrollY + deltaY;

    // 滚动到新位置
    window.scrollTo({
      top: newScrollY,
      behavior: 'auto'
    });

    // 累计拖拽距离
    dragScrollDistance += Math.abs(deltaY);

    // 重置鼠标开始位置，以便连续滚动
    mouseStartY = mouseCurrentY;

    // 更新进度显示
    updateDragScrollProgress();

    // 检查是否需要捕获新的屏幕
    checkCaptureViewport();
  }
}

// 处理拖拽结束 - 鼠标
function handleDragScrollEnd(e: MouseEvent) {
  if (!isDragging || !dragScrollCapturing) return;

  // 防止默认行为和冒泡
  e.preventDefault();
  e.stopPropagation();

  // 重置拖拽状态
  isDragging = false;

  // 更改鼠标样式
  if (dragScrollHandler) {
    dragScrollHandler.style.cursor = 'grab';

    // 更新状态指示器
    const statusIndicator = document.getElementById('ai-assistant-drag-status');
    if (statusIndicator) {
      statusIndicator.textContent = '✋ 按住并拖动';
    }
  }

  // 移除事件监听
  document.removeEventListener('mousemove', handleDragScrollMove);
  document.removeEventListener('mouseup', handleDragScrollEnd);

  // 如果拖拽距离足够大，捕获最后一屏
  if (dragScrollDistance > 20) {
    captureViewportForDragScroll();
  }
}

// 处理拖拽结束 - 触摸
function handleDragScrollTouchEnd(e: TouchEvent) {
  if (!isDragging || !dragScrollCapturing) return;

  // 防止默认行为和冒泡
  e.preventDefault();
  e.stopPropagation();

  // 重置拖拽状态
  isDragging = false;

  // 更新状态指示器
  const statusIndicator = document.getElementById('ai-assistant-drag-status');
  if (statusIndicator) {
    statusIndicator.textContent = '按住并拖动';
  }

  // 移除事件监听
  document.removeEventListener('touchmove', handleDragScrollTouchMove);
  document.removeEventListener('touchend', handleDragScrollTouchEnd);

  // 如果拖拽距离足够大，捕获最后一屏
  if (dragScrollDistance > 20) {
    captureViewportForDragScroll();
  }
}

// 更新拖拽滚动进度
function updateDragScrollProgress() {
  if (!scrollCaptureProgress) return;

  // 计算总滚动高度和当前位置
  const totalHeight = Math.max(
    document.body.scrollHeight,
    document.documentElement.scrollHeight
  ) - window.innerHeight;

  const currentProgress = Math.min(100, Math.round((window.scrollY / totalHeight) * 100));

  // 更新进度文本
  const progressText = document.getElementById('ai-assistant-scroll-progress-text');
  if (progressText) {
    progressText.textContent = `正在拖拽截图: ${currentProgress}%`;
  }
}

// 检查是否需要捕获当前视图
function checkCaptureViewport() {
  // 计算自上次捕获以来的滚动距离
  const scrollDelta = Math.abs(window.scrollY - dragScrollLastCaptureY);

  // 检查距离上次捕获的时间
  const timeDelta = Date.now() - dragScrollLastCaptureTime;

  // 根据页面高度动态调整捕获频率
  const captureThreshold = window.innerHeight * 0.3; // 降低到30%的视口高度
  const timeThreshold = 200; // 降低到200ms

  // 如果滚动距离超过屏幕高度的30%或时间超过200ms，捕获当前视图
  if (scrollDelta > captureThreshold || timeDelta > timeThreshold) {
    console.log(`触发截图 - 滚动: ${scrollDelta}px, 时间: ${timeDelta}ms`);
    captureViewportForDragScroll();
  }
}

// 捕获当前视图用于拖拽滚动
function captureViewportForDragScroll() {
  console.log('捕获当前视图，滚动位置:', window.scrollY);
  // 更新最后捕获位置和时间
  dragScrollLastCaptureY = window.scrollY;
  dragScrollLastCaptureTime = Date.now();

  // 通过消息请求背景脚本来捕获当前可见区域
  chrome.runtime.sendMessage({ action: 'captureVisibleTabForScroll' }, (response) => {
    if (!response || !response.dataUrl) {
      console.error('无法捕获屏幕:', response?.error || '未知错误');
      return;
    }

    console.log('成功捕获当前屏幕');
    // 添加到图片数组
    dragScrollImages.push({
      dataUrl: response.dataUrl,
      scrollY: window.scrollY,
      height: window.innerHeight,
      timestamp: Date.now()
    });

    // 更新进度显示中添加已捕获数量
    updateDragScrollProgress();
  });
}

// 完成用户拖拽滚动截图
function finishUserDragScrollCapture() {
  console.log('完成拖拽截图，共捕获', dragScrollImages.length, '张图片');

  if (!dragScrollCapturing || dragScrollImages.length === 0) {
    console.warn('没有捕获任何图片，清理资源');
    cleanupUserDragScrollCapture();
    return;
  }

  // 更新进度显示
  if (scrollCaptureProgress) {
    scrollCaptureProgress.style.display = 'flex';
    const progressText = document.getElementById('ai-assistant-scroll-progress-text');
    if (progressText) {
      progressText.textContent = '正在处理拖拽截图...';
    }
  }

  // 捕获最后一屏
  chrome.runtime.sendMessage({ action: 'captureVisibleTabForScroll' }, async (response) => {
    if (response && response.dataUrl) {
      // 添加最后一屏
      console.log('添加最后一屏，位置:', window.scrollY);
      dragScrollImages.push({
        dataUrl: response.dataUrl,
        scrollY: window.scrollY,
        height: window.innerHeight,
        timestamp: Date.now()
      });
    }

    try {
      // 在处理之前先显示加载提示
      showDragCaptureToast('正在处理截图，请稍候...');

      // 按滚动位置排序图片
      dragScrollImages.sort((a, b) => a.scrollY - b.scrollY);
      console.log('排序后的图片:', dragScrollImages.map(img => img.scrollY));

      // 如果没有初始选择框，使用全屏
      if (!dragScrollInitialRect) {
        console.log('使用全屏模式');
        // 获取第一张和最后一张图片的数据，构建完整截图
        const result = await processFullPageDragCapture(dragScrollImages);
        sendDragScrollResult(result);
      } else {
        console.log('使用选择框模式，尺寸:', dragScrollInitialRect.width, 'x', dragScrollInitialRect.height);
        // 使用初始选择框位置
        const result = await processSelectedAreaDragCapture(dragScrollImages, dragScrollInitialRect);
        sendDragScrollResult(result);
      }
    } catch (error) {
      console.error('处理拖拽截图失败:', error);
      showDragCaptureToast('处理拖拽截图失败，请重试');
      cleanupUserDragScrollCapture();
    }
  });
}

// 处理全页面拖拽截图
async function processFullPageDragCapture(images: Array<{dataUrl: string, scrollY: number, height: number, timestamp: number}>): Promise<string> {
  console.log('开始处理全页面拖拽截图');
  return new Promise((resolve, reject) => {
    try {
      // 创建临时Canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('无法创建Canvas上下文');
      }

      // 显示加载提示
      showDragCaptureToast('正在合成图片...');

      // 加载所有图像
      Promise.all(images.map(img => {
        return new Promise<HTMLImageElement>((resolveImg) => {
          const image = new Image();
          image.onload = () => resolveImg(image);
          image.onerror = (err) => {
            console.error('图片加载失败:', err);
            resolveImg(new Image()); // 返回空图片避免中断
          };
          image.src = img.dataUrl;
        });
      })).then(loadedImages => {
        console.log('所有图片加载完成');

        // 过滤掉无效的图片
        const validImagePairs = loadedImages
          .map((img, index) => ({ img, data: images[index] }))
          .filter(pair => pair.img.width > 0 && pair.img.height > 0);

        if (validImagePairs.length === 0) {
          throw new Error('没有有效的图片可以处理');
        }

        // 边框宽度和安全边距
        const borderWidth = 2;
        const safeMargin = 4;

        // 确定canvas宽度 - 使用第一张图片的宽度，但确保不超过视口宽度减去安全边距
        const width = Math.min(validImagePairs[0].img.width, window.innerWidth - safeMargin);

        // 计算高度 - 使用最后一张图片的底部减去第一张图片的顶部
        const firstImageScrollY = validImagePairs[0].data.scrollY;
        const lastImageScrollY = validImagePairs[validImagePairs.length - 1].data.scrollY;
        const lastImageHeight = validImagePairs[validImagePairs.length - 1].data.height;
        const totalHeight = (lastImageScrollY - firstImageScrollY) + lastImageHeight;

        console.log('Canvas尺寸:', width, 'x', totalHeight);

        // 设置canvas大小
        canvas.width = width;
        canvas.height = totalHeight;

        // 使用纯色背景填充canvas
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 绘制每个图像到对应位置
        validImagePairs.forEach((pair, index) => {
          const { img, data } = pair;
          const y = data.scrollY - firstImageScrollY;
          console.log(`绘制图片 ${index}，位置: ${y}`);

          // 确保绘制的图像宽度不超过canvas宽度
          const drawWidth = Math.min(img.width, width);
          ctx.drawImage(img, 0, 0, drawWidth, img.height, 0, y, drawWidth, img.height);
        });

        // 返回合并后的图像
        const mergedImageUrl = canvas.toDataURL('image/png');
        console.log('图片合成完成');
        resolve(mergedImageUrl);
      }).catch(err => {
        console.error('处理图片时出错:', err);
        reject(err);
      });
    } catch (error) {
      console.error('处理全页面拖拽截图失败:', error);
      reject(error);
    }
  });
}

// 处理选定区域拖拽截图
async function processSelectedAreaDragCapture(images: Array<{dataUrl: string, scrollY: number, height: number, timestamp: number}>, initialRect: DOMRect): Promise<string> {
  console.log('开始处理选定区域拖拽截图');
  return new Promise((resolve, reject) => {
    try {
      // 创建临时Canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('无法创建Canvas上下文');
      }

      // 加载所有图像
      Promise.all(images.map(img => {
        return new Promise<HTMLImageElement>((resolveImg) => {
          const image = new Image();
          image.onload = () => resolveImg(image);
          image.onerror = (err) => {
            console.error('图片加载失败:', err);
            resolveImg(new Image()); // 返回空图片避免中断
          };
          image.src = img.dataUrl;
        });
      })).then(loadedImages => {
        // 过滤掉无效的图片
        const validImagePairs = loadedImages
          .map((img, index) => ({ img, data: images[index] }))
          .filter(pair => pair.img.width > 0 && pair.img.height > 0);

        if (validImagePairs.length === 0) {
          throw new Error('没有有效的图片可以处理');
        }

        // 边框宽度和安全边距
        const borderWidth = 2;
        const safeMargin = 4;

        // 确保选区宽度不超出视口边界
        const width = Math.min(initialRect.width, window.innerWidth - initialRect.left - (borderWidth + safeMargin));

        // 计算高度 - 使用最后一张图片的底部减去第一张图片的顶部
        const firstImageScrollY = validImagePairs[0].data.scrollY;
        const lastImageScrollY = validImagePairs[validImagePairs.length - 1].data.scrollY;
        const lastImageHeight = validImagePairs[validImagePairs.length - 1].data.height;
        const totalHeight = (lastImageScrollY - firstImageScrollY) + lastImageHeight;

        console.log('Canvas尺寸:', width, 'x', totalHeight, '选区位置:', initialRect.left);

        // 设置canvas大小
        canvas.width = width;
        canvas.height = totalHeight;

        // 使用纯色背景填充canvas
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 获取设备像素比以处理高分辨率屏幕
        const dpr = window.devicePixelRatio || 1;

        // 绘制每个图像的选定区域到对应位置
        validImagePairs.forEach((pair, index) => {
          const { img, data } = pair;
          const y = data.scrollY - firstImageScrollY;

          // 计算截图位置
          const sourceX = initialRect.left * dpr;
          const sourceWidth = width * dpr;

          // 将图像对应区域绘制到canvas上
          try {
            ctx.drawImage(
              img,
              sourceX, 0, sourceWidth, img.height,
              0, y, width, img.height
            );
            console.log(`绘制图片 ${index}，位置: ${y}, 源位置: ${sourceX}`);
          } catch (err) {
            console.error('绘制图片出错:', err, '图片尺寸:', img.width, 'x', img.height);
          }
        });

        // 返回合并后的图像
        const mergedImageUrl = canvas.toDataURL('image/png');
        console.log('图片合成完成');
        resolve(mergedImageUrl);
      }).catch(reject);
    } catch (error) {
      console.error('处理选定区域拖拽截图失败:', error);
      reject(error);
    }
  });
}

// 发送拖拽滚动结果
function sendDragScrollResult(imageUrl: string) {
  console.log('发送截图结果到侧边栏');

  // 显示成功提示
  showDragCaptureToast('截图已完成');

  // 打开侧边栏
  chrome.runtime.sendMessage({
    action: 'openSidePanel'
  }, () => {
    setTimeout(() => {
      chrome.runtime.sendMessage({
        action: 'addScreenshot',
        imageUrl: imageUrl,
        text: '拖拽滚动截图',
        addToInput: true
      }, (response) => {
        console.log('截图发送结果:', response);
      });
    }, 500);
  });

  // 清理
  cleanupUserDragScrollCapture();
}

// 清理用户拖拽滚动资源
function cleanupUserDragScrollCapture() {
  console.log('清理拖拽截图资源...');
  // 重置状态
  dragScrollCapturing = false;
  dragScrollImages = [];
  dragScrollInitialRect = null;
  isDragging = false;

  // 移除事件监听
  document.removeEventListener('mousemove', handleDragScrollMove);
  document.removeEventListener('mouseup', handleDragScrollEnd);
  document.removeEventListener('touchmove', handleDragScrollTouchMove);
  document.removeEventListener('touchend', handleDragScrollTouchEnd);
  document.removeEventListener('keydown', handleKeyDown);

  // 移除拖拽处理器
  if (dragScrollHandler) {
    dragScrollHandler.remove();
    dragScrollHandler = null;
  }

  // 隐藏进度指示器
  if (scrollCaptureProgress) {
    scrollCaptureProgress.style.display = 'none';
  }

  // 移除提示
  const toast = document.getElementById('ai-assistant-drag-capture-toast');
  if (toast) {
    toast.remove();
  }

  // 清理UI
  cleanupScreenshotUI();
}

// 显示拖拽截图提示
function showDragCaptureToast(message: string) {
  // 清理已有提示
  const existingToast = document.getElementById('ai-assistant-drag-capture-toast');
  if (existingToast) {
    existingToast.remove();
  }

  // 创建新提示
  const toast = document.createElement('div');
  toast.id = 'ai-assistant-drag-capture-toast';
  toast.style.position = 'fixed';
  toast.style.top = '20px';
  toast.style.left = '50%';
  toast.style.transform = 'translateX(-50%)';
  toast.style.backgroundColor = 'rgba(33, 150, 243, 0.9)';
  toast.style.color = 'white';
  toast.style.padding = '12px 20px';
  toast.style.borderRadius = '8px';
  toast.style.zIndex = '2147483646';
  toast.style.fontSize = '14px';
  toast.style.fontWeight = 'bold';
  toast.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
  toast.style.textAlign = 'center';
  toast.style.maxWidth = '80%';
  toast.textContent = message;

  // 添加到页面
  document.body.appendChild(toast);

  // 3秒后自动消失
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.5s ease';
    setTimeout(() => toast.remove(), 500);
  }, 3000);
}

// 开始扩展区域截图
function startExtendedAreaScreenshot() {
  if (!screenshotOverlay || !selectionBox || !screenshotControls) {
    createScreenshotElements();
  }

  // 清理之前的选择框
  if (selectionBox) {
    selectionBox.style.display = 'none';
  }

  if (screenshotControls) {
    screenshotControls.style.display = 'none';
  }

  // 禁用页面文字选择
  document.body.style.userSelect = 'none';
  document.body.style.webkitUserSelect = 'none';
  // 使用类型断言处理其他浏览器前缀
  (document.body.style as any)['msUserSelect'] = 'none';
  (document.body.style as any)['mozUserSelect'] = 'none';

  // 显示覆盖层
  if (screenshotOverlay) {
    screenshotOverlay.style.display = 'block';

    // 设置变量
    isExtendedSelecting = true;
    extendedSelectionStartY = 0;
    extendedSelectionEndY = 0;

    // 添加鼠标事件监听器
    screenshotOverlay.addEventListener('mousedown', handleExtendedMouseDown);
    document.addEventListener('keydown', handleKeyDown);

    // 防止滚动
    document.body.style.overflow = 'auto';

    // 显示提示
    showDragCaptureToast('拖拽选择区域，可超出视口边界自动滚动');
  }
}

// 处理扩展鼠标按下事件
function handleExtendedMouseDown(e: MouseEvent) {
  // 阻止默认行为以防止文本被选中
  e.preventDefault();

  // 移除屏幕上的任何Toast提示，避免影响截图
  const toast = document.getElementById('ai-assistant-drag-capture-toast');
  if (toast) {
    toast.remove();
  }

  console.log('扩展选区开始:', e.clientX, e.clientY);
  isExtendedSelecting = true;
  startX = e.clientX;
  startY = e.clientY;
  endX = e.clientX;
  endY = e.clientY;

  // 记录文档坐标（考虑滚动位置）
  extendedSelectionStartY = e.clientY + window.scrollY;
  extendedSelectionEndY = e.clientY + window.scrollY;

  updateSelectionBox();

  if (selectionBox) {
    selectionBox.style.display = 'block';
  }

  // 添加鼠标移动和释放事件
  document.addEventListener('mousemove', handleExtendedMouseMove);
  document.addEventListener('mouseup', handleExtendedMouseUp);
}

// 处理扩展鼠标移动事件
function handleExtendedMouseMove(e: MouseEvent) {
  if (!isExtendedSelecting) return;

  // 阻止默认行为以防止文本被选中
  e.preventDefault();

  // 更新鼠标当前位置（限制在窗口边界内）
  endX = Math.max(0, Math.min(e.clientX, window.innerWidth - 1));
  endY = Math.max(0, Math.min(e.clientY, window.innerHeight - 1));
  extendedSelectionEndY = endY + window.scrollY;

  // 检查是否需要自动滚动
  checkAutoScroll(e);

  // 更新选择框
  updateExtendedSelectionBox();
}

// 检查并处理自动滚动
function checkAutoScroll(e: MouseEvent) {
  const scrollThreshold = 50; // 距离视口边缘多少像素触发滚动
  const maxScrollSpeed = 20; // 最大滚动速度

  // 计算鼠标距离视口边缘的距离
  const distanceFromTop = e.clientY;
  const distanceFromBottom = window.innerHeight - e.clientY;

  // 根据距离计算滚动速度和方向
  if (distanceFromTop < scrollThreshold) {
    // 鼠标接近顶部边缘，向上滚动
    autoScrollDirection = -1;
    autoScrollSpeed = Math.min(maxScrollSpeed, (scrollThreshold - distanceFromTop) / 2);
    startAutoScroll();
  } else if (distanceFromBottom < scrollThreshold) {
    // 鼠标接近底部边缘，向下滚动
    autoScrollDirection = 1;
    autoScrollSpeed = Math.min(maxScrollSpeed, (scrollThreshold - distanceFromBottom) / 2);
    startAutoScroll();
  } else {
    // 不在边缘区域，停止自动滚动
    stopAutoScroll();
  }
}

// 开始自动滚动
function startAutoScroll() {
  if (autoScrolling) return; // 已经在滚动中

  autoScrolling = true;
  // 清除可能存在的旧定时器
  if (autoScrollIntervalId !== null) {
    clearInterval(autoScrollIntervalId);
  }

  // 创建新的滚动定时器
  autoScrollIntervalId = window.setInterval(() => {
    // 计算新的滚动位置
    const scrollAmount = autoScrollSpeed * autoScrollDirection;
    window.scrollBy(0, scrollAmount);

    // 更新结束位置以反映新的滚动位置
    extendedSelectionEndY += scrollAmount;

    // 更新选择框
    updateExtendedSelectionBox();
  }, 16); // 约60fps
}

// 停止自动滚动
function stopAutoScroll() {
  if (!autoScrolling) return;

  autoScrolling = false;
  if (autoScrollIntervalId !== null) {
    clearInterval(autoScrollIntervalId);
    autoScrollIntervalId = null;
  }
}

// 更新扩展选择框位置和大小
function updateExtendedSelectionBox() {
  if (!selectionBox) return;

  // 计算视口内的坐标
  const viewportStartY = extendedSelectionStartY - window.scrollY;
  const viewportEndY = extendedSelectionEndY - window.scrollY;

  // 计算选择框位置（取可见部分）
  const left = Math.min(startX, endX);
  const top = Math.min(viewportStartY, viewportEndY);
  const width = Math.abs(endX - startX);
  const height = Math.abs(viewportEndY - viewportStartY);

  // 边框宽度
  const borderWidth = 2;
  // 额外边距，确保在高DPR屏幕上也有足够空间
  const safeMargin = 4;

  // 确保选区不超出视口右边界，保留边框宽度+安全边距
  const adjustedWidth = Math.min(width, window.innerWidth - left - (borderWidth + safeMargin));

  // 更新选择框样式
  selectionBox.style.left = `${left}px`;
  selectionBox.style.top = `${top}px`;
  selectionBox.style.width = `${adjustedWidth}px`;
  selectionBox.style.height = `${height}px`;

  // 当接近边缘时更改边框样式以增强可见性
  if (left + adjustedWidth > window.innerWidth - (borderWidth + safeMargin)) {
    selectionBox.style.borderRight = `${borderWidth}px solid rgba(110, 89, 242, 0.9)`;
  } else {
    selectionBox.style.border = `${borderWidth}px dashed #6e59f2`;
  }
}

// 处理扩展鼠标释放事件
function handleExtendedMouseUp(e: MouseEvent) {
  if (!isExtendedSelecting) return;

  console.log('扩展选区结束:', endX, endY);
  isExtendedSelecting = false;

  // 停止自动滚动
  stopAutoScroll();

  // 检查选择框是否有足够大小
  const minSize = 10; // 最小尺寸（像素）
  const width = Math.abs(endX - startX);
  const height = Math.abs(extendedSelectionEndY - extendedSelectionStartY);

  if (width < minSize || height < minSize) {
    console.log('选择框太小，取消选择');
    // 选择框太小，重置截图
    if (selectionBox) selectionBox.style.display = 'none';
    cleanupExtendedScreenshot();
    return;
  }

  console.log('扩展选择框尺寸:', width, 'x', height);
  console.log('文档坐标范围:', extendedSelectionStartY, 'to', extendedSelectionEndY);

  // 显示控制按钮，而不是直接开始捕获
  if (screenshotControls && selectionBox) {
    // 在选区下方显示控制按钮
    const selectionRect = selectionBox.getBoundingClientRect();
    screenshotControls.style.top = `${selectionRect.bottom + 10}px`;
    screenshotControls.style.left = `${selectionRect.left}px`;
    screenshotControls.style.display = 'flex';

    // 确保控制按钮在视口内
    const controlsRect = screenshotControls.getBoundingClientRect();

    // 检查底部空间是否足够
    const bottomSpace = window.innerHeight - selectionRect.bottom;
    const topSpace = selectionRect.top;

    // 没有足够的底部空间，也没有足够的顶部空间时，放在视口中心
    if (controlsRect.bottom > window.innerHeight && topSpace < controlsRect.height) {
      // 上下都没有足够空间，放在视口中心
      screenshotControls.style.top = `${Math.max(10, (window.innerHeight - controlsRect.height) / 2)}px`;
      screenshotControls.style.left = `${Math.max(10, (window.innerWidth - controlsRect.width) / 2)}px`;
    } else if (controlsRect.bottom > window.innerHeight) {
      // 底部空间不足，但顶部有空间，放在选区上方
      screenshotControls.style.top = `${selectionRect.top - controlsRect.height - 10}px`;
    }

    if (controlsRect.right > window.innerWidth) {
      screenshotControls.style.left = `${window.innerWidth - controlsRect.width - 10}px`;
    }
  }

  // 移除事件监听器
  document.removeEventListener('mousemove', handleExtendedMouseMove);
  document.removeEventListener('mouseup', handleExtendedMouseUp);
}

// 捕获扩展选择区域
function captureExtendedArea() {
  // 显示进度指示器
  if (scrollCaptureProgress) {
    scrollCaptureProgress.style.display = 'flex';
    const progressText = document.getElementById('ai-assistant-scroll-progress-text');
    if (progressText) {
      progressText.textContent = '正在捕获扩展区域...';
    }
  }

  // 防止用户交互
  const preventInteractionOverlay = document.createElement('div');
  preventInteractionOverlay.id = 'ai-assistant-prevent-interaction';
  preventInteractionOverlay.style.position = 'fixed';
  preventInteractionOverlay.style.top = '0';
  preventInteractionOverlay.style.left = '0';
  preventInteractionOverlay.style.width = '100%';
  preventInteractionOverlay.style.height = '100%';
  preventInteractionOverlay.style.backgroundColor = 'transparent';
  preventInteractionOverlay.style.zIndex = '2147483645';
  preventInteractionOverlay.style.cursor = 'progress';
  document.body.appendChild(preventInteractionOverlay);

  // 准备捕获参数
  const width = Math.abs(endX - startX);
  const height = Math.abs(extendedSelectionEndY - extendedSelectionStartY);
  const startScrollY = Math.min(extendedSelectionStartY, extendedSelectionEndY);
  const endScrollY = Math.max(extendedSelectionStartY, extendedSelectionEndY);
  const left = Math.min(startX, endX);

  // 边框宽度和安全边距
  const borderWidth = 2;
  const safeMargin = 4;

  // 确保宽度不超出视口右边界
  const adjustedWidth = Math.min(width, window.innerWidth - left - (borderWidth + safeMargin));

  // 创建画布
  const canvas = document.createElement('canvas');
  const dpr = window.devicePixelRatio || 1;
  canvas.width = adjustedWidth * dpr;
  canvas.height = height * dpr;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    console.error('无法创建Canvas上下文');
    cleanupExtendedScreenshot();
    return;
  }

  // 使用白色背景填充Canvas
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 开始捕获过程
  captureExtendedAreaProcess(canvas, ctx, startScrollY, endScrollY, left, adjustedWidth);
}

// 扩展区域捕获过程
function captureExtendedAreaProcess(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  startScrollY: number,
  endScrollY: number,
  left: number,
  width: number
) {
  // 计算总滚动高度
  const totalHeight = endScrollY - startScrollY;

  // 先滚动到区域起始位置
  window.scrollTo({
    top: startScrollY,
    behavior: 'instant'
  });

  // 等待滚动完成
  setTimeout(() => {
    // 收集所有需要的截图
    collectExtendedAreaImages(canvas, ctx, startScrollY, endScrollY, left, width);
  }, 300);
}

// 收集扩展区域的图像
function collectExtendedAreaImages(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  startPos: number,
  endPos: number,
  left: number,
  width: number,
  images: Array<{dataUrl: string, scrollY: number}> = []
) {
  // 更新进度
  const currentScrollY = window.scrollY;
  const progress = Math.min(100, Math.round(((currentScrollY - startPos) / (endPos - startPos)) * 100));

  if (scrollCaptureProgress) {
    const progressText = document.getElementById('ai-assistant-scroll-progress-text');
    if (progressText) {
      progressText.textContent = `正在捕获扩展区域: ${progress}%`;
    }
  }

  // 暂时隐藏UI元素，避免它们出现在截图中
  hideUIElementsForCapture();

  // 捕获当前可见区域
  chrome.runtime.sendMessage({ action: 'captureVisibleTabForScroll' }, (response) => {
    // 捕获完成后立即恢复UI显示
    restoreUIElementsAfterCapture();

    if (!response || !response.dataUrl) {
      console.error('无法捕获屏幕:', response?.error || '未知错误');
      cleanupExtendedScreenshot();
      return;
    }

    // 添加到图片数组
    images.push({
      dataUrl: response.dataUrl,
      scrollY: currentScrollY
    });

    // 检查是否已完成全部捕获
    if (currentScrollY + window.innerHeight >= endPos) {
      // 合成最终图像
      finishExtendedAreaCapture(canvas, ctx, images, startPos, endPos, left, width);
      return;
    }

    // 计算下一个滚动位置
    const viewportHeight = window.innerHeight;
    // 每次滚动90%视口高度，确保有重叠
    const nextPos = Math.min(currentScrollY + viewportHeight * 0.9, endPos - viewportHeight);

    // 滚动到下一个位置
    window.scrollTo({
      top: nextPos,
      behavior: 'instant'
    });

    // 等待滚动完成并稳定
    setTimeout(() => {
      collectExtendedAreaImages(canvas, ctx, startPos, endPos, left, width, images);
    }, 300);
  });
}

// 隐藏UI元素以便截图
function hideUIElementsForCapture() {
  // 隐藏进度指示器
  if (scrollCaptureProgress) {
    scrollCaptureProgress.dataset.prevDisplay = scrollCaptureProgress.style.display;
    scrollCaptureProgress.style.display = 'none';
  }

  // 隐藏选择框
  if (selectionBox) {
    selectionBox.dataset.prevDisplay = selectionBox.style.display;
    selectionBox.style.display = 'none';
  }

  // 隐藏控制按钮
  if (screenshotControls) {
    screenshotControls.dataset.prevDisplay = screenshotControls.style.display;
    screenshotControls.style.display = 'none';
  }

  // 隐藏其他可能的UI元素
  const toast = document.getElementById('ai-assistant-drag-capture-toast');
  if (toast) {
    toast.dataset.prevDisplay = toast.style.display;
    toast.style.display = 'none';
  }

  // 隐藏防止交互层
  const preventInteractionOverlay = document.getElementById('ai-assistant-prevent-interaction');
  if (preventInteractionOverlay) {
    preventInteractionOverlay.dataset.prevDisplay = preventInteractionOverlay.style.display;
    preventInteractionOverlay.style.display = 'none';
  }

  // 隐藏拖拽处理器
  if (dragScrollHandler) {
    dragScrollHandler.dataset.prevDisplay = dragScrollHandler.style.display;
    dragScrollHandler.style.display = 'none';
  }

  // 隐藏拖拽提示
  const dragHint = document.getElementById('ai-assistant-drag-hint');
  if (dragHint) {
    dragHint.dataset.prevDisplay = dragHint.style.display;
    dragHint.style.display = 'none';
  }

  // 隐藏拖拽状态指示器
  const dragStatus = document.getElementById('ai-assistant-drag-status');
  if (dragStatus) {
    dragStatus.dataset.prevDisplay = dragStatus.style.display;
    dragStatus.style.display = 'none';
  }

  // 隐藏所有截图相关的自定义元素
  const allAssistantElements = document.querySelectorAll('[id^="ai-assistant-"]');
  allAssistantElements.forEach(element => {
    const htmlElement = element as HTMLElement;
    // 如果元素还没有被处理过，则隐藏它
    if (htmlElement && !htmlElement.dataset.prevDisplay && htmlElement.style.display !== 'none') {
      htmlElement.dataset.prevDisplay = htmlElement.style.display || 'block';
      htmlElement.style.display = 'none';
    }
  });
}

// 恢复UI元素显示
function restoreUIElementsAfterCapture() {
  // 恢复进度指示器
  if (scrollCaptureProgress && scrollCaptureProgress.dataset.prevDisplay) {
    scrollCaptureProgress.style.display = scrollCaptureProgress.dataset.prevDisplay;
    delete scrollCaptureProgress.dataset.prevDisplay;
  }

  // 恢复选择框
  if (selectionBox && selectionBox.dataset.prevDisplay) {
    selectionBox.style.display = selectionBox.dataset.prevDisplay;
    delete selectionBox.dataset.prevDisplay;
  }

  // 恢复控制按钮
  if (screenshotControls && screenshotControls.dataset.prevDisplay) {
    screenshotControls.style.display = screenshotControls.dataset.prevDisplay;
    delete screenshotControls.dataset.prevDisplay;
  }

  // 恢复其他可能的UI元素
  const toast = document.getElementById('ai-assistant-drag-capture-toast');
  if (toast && toast.dataset.prevDisplay) {
    toast.style.display = toast.dataset.prevDisplay;
    delete toast.dataset.prevDisplay;
  }

  // 恢复防止交互层
  const preventInteractionOverlay = document.getElementById('ai-assistant-prevent-interaction');
  if (preventInteractionOverlay && preventInteractionOverlay.dataset.prevDisplay) {
    preventInteractionOverlay.style.display = preventInteractionOverlay.dataset.prevDisplay;
    delete preventInteractionOverlay.dataset.prevDisplay;
  }

  // 恢复拖拽处理器
  if (dragScrollHandler && dragScrollHandler.dataset.prevDisplay) {
    dragScrollHandler.style.display = dragScrollHandler.dataset.prevDisplay;
    delete dragScrollHandler.dataset.prevDisplay;
  }

  // 恢复拖拽提示
  const dragHint = document.getElementById('ai-assistant-drag-hint');
  if (dragHint && dragHint.dataset.prevDisplay) {
    dragHint.style.display = dragHint.dataset.prevDisplay;
    delete dragHint.dataset.prevDisplay;
  }

  // 恢复拖拽状态指示器
  const dragStatus = document.getElementById('ai-assistant-drag-status');
  if (dragStatus && dragStatus.dataset.prevDisplay) {
    dragStatus.style.display = dragStatus.dataset.prevDisplay;
    delete dragStatus.dataset.prevDisplay;
  }

  // 恢复所有被隐藏的截图相关元素
  const allAssistantElements = document.querySelectorAll('[id^="ai-assistant-"]');
  allAssistantElements.forEach(element => {
    const htmlElement = element as HTMLElement;
    if (htmlElement && htmlElement.dataset.prevDisplay) {
      htmlElement.style.display = htmlElement.dataset.prevDisplay;
      delete htmlElement.dataset.prevDisplay;
    }
  });
}

// 完成扩展区域捕获
function finishExtendedAreaCapture(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  images: Array<{dataUrl: string, scrollY: number}>,
  startScrollY: number,
  endScrollY: number,
  left: number,
  width: number
) {
  // 更新进度显示
  if (scrollCaptureProgress) {
    scrollCaptureProgress.style.display = 'flex';
    const progressText = document.getElementById('ai-assistant-scroll-progress-text');
    if (progressText) {
      progressText.textContent = '正在合成扩展区域截图...';
    }
  }

  // 处理并合成图像
  const processImages = async () => {
    try {
      // 加载所有图像
      const loadedImages = await Promise.all(images.map(img => {
        return new Promise<{img: HTMLImageElement, scrollY: number}>((resolve, reject) => {
          const image = new Image();
          image.onload = () => resolve({img: image, scrollY: img.scrollY});
          image.onerror = () => reject(new Error('图像加载失败'));
          image.src = img.dataUrl;
        });
      }));

      // 获取设备像素比
      const dpr = window.devicePixelRatio || 1;

      // 边框宽度和安全边距
      const borderWidth = 2;
      const safeMargin = 4;

      // 再次确保宽度不超出边界（防止浏览器窗口大小变化）
      const adjustedWidth = Math.min(width, window.innerWidth - left - (borderWidth + safeMargin));
      if (adjustedWidth !== width) {
        // 如果宽度需要调整，重新设置canvas宽度
        canvas.width = adjustedWidth * dpr;
        // 重新填充白色背景
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // 筛选出第一张和最后一张图像以确定裁剪区域
      const firstImage = loadedImages.sort((a, b) => a.scrollY - b.scrollY)[0];
      const lastImage = loadedImages.sort((a, b) => b.scrollY - a.scrollY)[0];

      // 确定浏览器顶部工具栏/导航栏的高度（通常是固定的）
      // 注意：这里我们基于假设谷歌搜索栏等导航元素通常位于页面顶部，且在滚动时固定在顶部
      // 我们可以通过检查第一张图片和最后一张图片顶部区域的像素差异来估计这个区域的高度
      let toolbarHeight = 0;
      if (loadedImages.length > 1) {
        // 假设第一张图片的顶部有浏览器元素，最后一张图片的顶部可能已经滚动到了网页内容
        // 这里我们通过简单的图像分析来检测不同区域
        toolbarHeight = detectBrowserToolbarHeight(firstImage.img, lastImage.img, dpr);
        console.log('检测到浏览器工具栏高度:', toolbarHeight);
      }

      // 根据滚动位置将图像合到Canvas上，同时避开浏览器UI元素
      for (const {img, scrollY} of loadedImages) {
        // 计算图像在Canvas中的位置
        const sourceX = left * dpr;
        const sourceWidth = adjustedWidth * dpr; // 使用调整后的宽度
        // 调整源图像的Y坐标，跳过浏览器工具栏
        const sourceY = toolbarHeight;
        const adjustedHeight = img.height - toolbarHeight;
        const destY = (scrollY - startScrollY) * dpr;

        // 绘制图像到对应位置，避开浏览器工具栏区域
        try {
          ctx.drawImage(
            img,
            sourceX, sourceY, sourceWidth, adjustedHeight,
            0, destY, canvas.width, adjustedHeight
          );
        } catch (err) {
          console.error('绘制图片出错:', err);
        }
      }

      // 裁剪到指定高度
      const totalHeight = (endScrollY - startScrollY) * dpr;
      const imageData = ctx.getImageData(0, 0, canvas.width, totalHeight);

      // 创建新Canvas以适应正确的高度
      const finalCanvas = document.createElement('canvas');
      finalCanvas.width = canvas.width;
      finalCanvas.height = totalHeight;
      const finalCtx = finalCanvas.getContext('2d');

      if (!finalCtx) {
        throw new Error('无法创建最终Canvas上下文');
      }

      finalCtx.putImageData(imageData, 0, 0);

      // 获取最终图像URL
      const finalImageUrl = finalCanvas.toDataURL('image/png');

      // 发送到侧边栏
      chrome.runtime.sendMessage({
        action: 'openSidePanel'
      }, () => {
        setTimeout(() => {
          chrome.runtime.sendMessage({
            action: 'addScreenshot',
            imageUrl: finalImageUrl,
            text: '扩展区域截图',
            addToInput: true
          });
        }, 500);
      });

      // 显示成功提示
      showDragCaptureToast('扩展区域截图已完成');

    } catch (error) {
      console.error('处理扩展区域截图失败:', error);
      showDragCaptureToast('截图处理失败，请重试');
    } finally {
      // 清理资源
      cleanupExtendedScreenshot();
    }
  };

  // 执行图像处理
  processImages();
}

// 检测浏览器工具栏高度的辅助函数
function detectBrowserToolbarHeight(firstImage: HTMLImageElement, lastImage: HTMLImageElement, dpr: number): number {
  try {
    // 创建临时canvas来分析图片
    const canvas1 = document.createElement('canvas');
    const canvas2 = document.createElement('canvas');
    const ctx1 = canvas1.getContext('2d', { willReadFrequently: true });
    const ctx2 = canvas2.getContext('2d', { willReadFrequently: true });

    if (!ctx1 || !ctx2) return 0;

    // 设置宽度为图片宽度，高度为可能的工具栏高度范围
    const analyzeHeight = 150 * dpr; // 假设最大工具栏高度150像素
    canvas1.width = canvas2.width = firstImage.width;
    canvas1.height = canvas2.height = analyzeHeight;

    // 绘制两张图片的顶部区域到canvas
    ctx1.drawImage(firstImage, 0, 0);
    ctx2.drawImage(lastImage, 0, 0);

    // 获取像素数据
    const data1 = ctx1.getImageData(0, 0, canvas1.width, analyzeHeight).data;
    const data2 = ctx2.getImageData(0, 0, canvas2.width, analyzeHeight).data;

    // 计算每一行的像素差异
    let significantDiffFound = false;
    let toolbarHeight = 0;

    // 每dpr像素分析一次，提高效率
    for (let y = 0; y < analyzeHeight; y += dpr) {
      let rowDiff = 0;
      let pixelsAnalyzed = 0;

      // 采样分析该行的若干像素点
      for (let x = 0; x < canvas1.width; x += dpr * 10) { // 每10个像素采样一次
        const i = (y * canvas1.width + x) * 4; // RGBA四个通道
        // 计算两个像素的颜色差异
        const rDiff = Math.abs(data1[i] - data2[i]);
        const gDiff = Math.abs(data1[i+1] - data2[i+1]);
        const bDiff = Math.abs(data1[i+2] - data2[i+2]);
        const aDiff = Math.abs(data1[i+3] - data2[i+3]);

        // 总差异
        const pixelDiff = rDiff + gDiff + bDiff + aDiff;
        rowDiff += pixelDiff;
        pixelsAnalyzed++;
      }

      // 计算平均差异
      const avgDiff = pixelsAnalyzed > 0 ? rowDiff / pixelsAnalyzed : 0;

      // 如果差异大于阈值，认为是从浏览器UI元素过渡到网页内容的边界
      if (avgDiff > 30 && !significantDiffFound) { // 阈值可以根据实际情况调整
        significantDiffFound = true;
        toolbarHeight = y;
        break;
      }
    }

    // 如果没有找到明显差异，返回安全的默认值
    return significantDiffFound ? toolbarHeight : Math.min(60 * dpr, analyzeHeight / 3);
  } catch (error) {
    console.error('检测浏览器工具栏高度时出错:', error);
    return 0; // 失败时不进行裁剪
  }
}

// 清理扩展截图资源
function cleanupExtendedScreenshot() {
  // 停止自动滚动
  stopAutoScroll();

  // 重置状态
  isExtendedSelecting = false;

  // 恢复滚动到合理位置
  window.scrollTo({
    top: Math.min(extendedSelectionStartY, extendedSelectionEndY),
    behavior: 'instant'
  });

  // 隐藏进度指示器
  if (scrollCaptureProgress) {
    scrollCaptureProgress.style.display = 'none';
  }

  // 移除交互阻止层
  const preventInteractionOverlay = document.getElementById('ai-assistant-prevent-interaction');
  if (preventInteractionOverlay) {
    preventInteractionOverlay.remove();
  }

  // 完全清理UI
  cleanupScreenshotUI();
}

// 处理键盘按键事件，用于取消截图
function handleKeyDown(e: KeyboardEvent) {
  // ESC键取消截图
  if (e.key === 'Escape') {
    console.log('ESC按键取消截图');

    // 取消扩展区域截图（如果正在进行）
    if (isExtendedSelecting) {
      cleanupExtendedScreenshot();
    } else {
      // 如果选区已完成但尚未确认，也需要清理
      cleanupScreenshotUI();
    }

    // 移除键盘事件监听
    document.removeEventListener('keydown', handleKeyDown);
  }
}

