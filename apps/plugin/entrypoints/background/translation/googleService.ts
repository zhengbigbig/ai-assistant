/**
 * Google翻译服务实现
 */
import { createBaseTranslationService } from './baseService';
import { escapeHTML, unescapeHTML } from './utils';
import { TranslationServiceProvider } from './types';

/**
 * Google翻译TKK值
 */
const GOOGLE_TRANSLATE_TKK = '448487.932609646';

/**
 * 位移和求和或异或操作
 */
function shiftLeftOrRightThenSumOrXor(num: number, optString: string): number {
  for (let i = 0; i < optString.length - 2; i += 3) {
    let acc: string | number = optString.charAt(i + 2);
    if ('a' <= acc) {
      acc = acc.charCodeAt(0) - 87;
    } else {
      acc = Number(acc);
    }
    if (optString.charAt(i + 1) == '+') {
      acc = num >>> acc;
    } else {
      acc = num << acc;
    }
    if (optString.charAt(i) == '+') {
      num += acc & 4294967295;
    } else {
      num ^= acc;
    }
  }
  return num;
}

/**
 * 转换查询字符串为字节数组
 */
function transformQuery(query: string): number[] {
  const bytesArray: number[] = [];
  let idx = 0;
  for (let i = 0; i < query.length; i++) {
    let charCode = query.charCodeAt(i);

    if (128 > charCode) {
      bytesArray[idx++] = charCode;
    } else {
      if (2048 > charCode) {
        bytesArray[idx++] = (charCode >> 6) | 192;
      } else {
        if (
          55296 == (charCode & 64512) &&
          i + 1 < query.length &&
          56320 == (query.charCodeAt(i + 1) & 64512)
        ) {
          charCode =
            65536 +
            ((charCode & 1023) << 10) +
            (query.charCodeAt(++i) & 1023);
          bytesArray[idx++] = (charCode >> 18) | 240;
          bytesArray[idx++] = ((charCode >> 12) & 63) | 128;
        } else {
          bytesArray[idx++] = (charCode >> 12) | 224;
        }
        bytesArray[idx++] = ((charCode >> 6) & 63) | 128;
      }
      bytesArray[idx++] = (charCode & 63) | 128;
    }
  }
  return bytesArray;
}

/**
 * 计算Google翻译的哈希值
 */
function calcHash(query: string): string {
  const tkkSplited = GOOGLE_TRANSLATE_TKK.split('.');
  const tkkIndex = Number(tkkSplited[0]) || 0;
  const tkkKey = Number(tkkSplited[1]) || 0;

  const bytesArray = transformQuery(query);

  let encondingRound = tkkIndex;
  for (const item of bytesArray) {
    encondingRound += item;
    encondingRound = shiftLeftOrRightThenSumOrXor(
      encondingRound,
      '+-a^+6'
    );
  }
  encondingRound = shiftLeftOrRightThenSumOrXor(
    encondingRound,
    '+-3^+b+-f'
  );

  encondingRound ^= tkkKey;
  if (encondingRound <= 0) {
    encondingRound = (encondingRound & 2147483647) + 2147483648;
  }

  const normalizedResult = encondingRound % 1000000;
  return normalizedResult.toString() + '.' + (normalizedResult ^ tkkIndex);
}

/**
 * 创建Google翻译服务
 */
export function createGoogleTranslationService(): TranslationServiceProvider {
  return createBaseTranslationService({
    serviceName: 'google',
    baseURL: 'https://translate.googleapis.com/translate_a/t?anno=3&client=te&v=1.0&format=html',
    xhrMethod: 'POST',
    transformRequest: function(sourceArray) {
      sourceArray = sourceArray.map((text) => escapeHTML(text));
      if (sourceArray.length > 1) {
        sourceArray = sourceArray.map(
          (text, index) => `<a i=${index}>${text}</a>`
        );
      }
      // the <pre> tag is to preserve the text formating
      return `<pre>${sourceArray.join('')}</pre>`;
    },
    parseResponse: function(response) {
      let responseJson;
      if (typeof response === 'string') {
        responseJson = [{ text: response, detectedLanguage: null }];
      } else if (typeof response[0] === 'string') {
        responseJson = response.map(
          (value: string) => ({ text: value, detectedLanguage: null })
        );
      } else {
        responseJson = response.map(
          (value: [string, string]) => ({ text: value[0], detectedLanguage: value[1] })
        );
      }
      return responseJson;
    },
    transformResponse: function(result) {
      // 如果结果为null，返回空数组
      if (!result) return [];

      // 移除<pre>标签
      if (result.indexOf('<pre') !== -1) {
        result = result.replace('</pre>', '');
        const index = result.indexOf('>');
        result = result.slice(index + 1);
      }

      // 每个翻译的句子都在<b>标签内
      const sentences: string[] = [];

      // 主要目标是移除每个句子中<i>标签内的原始文本
      // 只保留<a>标签
      let idx = 0;
      while (true) {
        // 每个翻译的句子都在<b>标签内
        const sentenceStartIndex = result.indexOf('<b>', idx);
        if (sentenceStartIndex === -1) break;

        // <i>标签是每个句子中的原始文本
        const sentenceFinalIndex = result.indexOf('<i>', sentenceStartIndex);

        if (sentenceFinalIndex === -1) {
          sentences.push(result.slice(sentenceStartIndex + 3));
          break;
        } else {
          sentences.push(
            result.slice(sentenceStartIndex + 3, sentenceFinalIndex)
          );
        }
        idx = sentenceFinalIndex;
      }

      // 如果响应没有任何句子（没有<i>和<b>标签），则直接使用结果
      result = sentences.length > 0 ? sentences.join(' ') : result;
      // 移除剩余的</b>标签（通常是最后一个）
      result = result.replace(/<\/b>/g, '');

      // 捕获每个<a i={number}>并将其放入数组，</a>将被忽略
      // 同一索引可能会出现多次
      // 有些文本可能会在<a i={number}>之外（通常是第一个<a>标签之前的文本，以及<a>标签之间的一些空白）
      // 在这种情况下，外部文本将放置在最近的<a i={number}>内
      let resultArray = [];
      let lastEndPos = 0;

      // 修复正则表达式
      const regex = /(<a\si=[0-9]+>)([^<>]*(?=<\/a>))*/g;
      for (const r of result.matchAll(regex)) {
        const fullText = r[0];
        const fullLength = r[0].length;
        const pos = r.index || 0; // 确保pos不为undefined
        // 如果它更大，则表示标签外有文本
        if (pos > lastEndPos) {
          const aTag = r[1];
          const insideText = r[2] || '';
          const outsideText = result
            .slice(lastEndPos, pos)
            .replace(/<\/a>/g, '');
          resultArray.push(aTag + outsideText + insideText);
        } else {
          resultArray.push(fullText);
        }
        lastEndPos = pos + fullLength;
      }
      // 捕获<a>标签外的最终文本
      {
        const lastOutsideText = result
          .slice(lastEndPos)
          .replace(/<\/a>/g, '');
        if (resultArray.length > 0) {
          resultArray[resultArray.length - 1] += lastOutsideText;
        }
      }

      // 对Google翻译结果进行排序，以保持链接与正确的名称相匹配
      // 注意：链接也可能消失
      // 每个内联标签都有一个从0开始的索引<a i={number}>
      let indexes;
      if (resultArray && resultArray.length > 0) {
        // 获取<a i={number}>的索引，修复正则表达式
        indexes = resultArray
          .map((value) => {
            const match = value.match(/[0-9]+(?=>)/g);
            return match && match[0] ? parseInt(match[0]) : NaN;
          })
          .filter((value) => !isNaN(value));
        // 获取<a i={number}>内的文本
        resultArray = resultArray.map((value) => {
          const resultStartAtIndex = value.indexOf('>');
          return value.slice(resultStartAtIndex + 1);
        });
      } else {
        // 响应可能没有任何<a i={number}>
        resultArray = [result];
        indexes = [0];
      }

      // 反转义HTML
      resultArray = resultArray.map((value) => unescapeHTML(value));

      const finalResulArray: string[] = [];
      // 对结果进行排序并放入finalResulArray
      for (const j in indexes) {
        if (finalResulArray[indexes[j]]) {
          finalResulArray[indexes[j]] += ' ' + resultArray[j];
        } else {
          finalResulArray[indexes[j]] = resultArray[j];
        }
      }

      return finalResulArray;
    },
    getExtraParameters: function(sourceLanguage, targetLanguage, requests) {
      return `&sl=${sourceLanguage}&tl=${targetLanguage}&tk=${calcHash(
        requests.map((info) => info.originalText).join('')
      )}`;
    },
    getRequestBody: function(sourceLanguage, targetLanguage, requests) {
      return requests
        .map((info) => `&q=${encodeURIComponent(info.originalText)}`)
        .join('');
    }
  });
}
