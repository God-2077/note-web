type MimeTypeMapType = {
    [key: string]: {
        "extension": string,
        "msg": string,
        "mimetype": string
    }
}
const MimeTypeMap: MimeTypeMapType = {
    "text/markdown": {
        "extension": ".md",
        "msg": "Markdown 文档",
        "mimetype": "text/markdown"
    },
    "audio/aac": {
        "extension": ".aac",
        "msg": "AAC 音频",
        "mimetype": "audio/aac"
    },
    "application/x-abiword": {
        "extension": ".abw",
        "msg": "AbiWord 文档",
        "mimetype": "application/x-abiword"
    },
    "image/apng": {
        "extension": ".apng",
        "msg": "动态可移植网络图形（APNG）图像",
        "mimetype": "image/apng"
    },
    "application/x-freearc": {
        "extension": ".arc",
        "msg": "归档文件（嵌入多个文件）",
        "mimetype": "application/x-freearc"
    },
    "image/avif": {
        "extension": ".avif",
        "msg": "AVIF 图像",
        "mimetype": "image/avif"
    },
    "video/x-msvideo": {
        "extension": ".avi",
        "msg": "AVI：音频视频交织文件格式（Audio Video Interleave）",
        "mimetype": "video/x-msvideo"
    },
    "application/vnd.amazon.ebook": {
        "extension": ".azw",
        "msg": "Amazon Kindle 电子书格式",
        "mimetype": "application/vnd.amazon.ebook"
    },
    "application/octet-stream": {
        "extension": ".bin",
        "msg": "任何二进制数据类型",
        "mimetype": "application/octet-stream"
    },
    "image/bmp": {
        "extension": ".bmp",
        "msg": "Windows OS/2 位图",
        "mimetype": "image/bmp"
    },
    "application/x-bzip": {
        "extension": ".bz",
        "msg": "BZip 归档",
        "mimetype": "application/x-bzip"
    },
    "application/x-bzip2": {
        "extension": ".bz2",
        "msg": "BZip2 归档",
        "mimetype": "application/x-bzip2"
    },
    "application/x-cdf": {
        "extension": ".cda",
        "msg": "CD 音频",
        "mimetype": "application/x-cdf"
    },
    "application/x-csh": {
        "extension": ".csh",
        "msg": "C-Shell 脚本",
        "mimetype": "application/x-csh"
    },
    "text/css": {
        "extension": ".css",
        "msg": "层叠样式表（CSS）",
        "mimetype": "text/css"
    },
    "text/csv": {
        "extension": ".csv",
        "msg": "逗号分隔值（CSV）",
        "mimetype": "text/csv"
    },
    "application/msword": {
        "extension": ".doc",
        "msg": "Microsoft Word",
        "mimetype": "application/msword"
    },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
        "extension": ".docx",
        "msg": "Microsoft Word（OpenXML）",
        "mimetype": "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    },
    "application/vnd.ms-fontobject": {
        "extension": ".eot",
        "msg": "MS 嵌入式 OpenType 字体",
        "mimetype": "application/vnd.ms-fontobject"
    },
    "application/epub+zip": {
        "extension": ".epub",
        "msg": "电子出版（EPUB）",
        "mimetype": "application/epub+zip"
    },
    "application/gzip": {
        "extension": ".gz",
        "msg": "GZip 压缩归档",
        "mimetype": "application/gzip"
    },
    "image/gif": {
        "extension": ".gif",
        "msg": "图像互换格式（GIF）",
        "mimetype": "image/gif"
    },
    "text/html": {
        "extension": ".html",
        "msg": "超文本标记语言（HTML）",
        "mimetype": "text/html"
    },
    "image/vnd.microsoft.icon": {
        "extension": ".ico",
        "msg": "图标（Icon）格式",
        "mimetype": "image/vnd.microsoft.icon"
    },
    "text/calendar": {
        "extension": ".ics",
        "msg": "iCalendar 格式",
        "mimetype": "text/calendar"
    },
    "application/java-archive": {
        "extension": ".jar",
        "msg": "Java 归档（JAR）",
        "mimetype": "application/java-archive"
    },
    "image/jpeg": {
        "extension": ".jpeg",
        "msg": "JPEG 图像",
        "mimetype": "image/jpeg"
    },
    "text/javascript": {
        "extension": ".mjs",
        "msg": "JavaScript 模块",
        "mimetype": "text/javascript"
    },
    "application/json": {
        "extension": ".json",
        "msg": "JSON 格式",
        "mimetype": "application/json"
    },
    "application/ld+json": {
        "extension": ".jsonld",
        "msg": "JSON-LD 格式",
        "mimetype": "application/ld+json"
    },
    "audio/midi": {
        "extension": ".mid",
        "msg": "音乐数字接口（MIDI）",
        "mimetype": "audio/midi"
    },
    "audio/mpeg": {
        "extension": ".mp3",
        "msg": "MP3 音频",
        "mimetype": "audio/mpeg"
    },
    "video/mp4": {
        "extension": ".mp4",
        "msg": "MP4 视频",
        "mimetype": "video/mp4"
    },
    "video/mpeg": {
        "extension": ".mpeg",
        "msg": "MPEG 视频",
        "mimetype": "video/mpeg"
    },
    "application/vnd.apple.installer+xml": {
        "extension": ".mpkg",
        "msg": "Apple 安装包",
        "mimetype": "application/vnd.apple.installer+xml"
    },
    "application/vnd.oasis.opendocument.presentation": {
        "extension": ".odp",
        "msg": "开放文档演示稿文档",
        "mimetype": "application/vnd.oasis.opendocument.presentation"
    },
    "application/vnd.oasis.opendocument.spreadsheet": {
        "extension": ".ods",
        "msg": "开放文档表格文档",
        "mimetype": "application/vnd.oasis.opendocument.spreadsheet"
    },
    "application/vnd.oasis.opendocument.text": {
        "extension": ".odt",
        "msg": "开放文档文本文档",
        "mimetype": "application/vnd.oasis.opendocument.text"
    },
    "audio/ogg": {
        "extension": ".oga",
        "msg": "OGG 音频",
        "mimetype": "audio/ogg"
    },
    "video/ogg": {
        "extension": ".ogv",
        "msg": "OGG 视频",
        "mimetype": "video/ogg"
    },
    "application/ogg": {
        "extension": ".ogx",
        "msg": "OGG",
        "mimetype": "application/ogg"
    },
    "audio/opus": {
        "extension": ".opus",
        "msg": "Opus 音频",
        "mimetype": "audio/opus"
    },
    "font/otf": {
        "extension": ".otf",
        "msg": "OpenType 字体",
        "mimetype": "font/otf"
    },
    "image/png": {
        "extension": ".png",
        "msg": "便携式网络图形",
        "mimetype": "image/png"
    },
    "application/pdf": {
        "extension": ".pdf",
        "msg": "Adobe 便携式文档格式（PDF）",
        "mimetype": "application/pdf"
    },
    "application/x-httpd-php": {
        "extension": ".php",
        "msg": "超文本预处理器（Personal Home Page）",
        "mimetype": "application/x-httpd-php"
    },
    "application/vnd.ms-powerpoint": {
        "extension": ".ppt",
        "msg": "Microsoft PowerPoint",
        "mimetype": "application/vnd.ms-powerpoint"
    },
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": {
        "extension": ".pptx",
        "msg": "Microsoft PowerPoint（OpenXML）",
        "mimetype": "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    },
    "application/vnd.rar": {
        "extension": ".rar",
        "msg": "RAR 归档",
        "mimetype": "application/vnd.rar"
    },
    "application/rtf": {
        "extension": ".rtf",
        "msg": "富文本格式（RTF）",
        "mimetype": "application/rtf"
    },
    "application/x-sh": {
        "extension": ".sh",
        "msg": "伯恩 shell 脚本",
        "mimetype": "application/x-sh"
    },
    "image/svg+xml": {
        "extension": ".svg",
        "msg": "可缩放矢量图形（SVG）",
        "mimetype": "image/svg+xml"
    },
    "application/x-tar": {
        "extension": ".tar",
        "msg": "磁带归档（TAR）",
        "mimetype": "application/x-tar"
    },
    "image/tiff": {
        "extension": ".tif",
        "msg": "标签图像文件格式（TIFF）",
        "mimetype": "image/tiff"
    },
    "video/mp2t": {
        "extension": ".ts",
        "msg": "MPEG 传输流",
        "mimetype": "video/mp2t"
    },
    "font/ttf": {
        "extension": ".ttf",
        "msg": "TrueType 字体",
        "mimetype": "font/ttf"
    },
    "text/plain": {
        "extension": ".txt",
        "msg": "文本（通常是 ASCII 或 ISO 8859-n）",
        "mimetype": "text/plain"
    },
    "application/vnd.visio": {
        "extension": ".vsd",
        "msg": "Microsoft Visio",
        "mimetype": "application/vnd.visio"
    },
    "audio/wav": {
        "extension": ".wav",
        "msg": "波形音频格式",
        "mimetype": "audio/wav"
    },
    "audio/webm": {
        "extension": ".weba",
        "msg": "WEBM 音频",
        "mimetype": "audio/webm"
    },
    "video/webm": {
        "extension": ".webm",
        "msg": "WEBM 视频",
        "mimetype": "video/webm"
    },
    "image/webp": {
        "extension": ".webp",
        "msg": "WEBP 图像",
        "mimetype": "image/webp"
    },
    "font/woff": {
        "extension": ".woff",
        "msg": "Web 开放字体格式（WOFF）",
        "mimetype": "font/woff"
    },
    "font/woff2": {
        "extension": ".woff2",
        "msg": "Web 开放字体格式（WOFF）",
        "mimetype": "font/woff2"
    },
    "application/xhtml+xml": {
        "extension": ".xhtml",
        "msg": "XHTML",
        "mimetype": "application/xhtml+xml"
    },
    "application/vnd.ms-excel": {
        "extension": ".xls",
        "msg": "Microsoft Excel",
        "mimetype": "application/vnd.ms-excel"
    },
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
        "extension": ".xlsx",
        "msg": "Microsoft Excel（OpenXML）",
        "mimetype": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    },
    "application/xml": {
        "extension": ".xml",
        "msg": "XML",
        "mimetype": "application/xml"
    },
    "application/vnd.mozilla.xul+xml": {
        "extension": ".xul",
        "msg": "XUL",
        "mimetype": "application/vnd.mozilla.xul+xml"
    },
    "application/zip": {
        "extension": ".zip",
        "msg": "ZIP 归档",
        "mimetype": "application/zip"
    },
    "video/3gpp": {
        "extension": ".3gp",
        "msg": "3GPP 音视频容器",
        "mimetype": "video/3gpp"
    },
    "video/3gpp2": {
        "extension": ".3g2",
        "msg": "3GPP2 音视频容器",
        "mimetype": "video/3gpp2"
    },
    "application/x-7z-compressed": {
        "extension": ".7z",
        "msg": "7-zip 归档",
        "mimetype": "application/x-7z-compressed"
    }
}



export { MimeTypeMap, MimeTypeMapType };
