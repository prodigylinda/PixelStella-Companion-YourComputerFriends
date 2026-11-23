import { translate, intlLocale } from '../shared/i18n.js';
/** Capture application-owned static nodes before any user data is rendered. */
export function staticLocalization(doc) {
    const texts = [], attributes = [];
    const walker = doc.createTreeWalker(doc.documentElement, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
        if (node.parentElement?.closest('script,style,#language'))
            continue;
        if (node.textContent?.trim())
            texts.push({ node: node, original: node.textContent });
    }
    for (const element of doc.querySelectorAll('[aria-label],[placeholder],[title]')) {
        for (const name of ['aria-label', 'placeholder', 'title']) {
            const original = element.getAttribute(name);
            if (original && element.id !== 'language')
                attributes.push({ node: element, name, original });
        }
    }
    return locale => { doc.documentElement.lang = intlLocale(locale); for (const item of texts)
        item.node.data = translate(item.original, locale); for (const item of attributes)
        item.node.setAttribute(item.name, translate(item.original, locale)); };
}
