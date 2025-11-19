import { MimeTypeMap } from '../data/commonMime';

/**
 * 编码文件名以符合 HTTP 头规范（RFC 5987）
 * 并根据 MIME 类型添加文件扩展名
 * 将 Unicode 文件名编码为 ASCII 兼容格式
 */
function encodeFilenameForContentDisposition(filename: string,mimeType?: string): string {
    // 检查文件名是否已经有扩展名，文件后缀名为 . + 1-4 个字符
    if (!/\.([a-zA-Z0-9]{1,4})$/.test(filename)) {
        // 默认使用 text/plain 类型，我的这个笔记网站总不可能给我塞二进制内容的 吧？
        mimeType = mimeType ? mimeType : "text/plain";
        if (MimeTypeMap[mimeType]) {
            filename += `${MimeTypeMap[mimeType].extension}`;
        }
    }
    // 如果文件名只包含 ASCII 字符，直接返回
    if (/^[\x00-\x7F]*$/.test(filename)) {
        return `filename="${filename}"`;
    }
    
    // 使用 RFC 5987 编码：filename*=UTF-8'' + URL 编码的文件名
    const encoded = encodeURIComponent(filename).replace(/['()]/g, escape);
    return `filename*=UTF-8''${encoded}`;
}

export { encodeFilenameForContentDisposition };