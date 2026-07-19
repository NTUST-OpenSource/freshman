// 渲染層後處理：表格橫向捲動包裝、圖片說明 figure 化
import { visit } from 'unist-util-visit';

export function rehypePost() {
  return (tree) => {
    visit(tree, 'element', (node, index, parent) => {
      if (!parent || index === undefined) return;

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
