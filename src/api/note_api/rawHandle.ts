import { handleMultiThreadDownload } from './handleMultiThreadDownload';
import { Context } from 'hono';
import { marked } from 'marked';
import { encodeFilenameForContentDisposition } from '../../utils/encodeFilenameForContentDisposition';

const RawPrefix = 'raw';
const RawSuffix = {
    raw: `/${RawPrefix}`,
    raw2: `/${RawPrefix}/`,
    text: `/${RawPrefix}/text`,
    text2: `/${RawPrefix}/text/`,
    md: `/${RawPrefix}/md`,
    md2: `/${RawPrefix}/md/`,
    marked: `/${RawPrefix}/marked`,
    marked2: `/${RawPrefix}/marked/`,
    html: `/${RawPrefix}/html`,
    html2: `/${RawPrefix}/html/`,
    mine: `/${RawPrefix}/mime`,
    mine2: `/${RawPrefix}/mime/`,
    down: `/${RawPrefix}/down`,
    down2: `/${RawPrefix}/down/`,
    down3: `/${RawPrefix}/d`,
    down4: `/${RawPrefix}/d/`,
};

async function rawHandle(c: Context, note: any) {
    // text
    if (c.req.path.endsWith(RawSuffix.text) || c.req.path.endsWith(RawSuffix.text2)) {
        return c.body(note.content, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Content-Disposition': `inline; ${encodeFilenameForContentDisposition(note.title,'text/plain')}`
            }
        });
    }
    // md
    if (c.req.path.endsWith(RawSuffix.md) || c.req.path.endsWith(RawSuffix.md2)) {
        return c.body(marked.parse(note.content), {
            headers: {
                'Content-Type': 'text/html; charset=utf-8',
                'Content-Disposition': `inline; ${encodeFilenameForContentDisposition(note.title,'text/html')}`
            }
        });
    }
    // marked
    if (c.req.path.endsWith(RawSuffix.marked) || c.req.path.endsWith(RawSuffix.marked2)) {
        const content = `<!doctype html>
<html>

<head>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <link rel="stylesheet" href="https://unpkg.com/github-markdown-css@5.8.1/github-markdown.css">
    <title>${note.title}</title>
    <style>
        .markdown-body {
        	box-sizing: border-box;
        	min-width: 200px;
        	max-width: 980px;
        	margin: 0 auto;
        	padding: 45px;
        	min-height: 100vh;
        }
        
        @media (max-width: 767px) {
        	.markdown-body {
        		padding: 15px;
        	}
        }
        @media (prefers-color-scheme: dark) {
            body
            {
            	background-color:#000000;
            }
        }
        @media (prefers-color-scheme: light) {
            body
            {
            	background-color:#FFFFFF;
            }
        }
    </style>
</head>

<body>
    <article class="markdown-body">
${marked.parse(note.content)}
    </article>
</body>

</html>`
        return c.body(content, {
            headers: {
                'Content-Type': 'text/html; charset=utf-8',
                'Content-Disposition': `inline; ${encodeFilenameForContentDisposition(note.title,'text/html')}`
            }
        });
    }
    // html
    if (c.req.path.endsWith(RawSuffix.html) || c.req.path.endsWith(RawSuffix.html2)) {
        return c.body(note.content, {
            headers: {
                'Content-Type': 'text/html; charset=utf-8',
                'Content-Disposition': `inline; ${encodeFilenameForContentDisposition(note.title,'text/html')}`
            }
        });
    }
    // raw
    if (c.req.path.endsWith(RawSuffix.raw) || c.req.path.endsWith(RawSuffix.raw2)) {
        return c.body(note.content, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Content-Disposition': `inline; ${encodeFilenameForContentDisposition(note.title,note.mimeType)}`
            }
        });
    }
    // mine
    if (c.req.path.endsWith(RawSuffix.mine) || c.req.path.endsWith(RawSuffix.mine2)) {
        return c.body(note.content, {
            headers: {
                'Content-Type': note.mimeType 
                    ? (note.mimeType.startsWith('text/') ? `${note.mimeType}; charset=utf-8` : note.mimeType) 
                    : 'text/plain; charset=utf-8',
                'Content-Disposition': `inline; ${encodeFilenameForContentDisposition(note.title, note.mimeType)}`
            }
        });
    }
    // down
    // 性能优化
    if (c.req.path.endsWith(RawSuffix.down) || c.req.path.endsWith(RawSuffix.down2) || c.req.path.endsWith(RawSuffix.down3) || c.req.path.endsWith(RawSuffix.down4)) {
        if (c.req.header('Range')) {
            return await handleMultiThreadDownload(c, note);
        } else {
            const contentType = 'application/octet-stream';
            const contentDisposition = `attachment; ${encodeFilenameForContentDisposition(note.title)}`;
            return c.body(note.content, {
                headers: {
                    'Content-Type': contentType,
                    'Content-Disposition': contentDisposition
                }
            });
        }
    }

    // 不支持的路径
    if ( !Object.values(RawSuffix).some(suffix => c.req.path.endsWith(suffix))) {
        return c.json({
            code: 404,
            success: false,
            message: "Not supported path"
        }, 404);
    } else {
        return c.json({
            code: 500,
            success: false,
            message: "Internal server error"
        }, 500);
    }
}


export default rawHandle;
export { rawHandle , RawPrefix, RawSuffix };