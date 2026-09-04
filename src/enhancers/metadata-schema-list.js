import { register } from '../core/registry.js';
import { markOnce, h, link, infinityJsonUrl } from '../core/dom.js';

const ID = 'metadata-schema-list';

const ROW_SELECTOR =
    'tr.foundation-collection-item[data-granite-collection-item-id*="/adminui-extension/metadataschema/"]';

register({
    id: ID,

    appliesTo() {
        return !!document.querySelector(ROW_SELECTOR);
    },

    enhance() {
        document.querySelectorAll(ROW_SELECTOR).forEach((row) => {
            const cell = row.querySelector('td.foundation-collection-item-title');
            if (!cell) return;

            const path = row.getAttribute('data-granite-collection-item-id');
            if (!path) return;

            if (!markOnce(row, ID)) return;

            const titleLink = cell.querySelector('a');
            const title = titleLink?.textContent.trim() || '';

            const rawNodeName = row.getAttribute(
                'data-foundation-collection-item-id',
            );

            const nodeName = rawNodeName?.replace(/^\//, '');

            const details = h('div', {
                class: 'aem-tb-path-info',
            });

            details.appendChild(
                h('span', {
                    class: 'aem-tb-path',
                    text: path,
                }),
            );

            details.appendChild(
                link(infinityJsonUrl(path), 'View JSON'),
            );

            if (nodeName && nodeName !== title) {
                details.appendChild(
                    h('span', {
                        class: 'aem-tb-node',
                        text: `node: ${nodeName}`,
                    }),
                );
            }

            cell.appendChild(details);
        });
    },
}
);