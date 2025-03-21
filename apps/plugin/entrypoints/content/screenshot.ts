/**
 * 截图相关功能
 */

import { useScreenshotStore } from '../stores/screenshot';

let selectionBox: HTMLElement | null = null;
let screenshotOverlay: HTMLElement | null = null;
let screenshotControls: HTMLElement | null = null;
let scrollCaptureProgress: HTMLElement | null = null;

// 截图相关变量

let startX = 0;
let startY = 0;
let endX = 0;
let endY = 0;


// 添加自动滚动相关变量
let autoScrolling = false;
let autoScrollSpeed = 0;
let autoScrollDirection = 0; // 0: 无滚动, 1: 向下滚动, -1: 向上滚动
let autoScrollIntervalId: number | null = null;
let extendedSelectionStartY = 0; // 拖拽开始时的文档Y坐标
let extendedSelectionEndY = 0; // 拖拽结束时的文档Y坐标
let isExtendedSelecting = false;

// 1. 开始选区截图
export function startExtendedAreaScreenshot() {
  createScreenshotElements();
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

    // 显示提示
    showDragCaptureToast('拖拽选择区域，可超出视口边界自动滚动');
  }
}

// 2. 创建截图相关的DOM元素
function createScreenshotElements() {
  // 不存在时则创建
  if (!screenshotOverlay) {
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
    document.body.appendChild(screenshotOverlay);
  }

  if (!selectionBox) {
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
    // 将元素添加到页面
    document.body.appendChild(selectionBox);
  }

  if (!scrollCaptureProgress) {
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
  }
  if (!screenshotControls) {
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
    document.body.appendChild(screenshotControls);
  }
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

// 捕获扩展选择区域
function captureExtendedArea() {
  // 显示进度指示器
  if (scrollCaptureProgress) {
    scrollCaptureProgress.style.display = 'flex';
    const progressText = document.getElementById(
      'ai-assistant-scroll-progress-text'
    );
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
  const adjustedWidth = Math.min(
    width,
    window.innerWidth - left - (borderWidth + safeMargin)
  );

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
  captureExtendedAreaProcess(
    canvas,
    ctx,
    startScrollY,
    endScrollY,
    left,
    adjustedWidth
  );
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
  // 先滚动到区域起始位置
  window.scrollTo({
    top: startScrollY,
    behavior: 'instant',
  });

  // 等待滚动完成
  setTimeout(() => {
    // 收集所有需要的截图
    collectExtendedAreaImages(
      canvas,
      ctx,
      startScrollY,
      endScrollY,
      left,
      width
    );
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
  images: Array<{ dataUrl: string; scrollY: number }> = []
) {
  // 更新进度
  const currentScrollY = window.scrollY;
  const progress = Math.min(
    100,
    Math.round(((currentScrollY - startPos) / (endPos - startPos)) * 100)
  );

  if (scrollCaptureProgress) {
    const progressText = document.getElementById(
      'ai-assistant-scroll-progress-text'
    );
    if (progressText) {
      progressText.textContent = `正在捕获扩展区域: ${progress}%`;
    }
  }

  // 暂时隐藏UI元素，避免它们出现在截图中
  hideUIElementsForCapture();

  // 捕获当前可见区域
  chrome.runtime.sendMessage(
    { action: 'captureVisibleTabForScroll' },
    (response) => {
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
        scrollY: currentScrollY,
      });

      // 检查是否已完成全部捕获
      if (currentScrollY + window.innerHeight >= endPos) {
        // 合成最终图像
        finishExtendedAreaCapture(
          canvas,
          ctx,
          images,
          startPos,
          endPos,
          left,
          width
        );
        return;
      }

      // 计算下一个滚动位置
      const viewportHeight = window.innerHeight;
      // 每次滚动90%视口高度，确保有重叠
      const nextPos = Math.min(
        currentScrollY + viewportHeight * 0.9,
        endPos - viewportHeight
      );

      // 滚动到下一个位置
      window.scrollTo({
        top: nextPos,
        behavior: 'instant',
      });

      // 等待滚动完成并稳定
      setTimeout(() => {
        collectExtendedAreaImages(
          canvas,
          ctx,
          startPos,
          endPos,
          left,
          width,
          images
        );
      }, 300);
    }
  );
}

// 隐藏UI元素以便截图
function hideUIElementsForCapture() {
  // 隐藏进度指示器
  if (scrollCaptureProgress) {
    scrollCaptureProgress.dataset.prevDisplay =
      scrollCaptureProgress.style.display;
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
  const preventInteractionOverlay = document.getElementById(
    'ai-assistant-prevent-interaction'
  );
  if (preventInteractionOverlay) {
    preventInteractionOverlay.dataset.prevDisplay =
      preventInteractionOverlay.style.display;
    preventInteractionOverlay.style.display = 'none';
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
  const allAssistantElements = document.querySelectorAll(
    '[id^="ai-assistant-"]'
  );
  allAssistantElements.forEach((element) => {
    const htmlElement = element as HTMLElement;
    // 如果元素还没有被处理过，则隐藏它
    if (
      htmlElement &&
      !htmlElement.dataset.prevDisplay &&
      htmlElement.style.display !== 'none'
    ) {
      htmlElement.dataset.prevDisplay = htmlElement.style.display || 'block';
      htmlElement.style.display = 'none';
    }
  });
}

// 恢复UI元素显示
function restoreUIElementsAfterCapture() {
  // 恢复进度指示器
  if (scrollCaptureProgress && scrollCaptureProgress.dataset.prevDisplay) {
    scrollCaptureProgress.style.display =
      scrollCaptureProgress.dataset.prevDisplay;
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
  const preventInteractionOverlay = document.getElementById(
    'ai-assistant-prevent-interaction'
  );
  if (
    preventInteractionOverlay &&
    preventInteractionOverlay.dataset.prevDisplay
  ) {
    preventInteractionOverlay.style.display =
      preventInteractionOverlay.dataset.prevDisplay;
    delete preventInteractionOverlay.dataset.prevDisplay;
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
  const allAssistantElements = document.querySelectorAll(
    '[id^="ai-assistant-"]'
  );
  allAssistantElements.forEach((element) => {
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
  images: Array<{ dataUrl: string; scrollY: number }>,
  startScrollY: number,
  endScrollY: number,
  left: number,
  width: number
) {
  // 更新进度显示
  if (scrollCaptureProgress) {
    scrollCaptureProgress.style.display = 'flex';
    const progressText = document.getElementById(
      'ai-assistant-scroll-progress-text'
    );
    if (progressText) {
      progressText.textContent = '正在合成扩展区域截图...';
    }
  }

  // 检测浏览器工具栏高度的辅助函数
  function detectBrowserToolbarHeight(
    firstImage: HTMLImageElement,
    lastImage: HTMLImageElement,
    dpr: number
  ): number {
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
        for (let x = 0; x < canvas1.width; x += dpr * 10) {
          // 每10个像素采样一次
          const i = (y * canvas1.width + x) * 4; // RGBA四个通道
          // 计算两个像素的颜色差异
          const rDiff = Math.abs(data1[i] - data2[i]);
          const gDiff = Math.abs(data1[i + 1] - data2[i + 1]);
          const bDiff = Math.abs(data1[i + 2] - data2[i + 2]);
          const aDiff = Math.abs(data1[i + 3] - data2[i + 3]);

          // 总差异
          const pixelDiff = rDiff + gDiff + bDiff + aDiff;
          rowDiff += pixelDiff;
          pixelsAnalyzed++;
        }

        // 计算平均差异
        const avgDiff = pixelsAnalyzed > 0 ? rowDiff / pixelsAnalyzed : 0;

        // 如果差异大于阈值，认为是从浏览器UI元素过渡到网页内容的边界
        if (avgDiff > 30 && !significantDiffFound) {
          // 阈值可以根据实际情况调整
          significantDiffFound = true;
          toolbarHeight = y;
          break;
        }
      }

      // 如果没有找到明显差异，返回安全的默认值
      return significantDiffFound
        ? toolbarHeight
        : Math.min(60 * dpr, analyzeHeight / 3);
    } catch (error) {
      console.error('检测浏览器工具栏高度时出错:', error);
      return 0; // 失败时不进行裁剪
    }
  }

  // 处理并合成图像
  const processImages = async () => {
    try {
      // 加载所有图像
      const loadedImages = await Promise.all(
        images.map((img) => {
          return new Promise<{ img: HTMLImageElement; scrollY: number }>(
            (resolve, reject) => {
              const image = new Image();
              image.onload = () =>
                resolve({ img: image, scrollY: img.scrollY });
              image.onerror = () => reject(new Error('图像加载失败'));
              image.src = img.dataUrl;
            }
          );
        })
      );

      // 获取设备像素比
      const dpr = window.devicePixelRatio || 1;

      // 边框宽度和安全边距
      const borderWidth = 2;
      const safeMargin = 4;

      // 再次确保宽度不超出边界（防止浏览器窗口大小变化）
      const adjustedWidth = Math.min(
        width,
        window.innerWidth - left - (borderWidth + safeMargin)
      );
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
        toolbarHeight = detectBrowserToolbarHeight(
          firstImage.img,
          lastImage.img,
          dpr
        );
        console.log('检测到浏览器工具栏高度:', toolbarHeight);
      }

      // 根据滚动位置将图像合到Canvas上，同时避开浏览器UI元素
      for (const { img, scrollY } of loadedImages) {
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
            sourceX,
            sourceY,
            sourceWidth,
            adjustedHeight,
            0,
            destY,
            canvas.width,
            adjustedHeight
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
      chrome.runtime.sendMessage(
        {
          action: 'openSidePanel',
        },
        () => {
          setTimeout(() => {
            chrome.runtime.sendMessage({
              action: 'addScreenshot',
              imageUrl: finalImageUrl,
              text: '扩展区域截图',
              addToInput: true,
            });
          }, 500);
        }
      );

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

// 显示拖拽截图提示
function showDragCaptureToast(message: string) {
  // 清理已有提示
  const existingToast = document.getElementById(
    'ai-assistant-drag-capture-toast'
  );
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

// 停止自动滚动
function stopAutoScroll() {
  if (!autoScrolling) return;

  autoScrolling = false;
  if (autoScrollIntervalId !== null) {
    clearInterval(autoScrollIntervalId);
    autoScrollIntervalId = null;
  }
}

// 清理扩展截图资源
function cleanupExtendedScreenshot() {
  // 恢复滚动到合理位置
  window.scrollTo({
    top: Math.min(extendedSelectionStartY, extendedSelectionEndY),
    behavior: 'instant',
  });

  // 隐藏进度指示器
  if (scrollCaptureProgress) {
    scrollCaptureProgress.style.display = 'none';
  }

  // 移除交互阻止层
  const preventInteractionOverlay = document.getElementById(
    'ai-assistant-prevent-interaction'
  );
  if (preventInteractionOverlay) {
    preventInteractionOverlay.remove();
  }

  // 完全清理UI
  cleanupScreenshotUI();
}

// 清理截图界面 - 修改以确保清理所有事件监听器
function cleanupScreenshotUI() {
  console.log('清理截图界面');

  // 重置状态
  useScreenshotStore.getState().cancelSelection();
  isExtendedSelecting = false;
  stopAutoScroll();

  if (screenshotOverlay) {
    console.log(111222);
    screenshotOverlay.style.display = 'none';
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
}

// 3. 处理扩展鼠标按下事件
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
    autoScrollSpeed = Math.min(
      maxScrollSpeed,
      (scrollThreshold - distanceFromTop) / 2
    );
    startAutoScroll();
  } else if (distanceFromBottom < scrollThreshold) {
    // 鼠标接近底部边缘，向下滚动
    autoScrollDirection = 1;
    autoScrollSpeed = Math.min(
      maxScrollSpeed,
      (scrollThreshold - distanceFromBottom) / 2
    );
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
  const adjustedWidth = Math.min(
    width,
    window.innerWidth - left - (borderWidth + safeMargin)
  );

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
  console.log(
    '文档坐标范围:',
    extendedSelectionStartY,
    'to',
    extendedSelectionEndY
  );

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
    const topSpace = selectionRect.top;

    // 没有足够的底部空间，也没有足够的顶部空间时，放在视口中心
    if (
      controlsRect.bottom > window.innerHeight &&
      topSpace < controlsRect.height
    ) {
      // 上下都没有足够空间，放在视口中心
      screenshotControls.style.top = `${Math.max(
        10,
        (window.innerHeight - controlsRect.height) / 2
      )}px`;
      screenshotControls.style.left = `${Math.max(
        10,
        (window.innerWidth - controlsRect.width) / 2
      )}px`;
    } else if (controlsRect.bottom > window.innerHeight) {
      // 底部空间不足，但顶部有空间，放在选区上方
      screenshotControls.style.top = `${
        selectionRect.top - controlsRect.height - 10
      }px`;
    }

    if (controlsRect.right > window.innerWidth) {
      screenshotControls.style.left = `${
        window.innerWidth - controlsRect.width - 10
      }px`;
    }
  }

  // 移除事件监听器
  document.removeEventListener('mousemove', handleExtendedMouseMove);
  document.removeEventListener('mouseup', handleExtendedMouseUp);
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
  const adjustedWidth = Math.min(
    width,
    window.innerWidth - left - (borderWidth + safeMargin)
  );

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
