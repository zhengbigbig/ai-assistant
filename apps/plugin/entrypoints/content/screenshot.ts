/**
 * 截图相关功能
 *
 * 执行流程：
 * 1. startExtendedAreaScreenshot: 开始截图
 * 2. createScreenshotElements: 创建UI元素
 * 3. handleExtendedMouseDown: 开始选区
 * 4. handleExtendedMouseMove: 处理选区移动和自动滚动
 * 5. handleExtendedMouseUp: 完成选区
 * 6. captureExtendedArea: 开始捕获
 * 7. collectExtendedAreaImages: 收集图像
 * 8. finishExtendedAreaCapture: 合成最终图像
 * 9. cleanupExtendedScreenshot: 清理资源
 */

import { useScreenshotStore } from '../stores/screenshot';

// ============= 1. 全局变量定义 =============
let selectionBox: HTMLElement | null = null;
let screenshotOverlay: HTMLElement | null = null;
let screenshotControls: HTMLElement | null = null;

// 截图状态变量
let startX = 0;
let startY = 0;
let endX = 0;
let endY = 0;

// 自动滚动相关变量
let autoScrolling = false;
let autoScrollSpeed = 0;
let autoScrollDirection = 0;
let autoScrollIntervalId: number | null = null;
let extendedSelectionStartY = 0;
let extendedSelectionEndY = 0;
let isExtendedSelecting = false;

// ============= 2. UI管理相关函数 =============

/**
 * 统一管理UI元素的显示/隐藏
 */
interface UIElementVisibility {
  element: HTMLElement;
  display: string;
}

function manageUIElements(
  elements: UIElementVisibility[],
  action: 'show' | 'hide'
) {
  elements.forEach(({ element, display }) => {
    if (action === 'hide') {
      element.dataset.prevDisplay = element.style.display;
      element.style.display = 'none';
    } else {
      element.style.display = element.dataset.prevDisplay || display;
      delete element.dataset.prevDisplay;
    }
  });
}

/**
 * 更新选择框位置和大小
 */
function updateSelectionBox(params: {
  startX: number;
  endX: number;
  startY: number;
  endY: number;
  scrollY?: number;
}) {
  if (!selectionBox) return;

  const { startX, endX, startY, endY, scrollY = 0 } = params;

  // 计算视口内的坐标
  const viewportStartY = startY - scrollY;
  const viewportEndY = endY - scrollY;

  // 计算选择框位置
  const left = Math.min(startX, endX);
  const top = Math.min(viewportStartY, viewportEndY);
  const width = Math.abs(endX - startX);
  const height = Math.abs(viewportEndY - viewportStartY);

  // 边框相关常量
  const borderWidth = 2;
  const safeMargin = 4;

  // 确保选区不超出视口右边界
  const adjustedWidth = Math.min(
    width,
    window.innerWidth - left - (borderWidth + safeMargin)
  );

  // 更新选区样式
  selectionBox.style.left = `${left}px`;
  selectionBox.style.top = `${top}px`;
  selectionBox.style.width = `${adjustedWidth}px`;
  selectionBox.style.height = `${height}px`;

  // 边缘处理
  selectionBox.style.border =
    left + adjustedWidth > window.innerWidth - (borderWidth + safeMargin)
      ? `${borderWidth}px solid rgba(110, 89, 242, 0.9)`
      : `${borderWidth}px dashed #6e59f2`;
}

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
  // 先隐藏所有UI元素，再显示进度指示器
  hideUIElementsForCapture();

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

  // 步骤1: 根据滚动方向计算相对间距
  // 这个相对间距用于确定初始滚动位置和后续图像拼接的重叠区域
  const viewportHeight = window.innerHeight;
  const relativeOffset = startScrollY % viewportHeight;
  const areSingleImage = endScrollY - startScrollY <= viewportHeight;
  // 判断是否需要滚动
  if (!areSingleImage) {
    // 先滚动到初始位置
    window.scrollTo({
      top: startScrollY,
      behavior: 'instant',
    });
  }
  // 开始捕获过程
  setTimeout(() => {
    // 收集所有需要的截图
    collectExtendedAreaImages(
      startScrollY,
      endScrollY,
      left,
      adjustedWidth,
      startScrollY, // 实际滚动位置可能因为边界限制与理想位置不同
      Math.max(100, relativeOffset), // 确保有足够的重叠区域
      [],
      areSingleImage
    );
  }, 300);
}

// 收集选区区域的图像
function collectExtendedAreaImages(
  startPos: number,
  endPos: number,
  left: number,
  width: number,
  lastTargetScrollY: number,
  relativeOffset: number,
  images: Array<{
    dataUrl: string;
    scrollY: number;
    sourceY: number;
    sourceHeight: number;
  }> = [],
  areSingleImage = false
) {
  // 更新进度
  const currentScrollY = lastTargetScrollY;
  // 获取视口高度
  const viewportHeight = window.innerHeight;

  // 再次隐藏UI元素，确保每次捕获前都不会出现UI，但保留进度指示器
  hideUIElementsForCapture();

  // 为确保UI元素完全隐藏后再截图，增加短暂延迟
  // 步骤2：先截图后滚动
  setTimeout(() => {
    chrome.runtime.sendMessage(
      { action: 'captureVisibleTabForScroll' },
      (response) => {
        if (!response || !response.dataUrl) {
          console.error('无法捕获屏幕:', response?.error || '未知错误');
          cleanupExtendedScreenshot();
          return;
        }
        const isFirstImage = images.length === 0;
        // 首次sourceY为0，除非超越位置，sourceY为相对间距
        let sourceY = isFirstImage ? 0 : relativeOffset;
        // 首次sourceHeight为视口高度，除非超越位置，sourceHeight为视口高度 - 相对间距
        let sourceHeight = isFirstImage
          ? viewportHeight
          : viewportHeight - relativeOffset;
        let nextScrollY = 0;
        // 预期滚动位置
        const expectedScrollY =
          currentScrollY + viewportHeight - relativeOffset;
        // 不可超越位置
        const maxScrollY = endPos - viewportHeight;
        // 当前位置若已经到倒数第一张图片
        if (expectedScrollY >= maxScrollY) {
          nextScrollY = maxScrollY;
        } else {
          nextScrollY = expectedScrollY;
        }
        const isLastImage = currentScrollY >= endPos - viewportHeight;
        if (isLastImage && images.length > 1) {
          // 超长情况
          // 最后一张图应该计算滚动距离为当前滚动位置 - 上一次滚动位置，相对截图起始点应该是可视窗口 - 滚动高度
          sourceHeight = Math.abs(currentScrollY - images[images.length - 1].scrollY);
          sourceY = viewportHeight - sourceHeight;
        }
        if (areSingleImage) {
          images.push({
            dataUrl: response.dataUrl,
            scrollY: 0,
            sourceY: startPos - window.scrollY,
            sourceHeight: endPos - startPos,
          });
        } else {
          // 添加到图片数组
          images.push({
            dataUrl: response.dataUrl,
            scrollY: currentScrollY,
            sourceY,
            sourceHeight,
          });
        }

        // 检查是否已完成全部捕获
        if (isLastImage) {
          // 合成最终图像
          finishExtendedAreaCapture(
            images,
            startPos,
            endPos,
            left,
            width,
            areSingleImage
          );
          return;
        }

        // 滚动到下一个位置
        window.scrollTo({
          top: nextScrollY,
          behavior: 'instant',
        });

        // 等待滚动完成并稳定
        setTimeout(() => {
          collectExtendedAreaImages(
            startPos,
            endPos,
            left,
            width,
            nextScrollY,
            relativeOffset,
            images
          );
        }, 300);
      }
    );
  }, 50); // 增加50ms延迟确保UI隐藏后再截图
}

// 隐藏UI元素以便截图
function hideUIElementsForCapture() {
  // 确保所有与截图相关的UI元素都被隐藏
  // 创建一个完整的需要隐藏的元素列表
  const elementsToHide = [
    { element: selectionBox!, display: 'block' },
    { element: screenshotOverlay!, display: 'block' },
    { element: screenshotControls!, display: 'flex' },
  ].filter(({ element }) => element);

  // 添加所有以ai-assistant开头的动态元素，但排除进度指示器
  const dynamicElements = document.querySelectorAll('[id^="ai-assistant-"]');
  dynamicElements.forEach((element) => {
    if (element instanceof HTMLElement) {
      // 排除进度指示器及其相关元素
      if (element.id === 'ai-assistant-prevent-interaction') {
        return;
      }
      elementsToHide.push({
        element,
        display: element.style.display || 'block',
      });
    }
  });

  // 隐藏所有元素
  manageUIElements(elementsToHide, 'hide');

  // 确保隐藏成功
  setTimeout(() => {
    // 再次检查并隐藏可能未被隐藏的元素，但保留进度指示器
    const remainingElements = document.querySelectorAll(
      '[id^="ai-assistant-"]'
    );
    remainingElements.forEach((element) => {
      if (element instanceof HTMLElement && element.style.display !== 'none') {
        // 排除进度指示器及其相关元素
        if (element.id === 'ai-assistant-prevent-interaction') {
          return;
        }
        element.dataset.prevDisplay = element.style.display || 'block';
        element.style.display = 'none';
      }
    });
  }, 10);
}

// 完成选定区域捕获
async function finishExtendedAreaCapture(
  images: Array<{
    dataUrl: string;
    sourceY: number;
    sourceHeight: number;
  }>,
  startScrollY: number,
  endScrollY: number,
  left: number,
  width: number,
  areSingleImage: boolean
) {
  const height = Math.abs(endScrollY - startScrollY);
  // 创建画布
  const canvas = document.createElement('canvas');
  const dpr = window.devicePixelRatio || 1;
  // 使用物理像素尺寸创建画布，确保高清显示
  canvas.width = width * dpr;
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

  // 处理并合成图像
  try {
    // 加载所有图像
    const loadedImages = await Promise.all(
      images.map((img) => {
        return new Promise<{
          img: HTMLImageElement;
          sourceY: number;
          sourceHeight: number;
        }>((resolve, reject) => {
          const image = new Image();
          image.onload = () =>
            resolve({
              img: image,
              sourceY: img.sourceY,
              sourceHeight: img.sourceHeight,
            });
          image.onerror = () => reject(new Error('图像加载失败'));
          image.src = img.dataUrl;
        });
      })
    );

    let destY = 0;
    // 根据滚动位置将图像合到Canvas上
    for (const { img, sourceY, sourceHeight } of loadedImages) {
      // 计算图像在Canvas中的位置，注意DPR计算
      const sourceX = left * dpr;
      const sourceWidth = width * dpr;

      // 使用预先计算好的源图Y坐标和高度，正确处理DPR因素
      const actualSourceY = sourceY * dpr;
      const actualSourceHeight = sourceHeight * dpr;
      // 目标Y位置也需要考虑DPR因素
      const actualDestY = destY * dpr;

      // 绘制图像到对应位置，确保正确处理DPR
      ctx.drawImage(
        img, // 源图像
        sourceX, // 源图像的x坐标
        actualSourceY, // 源图像的y坐标，已乘以DPR
        sourceWidth, // 源图像的宽度，已乘以DPR
        actualSourceHeight, // 源图像的高度，已乘以DPR
        0, // 目标canvas的x坐标
        actualDestY, // 目标canvas的y坐标，已乘以DPR
        canvas.width, // 目标宽度（使用canvas宽度，已考虑DPR）
        actualSourceHeight // 目标高度，已乘以DPR
      );
      destY += sourceHeight;
    }

    // 获取最终图像URL
    const finalImageUrl = canvas.toDataURL('image/png');

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
            text: '选定区域截图',
            addToInput: true,
          });

          // 显示成功提示
          showDragCaptureToast('选定区域截图已完成');

          // 截图发送后清理资源
          cleanupExtendedScreenshot(areSingleImage);
        }, 500);
      }
    );
  } catch (error) {
    console.error('处理选定区域截图失败:', error);
    showDragCaptureToast('截图处理失败，请重试');

    // 错误时也需要清理资源
    cleanupExtendedScreenshot();
  }
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
function cleanupExtendedScreenshot(areSingleImage?: boolean) {
  if (!areSingleImage) {
    // 恢复滚动到合理位置
    window.scrollTo({
      top: Math.min(extendedSelectionStartY, extendedSelectionEndY),
      behavior: 'instant',
    });
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

  updateSelectionBox({
    startX,
    endX,
    startY: extendedSelectionStartY,
    endY: extendedSelectionEndY,
    scrollY: window.scrollY,
  });

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

  // 使用统一的updateSelectionBox函数
  updateSelectionBox({
    startX,
    endX,
    startY: extendedSelectionStartY,
    endY: extendedSelectionEndY,
    scrollY: window.scrollY,
  });
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
    updateSelectionBox({
      startX,
      endX,
      startY: extendedSelectionStartY,
      endY: extendedSelectionEndY,
      scrollY: window.scrollY,
    });
  }, 16); // 约60fps
}

// 处理扩展鼠标释放事件
function handleExtendedMouseUp() {
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

// 处理键盘按键事件，用于取消截图
function handleKeyDown(e: KeyboardEvent) {
  // ESC键取消截图
  if (e.key === 'Escape') {
    console.log('ESC按键取消截图');

    // 取消选定区域截图（如果正在进行）
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
