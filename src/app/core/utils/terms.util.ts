export interface TermsBlock {
    level: 0 | 1 | 2;
    text: string;
}

export function termsBlocks(md: string): TermsBlock[] {
    const body = md.replace(/\r\n/g, '\n').replace(/^---\n[\s\S]*?\n---\n/, '');
    return body.split(/\n\s*\n/)
        .map(b => b.trim())
        .filter(Boolean)
        .map(b => {
            const h = /^(#{1,2}) ([^\n]+)$/.exec(b);
            return h ? {level: h[1].length as 1 | 2, text: h[2].trim()} : {level: 0, text: b};
        });
}
