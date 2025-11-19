import { Context } from 'hono';
import { encodeFilenameForContentDisposition } from '../../utils/encodeFilenameForContentDisposition';



function isForceDownload(c: Context): boolean {
    return c.req.query('d') !== undefined || c.req.query('down') !== undefined || c.req.query('download') !== undefined;
}

/**
 * 处理多线程下载请求
 */
async function handleMultiThreadDownload(c: Context, note: any) {
    // console.log("progress: 0");
    const content = note.content ?? "";
    // console.log("progress: 0.1");
    
    // 在 Cloudflare Workers 中使用 TextEncoder 而不是 Buffer
    const contentBuffer = new TextEncoder().encode(content);
    // console.log("progress: 0.2");
    const totalSize = contentBuffer.length;
    // console.log("progress: 0.3");
    const title = note.title ?? "Untitled";
    // console.log("progress: 0.4");
    const mimeType = `${note.mimeType ?? "text/plain"}; charset=utf-8`;
    // console.log("progress: 0.5");
    
    // 检查Range请求（多线程下载的关键）
    const rangeHeader = c.req.header('Range');
    // console.log("progress: 0.6");
    
    // 设置支持Range请求的头部
    c.header('Accept-Ranges', 'bytes');
    // console.log("progress: 1.1");
    c.header('Cache-Control', 'no-cache');
    // console.log("progress: 1.2");
    if (rangeHeader) {
        // 处理范围请求（分片下载）
        return handleRangeRequest(c, contentBuffer, totalSize, mimeType, title, rangeHeader);
    } else {
        // 完整文件下载（兼容单线程）
        return handleFullDownload(c, contentBuffer, totalSize, mimeType, title);
    }
}

/**
 * 处理范围请求（支持多线程分片下载）
 */
function handleRangeRequest(c: Context, contentBuffer: Uint8Array, totalSize: number, 
                          mimeType: string, title: string, rangeHeader: string) {
    // 解析Range头（格式：bytes=start-end）
    const range = parseRangeHeader(rangeHeader, totalSize);
    
    if (!range || range.start >= totalSize) {
        c.header('Content-Range', `bytes */${totalSize}`);
        return c.body(null, 416); // 范围不满足
    }
    
    const chunkSize = range.end - range.start + 1;
    const chunk = contentBuffer.slice(range.start, range.end + 1);
    
    // 设置部分内容响应头
    c.status(206); // Partial Content
    c.header('Content-Type', 'application/octet-stream');
    c.header('Content-Length', chunkSize.toString());
    c.header('Content-Range', `bytes ${range.start}-${range.end}/${totalSize}`);
    c.header('Content-Disposition', `attachment; ${encodeFilenameForContentDisposition(title)}`);
    
    return c.body(chunk);
}

/**
 * 处理完整文件下载
 */
function handleFullDownload(c: Context, contentBuffer: Uint8Array, totalSize: number, 
                          mimeType: string, title: string) {
    c.header('Content-Type', 'application/octet-stream');
    c.header('Content-Length', totalSize.toString());
    c.header('Content-Disposition', `attachment; ${encodeFilenameForContentDisposition(title)}`);
    
    return c.body(contentBuffer);
}

/**
 * 解析Range请求头
 */
function parseRangeHeader(rangeHeader: string, totalSize: number) {
    if (!rangeHeader || !rangeHeader.startsWith('bytes=')) {
        return null;
    }
    
    const rangeStr = rangeHeader.substring(6);
    const ranges = rangeStr.split('-');
    
    if (ranges.length !== 2) return null;
    
    const start = parseInt(ranges[0]);
    const end = ranges[1] ? parseInt(ranges[1]) : totalSize - 1;
    
    if (isNaN(start) && isNaN(end)) return null;
    
    const finalStart = isNaN(start) ? totalSize - end : start;
    const finalEnd = isNaN(end) ? totalSize - 1 : Math.min(end, totalSize - 1);
    
    if (finalStart >= totalSize || finalEnd >= totalSize || finalStart > finalEnd) {
        return null;
    }
    
    return { start: finalStart, end: finalEnd };
}


export default handleMultiThreadDownload;

export {
    handleMultiThreadDownload,
    handleRangeRequest,
    handleFullDownload,
    parseRangeHeader
}