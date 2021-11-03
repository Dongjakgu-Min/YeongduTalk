function getEmoticonURL(lang = 'kr'): string {
    return `http://item-${lang}.talk.kakao.co.kr/dw`;
}

export function getEmoticonImageURL(path: string, lang = 'kr'): string {
    return `${getEmoticonURL(lang)}/${path}`;
}

export function getEmoticonTitleURL(id: string, type = 'png', lang = 'kr'): string {
    return `${getEmoticonURL(lang)}/${id}.title.${type}`;
}

export function getEmoticonThumbnailURL(path: string, lang = 'kr'): string {
    const filename = path.replace('emot', 'thum').replace('.webp', '.png');
    return `${getEmoticonURL(lang)}/${filename}`;
}

export function getEmoticonPackURL(id: string, lang = 'kr'): string {
    return `${getEmoticonURL(lang)}/${id}.file_pack.zip`;
}

export function getEmoticonThumbnailPackURL(id: string, lang = 'kr'): string {
    return `${getEmoticonURL(lang)}/${id}.thum_pack.zip`;
}