import React, { useEffect, useRef, useState } from 'react';
import { Button, message } from 'antd';
import styled from 'styled-components';
import { useScreenshotStore } from '../../stores/screenshot';

// 样式定义
const ScreenshotOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.3);
  z-index: 2147483646;
  cursor: crosshair;
`;

const SelectionBox = styled.div`
  position: fixed;
  border: 2px dashed #6e59f2;
  background-color: rgba(110, 89, 242, 0.1);
  z-index: 2147483647;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.3);
`;

const ControlPanel = styled.div`
  position: fixed;
  z-index: 2147483647;
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  padding: 8px;
  display: flex;
  gap: 8px;
`;

const PreventInteraction = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: transparent;
  z-index: 2147483645;
  cursor: progress;
`;

const Toast = styled.div`
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(33, 150, 243, 0.9);
  color: white;
  padding: 12px 20px;
  border-radius: 8px;
  z-index: 2147483646;
  font-size: 14px;
  font-weight: bold;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  text-align: center;
  max-width: 80%;
  opacity: 1;
  transition: opacity 0.5s ease;
`;

// 接口定义
interface SelectionCoords {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  extendedStartY: number;
  extendedEndY: number;
}

interface ScreenshotImage {
  dataUrl: string;
  scrollY: number;
  sourceY: number;
  sourceHeight: number;
}

const ScreenshotManager: React.FC = () => {
  // 状态
  const [visible, setVisible] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [preventInteraction, setPreventInteraction] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [coords, setCoords] = useState<SelectionCoords>({
    startX: 0,
    startY: 0,
    endX: 0,
    endY: 0,
    extendedStartY: 0,
    extendedEndY: 0,
  });

  // 引用
  const overlayRef = useRef<HTMLDivElement>(null);
  const selectionBoxRef = useRef<HTMLDivElement>(null);
  const controlPanelRef = useRef<HTMLDivElement>(null);

  // Zustand store
  const {
    startSelection,
    cancelSelection,
    finishCapture: saveScreenshotToStore,
  } = useScreenshotStore();

  // 自动滚动相关状态
  const [autoScrolling, setAutoScrolling] = useState(false);
  const autoScrollInfoRef = useRef({
    direction: 0,
    speed: 0,
    intervalId: null as number | null,
  });

  // Toast显示函数
  const showToast = (msg: string) => {
    setToast(msg);
    // 3秒后自动隐藏
    setTimeout(() => setToast(null), 3000);
  };

  // 初始化截图环境
  const startScreenshot = () => {
    setVisible(true);
    setSelecting(false);
    setShowControls(false);
    setCoords({
      startX: 0,
      startY: 0,
      endX: 0,
      endY: 0,
      extendedStartY: 0,
      extendedEndY: 0,
    });
    showToast('拖拽选择区域，可超出视口边界自动滚动');
    // 更新全局状态
    startSelection();
  };

  // 清理截图环境
  const cleanupScreenshot = (areSingleImage?: boolean) => {
    // 恢复滚动位置
    if (!areSingleImage) {
      window.scrollTo({
        top: Math.min(coords.extendedStartY, coords.extendedEndY),
        behavior: 'instant',
      });
    }

    // 停止自动滚动
    stopAutoScroll();

    // 隐藏所有UI元素
    setVisible(false);
    setSelecting(false);
    setShowControls(false);
    setPreventInteraction(false);

    // 重置store状态
    cancelSelection();
  };

  // 更新选择框位置和大小
  const updateSelectionBox = () => {
    if (!selectionBoxRef.current) return;

    const { startX, endX, extendedStartY, extendedEndY } = coords;
    const scrollY = window.scrollY;

    // 计算视口内的坐标
    const viewportStartY = extendedStartY - scrollY;
    const viewportEndY = extendedEndY - scrollY;

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
    selectionBoxRef.current.style.left = `${left}px`;
    selectionBoxRef.current.style.top = `${top}px`;
    selectionBoxRef.current.style.width = `${adjustedWidth}px`;
    selectionBoxRef.current.style.height = `${height}px`;
    selectionBoxRef.current.style.display = 'block';

    // 边缘处理
    selectionBoxRef.current.style.border =
      left + adjustedWidth > window.innerWidth - (borderWidth + safeMargin)
        ? `${borderWidth}px solid rgba(110, 89, 242, 0.9)`
        : `${borderWidth}px dashed #6e59f2`;
  };

  // 处理鼠标按下事件
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // 阻止默认行为
    e.preventDefault();

    setSelecting(true);
    setShowControls(false);

    // 更新坐标
    const newCoords = {
      startX: e.clientX,
      startY: e.clientY,
      endX: e.clientX,
      endY: e.clientY,
      extendedStartY: e.clientY + window.scrollY,
      extendedEndY: e.clientY + window.scrollY,
    };
    setCoords(newCoords);

    // 显示选择框
    if (selectionBoxRef.current) {
      selectionBoxRef.current.style.display = 'block';
    }
  };

  // 处理鼠标移动事件
  const handleMouseMove = (e: MouseEvent) => {
    if (!selecting) return;

    // 阻止默认行为
    e.preventDefault();

    // 更新鼠标当前位置（限制在窗口边界内）
    const endX = Math.max(0, Math.min(e.clientX, window.innerWidth - 1));
    const endY = Math.max(0, Math.min(e.clientY, window.innerHeight - 1));

    // 获取页面实际高度
    const maxScrollY =
      Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight
      ) - window.innerHeight;

    // 限制extendedEndY不超过页面最大高度
    const extendedEndY = Math.min(
      endY + window.scrollY,
      maxScrollY + window.innerHeight
    );

    // 更新坐标
    setCoords((prev) => ({
      ...prev,
      endX,
      endY,
      extendedEndY,
    }));

    // 检查是否需要自动滚动
    checkAutoScroll(e);
  };

  // 处理鼠标释放事件
  const handleMouseUp = () => {
    if (!selecting) return;

    setSelecting(false);
    stopAutoScroll();

    // 检查选择框是否有足够大小
    const minSize = 10; // 最小尺寸（像素）
    const width = Math.abs(coords.endX - coords.startX);
    const height = Math.abs(coords.extendedEndY - coords.extendedStartY);

    if (width < minSize || height < minSize) {
      // 选择框太小，重置截图
      if (selectionBoxRef.current) {
        selectionBoxRef.current.style.display = 'none';
      }
      cleanupScreenshot();
      return;
    }

    // 显示控制按钮
    setShowControls(true);
    updateControlPosition();
  };

  // 更新控制面板位置
  const updateControlPosition = () => {
    if (!controlPanelRef.current || !selectionBoxRef.current) return;

    const selectionRect = selectionBoxRef.current.getBoundingClientRect();
    controlPanelRef.current.style.top = `${selectionRect.bottom + 10}px`;
    controlPanelRef.current.style.left = `${selectionRect.left}px`;

    // 确保控制按钮在视口内
    const controlsRect = controlPanelRef.current.getBoundingClientRect();

    // 检查底部空间是否足够
    const topSpace = selectionRect.top;

    // 没有足够的底部空间，也没有足够的顶部空间时，放在视口中心
    if (
      controlsRect.bottom > window.innerHeight &&
      topSpace < controlsRect.height
    ) {
      // 上下都没有足够空间，放在视口中心
      controlPanelRef.current.style.top = `${Math.max(
        10,
        (window.innerHeight - controlsRect.height) / 2
      )}px`;
      controlPanelRef.current.style.left = `${Math.max(
        10,
        (window.innerWidth - controlsRect.width) / 2
      )}px`;
    } else if (controlsRect.bottom > window.innerHeight) {
      // 底部空间不足，但顶部有空间，放在选区上方
      controlPanelRef.current.style.top = `${
        selectionRect.top - controlsRect.height - 10
      }px`;
    }

    if (controlsRect.right > window.innerWidth) {
      controlPanelRef.current.style.left = `${
        window.innerWidth - controlsRect.width - 10
      }px`;
    }
  };

  // 检查自动滚动
  const checkAutoScroll = (e: MouseEvent) => {
    const scrollThreshold = 50; // 距离视口边缘多少像素触发滚动
    const maxScrollSpeed = 20; // 最大滚动速度

    // 计算鼠标距离视口边缘的距离
    const distanceFromTop = e.clientY;
    const distanceFromBottom = window.innerHeight - e.clientY;

    // 根据距离计算滚动速度和方向
    if (distanceFromTop < scrollThreshold) {
      // 鼠标接近顶部边缘，向上滚动
      autoScrollInfoRef.current.direction = -1;
      autoScrollInfoRef.current.speed = Math.min(
        maxScrollSpeed,
        (scrollThreshold - distanceFromTop) / 2
      );
      startAutoScroll();
    } else if (distanceFromBottom < scrollThreshold) {
      // 鼠标接近底部边缘，向下滚动
      autoScrollInfoRef.current.direction = 1;
      autoScrollInfoRef.current.speed = Math.min(
        maxScrollSpeed,
        (scrollThreshold - distanceFromBottom) / 2
      );
      startAutoScroll();
    } else {
      // 不在边缘区域，停止自动滚动
      stopAutoScroll();
    }
  };

  // 开始自动滚动
  const startAutoScroll = () => {
    if (autoScrolling) return; // 已经在滚动中

    setAutoScrolling(true);
    // 清除可能存在的旧定时器
    if (autoScrollInfoRef.current.intervalId !== null) {
      clearInterval(autoScrollInfoRef.current.intervalId);
    }

    // 获取页面实际高度
    const maxScrollY =
      Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight
      ) - window.innerHeight;

    // 创建新的滚动定时器
    autoScrollInfoRef.current.intervalId = window.setInterval(() => {
      // 计算新的滚动位置
      const scrollAmount =
        autoScrollInfoRef.current.speed * autoScrollInfoRef.current.direction;
      const newScrollY = window.scrollY + scrollAmount;

      // 限制滚动范围
      if (newScrollY >= 0 && newScrollY <= maxScrollY) {
        window.scrollBy(0, scrollAmount);

        // 更新结束位置以反映新的滚动位置
        setCoords((prev) => ({
          ...prev,
          extendedEndY: Math.min(
            prev.extendedEndY + scrollAmount,
            maxScrollY + window.innerHeight
          ),
        }));
      } else {
        // 如果超出范围，停止自动滚动
        stopAutoScroll();
      }
    }, 16); // 约60fps
  };

  // 停止自动滚动
  const stopAutoScroll = () => {
    if (!autoScrolling) return;

    setAutoScrolling(false);
    if (autoScrollInfoRef.current.intervalId !== null) {
      clearInterval(autoScrollInfoRef.current.intervalId);
      autoScrollInfoRef.current.intervalId = null;
    }
  };

  // 确认截图
  const confirmScreenshot = () => {
    // 隐藏控制按钮
    setShowControls(false);
    // 开始捕获扩展选择区域
    captureArea();
  };

  // 捕获区域
  const captureArea = () => {
    // 防止用户交互
    setPreventInteraction(true);

    // 准备捕获参数
    const { startX, endX, extendedStartY, extendedEndY } = coords;
    const width = Math.abs(endX - startX);
    const startScrollY = Math.min(extendedStartY, extendedEndY);
    const endScrollY = Math.max(extendedStartY, extendedEndY);
    const left = Math.min(startX, endX);

    // 边框宽度和安全边距
    const borderWidth = 2;
    const safeMargin = 4;

    // 确保宽度不超出视口右边界
    const adjustedWidth = Math.min(
      width,
      window.innerWidth - left - (borderWidth + safeMargin)
    );

    // 计算相对间距
    const viewportHeight = window.innerHeight;
    const relativeOffset = startScrollY % viewportHeight;
    const areSingleImage = endScrollY - startScrollY <= viewportHeight;

    // 隐藏所有UI元素用于截图
    hideUIElementsForCapture();

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
      collectImages(
        startScrollY,
        endScrollY,
        left,
        adjustedWidth,
        startScrollY,
        Math.max(100, relativeOffset),
        [],
        areSingleImage
      );
    }, 300);
  };

  // 收集图像
  const collectImages = (
    startPos: number,
    endPos: number,
    left: number,
    width: number,
    lastTargetScrollY: number,
    relativeOffset: number,
    images: ScreenshotImage[] = [],
    areSingleImage = false
  ) => {
    // 更新进度
    const currentScrollY = lastTargetScrollY;
    // 获取视口高度
    const viewportHeight = window.innerHeight;

    // 再次隐藏UI元素
    hideUIElementsForCapture();

    // 短暂延迟确保UI隐藏
    setTimeout(() => {
      chrome.runtime.sendMessage(
        { action: 'captureVisibleTabForScroll' },
        (response) => {
          if (!response || !response.dataUrl) {
            console.error('无法捕获屏幕:', response?.error || '未知错误');
            cleanupScreenshot();
            message.error('截图失败，请重试');
            return;
          }

          const isFirstImage = images.length === 0;
          // 计算sourceY和sourceHeight，考虑重叠情况
          let sourceY = isFirstImage ? 0 : relativeOffset;
          let sourceHeight = isFirstImage
            ? viewportHeight
            : viewportHeight - relativeOffset;

          // 计算下一个滚动位置
          let nextScrollY = 0;
          // 预期滚动位置
          const expectedScrollY =
            currentScrollY + viewportHeight - relativeOffset;
          // 不可超越位置
          const maxScrollY = endPos - viewportHeight;

          // 与原始逻辑保持一致
          if (expectedScrollY >= maxScrollY) {
            nextScrollY = maxScrollY;
          } else {
            nextScrollY = expectedScrollY;
          }
          const isLastImage = currentScrollY >= endPos - viewportHeight;

          if (isLastImage && images.length > 1) {
            // 使用原始版本的计算方法
            sourceHeight = Math.abs(
              currentScrollY - images[images.length - 1].scrollY
            );
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
            images.push({
              dataUrl: response.dataUrl,
              scrollY: currentScrollY,
              sourceY,
              sourceHeight,
            });
          }

          if (isLastImage) {
            completeCapture(
              images,
              startPos,
              endPos,
              left,
              width,
              areSingleImage
            );
            return;
          }

          // 使用精确的滚动位置
          window.scrollTo({
            top: nextScrollY,
            behavior: 'instant',
          });

          // 等待滚动完成并稳定
          setTimeout(() => {
            collectImages(
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
    }, 50);
  };

  // 完成捕获
  const completeCapture = async (
    images: ScreenshotImage[],
    startScrollY: number,
    endScrollY: number,
    left: number,
    width: number,
    areSingleImage: boolean
  ) => {
    showToast('选定区域截图合并中...');
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
      cleanupScreenshot();
      message.error('截图处理失败，无法创建画布');
      return;
    }

    // 使用白色背景填充Canvas
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    try {
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

      // 使用原始的简单逻辑，减少出错几率
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
          img,
          sourceX,
          actualSourceY,
          sourceWidth,
          actualSourceHeight,
          0,
          actualDestY,
          canvas.width,
          actualSourceHeight
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

            showToast('选定区域截图已完成');
            // 更新全局状态，保存截图URL
            saveScreenshotToStore(finalImageUrl);
            cleanupScreenshot(areSingleImage);
          }, 500);
        }
      );
    } catch (error) {
      console.error('处理选定区域截图失败:', error);
      showToast('截图处理失败，请重试');
      // 更新全局状态为失败
      saveScreenshotToStore(null);
      cleanupScreenshot();
    }
  };

  // 隐藏UI元素用于截图
  const hideUIElementsForCapture = () => {
    if (selectionBoxRef.current) {
      selectionBoxRef.current.style.display = 'none';
    }
    if (overlayRef.current) {
      overlayRef.current.style.display = 'none';
    }
    if (controlPanelRef.current) {
      controlPanelRef.current.style.display = 'none';
    }

    // 隐藏所有以ai-assistant开头的动态元素，但排除进度指示器
    const dynamicElements = document.querySelectorAll('[id^="ai-assistant-"]');
    dynamicElements.forEach((element) => {
      if (element instanceof HTMLElement) {
        // 排除进度指示器及其相关元素
        if (element.id === 'ai-assistant-prevent-interaction') {
          return;
        }
        element.dataset.prevDisplay = element.style.display || 'block';
        element.style.display = 'none';
      }
    });
  };

  // 处理键盘事件
  const handleKeyDown = (e: KeyboardEvent) => {
    // ESC键取消截图
    if (e.key === 'Escape') {
      cleanupScreenshot();
    }
  };

  // 监听键盘事件
  useEffect(() => {
    if (visible) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [visible]);

  // 监听鼠标移动和释放事件
  useEffect(() => {
    if (selecting) {
      const mouseMoveHandler = (e: MouseEvent) => handleMouseMove(e);
      const mouseUpHandler = () => handleMouseUp();

      document.addEventListener('mousemove', mouseMoveHandler);
      document.addEventListener('mouseup', mouseUpHandler);

      return () => {
        document.removeEventListener('mousemove', mouseMoveHandler);
        document.removeEventListener('mouseup', mouseUpHandler);
      };
    }
  }, [selecting, coords]);

  // 更新选择框
  useEffect(() => {
    if (selecting || showControls) {
      updateSelectionBox();
    }
  }, [coords, selecting, showControls]);

  // 监听chrome消息，接收截图命令
  useEffect(() => {
    const messageListener = (
      message: any,
      sender: chrome.runtime.MessageSender,
      sendResponse: (response?: any) => void
    ) => {
      if (message.action === 'startAreaScreenshot') {
        startScreenshot();
        sendResponse({ success: true });
      }
      return true;
    };

    chrome.runtime.onMessage.addListener(messageListener);

    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, []);

  if (!visible) return null;

  return (
    <>
      <ScreenshotOverlay ref={overlayRef} onMouseDown={handleMouseDown} />

      <SelectionBox ref={selectionBoxRef} />

      {showControls && (
        <ControlPanel ref={controlPanelRef}>
          <Button type="primary" size="small" onClick={confirmScreenshot}>
            确认
          </Button>
          <Button size="small" onClick={() => cleanupScreenshot()}>
            取消
          </Button>
        </ControlPanel>
      )}

      {preventInteraction && <PreventInteraction />}

      {toast && <Toast>{toast}</Toast>}
    </>
  );
};

export default ScreenshotManager;
