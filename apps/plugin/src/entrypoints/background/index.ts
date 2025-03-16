import browser from 'webextension-polyfill';

export default defineBackground(() => {
  console.log('Background script loaded');

  // 监听消息
  browser.runtime.onMessage.addListener((message, sender) => {
    console.log('Received message:', message, 'from:', sender);
    // 处理消息
    return Promise.resolve('Response from background script');
  });
});
