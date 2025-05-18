import {
  AI_ASSISTANT_TRANSLATED,
  AI_ASSISTANT_TRANSLATED_CONTAINER,
  AI_ASSISTANT_TRANSLATED_WRAPPER,
  CUSTOM_LOADING_INJECT_STYLE,
  DisplayMode,
} from '@/constants/config';
import { useConfigStore } from '@/entrypoints/stores/configStore';
import {
  AttributeToTranslate,
  PieceToTranslate,
  useTranslationStore,
} from '@/entrypoints/stores/translationStore';
import { languages } from '@/utils/languages';
import {
  BLOCK_ELEMENTS,
  HTML_TAGS_INLINE_IGNORE,
  HTML_TAGS_INLINE_TEXT,
  HTML_TAGS_NO_TRANSLATE,
  PDF_SELECTORS_CONFIG,
  specialRules,
  TRANSLATE_MARK_ATTR,
} from './constants';
import { SpecialRule } from './types';

// 这些标记不能包含单词，例如 <customskipword>12</customskipword>34
// Google会重新排序为 <customskipword>1234</customskipword>
// 在某些情况下，Google会破坏翻译，在某些情况下返回startMark0
const startMark = '@%';
const endMark = '#$';
const startMark0 = '@ %';
const endMark0 = '# $';

// 根据当前URL获取特殊配置
export const getPageSpecialConfig = (): SpecialRule | null => {
  try {
    const {
      tabHostName: currentHostname,
      tabUrlWithoutSearch: currentUrlWithoutSearch,
    } = useTranslationStore.getState().ctx;
    // 遍历特殊规则列表，查找匹配的规则
    for (const specialRule of specialRules) {
      // 通过主机名匹配
      if (specialRule.hostname) {
        const hostnames = Array.isArray(specialRule.hostname)
          ? specialRule.hostname
          : [specialRule.hostname];
        if (hostnames.includes(currentHostname)) {
          return specialRule;
        }
      }

      // 通过正则表达式匹配
      if (specialRule.regex) {
        const regexes = Array.isArray(specialRule.regex)
          ? specialRule.regex
          : [specialRule.regex];
        for (const regex of regexes) {
          const reg = new RegExp(regex);
          if (reg.test(currentUrlWithoutSearch)) {
            return specialRule;
          }
        }
      }
    }

    // 检测Nitter网站
    const nitterMeta = document.querySelector('meta[property="og:site_name"]');
    if (nitterMeta && nitterMeta.getAttribute('content') === 'Nitter') {
      const nitterTweetContent = document.querySelector('.tweet-content');
      if (nitterTweetContent) {
        return {
          name: 'nitter',
          selectors: ['.tweet-content', '.quote-text'],
        };
      }
    }

    // 检测Mastodon网站
    const mastodonId = document.querySelector('div#mastodon');
    if (mastodonId) {
      return {
        name: 'mastodon',
        containerSelectors: 'div.status__content__text',
        detectLanguage: true,
      };
    }

    return null;
  } catch (error) {
    console.error('获取页面特殊配置失败:', error);
    return null;
  }
};

// 检测文本语言
export const detectLanguage = async (text: string): Promise<string | null> => {
  try {
    // 向后台发送消息请求检测语言
    const response = await chrome.runtime.sendMessage({
      action: 'detectLanguage',
      text: text,
    });

    return response;
  } catch (error) {
    console.error('语言检测失败:', error);
    return null;
  }
};

// 判断节点是否有效（是否需要翻译）
export const isValidNode = (node: Element): boolean => {
  // 检查节点是否已经被标记为翻译
  if (node.hasAttribute && node.hasAttribute(TRANSLATE_MARK_ATTR)) {
    return false;
  }

  // 检查节点是否在忽略列表或不翻译列表中，或者有其他禁止翻译的标记
  if (
    HTML_TAGS_INLINE_IGNORE.includes(node.nodeName) ||
    HTML_TAGS_NO_TRANSLATE.includes(node.nodeName) ||
    node.classList.contains('notranslate') ||
    node.getAttribute('translate') === 'no' ||
    (node as HTMLElement).isContentEditable
  ) {
    return false;
  }

  // 检查父节点是否有翻译标记
  if (
    node.parentNode &&
    node.parentNode instanceof Element &&
    node.parentNode.hasAttribute &&
    node.parentNode.hasAttribute(TRANSLATE_MARK_ATTR)
  ) {
    return false;
  }

  // 检查祖先元素是否有copiedNode标记
  if (
    node instanceof Element &&
    node.closest &&
    node.closest(`[${TRANSLATE_MARK_ATTR}=copiedNode]`)
  ) {
    return false;
  }

  // 检查是否为特殊的图片段落节点
  if (node.nodeName === 'P') {
    // 检查所有子节点
    const isIncludeImg = node.querySelector('img');
    if (isIncludeImg && node.childNodes.length < 3) {
      // 将其视为图片节点
      // 检查长度
      const innerText = (node as HTMLElement).innerText;
      if (innerText.length < 80) {
        return false;
      } else {
        return true;
      }
    }
  }

  // 不考虑文本内容样式，若文本为空则返回false，使用innerText判断
  if ((node as HTMLElement)?.innerText?.trim().length === 0) {
    return false;
  }

  // 检查节点是否隐藏
  if (node instanceof HTMLElement) {
    const computedStyle = window.getComputedStyle(node);
    if (
      computedStyle.display === 'none' ||
      computedStyle.visibility === 'hidden' ||
      computedStyle.opacity === '0' ||
      (computedStyle.height === '0px' && computedStyle.overflow === 'hidden') ||
      node.offsetParent === null
    ) {
      return false;
    }
  }

  return true;
};

// 判断子元素是否已经存在于数组中的某个元素的子孙节点中
const isDuplicatedChild = (array: Element[], child: Element): boolean => {
  for (const item of array) {
    if (item.contains(child)) {
      return true;
    }
  }
  return false;
};

// 获取主要内容容器
const getContainers = (
  root: Element,
  pageSpecialConfig: SpecialRule | null
): Element[] | null => {
  if (pageSpecialConfig && pageSpecialConfig.containerSelectors) {
    // 转换为数组
    const containerSelectors = Array.isArray(
      pageSpecialConfig.containerSelectors
    )
      ? pageSpecialConfig.containerSelectors
      : [pageSpecialConfig.containerSelectors];

    if (containerSelectors.length > 0) {
      const containers: Element[] = [];
      for (const selector of containerSelectors) {
        if (root && root.querySelectorAll) {
          const allContainers = root.querySelectorAll(selector);
          if (allContainers.length > 0) {
            allContainers.forEach((container) => {
              // 检查是否需要将BR转换为段落
              if (pageSpecialConfig.brToParagraph) {
                // 将连续的<br>标签替换为段落标签
                const pattern = new RegExp('<br/?>[ \\r\\n\\s]*<br/?>', 'g');
                container.innerHTML = container.innerHTML.replace(
                  pattern,
                  '</p><p>'
                );
              }
              containers.push(container);
            });
          }
        }
      }
      return containers.length > 0 ? containers : null;
    }
  }

  // 如果没有指定容器选择器，则尝试自动检测主要内容区域
  if (!(root && (root as HTMLElement).innerText)) {
    return null;
  }

  let selectedContainer: Element;
  const matched = (root as HTMLElement).innerText.match(/\S+/g);
  const numWordsOnPage = matched ? matched.length : 0;

  // 查找段落
  let ps = root.querySelectorAll('p');

  // 如果没有段落，则查找div
  if (ps.length === 0) {
    ps = root.querySelectorAll('div');
  }

  // 找到包含最多单词的元素
  let pWithMostWords = root;
  let highestWordCount = 0;

  // 遍历段落或div，找到包含单词最多的元素
  ps.forEach((p) => {
    if (
      checkAgainstBlacklist(p, 3) &&
      p instanceof HTMLElement &&
      p.offsetHeight !== 0
    ) {
      const myInnerText = (p as HTMLElement).innerText.match(/\S+/g);
      if (myInnerText) {
        const wordCount = myInnerText.length;
        if (wordCount > highestWordCount) {
          highestWordCount = wordCount;
          pWithMostWords = p;
        }
      }
    }
  });

  // 不断向上查找父元素，直到包含页面总词数的40%以上
  selectedContainer = pWithMostWords;
  let wordCountSelected = highestWordCount;

  while (
    wordCountSelected / numWordsOnPage < 0.4 &&
    selectedContainer !== root &&
    selectedContainer.parentElement &&
    (selectedContainer.parentElement as HTMLElement).innerText
  ) {
    selectedContainer = selectedContainer.parentElement;
    const match = (selectedContainer as HTMLElement).innerText.match(/\S+/g);
    wordCountSelected = match ? match.length : 0;
  }

  // 确保不选择单个p标签
  if (selectedContainer.tagName === 'P') {
    selectedContainer = selectedContainer.parentElement || selectedContainer;
  }

  return [selectedContainer];
};

// 检查元素是否在黑名单中
const blacklist = ['comment']; // 黑名单关键词
function checkAgainstBlacklist(elem: Element, level: number): Element | null {
  if (!elem) return null;

  const className = elem.className;
  const id = elem.id;

  // 检查类名或ID是否包含黑名单关键词
  const isBlackListed = blacklist.some((item) => {
    return (
      (typeof className === 'string' && className.indexOf(item) >= 0) ||
      (typeof id === 'string' && id.indexOf(item) >= 0)
    );
  });

  if (isBlackListed) {
    return null;
  }

  // 递归检查父元素，直到达到指定的层级或body
  const parent = elem.parentElement;
  if (level > 0 && parent && parent !== document.body) {
    return checkAgainstBlacklist(parent, level - 1);
  }

  return elem;
}

// 为节点添加包装器
const addWrapperToNode = (node: Node, wrapper: HTMLElement): void => {
  try {
    const parent = node.parentNode;
    if (!parent) return;

    // 使用包装器替换元素（作为子元素）
    parent.replaceChild(wrapper, node);
    // 将原始元素设置为包装器的子元素
    wrapper.appendChild(node);
  } catch (e) {
    console.error('添加包装器错误', e);
  }
};

// 还原页面原始内容
export const restorePage = () => {
  // 增加计数器，用于追踪翻译状态的变化
  useTranslationStore.getState().incrementFooCount();
  // 清空需要翻译的文本片段
  useTranslationStore.getState().setPiecesToTranslate([]);
  // 禁用DOM变化监视器
  disableMutationObserver();
  // 更新页面语言状态为"原始"
  useTranslationStore.getState().setPageLanguageState('original');
  // 恢复当前页面语言为原始标签语言
  const originalTabLanguage =
    useTranslationStore.getState().originalTabLanguage;
  useTranslationStore.getState().setCurrentPageLanguage(originalTabLanguage);
  try {
    // 移除复制的节点（用于双语显示）
    const copiedNodes = document.querySelectorAll(
      `[${TRANSLATE_MARK_ATTR}="copiedNode"]`
    );
    copiedNodes.forEach((node) => {
      if (node) {
        // 从DOM中完全移除复制的节点
        node.remove();
      }
    });

    // 恢复所有被翻译过的节点
    for (const ntr of useTranslationStore.getState().nodesToRestore) {
      (ntr.node as HTMLElement).replaceWith(ntr.original);
    }
    useTranslationStore.getState().clearNodesToRestore();

    // 恢复所有被翻译过的属性
    for (const ati of useTranslationStore.getState().attributesToTranslate) {
      if (ati.isTranslated) {
        ati.node.setAttribute(ati.attrName, ati.original);
      }
    }
    useTranslationStore.getState().clearAttributesToTranslate();
  } catch (error) {
    console.error('恢复页面失败:', error);
  }
};

// checkIsSameLanguage
const checkIsSameLanguage = (lang: string, langs: string[]): boolean => {
  // 修正语言代码
  const finalLang = languages.fixTLanguageCode(lang);
  if (!finalLang) {
    return false;
  }
  // 如果修正后的语言代码在给定的语言列表中，则认为相同
  if (langs.includes(finalLang)) {
    return true;
  }

  // for api does not has the best detect for zh-CN and zh-TW
  // we will treat zh-CN and zh-TW as same language
  // we focus on the dual language display, so zh-TW -> zh-CN is not the first priority to fix,
  // I think people will not use it to learn zh-TW to zh-CN
  // only is show dual language, we will treat zh-CN and zh-TW as same language
  // 如果显示双语且语言以"zh-"开头，并且给定的语言列表中包含以"zh-"开头的语言，则认为相同
  if (useConfigStore.getState().translation.displayMode === DisplayMode.DUAL) {
    if (finalLang.startsWith('zh-')) {
      // if langs , includes any lang starts with zh- , we will treat it as same language
      return langs.filter((lang) => lang.startsWith('zh-')).length > 0;
    } else {
      return false;
    }
  }
  return false;
};

// 递归判断其子孙节点，是否都是行内元素且行内元素均只包含文本节点
const onlyContainsTextNodes = (element: Node): boolean => {
  // 检查当前节点的子节点
  for (const child of Array.from(element.childNodes)) {
    // 如果是文本节点，则继续检查
    if (child.nodeType === Node.TEXT_NODE) {
      continue;
    }

    // 如果是元素节点但不是行内元素，返回false
    if (
      child.nodeType === Node.ELEMENT_NODE &&
      !HTML_TAGS_INLINE_TEXT.includes(child.nodeName)
    ) {
      return false;
    }

    // 递归检查子节点
    if (!onlyContainsTextNodes(child)) {
      return false;
    }
  }

  return true;
};

// 是否段落截断，双语对照情况，先处理样式
const clearLineClampRestriction = (node: Node) => {
  if (
    useConfigStore.getState().translation.displayMode === DisplayMode.DUAL &&
    node instanceof HTMLElement
  ) {
    const computedStyle = window.getComputedStyle(node);
    const lineClampValue =
      computedStyle.getPropertyValue('-webkit-line-clamp') ||
      computedStyle.getPropertyValue('line-clamp') ||
      '';
    if (lineClampValue && lineClampValue !== 'none') {
      // 解除line-clamp限制
      node.style.setProperty('-webkit-line-clamp', 'unset');
      node.style.setProperty('line-clamp', 'unset');
      node.style.maxHeight = 'unset';
    }
  }
};

// 获取需要翻译的节点
export const getNodesThatNeedToTranslate = async (
  root: Element
): Promise<any[]> => {
  const targetLanguage = useConfigStore.getState().translation.targetLanguage;
  const pageSpecialConfig = getPageSpecialConfig();
  const {
    tabHostName: currentHostname,
    tabUrlWithoutSearch: currentUrlWithoutSearch,
  } = useTranslationStore.getState().ctx;
  // 获取特殊选择器
  const allBlocksSelectors =
    pageSpecialConfig && pageSpecialConfig.selectors
      ? Array.isArray(pageSpecialConfig.selectors)
        ? pageSpecialConfig.selectors
        : [pageSpecialConfig.selectors]
      : [];
  const noTranslateSelectors =
    pageSpecialConfig && pageSpecialConfig.noTranslateSelectors
      ? Array.isArray(pageSpecialConfig.noTranslateSelectors)
        ? pageSpecialConfig.noTranslateSelectors
        : [pageSpecialConfig.noTranslateSelectors]
      : [];
  // 处理不翻译的选择器
  if (noTranslateSelectors.length > 0) {
    const noTranslateNodes = root.querySelectorAll(
      noTranslateSelectors.join(',')
    );
    for (const node of noTranslateNodes) {
      node.classList.add('notranslate');
    }
  }

  // 所有块节点，按从上到下的顺序
  let allNodes: Element[] = [];

  // 特殊网站处理
  let blockElementsList = [...BLOCK_ELEMENTS];

  // 如果页面特殊配置中有blockElements，则使用它
  if (pageSpecialConfig && pageSpecialConfig.blockElements) {
    blockElementsList = Array.isArray(pageSpecialConfig.blockElements)
      ? pageSpecialConfig.blockElements
      : [pageSpecialConfig.blockElements];
  }

  // 处理iframe容器
  let currentRoot = root;

  // 处理iframe容器
  if (pageSpecialConfig && pageSpecialConfig.iframeContainer) {
    const iframeContainer = root.querySelector(
      pageSpecialConfig.iframeContainer
    );
    if (
      iframeContainer &&
      iframeContainer instanceof HTMLIFrameElement &&
      iframeContainer.contentDocument
    ) {
      currentRoot = iframeContainer.contentDocument.body;
    }
  }

  // 如果有特殊选择器，使用它们查找节点
  if (allBlocksSelectors.length > 0) {
    // 使用选择器查找节点
    for (const selector of allBlocksSelectors) {
      if (currentRoot && currentRoot.querySelectorAll) {
        const nodes = currentRoot.querySelectorAll(selector);

        for (const node of nodes) {
          // 对于twitter等网站，检查节点语言是否与目标语言或永不翻译语言一致，如果是则跳过翻译
          if (
            currentHostname === 'twitter.com' ||
            currentHostname === 'twitterdesk.twitter.com' ||
            currentHostname === 'mobile.twitter.com'
          ) {
            // check language
            try {
              const lang = node.getAttribute('lang');
              if (lang && checkIsSameLanguage(lang, [targetLanguage])) {
                continue;
              }
            } catch (e) {
              console.error('checkIsSameLanguage error:', e);
              // ignore
            }
          }
          // 检查节点是否有效且未重复
          if (isValidNode(node) && !isDuplicatedChild(allNodes, node)) {
            allNodes.push(node);
          }
        }
      }
    }
  }
  // 使用TreeWalker遍历DOM树查找块级元素
  const contentContainers = getContainers(currentRoot, pageSpecialConfig);

  // 确定要遍历的容器
  let containers: Element[] = [];
  if (contentContainers && Array.isArray(contentContainers)) {
    containers = contentContainers;
  } else {
    containers = [currentRoot];
  }
  // 遍历每个容器
  for (const container of containers) {
    // 记录已经接受的节点
    const acceptedNodes = new Set();
    // 创建TreeWalker，只关注元素节点
    const treeWalker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_ELEMENT,
      {
        acceptNode: (node) => {
          // 检查是否是已接受节点的子节点
          let parent = node.parentNode;
          while (parent) {
            if (acceptedNodes.has(parent)) {
              return NodeFilter.FILTER_REJECT; // 拒绝已接受节点的子节点
            }
            parent = parent.parentNode;
          }
          // 无效节点直接拒绝
          if (!isValidNode(node as Element)) {
            // 拒绝该节点及其所有子节点，完全跳过这个分支
            return NodeFilter.FILTER_REJECT;
          }
          // 双语对照重写节点样式
          clearLineClampRestriction(node);
          // 块级节点，但子节点是文本，接受
          if (
            blockElementsList.includes(node.nodeName) &&
            Array.from(node.childNodes).every(
              (child) => child.nodeType === Node.TEXT_NODE
            )
          ) {
            acceptedNodes.add(node);
            return NodeFilter.FILTER_ACCEPT;
          }

          // 当前节点非块级节点，递归判断其子孙节点，是否都是行内元素且行内元素均只包含文本节点
          if (
            !blockElementsList.includes(node.nodeName) &&
            onlyContainsTextNodes(node)
          ) {
            acceptedNodes.add(node);
            return NodeFilter.FILTER_ACCEPT;
          }

          // 其他节点均跳过，继续递归
          return NodeFilter.FILTER_SKIP;
        },
      }
    );

    // 遍历DOM树并收集符合条件的节点
    let currentNode = treeWalker.nextNode();
    while (currentNode) {
      if (!isDuplicatedChild(allNodes, currentNode as Element)) {
        allNodes.push(currentNode as Element);
      }
      currentNode = treeWalker.nextNode();
    }
  }

  // 按从上到下的顺序排序节点
  allNodes.sort((a, b) => {
    return a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING
      ? -1
      : 1;
  });

  // 检查是否需要语言检测
  if (pageSpecialConfig && pageSpecialConfig.detectLanguage === true) {
    // 只在节点数量少于500时进行语言检测
    if (allNodes.length < 500) {
      const newAllNodes: Element[] = [];
      for (const node of allNodes) {
        const nodeText = (node as HTMLElement).innerText;
        if (nodeText && nodeText.trim().length > 0) {
          try {
            // 检测节点文本语言
            const detectedLang = await detectLanguage(nodeText);

            // 如果不是目标语言，则添加到翻译列表
            if (
              detectedLang &&
              !checkIsSameLanguage(detectedLang, [targetLanguage])
            ) {
              newAllNodes.push(node);
            }
          } catch (error) {
            console.error('语言检测失败:', error);
            // 如果检测失败，仍然添加节点（宁可错译也不漏译）
            newAllNodes.push(node);
          }
        }
      }
      allNodes = newAllNodes;
    }
  }

  // 若是pdf，则特殊处理
  if (new RegExp(PDF_SELECTORS_CONFIG.regex).test(currentUrlWithoutSearch)) {
    // 为需要翻译的节点创建复制节点，用于双语显示
    for (const node of allNodes) {
      const pdfContainer = document.createElement('div');
      pdfContainer.style.display = 'flex';
      addWrapperToNode(node, pdfContainer);
    }
  }
  // 是否双语对照，若是，则复制其节点到页面底部
  if (useConfigStore.getState().translation.displayMode === DisplayMode.DUAL) {
    const copiedNodes = allNodes.map((node) => [node, copyNodeToBottom(node)]);
    return copiedNodes;
  }
  return allNodes.map((node) => [node, null]);
};

export const copyNodeToBottom = (node: Element) => {
  /**
   * 复制节点下所有子节点，并插入到原节点最下方
   * 1. 双语对照时，判断原节点是否是块级元素，若是块级元素插入格式为：
   *  <原节点>
   *    <原节点子节点>...</原节点子节点>
   *    <font class添加notranslate container 增加一些边距样式>
   *      <br/>
   *      <font class="notranslate" ...双语对照样式>复制节点子节点</font>
   *    </font>
   *  </原节点>
   * 若是行内元素
   *  <原节点>
   *    <原节点子节点>...</原节点子节点>
   *    <font class添加notranslate container 增加一些边距样式>
   *      <font class="notranslate">&nbsp;&nbsp;</font>
   *      <font class="notranslate" ...双语对照样式>复制节点子节点</font>
   *    </font>
   *  </原节点>
   * 2. 非双语对照时，直接返回原节点
   */

  // 判断是否为块级元素：通过标签判断+通过实际样式判断
  const isBlockElement =
    BLOCK_ELEMENTS.includes(node.nodeName) ||
    (node as HTMLElement).style.display.includes('block') ||
    (node as HTMLElement).style.display.includes('flex') ||
    (node as HTMLElement).style.display.includes('grid') ||
    (node as HTMLElement).style.display.includes('table') ||
    (node as HTMLElement).style.display.includes('flow-root');

  // 创建翻译容器节点 - 主要是最外层包裹
  const translatedNodeWrapper = document.createElement('font');
  translatedNodeWrapper.classList.add(AI_ASSISTANT_TRANSLATED_WRAPPER);

  // 标记副本节点为已复制节点，以便后续恢复页面时能够识别和移除
  translatedNodeWrapper.setAttribute(TRANSLATE_MARK_ATTR, 'copiedNode');

  // 创建翻译节点容器 - 主要控制结构
  const translatedNodeContainer = document.createElement('div');
  translatedNodeContainer.classList.add(AI_ASSISTANT_TRANSLATED_CONTAINER);

  // 应用基础样式
  if (isBlockElement) {
    translatedNodeContainer.style.margin = '8px 0';
    translatedNodeContainer.style.display = 'inline-block';
  }
  // 其他样式直接在配置写入body

  // 创建翻译节点
  const translatedNode = document.createElement('font');
  translatedNode.classList.add(AI_ASSISTANT_TRANSLATED);
  translatedNode.innerHTML = node.innerHTML;
  translatedNodeContainer.appendChild(translatedNode);

  // 根据节点类型决定如何添加翻译内容
  if (isBlockElement) {
    // 块级元素：添加换行符后插入翻译节点
    const brElement = document.createElement('br');
    translatedNodeWrapper.appendChild(brElement);
    translatedNodeWrapper.appendChild(translatedNodeContainer);
  } else {
    // 行内元素：添加两个空格后插入翻译节点
    const spacer = document.createElement('font');
    spacer.innerHTML = '&nbsp;&nbsp;';
    spacer.setAttribute('notranslate', 'true');
    translatedNodeWrapper.appendChild(spacer);
    translatedNodeWrapper.appendChild(translatedNodeContainer);
  }

  // 初始时宽度缩小，不显示
  if (translatedNodeWrapper instanceof HTMLElement) {
    translatedNodeWrapper.style.display = 'none';
  }
  // 将复制节点插入到原节点所有子节点最后
  node.appendChild(translatedNodeWrapper);

  // 返回复制的节点，后续翻译结果将更新到这个节点中
  return translatedNodeWrapper;
};

// 获取需要翻译的节点
export const getPiecesToTranslate = (
  root = document.body,
  originalNode = null
): {
  isTranslated: boolean;
  parentElement: Element | null;
  nodes: Element[];
  originalElement: Element | null;
}[] => {
  // 初始化存储翻译片段的数组，每个片段包含多个节点和相关信息
  const piecesToTranslate: any[] = [
    {
      isTranslated: false, // 标记该片段是否已被翻译
      parentElement: null, // 所有节点的共同父元素
      nodes: [], // 实际需要翻译的节点数组
      originalElement: originalNode, // 添加根元素，即传入的node
    },
  ];
  let index = 0; // 当前处理的片段索引
  let currentParagraphSize = 0; // 当前段落大小，用于控制分段

  // 递归遍历DOM树获取所有需要翻译的节点
  const getAllNodes = function (
    node: any, // 当前处理的节点
    lastHTMLElement?: Element | null, // 最后一个HTML元素，用于定位
    lastSelectOrDataListElement?: Element | null // 最后一个SELECT或DATALIST元素，需特殊处理
  ) {
    // 处理元素节点(nodeType=1)和文档片段节点(nodeType=11)
    if (node.nodeType == 1 || node.nodeType == 11) {
      // 如果是文档片段节点(如Shadow DOM)
      if (node.nodeType == 11) {
        lastHTMLElement = node.host; // 使用宿主元素
        lastSelectOrDataListElement = null;
      } else if (node.nodeType == 1) {
        // 如果是普通元素节点
        lastHTMLElement = node;
        // 记录SELECT或DATALIST元素，因为它们的子元素OPTION需要特殊处理
        if (node.nodeName === 'SELECT' || node.nodeName === 'DATALIST')
          lastSelectOrDataListElement = node;

        // 跳过不需要翻译的节点类型
        if (
          HTML_TAGS_INLINE_IGNORE.indexOf(node.nodeName) !== -1 || // 忽略的内联元素
          HTML_TAGS_NO_TRANSLATE.indexOf(node.nodeName) !== -1 || // 不翻译的标签(如SCRIPT)
          node.classList.contains('notranslate') || // 有notranslate类
          node.getAttribute('translate') === 'no' || // translate属性为no
          node.isContentEditable // 可编辑内容
        ) {
          // 如果当前片段已有节点，创建新片段
          if (piecesToTranslate[index].nodes.length > 0) {
            currentParagraphSize = 0;
            // 添加新的空白片段
            piecesToTranslate.push({
              isTranslated: false,
              parentElement: null,
              nodes: [],
              originalElement: root, // 为新片段添加根元素
            });
            index++; // 移到下一个片段
          }
          return; // 跳过此节点的进一步处理
        }
      }

      // 处理子节点的辅助函数
      function getAllChilds(childNodes: any) {
        Array.from(childNodes).forEach((_node: any) => {
          // 记录元素节点
          if (_node.nodeType == 1) {
            lastHTMLElement = _node;
            if (_node.nodeName === 'SELECT' || _node.nodeName === 'DATALIST')
              lastSelectOrDataListElement = _node;
          }

          // 如果不是内联文本元素，则创建新的翻译片段
          // 这是关键逻辑：非内联文本元素会分割文本流
          if (HTML_TAGS_INLINE_TEXT.indexOf(_node.nodeName) == -1) {
            // 如果当前片段有内容，结束当前片段
            if (piecesToTranslate[index].nodes.length > 0) {
              currentParagraphSize = 0;
              // 创建新片段
              piecesToTranslate.push({
                isTranslated: false,
                parentElement: null,
                nodes: [],
                originalElement: root, // 为新片段添加根元素
              });
              index++;
            }
            // 递归处理这个非内联元素
            getAllNodes(_node, lastHTMLElement, lastSelectOrDataListElement);

            // 处理完后，如果有内容，再次创建新片段
            if (piecesToTranslate[index].nodes.length > 0) {
              currentParagraphSize = 0;
              piecesToTranslate.push({
                isTranslated: false,
                parentElement: null,
                nodes: [],
                originalElement: root, // 为新片段添加根元素
              });
              index++;
            }
          } else {
            // 对于内联文本元素，直接递归处理，不创建新片段
            // 这样可以保持内联元素的文本在同一翻译单元中
            getAllNodes(_node, lastHTMLElement, lastSelectOrDataListElement);
          }
        });
      }

      // 处理当前节点的所有子节点
      getAllChilds(node.childNodes);

      // 处理Shadow DOM
      if (node.shadowRoot) {
        getAllChilds(node.shadowRoot.childNodes);
      }
    } else if (node.nodeType == 3) {
      // 处理文本节点
      // 只处理非空文本
      if (node.textContent.trim().length > 0) {
        // 设置父元素(如果尚未设置)
        if (!piecesToTranslate[index].parentElement) {
          // 特殊处理SELECT/DATALIST内的OPTION
          if (
            node &&
            node.parentNode &&
            node.parentNode.nodeName === 'OPTION' &&
            lastSelectOrDataListElement
          ) {
            // 对于OPTION元素中的文本，使用SELECT作为父元素
            piecesToTranslate[index].parentElement =
              lastSelectOrDataListElement;
          } else {
            // 查找非内联元素作为父元素
            let temp = node.parentNode;
            // 向上遍历直到找到非内联元素
            while (
              temp &&
              temp != root &&
              (HTML_TAGS_INLINE_TEXT.indexOf(temp.nodeName) != -1 ||
                HTML_TAGS_INLINE_IGNORE.indexOf(temp.nodeName) != -1)
            ) {
              temp = temp.parentNode;
            }
            // 处理Shadow DOM
            if (temp && temp.nodeType === 11) {
              temp = temp.host;
            }
            piecesToTranslate[index].parentElement = temp;
          }
        }

        // 如果当前段落过大(>1000字符)，分割为新片段
        // 这是为了避免翻译单元过大，可能导致翻译质量下降
        if (currentParagraphSize > 1000) {
          currentParagraphSize = 0;
          // The important part - save the parent element for the next piece
          const pieceInfo = {
            isTranslated: false,
            parentElement: null,
            nodes: [],
            originalElement: root, // 为新片段添加根元素
          };
          pieceInfo.parentElement = piecesToTranslate[index].parentElement;
          piecesToTranslate.push(pieceInfo);
          index++;
        }

        // 累加当前段落大小
        currentParagraphSize += node.textContent.length;
        // 添加文本节点到当前翻译片段
        piecesToTranslate[index].nodes.push(node);
      }
    }
  };

  // 从根节点开始递归处理
  getAllNodes(root);

  // 移除最后一个空片段(如果存在)
  if (
    piecesToTranslate.length > 0 &&
    piecesToTranslate[piecesToTranslate.length - 1].nodes.length == 0
  ) {
    piecesToTranslate.pop();
  }

  // 返回待翻译片段数组
  return piecesToTranslate;
};

// 获取需要翻译的属性（如placeholder, alt, title等）
export const getAttributesToTranslate = (root = document.body): any[] => {
  const attributesToTranslate: any[] = [];
  const placeholdersElements = root.querySelectorAll(
    'input[placeholder], textarea[placeholder]'
  );
  const altElements = root.querySelectorAll(
    'area[alt], img[alt], input[type="image"][alt]'
  );
  // const valueElements = root.querySelectorAll('input[type="button"], input[type="submit"], input[type="reset"]')
  const valueElements: any[] = [];
  const titleElements = root.querySelectorAll('body [title]');

  function hasNoTranslate(elem: any) {
    if (
      elem &&
      (elem.classList.contains('notranslate') ||
        elem.getAttribute('translate') === 'no')
    ) {
      return true;
    }
  }

  placeholdersElements.forEach((e) => {
    if (hasNoTranslate(e)) return;

    const txt = e.getAttribute('placeholder');
    if (txt && txt.trim()) {
      attributesToTranslate.push({
        node: e,
        original: txt,
        attrName: 'placeholder',
      });
    }
  });

  altElements.forEach((e) => {
    if (hasNoTranslate(e)) return;

    const txt = e.getAttribute('alt');
    if (txt && txt.trim()) {
      attributesToTranslate.push({
        node: e,
        original: txt,
        attrName: 'alt',
      });
    }
  });

  valueElements.forEach((e) => {
    if (hasNoTranslate(e)) return;

    const txt = e.getAttribute('value');
    if (e.type == 'submit' && !txt) {
      attributesToTranslate.push({
        node: e,
        original: 'Submit Query',
        attrName: 'value',
      });
    } else if (e.type == 'reset' && !txt) {
      attributesToTranslate.push({
        node: e,
        original: 'Reset',
        attrName: 'value',
      });
    } else if (txt && txt.trim()) {
      attributesToTranslate.push({
        node: e,
        original: txt,
        attrName: 'value',
      });
    }
  });

  titleElements.forEach((e) => {
    if (hasNoTranslate(e)) return;

    const txt = e.getAttribute('title');
    if (txt && txt.trim()) {
      attributesToTranslate.push({
        node: e,
        original: txt,
        attrName: 'title',
      });
    }
  });
  return attributesToTranslate;
};

// 修改isInScreen函数以支持处理隐藏元素
export const isInScreen = (element: Element | null): boolean => {
  if (!element) return false;

  // 检查元素是否为被标记为copiedNode
  if (
    element.getAttribute &&
    element.getAttribute(TRANSLATE_MARK_ATTR) === 'copiedNode'
  ) {
    // 对于复制节点，检查其父元素是否在屏幕中
    return element.parentElement ? isInScreen(element.parentElement) : false;
  }

  // 检查元素是否显示
  const computedStyle = window.getComputedStyle(element);
  if (computedStyle.display === 'none') {
    // 对于隐藏元素，检查其父元素是否在屏幕中
    return element.parentElement ? isInScreen(element.parentElement) : false;
  }

  // 获取元素位置
  const rect = element.getBoundingClientRect();

  // 判断元素是否在视口中
  return (
    (rect.top > 0 && rect.top <= window.innerHeight) ||
    (rect.bottom > 0 && rect.bottom <= window.innerHeight)
  );
};

// 添加loading图标到待翻译节点
export const addLoadingIconToNode = (node: Element) => {
  // 检查其内部节点是否存在loading图标
  if (node.querySelector('.ai-assistant-loading-icon')) {
    return;
  }

  // 创建loading图标元素 - 使用Ant Design的loading图标样式
  const loadingIcon = document.createElement('span');
  loadingIcon.classList.add('ai-assistant-loading-icon');
  loadingIcon.style.display = 'inline-flex';
  loadingIcon.style.alignItems = 'center';
  loadingIcon.style.justifyContent = 'center';
  loadingIcon.style.width = '18px';
  loadingIcon.style.height = '18px';
  loadingIcon.style.marginLeft = '6px';
  loadingIcon.style.verticalAlign = 'middle';
  loadingIcon.style.position = 'relative';
  loadingIcon.style.top = '-1px'; // 微调以确保完全垂直居中

  // 使用紫色主题加载图标
  loadingIcon.innerHTML = `
    <svg viewBox="0 0 1024 1024" focusable="false" data-icon="loading" width="1em" height="1em" fill="#8A2BE2" aria-hidden="true">
      <path d="M988 548c-19.9 0-36-16.1-36-36 0-59.4-11.6-117-34.6-171.3a440.45 440.45 0 00-94.3-139.9 437.71 437.71 0 00-139.9-94.3C629 83.6 571.4 72 512 72c-19.9 0-36-16.1-36-36s16.1-36 36-36c69.1 0 136.2 13.5 199.3 40.3C772.3 66 827 103 874 150c47 47 83.9 101.8 109.7 162.7 26.7 63.1 40.2 130.2 40.2 199.3.1 19.9-16 36-35.9 36z"></path>
    </svg>
  `;

  // 添加旋转动画样式，使loading图标旋转起来
  // 检查是否已注入样式，避免重复注入
  if (!document.getElementById(CUSTOM_LOADING_INJECT_STYLE)) {
    const style = document.createElement('style');
    style.id = CUSTOM_LOADING_INJECT_STYLE;
    style.textContent = `
      @keyframes ai-assistant-rotate {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      .ai-assistant-loading-icon svg {
        animation: ai-assistant-rotate 1s linear infinite;
      }
    `;
    document.head.appendChild(style);
  }

  // 将loading图标插入到其最后子节点后
  node.appendChild(loadingIcon);
};

// 移除节点的loading图标
export const removeLoadingIconFromNode = (node: Element) => {
  // 获取节点子节点内loading图标并移除
  const loadingIcon = node.querySelector('.ai-assistant-loading-icon');
  if (loadingIcon) {
    node.removeChild(loadingIcon);
  }
};

// 翻译页面
export const translatePage = async () => {
  const targetLanguage = useConfigStore.getState().translation.targetLanguage;
  // 增加计数器，用于追踪翻译状态的变化
  useTranslationStore.getState().incrementFooCount();
  // 首先恢复页面到原始状态
  restorePage();
  try {
    // 获取需要翻译的节点，并从中提取需要翻译的文本片段
    const newPiecesToTranslate = (
      await getNodesThatNeedToTranslate(document.body)
    ).reduce((acc, [node, copiedNode]) => {
      return acc.concat(getPiecesToTranslate(copiedNode ?? node, node));
    }, []);
    useTranslationStore.getState().setPiecesToTranslate(newPiecesToTranslate);
  } catch (error) {
    console.error('获取需要翻译的片段失败', error);
    throw error;
  }
  // 获取需要翻译的属性
  const attributesToTranslate = getAttributesToTranslate();
  useTranslationStore
    .getState()
    .setAttributesToTranslate(attributesToTranslate);
  // 更新页面语言状态为"已翻译"
  useTranslationStore.getState().setPageLanguageState('translated');
  // 更新当前页面语言为目标语言
  useTranslationStore.getState().setCurrentPageLanguage(targetLanguage);
  // 启用DOM变化监视器，用于检测动态添加的内容
  enableMutationObserver();
  // 将自定义词典转换为压缩映射
  const customDictionary =
    useConfigStore.getState().translation.customDictionary;
  Object.entries(customDictionary).forEach(([key], index) => {
    compressionMap[index + 1] = key;
  });

  // 开始动态翻译页面
  translateDynamically();
};

let translateNewNodesTimerHandler: NodeJS.Timeout;
// DOM变化监视器
const mutationObserver = new MutationObserver(function (mutations) {
  const piecesToTranslate: Element[] = [];

  mutations.forEach((mutation) => {
    mutation.addedNodes.forEach((addedNode) => {
      if (HTML_TAGS_NO_TRANSLATE.indexOf(addedNode.nodeName) == -1) {
        if (HTML_TAGS_INLINE_TEXT.indexOf(addedNode.nodeName) == -1) {
          if (HTML_TAGS_INLINE_IGNORE.indexOf(addedNode.nodeName) == -1) {
            piecesToTranslate.push(addedNode as Element);
          }
        }
      }
    });

    mutation.removedNodes.forEach((removedNode) => {
      useTranslationStore.getState().addRemovedNode(removedNode as Element);
    });
  });

  piecesToTranslate.forEach((ptt) => {
    if (useTranslationStore.getState().newNodes.indexOf(ptt) == -1) {
      useTranslationStore.getState().addNewNode(ptt);
    }
  });
});

// 禁用DOM变化监视器
export function disableMutationObserver() {
  if (translateNewNodesTimerHandler) {
    clearInterval(translateNewNodesTimerHandler);
  }
  useTranslationStore.getState().clearNodes();
  mutationObserver.disconnect();
  mutationObserver.takeRecords();
}

// 启用DOM变化监视器
export function enableMutationObserver() {
  disableMutationObserver();

  translateNewNodesTimerHandler = setInterval(translateNewNodes, 2000);
  mutationObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

// 动态节点翻译
async function translateNewNodes() {
  try {
    for (const nn of useTranslationStore.getState().newNodes) {
      // 跳过已经移除的节点
      if (useTranslationStore.getState().removedNodes.indexOf(nn) != -1)
        continue;

      // 获取需要翻译的内容
      const newPiecesToTranslate = (
        await getNodesThatNeedToTranslate(nn)
      ).reduce((acc, [node, copiedNode]) => {
        return acc.concat(getPiecesToTranslate(copiedNode ?? node, node));
      }, []);

      // 过滤掉已经存在于翻译状态中的节点
      for (const i in newPiecesToTranslate) {
        let finded = false;

        for (const ntt of useTranslationStore.getState().piecesToTranslate) {
          if (
            ntt.nodes.some((n1) =>
              newPiecesToTranslate[i].nodes.some((n2: Node) => n1 === n2)
            )
          ) {
            finded = true;
          }
        }

        if (!finded) {
          // 添加loading图标
          newPiecesToTranslate.forEach((node: any) => {
            addLoadingIconToNode(node.originalElement);
          });
          // 添加到待翻译列表
          useTranslationStore
            .getState()
            .addPieceToTranslate(newPiecesToTranslate[i]);
        }
      }
    }
  } catch (e) {
    console.error('translateNewNodes error:', e);
  } finally {
    // 清理节点列表
    useTranslationStore.getState().clearNodes();
  }
}

// 处理翻译文本中的关键词，如果有自定义替换值则替换它。
// 当遇到Google翻译重新排序，原始文本包含我们的标记等情况时，我们会捕获这些异常并调用文本翻译方法重新翻译这部分内容。
async function handleCustomWords(translated: string, originalText: string) {
  try {
    const customDictionary =
      useConfigStore.getState().translation.customDictionary;
    if (Object.keys(customDictionary).length > 0) {
      translated = removeExtraDelimiter(translated);
      // 使用正则表达式替换所有匹配项，兼容低版本浏览器
      translated = translated.replace(new RegExp(startMark0, 'g'), startMark);
      translated = translated.replace(new RegExp(endMark0, 'g'), endMark);

      // 处理全角字符 - 转换常见的全角字符为半角字符
      const fullWidthToHalfWidth = (str: string): string => {
        // 全角转半角字符映射
        const map: Record<string, string> = {
          '＠': '@',
          '％': '%',
          '＃': '#',
          '＄': '$',
        };

        let result = str;
        for (const [fullWidth, halfWidth] of Object.entries(map)) {
          result = result.replace(new RegExp(fullWidth, 'g'), halfWidth);
        }
        return result;
      };

      // 转换全角字符为半角字符
      translated = fullWidthToHalfWidth(translated);

      while (true) {
        // 寻找标记
        const startIndex = translated.indexOf(startMark);
        const endIndex = translated.indexOf(endMark);

        if (startIndex === -1 && endIndex === -1) {
          break;
        } else if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
          // 处理不匹配的标记
          console.warn('标记不匹配，跳过处理', startIndex, endIndex);
          break;
        } else {
          const placeholderText = translated.substring(
            startIndex + startMark.length,
            endIndex
          );

          // 此时placeholderText实际上是currentIndex，真实值在compressionMap中
          const keyWord = handleHitKeywords(placeholderText, false);

          // 安全检查
          if (!keyWord || keyWord === 'undefined') {
            // 尝试移除标记并继续处理
            const frontPart = translated.substring(0, startIndex);
            const backPart = translated.substring(endIndex + endMark.length);
            translated = frontPart + placeholderText + backPart;
            continue;
          }

          // 准备替换
          let frontPart = translated.substring(0, startIndex);
          let backPart = translated.substring(endIndex + endMark.length);

          // 寻找自定义词典中的匹配项
          // 首先转换keyWord为小写
          const keyWordLower = typeof keyWord === 'string' ? keyWord.toLowerCase() : String(keyWord).toLowerCase();

          // 尝试找到精确匹配的词
          let customValue = String(keyWord); // 默认使用原始关键词
          let foundMatch = false;

          for (const dictKey of Object.keys(customDictionary)) {
            if (dictKey.toLowerCase() === keyWordLower) {
              customValue = customDictionary[dictKey] || String(keyWord);
              foundMatch = true;
              break;
            }
          }

          // 高亮自定义词，在其前后添加空格
          frontPart = isPunctuationOrDelimiter(
            frontPart.charAt(frontPart.length - 1)
          )
            ? frontPart
            : frontPart + ' ';
          backPart = isPunctuationOrDelimiter(backPart.charAt(0))
            ? backPart
            : ' ' + backPart;

          translated = frontPart + customValue + backPart;
        }
      }
    }
  } catch (e) {
    console.error('handleCustomWords error:', e);
    return await backgroundTranslateSingleText(originalText);
  }

  return translated;
}

// 向后台发送请求翻译单个文本
function backgroundTranslateSingleText(sourceArray2d: string) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      {
        action: 'translateSingleText',
        serviceName: useConfigStore.getState().translation.translationService,
        sourceLanguage: useTranslationStore.getState().originalTabLanguage,
        targetLanguage: useConfigStore.getState().translation.targetLanguage,
        sourceArray2d,
      },
      (response) => {
        resolve(response);
      }
    );
  });
}

// 翻译结果
async function translateResults(
  piecesToTranslateNow: PieceToTranslate[],
  results: any
) {
  for (const i in piecesToTranslateNow) {
    // 移除loading图标
    removeLoadingIconFromNode(
      piecesToTranslateNow[i].originalElement as Element
    );
    for (const j in piecesToTranslateNow[i].nodes) {
      if (results[i][j]) {
        const nodes = piecesToTranslateNow[i].nodes;
        const translated = results[i][j] + ' ';
        // 单纯复制节点
        const newNode = nodes[j] as Element;

        // 不再尝试修改nodes[j]，而是直接使用返回的新节点
        useTranslationStore.getState().addNodeToRestore({
          node: newNode,
          original: nodes[j]?.textContent || '',
        });

        const result = (await handleCustomWords(
          translated || '',
          newNode.textContent || ''
        )) as string;
        newNode.textContent = result;
        // 替换原节点
        nodes[j].textContent = result;

        // 如果是双语对照，恢复复制节点显示
        if (
          useConfigStore.getState().translation.displayMode === DisplayMode.DUAL
        ) {
          const originalElement = piecesToTranslateNow[i].originalElement;
          if (originalElement) {
            const copiedNode = originalElement.querySelector(
              `[${TRANSLATE_MARK_ATTR}="copiedNode"]`
            );
            if (
              copiedNode instanceof HTMLElement &&
              copiedNode.style.display === 'none'
            ) {
              copiedNode.style.removeProperty('display');
            }
          }
        }
      }
    }
  }
  mutationObserver.takeRecords();
}

// 向后台发送请求翻译文本数组
function backgroundTranslateText(sourceArray2d: any) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      {
        action: 'translateText',
        serviceName: useConfigStore.getState().translation.translationService,
        sourceLanguage: useTranslationStore.getState().originalTabLanguage,
        targetLanguage: useConfigStore.getState().translation.targetLanguage,
        sourceArray2d,
      },
      (response) => {
        resolve(response);
      }
    );
  });
}

// 动态翻译
async function translateDynamically() {
  try {
    const piecesToTranslate = useTranslationStore.getState().piecesToTranslate;
    const pageIsVisible = useTranslationStore.getState().pageIsVisible;
    if (piecesToTranslate && pageIsVisible) {
      const currentFooCount = useTranslationStore.getState().fooCount;

      const piecesToTranslateNow: PieceToTranslate[] = [];
      piecesToTranslate.forEach((ptt, index) => {
        // 使用rootElement来判断是否在视图中
        if (!ptt.isTranslated) {
          if (isInScreen(ptt.originalElement)) {
            // 不直接修改原对象，而是通过store更新
            useTranslationStore.getState().updatePieceTranslated(index, true);
            piecesToTranslateNow.push(ptt);
          }
        }
      });

      const attributesToTranslateNow: AttributeToTranslate[] = [];
      const attributesToTranslate =
        useTranslationStore.getState().attributesToTranslate;
      attributesToTranslate.forEach((ati, index) => {
        if (!ati.isTranslated) {
          if (isInScreen(ati.node)) {
            // 不直接修改原对象，而是通过store更新
            useTranslationStore
              .getState()
              .updateAttributeTranslated(index, true);
            attributesToTranslateNow.push(ati);
          }
        }
      });

      if (piecesToTranslateNow.length > 0) {
        // 为待翻译节点加上loading图标
        piecesToTranslateNow.forEach((ptt) => {
          // 给originalElement加上loading图标
          addLoadingIconToNode(ptt.originalElement as Element);
        });

        const results = await backgroundTranslateHTML(
          piecesToTranslateNow.map((ptt) =>
            ptt.nodes.map((node) => {
              return filterKeywordsInText(node.textContent || '');
            })
          )
        );
        if (
          useTranslationStore.getState().pageLanguageState === 'translated' &&
          currentFooCount === useTranslationStore.getState().fooCount
        ) {
          await translateResults(piecesToTranslateNow, results);
        }
      }

      if (attributesToTranslateNow.length > 0) {
        backgroundTranslateText(
          attributesToTranslateNow.map((ati) => ati.original)
        ).then((results) => {
          if (
            useTranslationStore.getState().pageLanguageState === 'translated' &&
            currentFooCount === useTranslationStore.getState().fooCount
          ) {
            translateAttributes(attributesToTranslateNow, results);
          }
        });
      }
    }
  } catch (e) {
    console.error('translateDynamically error:', e);
  }
  setTimeout(translateDynamically, 1500);
}

// 翻译属性
function translateAttributes(
  attributesToTranslateNow: AttributeToTranslate[],
  results: any
) {
  for (const i in attributesToTranslateNow) {
    const ati = attributesToTranslateNow[i];
    ati.node.setAttribute(ati.attrName, results[i]);
  }
}

// 翻译HTML
async function backgroundTranslateHTML(sourceArray2d: string[][]) {
  const serviceName = useConfigStore.getState().translation.translationService;
  const sourceLanguage = useTranslationStore.getState().originalTabLanguage;
  const targetLanguage = useConfigStore.getState().translation.targetLanguage;
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(
      {
        action: 'translateHTML',
        serviceName,
        sourceLanguage,
        targetLanguage,
        sourceArray2d,
      },
      (response) => {
        resolve(response);
      }
    );
  });
}

// 移除可能影响语义的无用换行符和多余空格
function removeExtraDelimiter(textContext: string) {
  if (!textContext) return '';
  textContext = textContext.replace(/\n/g, ' ');
  textContext = textContext.replace(/  +/g, ' ');
  return textContext;
}

// 任何类型的标点符号（包括国际标点符号，例如中文和西班牙语标点符号）以及空格、换行符
// 这个函数用于检测字符是否为标点符号或分隔符
function isPunctuationOrDelimiter(str: string) {
  if (typeof str !== 'string') return false;
  if (str === '\n' || str === ' ') return true;
  const regex =
    // eslint-disable-next-line no-useless-escape, no-misleading-character-class
    /[\$\uFFE5\^\+=`~<>{}\[\]|\u00A0|\u2002|\u2003|\u2009|\u200C|\u200D|\u3002|\uff1f|\uff01|\uff0c|\u3001|\uff1b|\uff1a|\u201c|\u201d|\u2018|\u2019|\uff08|\uff09|\u300a|\u300b|\u3010|\u3011|\u007e!-#%-\x2A,-/:;\x3F@\x5B-\x5D_\x7B}\u00A1\u00A7\u00AB\u00B6\u00B7\u00BB\u00BF\u037E\u0387\u055A-\u055F\u0589\u058A\u05BE\u05C0\u05C3\u05C6\u05F3\u05F4\u0609\u060A\u060C\u060D\u061B\u061E\u061F\u066A-\u066D\u06D4\u0700-\u070D\u07F7-\u07F9\u0830-\u083E\u085E\u0964\u0965\u0970\u0AF0\u0DF4\u0E4F\u0E5A\u0E5B\u0F04-\u0F12\u0F14\u0F3A-\u0F3D\u0F85\u0FD0-\u0FD4\u0FD9\u0FDA\u104A-\u104F\u10FB\u1360-\u1368\u1400\u166D\u166E\u169B\u169C\u16EB-\u16ED\u1735\u1736\u17D4-\u17D6\u17D8-\u17DA\u1800-\u180A\u1944\u1945\u1A1E\u1A1F\u1AA0-\u1AA6\u1AA8-\u1AAD\u1B5A-\u1B60\u1BFC-\u1BFF\u1C3B-\u1C3F\u1C7E\u1C7F\u1CC0-\u1CC7\u1CD3\u2010-\u2027\u2030-\u2043\u2045-\u2051\u2053-\u205E\u207D\u207E\u208D\u208E\u2329\u232A\u2768-\u2775\u27C5\u27C6\u27E6-\u27EF\u2983-\u2998\u29D8-\u29DB\u29FC\u29FD\u2CF9-\u2CFC\u2CFE\u2CFF\u2D70\u2E00-\u2E2E\u2E30-\u2E3B\u3001-\u3003\u3008-\u3011\u3014-\u301F\u3030\u303D\u30A0\u30FB\uA4FE\uA4FF\uA60D-\uA60F\uA673\uA67E\uA6F2-\uA6F7\uA874-\uA877\uA8CE\uA8CF\uA8F8-\uA8FA\uA92E\uA92F\uA95F\uA9C1-\uA9CD\uA9DE\uA9DF\uAA5C-\uAA5F\uAADE\uAADF\uAAF0\uAAF1\uABEB\uFD3E\uFD3F\uFE10-\uFE19\uFE30-\uFE52\uFE54-\uFE61\uFE63\uFE68\uFE6A\uFE6B\uFF01-\uFF03\uFF05-\uFF0A\uFF0C-\uFF0F\uFF1A\uFF1B\uFF1F\uFF20\uFF3B-\uFF3D\uFF3F\uFF5B\uFF5D\uFF5F-\uFF65]+/g;
  return regex.test(str);
}

// 在发送到翻译引擎之前，将匹配的关键词转换为特殊数字字符串以跳过翻译。
// 对于英文单词，匹配时忽略大小写。
// 但对于单词"app"，我们不希望"Happy"也被匹配。
// 因此，我们通过检查关键词前后的两个字符来仅匹配孤立的单词。
// 但这也会导致此方法对于没有空格的中文、缅甸语和其他语言不起作用。
function filterKeywordsInText(textContext: string) {
  // 从configStore获取自定义词典
  const customDictionary =
    useConfigStore.getState().translation.customDictionary;
  if (Object.keys(customDictionary).length > 0) {
    // reordering , we want to match the keyword "Spring Boot" first then the keyword "Spring"
    // 重新排序，我们希望先匹配关键词"Spring Boot"，然后再匹配关键词"Spring"
    const sortedEntries = Object.entries(customDictionary).sort(
      (a, b) => b[0].length - a[0].length
    );
    for (const [keyWord] of sortedEntries) {
      while (true) {
        const index = textContext.indexOf(keyWord);
        if (index === -1) {
          break;
        } else {
          textContext = removeExtraDelimiter(textContext);
          const previousIndex = index - 1;
          const nextIndex = index + keyWord.length;
          const previousChar =
            previousIndex === -1 ? '\n' : textContext.charAt(previousIndex);
          const nextChar =
            nextIndex === textContext.length
              ? '\n'
              : textContext.charAt(nextIndex);
          let placeholderText = '';
          const keyWordWithCase = textContext.substring(
            index,
            index + keyWord.length
          );
          if (
            isPunctuationOrDelimiter(previousChar) &&
            isPunctuationOrDelimiter(nextChar)
          ) {
            // 如果关键词前后都是标点符号或分隔符，则使用标记包装关键词
            placeholderText =
              startMark + handleHitKeywords(keyWordWithCase, true) + endMark;
          } else {
            // 否则在每个字符之间添加特殊标记
            placeholderText = '#n%o#';
            for (const c of Array.from(keyWordWithCase)) {
              placeholderText += c;
              placeholderText += '#n%o#';
            }
          }
          const frontPart = textContext.substring(0, index);
          const backPart = textContext.substring(index + keyWord.length);
          textContext = frontPart + placeholderText + backPart;
        }
      }
      textContext = textContext.replace(/#n%o#/g, '');
    }
  }
  return textContext;
}

// number为索引从1开始自增，string为关键词
const compressionMap: Record<number, string> = {};
// True：将关键词存储在Map中并返回索引
// False：通过索引提取关键词
function handleHitKeywords(value: string, mode: boolean) {
  if (mode) {
    // 根据value在compressionMap中找到对应的索引
    const index = Object.values(compressionMap).indexOf(value);
    return String(index + 1);
  } else {
    return String(compressionMap[Number(value)]);
  }
}

// 检测页面语言的辅助函数
export function detectPageLanguage() {
  return new Promise((resolve, reject) => {
    // 首先尝试从HTML元素的lang属性获取
    // if (document.documentElement && document.documentElement.lang) {
    //   resolve(document.documentElement.lang);
    // } else {
    // 如果无法从HTML元素获取，则使用语言检测API
    if (document.body && document.body.innerText) {
      chrome.runtime.sendMessage(
        {
          action: 'detectLanguage',
          text: document.body.innerText,
        },
        (response) => {
          resolve(response);
        }
      );
    } else {
      // 如果没有文本内容，则无法检测
      resolve(undefined);
    }
    // }
  });
}
