// 渲染層後處理：表格橫向捲動包裝、圖片說明 figure 化、站內圖片標尺寸
import fs from 'node:fs';
import { visit } from 'unist-util-visit';

const sizeCache = new Map();

/**
 * 讀 public/ 下圖片的實際尺寸，供 <img width height> 使用（避免載入時版面位移）。
 * ponytail: 只解 webp／png 檔頭（本站content圖片就這兩種），其他格式回 null 不標尺寸，不擋 build。
 * @param {string} src 以 / 開頭的站內路徑
 */
function imageSize(src) {
  if (sizeCache.has(src)) return sizeCache.get(src);
  let size = null;
  try {
    const buf = fs.readFileSync(`./public${decodeURI(src)}`);
    if (buf.subarray(0, 4).toString('latin1') === 'RIFF' && buf.subarray(8, 12).toString('latin1') === 'WEBP') {
      const chunk = buf.subarray(12, 16).toString('latin1');
      if (chunk === 'VP8X') {
        size = { w: buf.readUIntLE(24, 3) + 1, h: buf.readUIntLE(27, 3) + 1 };
      } else if (chunk === 'VP8 ') {
        size = { w: buf.readUInt16LE(26) & 0x3fff, h: buf.readUInt16LE(28) & 0x3fff };
      } else if (chunk === 'VP8L') {
        const bits = buf.readUInt32LE(21);
        size = { w: (bits & 0x3fff) + 1, h: ((bits >> 14) & 0x3fff) + 1 };
      }
    } else if (buf.readUInt32BE(0) === 0x89504e47) {
      size = { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
    }
  } catch {
    // 檔案不存在或格式非預期：略過，交由瀏覽器處理
  }
  sizeCache.set(src, size);
  return size;
}

export function rehypePost() {
  return (tree) => {
    visit(tree, 'element', (node, index, parent) => {
      if (!parent || index === undefined) return;

      // 內容圖片一律延遲載入（未指定者）；文章圖皆在標題之下，無 LCP 疑慮
      if (node.tagName === 'img') {
        node.properties ??= {};
        node.properties.loading ??= 'lazy';
        node.properties.decoding ??= 'async';
        const src = node.properties.src;
        if (node.properties.width === undefined && typeof src === 'string' && src.startsWith('/')) {
          const size = imageSize(src);
          if (size) {
            node.properties.width = size.w;
            node.properties.height = size.h;
          }
        }
      }

      // 表格 → 包一層橫向捲動容器（手機不爆版）；只跳過已包裝者，dept/tabs 等 div 容器內仍要包
      const parentCls = [].concat(parent.properties?.className ?? []);
      if (node.tagName === 'table' && !parentCls.includes('table-scroll')) {
        parent.children[index] = {
          type: 'element',
          tagName: 'div',
          properties: { className: ['table-scroll'] },
          children: [node],
        };
        return;
      }

      // 段落內單一張帶 title 的圖 → <figure> + <figcaption>
      if (
        node.tagName === 'p' &&
        node.children.length === 1 &&
        node.children[0].type === 'element' &&
        node.children[0].tagName === 'img' &&
        node.children[0].properties?.title
      ) {
        const img = node.children[0];
        const caption = String(img.properties.title);
        delete img.properties.title;
        parent.children[index] = {
          type: 'element',
          tagName: 'figure',
          properties: {},
          children: [
            img,
            { type: 'element', tagName: 'figcaption', properties: {}, children: [{ type: 'text', value: caption }] },
          ],
        };
      }
    });
  };
}
