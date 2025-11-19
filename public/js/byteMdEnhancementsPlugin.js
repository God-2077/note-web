
// 原生JS实现的ByteMD清空文本插件
const byteMdEnhancementsPlugin = () => {
    return {
        actions: [{
            // 按钮标题
            title: '清空内容',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor"><!--!Font Awesome Free v7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M262.2 48C248.9 48 236.9 56.3 232.2 68.8L216 112L120 112C106.7 112 96 122.7 96 136C96 149.3 106.7 160 120 160L520 160C533.3 160 544 149.3 544 136C544 122.7 533.3 112 520 112L424 112L407.8 68.8C403.1 56.3 391.2 48 377.8 48L262.2 48zM128 208L128 512C128 547.3 156.7 576 192 576L448 576C483.3 576 512 547.3 512 512L512 208L464 208L464 512C464 520.8 456.8 528 448 528L192 528C183.2 528 176 520.8 176 512L176 208L128 208zM288 280C288 266.7 277.3 256 264 256C250.7 256 240 266.7 240 280L240 456C240 469.3 250.7 480 264 480C277.3 480 288 469.3 288 456L288 280zM400 280C400 266.7 389.3 256 376 256C362.7 256 352 266.7 352 280L352 456C352 469.3 362.7 480 376 480C389.3 480 400 469.3 400 456L400 280z"/></svg>',
            // 快捷键提示
            cheatsheet: '清空所有内容',
            // 处理器配置
            handler: {
                type: 'action',
                click: ({
                    editor
                }) => {
                    // 清空编辑器内容
                    editor.setValue('');
                    // 聚焦到编辑器
                    editor.focus();
                }
            }
        },{
            title: '复制内容',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor"><!--!Font Awesome Free v7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M480 400L288 400C279.2 400 272 392.8 272 384L272 128C272 119.2 279.2 112 288 112L421.5 112C425.7 112 429.8 113.7 432.8 116.7L491.3 175.2C494.3 178.2 496 182.3 496 186.5L496 384C496 392.8 488.8 400 480 400zM288 448L480 448C515.3 448 544 419.3 544 384L544 186.5C544 169.5 537.3 153.2 525.3 141.2L466.7 82.7C454.7 70.7 438.5 64 421.5 64L288 64C252.7 64 224 92.7 224 128L224 384C224 419.3 252.7 448 288 448zM160 192C124.7 192 96 220.7 96 256L96 512C96 547.3 124.7 576 160 576L352 576C387.3 576 416 547.3 416 512L416 496L368 496L368 512C368 520.8 360.8 528 352 528L160 528C151.2 528 144 520.8 144 512L144 256C144 247.2 151.2 240 160 240L176 240L176 192L160 192z"/></svg>',
            // 处理器配置
            handler: {
                type: 'action',
                click: ({
                    editor
                }) => {
                    const content = editor.getValue();
                    // 复制内容到剪切板
                    navigator.clipboard.writeText(content);
                    // 提示用户复制成功
                    alert('内容已复制到剪切板');
                    editor.focus();
                }
            }
        },
        // 粘贴剪切板内容按钮
        {
            title: '粘贴内容',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor"><!--!Font Awesome Free v7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M128 112L352 112C360.8 112 368 119.2 368 128L368 176L416 176L416 128C416 92.7 387.3 64 352 64L128 64C92.7 64 64 92.7 64 128L64 448C64 483.3 92.7 512 128 512L240 512L240 464L128 464C119.2 464 112 456.8 112 448L112 128C112 119.2 119.2 112 128 112zM304 184C304 170.7 293.3 160 280 160L168 160C154.7 160 144 170.7 144 184C144 197.3 154.7 208 168 208L273.6 208C282.4 199.4 292.6 192.2 303.8 186.9C303.9 186 304 185 304 184zM512 528L352 528C343.2 528 336 520.8 336 512L336 288C336 279.2 343.2 272 352 272L453.5 272C457.7 272 461.8 273.7 464.8 276.7L523.3 335.2C526.3 338.2 528 342.3 528 346.5L528 512C528 520.8 520.8 528 512 528zM288 288L288 512C288 547.3 316.7 576 352 576L512 576C547.3 576 576 547.3 576 512L576 346.5C576 329.5 569.3 313.2 557.3 301.2L498.8 242.7C486.8 230.7 470.5 224 453.5 224L352 224C316.7 224 288 252.7 288 288z"/></svg>',
            cheatsheet: '粘贴剪切板内容',
            handler: {
                type: 'action',
                click: async ({
                    editor
                }) => {
                    try {
                        // 读取剪切板内容
                        const clipboardItems = await navigator.clipboard.read();
                        let text = '';

                        // 辅助函数：将Blob转换为字符串
                        const blobToString = blob => new Promise((resolve, reject) => {
                            const reader = new FileReader();
                            reader.onload = () => resolve(reader.result);
                            reader.onerror = reject;
                            reader.readAsText(blob);
                        });

                        // 检查剪贴板中是否有HTML内容
                        let hasHtml = false;
                        for (const clipboardItem of clipboardItems) {
                            if (clipboardItem.types.includes('text/html')) {
                                hasHtml = true;
                                break;
                            }
                        }

                        // 优先处理HTML内容
                        if (hasHtml) {
                            for (const clipboardItem of clipboardItems) {
                                if (clipboardItem.types.includes('text/html')) {
                                    try {
                                        const htmlBlob = await clipboardItem.getType('text/html');
                                        const htmlString = await blobToString(htmlBlob);
                                        const turndownService = new TurndownService({
                                            headingStyle: 'atx',
                                            hr: '---',
                                            bulletListMarker: '-',
                                            codeBlockStyle: 'fenced',
                                            fence: '```',
                                            emDelimiter: '*',
                                            strongDelimiter: '**',
                                            linkStyle: 'inlined',
                                            linkReferenceStyle: 'full',
                                            preformattedCode: 'true',
                                        });
                                        text = turndownService.turndown(htmlString);
                                        break; // 获取成功后跳出循环
                                    } catch (htmlError) {
                                        console.warn('HTML转换失败，尝试纯文本:', htmlError);
                                        // HTML转换失败时降级处理
                                    }
                                }
                            }
                        }

                        // 如果没有HTML或转换失败，使用纯文本
                        if (!text) {
                            for (const clipboardItem of clipboardItems) {
                                if (true || clipboardItem.types.includes('text/plain')) {
                                    try {
                                        const plainBlob = await clipboardItem.getType('text/plain');
                                        text = await blobToString(plainBlob);
                                        break;
                                    } catch (plainError) {
                                        console.error('纯文本读取失败:', plainError);
                                    }
                                }
                            }
                        }

                        // 获取当前光标位置
                        const cursor = editor.getCursor();

                        // 在光标位置插入内容
                        editor.replaceRange(text, cursor);
                        editor.focus();
                    } catch (error) {
                        console.error('剪贴板操作失败:', error);
                        alert(`剪贴板访问错误: ${error.message}`);
                    }
                }
            }
        }, {
            // 按钮标题
            title: '下划线',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor"><!--!Font Awesome Free v7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M128 96C128 78.3 142.3 64 160 64L224 64C241.7 64 256 78.3 256 96C256 113.7 241.7 128 224 128L224 288C224 341 267 384 320 384C373 384 416 341 416 288L416 128C398.3 128 384 113.7 384 96C384 78.3 398.3 64 416 64L480 64C497.7 64 512 78.3 512 96C512 113.7 497.7 128 480 128L480 288C480 376.4 408.4 448 320 448C231.6 448 160 376.4 160 288L160 128C142.3 128 128 113.7 128 96zM128 544C128 526.3 142.3 512 160 512L480 512C497.7 512 512 526.3 512 544C512 561.7 497.7 576 480 576L160 576C142.3 576 128 561.7 128 544z"/></svg>',
            // 处理器配置
            handler: {
                type: 'action',
                click: ({
                    editor,
                    wrapText
                }) => {
                    wrapText('<span style="text-decoration: underline">', '</ins>');
                    editor.focus();
                }
            }
        }, {
            // 按钮标题
            title: '上标',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor"><!--!Font Awesome Pro v7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2025 Fonticons, Inc.--><path d="M576 96C576 84.9 570.3 74.6 560.8 68.8C551.3 63 539.6 62.4 529.7 67.4L497.7 83.4C481.9 91.3 475.5 110.5 483.4 126.3C489 137.5 500.3 144 512 144L512 224C494.3 224 480 238.3 480 256C480 273.7 494.3 288 512 288L576 288C593.7 288 608 273.7 608 256C608 238.3 593.7 224 576 224L576 96zM128 128C110.3 128 96 142.3 96 160C96 177.7 110.3 192 128 192L143.3 192L232.9 320L143.3 448L128 448C110.3 448 96 462.3 96 480C96 497.7 110.3 512 128 512L160 512C170.4 512 180.2 506.9 186.2 498.4L272 375.8L357.8 498.4C363.8 507 373.6 512 384 512L416 512C433.7 512 448 497.7 448 480C448 462.3 433.7 448 416 448L400.7 448L311.1 320L400.7 192L416 192C433.7 192 448 177.7 448 160C448 142.3 433.7 128 416 128L384 128C373.6 128 363.8 133.1 357.8 141.6L272 264.2L186.2 141.6C180.2 133.1 170.4 128 160 128L128 128z"/></svg>',
            // 处理器配置
            handler: {
                type: 'action',
                click: ({
                    editor,
                    wrapText
                }) => {
                    wrapText('<sup>', '</sup>');
                    editor.focus();
                }
            }
        }, {
            // 按钮标题
            title: '下标',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor"><!--!Font Awesome Free v7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M128 128C110.3 128 96 142.3 96 160C96 177.7 110.3 192 128 192L143.3 192L232.9 320L143.3 448L128 448C110.3 448 96 462.3 96 480C96 497.7 110.3 512 128 512L160 512C170.4 512 180.2 506.9 186.2 498.4L272 375.8L357.8 498.4C363.8 507 373.6 512 384 512L416 512C433.7 512 448 497.7 448 480C448 462.3 433.7 448 416 448L400.7 448L311.1 320L400.7 192L416 192C433.7 192 448 177.7 448 160C448 142.3 433.7 128 416 128L384 128C373.6 128 363.8 133.1 357.8 141.6L272 264.2L186.2 141.6C180.2 133.1 170.4 128 160 128L128 128zM576 384C576 372.9 570.3 362.6 560.8 356.8C551.3 351 539.6 350.4 529.7 355.4L497.7 371.4C481.9 379.3 475.5 398.5 483.4 414.3C489 425.5 500.3 432 512 432L512 512C494.3 512 480 526.3 480 544C480 561.7 494.3 576 512 576L576 576C593.7 576 608 561.7 608 544C608 526.3 593.7 512 576 512L576 384z"/></svg>',
            // 处理器配置
            handler: {
                type: 'action',
                click: ({
                    editor,
                    wrapText
                }) => {
                    wrapText('<sub>', '</sub>');
                    editor.focus();
                }
            }
        }, {
            title: '插入时间',
            icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor"><!--!Font Awesome Free v7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M528 320C528 434.9 434.9 528 320 528C205.1 528 112 434.9 112 320C112 205.1 205.1 112 320 112C434.9 112 528 205.1 528 320zM64 320C64 461.4 178.6 576 320 576C461.4 576 576 461.4 576 320C576 178.6 461.4 64 320 64C178.6 64 64 178.6 64 320zM296 184L296 320C296 328 300 335.5 306.7 340L402.7 404C413.7 411.4 428.6 408.4 436 397.3C443.4 386.2 440.4 371.4 429.3 364L344 307.2L344 184C344 170.7 333.3 160 320 160C306.7 160 296 170.7 296 184z"/></svg>`,
            handler: {
                type: 'action',
                click({
                    editor
                }) {
                    const time = new Date().toLocaleString();
                    editor.replaceSelection(`${time}`);
                    editor.focus();
                },
            },
        },
        // 下载Markdown文件按钮
        {
            title: '下载文件',
            icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor"><!--!Font Awesome Free v7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.--><path d="M352 96C352 78.3 337.7 64 320 64C302.3 64 288 78.3 288 96L288 306.7L246.6 265.3C234.1 252.8 213.8 252.8 201.3 265.3C188.8 277.8 188.8 298.1 201.3 310.6L297.3 406.6C309.8 419.1 330.1 419.1 342.6 406.6L438.6 310.6C451.1 298.1 451.1 277.8 438.6 265.3C426.1 252.8 405.8 252.8 393.3 265.3L352 306.7L352 96zM160 384C124.7 384 96 412.7 96 448L96 480C96 515.3 124.7 544 160 544L480 544C515.3 544 544 515.3 544 480L544 448C544 412.7 515.3 384 480 384L433.1 384L376.5 440.6C345.3 471.8 294.6 471.8 263.4 440.6L206.9 384L160 384zM464 440C477.3 440 488 450.7 488 464C488 477.3 477.3 488 464 488C450.7 488 440 477.3 440 464C440 450.7 450.7 440 464 440z"/></svg>',
            cheatsheet: '下载Markdown文件',
            handler: {
                type: 'action',
                click: ({
                    editor
                }) => {
                    // 获取编辑器内容
                    const content = editor.getValue();

                    // 创建Blob对象
                    const blob = new Blob([content], {
                        type: 'text/markdown;charset=utf-8'
                    });

                    // 创建下载链接
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = "Markdown.md";

                    // 触发下载
                    document.body.appendChild(a);
                    a.click();

                    // 清理
                    setTimeout(() => {
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                    }, 100);
                }
            }
        }, {
            title: '上传文件',
            icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor"><!--!Font Awesome Pro v7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2025 Fonticons, Inc.--><path d="M352 173.3L352 384C352 401.7 337.7 416 320 416C302.3 416 288 401.7 288 384L288 173.3L246.6 214.7C234.1 227.2 213.8 227.2 201.3 214.7C188.8 202.2 188.8 181.9 201.3 169.4L297.3 73.4C309.8 60.9 330.1 60.9 342.6 73.4L438.6 169.4C451.1 181.9 451.1 202.2 438.6 214.7C426.1 227.2 405.8 227.2 393.3 214.7L352 173.3zM320 464C364.2 464 400 428.2 400 384L480 384C515.3 384 544 412.7 544 448L544 480C544 515.3 515.3 544 480 544L160 544C124.7 544 96 515.3 96 480L96 448C96 412.7 124.7 384 160 384L240 384C240 428.2 275.8 464 320 464zM464 488C477.3 488 488 477.3 488 464C488 450.7 477.3 440 464 440C450.7 440 440 450.7 440 464C440 477.3 450.7 488 464 488z"/></svg>`,
            handler: {
                type: 'action',
                click({
                    editor
                }) {
                    // 创建隐藏的文件输入元素
                    const fileInput = document.createElement('input');
                    fileInput.type = 'file';
                    fileInput.accept = 'text/html,text/markdown,text/plain';
                    fileInput.style.display = 'none'; // 隐藏元素

                    // 添加change事件监听器（文件选择后触发）
                    fileInput.addEventListener('change', function (e) {
                        const files = e.target.files;
                        if (files.length > 0) {
                            let file = files[0];

                            const reader = new FileReader();
                            reader.onload = function (e) {
                                // console.log('文件内容：');
                                // console.log(e.target.result);
                                if (file.type == 'text/html') {
                                    const turndownService = new TurndownService({
                                        headingStyle: 'atx',
                                        hr: '---',
                                        bulletListMarker: '-',
                                        codeBlockStyle: 'fenced',
                                        fence: '```',
                                        emDelimiter: '*',
                                        strongDelimiter: '**',
                                        linkStyle: 'inlined',
                                        linkReferenceStyle: 'full',
                                        preformattedCode: 'true',
                                    });
                                    editor.replaceSelection(turndownService.turndown(e.target.result));
                                } else {
                                    editor.replaceSelection(e.target.result);
                                }
                                fileInput.remove();
                            }

                            reader.onerror = function (e) {
                                console.log(e)
                            };

                            reader.readAsText(file);

                            // 这里可以处理文件（如上传、预览等）
                        } else {
                            console.log('not file')
                        }
                    });

                    // 将文件输入添加到DOM
                    document.body.appendChild(fileInput);

                    fileInput.click(); // 模拟文件输入框点击
                },
            },
        }, {
            title: '插入视频',
            icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="23 7 16 12 23 17 23 7"></polygon>
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
    </svg>`,
            handler: {
                type: 'action',
                click({
                    editor
                }) {
                    // 获取当前光标位置
                    const cursor = editor.getCursor();

                    // 构建视频HTML模板
                    const videoHtml = `<div style="position: relative; width: 100%; height: 0; padding-top: 56.25%;">
<video style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;" controls>
<source src="your-video.mp4" type="video/mp4">
您的浏览器不支持HTML5视频标签。
  </video>
</div>
        `.trim();

                    // 在光标位置插入视频HTML
                    editor.replaceSelection(videoHtml);

                    // 将光标移动到视频代码下方
                    editor.setCursor({
                        line: cursor.line + 7,
                        ch: cursor.ch
                    });

                    // 聚焦编辑器
                    editor.focus();
                }
            }
        }
        ],
        editorEffect({
            editor
        }) {
            // 监听编辑器的粘贴事件
            editor.on('paste', (_, event) => {
                // 1. 立即阻止默认行为
                // event.preventDefault();

                // 2. 从粘贴板数据中查找HTML内容
                const clipboardData = event.clipboardData;
                if (!clipboardData) return;


                const htmlItem = Array.from(clipboardData.items).find(
                    (item) => item.type.includes('text/html')
                );

                if (!htmlItem) {
                    // 如果没有HTML内容，执行默认粘贴行为
                    // document.execCommand('paste');
                    return;
                }

                event.preventDefault();

                // 3. 获取HTML字符串
                htmlItem.getAsString((htmlString) => {
                    // 使用turndown库将HTML转换为Markdown
                    const turndownService = new TurndownService({
                        headingStyle: 'atx',
                        hr: '---',
                        bulletListMarker: '-',
                        codeBlockStyle: 'fenced',
                        fence: '```',
                        emDelimiter: '*',
                        strongDelimiter: '**',
                        linkStyle: 'inlined',
                        linkReferenceStyle: 'full',
                        preformattedCode: 'true',
                    });
                    const markdown = turndownService.turndown(htmlString);

                    // 插入转换后的Markdown
                    editor.replaceSelection(markdown);
                });
            });
        }
    };
};


window.byteMdEnhancementsPlugin = byteMdEnhancementsPlugin;