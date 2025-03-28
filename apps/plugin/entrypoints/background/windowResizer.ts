export function resizeWindow(width: number, height: number) {
  console.log(`Resizing window to ${width}x${height}`);
  // 调整浏览器窗口尺寸
  // 获取当前窗口
  chrome.windows.getCurrent((window) => {
    if (!window.id) {
      console.error('Cannot get current window ID');
      return;
    }

    // 保持窗口当前的左上角位置不变
    chrome.windows
      .update(window.id, {
        width,
        height,
      })
      .then(() => {
        console.log(`Window resized to ${width}x${height}`);
      })
      .catch((error) => {
        console.error('Error resizing window:', error);
      });
  });
}
