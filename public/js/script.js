// 配置和状态管理
const config = JSON.parse(localStorage.getItem('config')) || {
    baseUrl: location.origin + "/api",
    adminToken: '',
    isDarkMode: false,
    rememberToken: false,
    list: {
        sort: "date",
        limit: 10,
    },
    search: {
        limit: 10,
    },
};
// const config = {
//     baseUrl: localStorage.getItem('baseUrl') || location.origin + "/api",
//     adminToken: localStorage.getItem('adminToken') || '',
//     isDarkMode: localStorage.getItem('darkMode') === 'true',
//     rememberToken: localStorage.getItem('rememberToken') === 'true',
// };

let currentNoteId = null;
let isEditMode = false;
let currentPage = 1;
let totalNotes = 0;
let notesPerPage = 10;
let currentEncryptedNoteId = null;
let currentNoteTextType = 'plain';


// 搜索相关变量
let searchCurrentPage = 1;
let searchTotalNotes = 0;
let searchNotesPerPage = 10;
let currentSearchQuery = '';

// 初始化 NoteSDK 实例
let noteSDK = null;

// 初始化 SDK
function initSDK() {
    try {
        noteSDK = new NoteSDK({
            baseUrl: config.baseUrl,
            token: config.adminToken
        });
    } catch (error) {
        console.error('SDK初始化失败:', error);
        iziToast.error({
            title: '错误',
            message: 'SDK初始化失败: ' + error.message
        });
    }
}

// 初始化主题
function initTheme() {
    if (config.isDarkMode) {
        document.body.classList.add('dark-mode');
        document.getElementById('themeToggle').innerHTML = '<i class="icon-sun"></i>';
    } else {
        document.body.classList.remove('dark-mode');
        document.getElementById('themeToggle').innerHTML = '<i class="icon-moon"></i>';
    }
}

// 加载配置到表单
function loadConfig() {
    document.getElementById('baseUrl').value = config.baseUrl;
    document.getElementById('adminToken').value = config.adminToken;
    document.getElementById('rememberToken').checked = config.rememberToken;
    // 根据是否有token显示/隐藏编辑功能
    toggleEditFeatures(!!config.adminToken);
    
    // list
    document.getElementById('sort').value = config.list.sort;
    document.getElementById('limit').value = config.list.limit;
    
    // search
    document.getElementById('searchLimit').value = config.search.limit;

    // serviceWorkerEnabled
    document.getElementById('serviceWorkerEnabled').value = localStorage.getItem('serviceWorkerEnabled') || '1';

    // 初始化SDK
    initSDK();
}

// 设置事件监听器
function setupEventListeners() {
    // 主题切换
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    
    // 创建笔记表单提交
    document.getElementById('createNoteForm').addEventListener('submit', createNote);
    
    // 刷新笔记列表
    document.getElementById('refreshNotes').addEventListener('click', loadNotes);
    
    // 应用筛选
    document.getElementById('applyFilters').addEventListener('click', loadNotes);
    
    // 保存配置
    document.getElementById('saveConfig').addEventListener('click', saveConfig);
    
    // 关闭模态框
    document.querySelector('.close').addEventListener('click', closeModal);
    document.getElementById('closeModal').addEventListener('click', closeModal);
    
    // 删除笔记
    document.getElementById('deleteNote').addEventListener('click', deleteNote);
    
    // 编辑笔记
    document.getElementById('editNote').addEventListener('click', enableEditMode);
    
    // 保存编辑
    document.getElementById('saveEdit').addEventListener('click', saveEdit);
    
    // 取消编辑
    document.getElementById('cancelEdit').addEventListener('click', cancelEdit);
    
    // 翻页
    document.getElementById('prevPage').addEventListener('click', goToPrevPage);
    document.getElementById('nextPage').addEventListener('click', goToNextPage);
    
    // 折叠筛选选项
    document.getElementById('toggleFilters').addEventListener('click', toggleFilters);
    
    // 密码提示框
    document.getElementById('submitPassword').addEventListener('click', submitPassword);
    document.getElementById('notePassword').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            submitPassword();
        }
    });
    document.getElementById('cancelPassword').addEventListener('click', cancelPassword);

    // 文本类型切换预览
    document.getElementById('textType').addEventListener('change', updatePreviewStyle);
    document.getElementById('editTextType').addEventListener('change', updatePreviewStyle);
    
    // 标签页切换
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', function() {
            switchTab(this.getAttribute('data-target'));
        });
    });
    
    document.querySelector("#createNotePage > div > div.remind > button").addEventListener('click', function() {
            switchTab("ConfigPage");
    });
    
    // 搜索按钮点击事件
    document.getElementById('searchButton').addEventListener('click', performSearch);
    
    // 搜索输入框回车事件
    document.getElementById('searchQuery').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
    
    // 搜索分页事件
    document.getElementById('searchPrevPage').addEventListener('click', goToSearchPrevPage);
    document.getElementById('searchNextPage').addEventListener('click', goToSearchNextPage);
    
    // 搜索页面的筛选选项变化事件
    document.getElementById('searchLimit').addEventListener('change', function() {
        if (currentSearchQuery) {
            performSearch();
        }
    });
    
    document.getElementById('searchPageNum').addEventListener('change', function() {
        if (currentSearchQuery) {
            searchCurrentPage = parseInt(this.value) || 1;
            performSearch();
        }
    });
}

// 切换标签页
function switchTab(targetId) {
    // 移除所有标签的active类
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // 隐藏所有页面
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // 激活当前标签和页面
    document.querySelector(`.tab[data-target="${targetId}"]`).classList.add('active');
    document.getElementById(targetId).classList.add('active');
}

// 切换主题
function toggleTheme() {
    config.isDarkMode = !config.isDarkMode;
    updateAndPersistConfig();
    initTheme();
}

// 保存配置
function saveConfig() {
    config.baseUrl = document.getElementById('baseUrl').value;
    config.rememberToken = document.getElementById('rememberToken').checked;
    config.adminToken = document.getElementById('adminToken').value || '';

    // 保存配置到localStorage
    updateAndPersistConfig();

    // serviceWorkerEnabled
    const serviceWorkerEnabled = document.getElementById('serviceWorkerEnabled').value;
    if (serviceWorkerEnabled == '0') {
        try {
            navigator.serviceWorker.getRegistrations().then(registrations => {
                registrations.forEach(registration => {
                    registration.unregister();
                });
            });
            localStorage.setItem('serviceWorkerRegistered', '0')
        } catch (error) { }
        localStorage.setItem('serviceWorkerEnabled', '0');
    }
    localStorage.setItem('serviceWorkerEnabled', serviceWorkerEnabled);


    // if (rememberToken) {
    //     // 如果选择记住Token，则保存到localStorage
    //     localStorage.setItem('adminToken', config.adminToken);
    // } else {
    //     // 如果不记住，则保存到sessionStorage
    //     sessionStorage.setItem('adminToken', config.adminToken);
    //     // 同时从localStorage中移除
    //     localStorage.removeItem('adminToken');
    // }
    
    // localStorage.setItem('baseUrl', config.baseUrl);
    
    toggleEditFeatures(!!config.adminToken);
    
    // 重新初始化SDK
    initSDK();
    
    loadNotes();
    
    iziToast.success({
        title: '成功',
        message: '配置已保存'
    });
}

function updateAndPersistConfig() {
  const newConfig = { ...config };
  newConfig.adminToken = config.rememberToken ? document.getElementById('adminToken').value : '';
  localStorage.setItem('config', JSON.stringify(newConfig));
  return //newConfig; // 可选：返回更新后的配置
}

// 根据是否有token切换编辑功能
function toggleEditFeatures(hasToken) {
    const createForm = document.getElementById('createNoteForm');
    const createFormremind = document.querySelector("#createNotePage .remind");
    const editButtons = document.querySelectorAll('.edit-btn');
    const deleteButtons = document.querySelectorAll('.delete-btn');
    
    if (hasToken) {
        createForm.classList.remove('hidden');
        createFormremind.classList.add('hidden');
        document.getElementById('editNote').classList.remove('hidden');
    } else {
        createForm.classList.add('hidden');
        createFormremind.classList.remove('hidden');
        document.getElementById('editNote').classList.add('hidden');
    }
}

// 创建笔记
async function createNote(e) {
    e.preventDefault();
    
    if (!noteSDK) {
        iziToast.error({
            title: '错误',
            message: 'SDK未初始化，请检查配置'
        });
        return;
    }
    
    if (!config.adminToken) {
        iziToast.error({
            title: '错误',
            message: '需要管理员Token才能创建笔记'
        });
        return;
    }
    
    const title = document.getElementById('title').value;
    const content = document.getElementById('content').value;
    const textType = document.getElementById('textType').value;
    const password = document.getElementById('password').value;
    const expiration = document.getElementById('expiration').value;
    
    try {
        const expirationTimestamp = expiration ? Math.floor(new Date(expiration).getTime() / 1000) : undefined;
        
        iziToast.info({
            title: '加载中',
            message: '正在创建笔记...',
            class: 'create-toast',
            timeout: false,
        });

        const data = await noteSDK.createNote({
            title: title || undefined,
            content: content || undefined,
            textType: textType || 'plain',
            password: password || undefined,
            expiration: expirationTimestamp
        });
    
        closeToast('create-toast');

        if (data.success) {
            iziToast.success({
                title: '成功',
                message: '笔记已创建'
            });
            
            // 清空表单
            document.getElementById('createNoteForm').reset();
            
            // 重新加载笔记列表
            loadNotes();
            
            // 切换到笔记列表页面
            switchTab('noteListPage');
        } else {
            iziToast.error({
                title: '错误',
                message: data.message || '创建笔记失败'
            });
        }
    } catch (error) {
        closeToast('create-toast');
        iziToast.error({
            title: '错误',
            message: '创建笔记失败: ' + error.message
        });
    }
}

// 加载笔记列表
async function loadNotes() {
    if (!noteSDK) {
        return;
    }
    
    const sort = document.getElementById('sort').value;
    const limit = document.getElementById('limit').value;
    const page = document.getElementById('page').value;
    const startTime = document.getElementById('startTime').value;
    const endTime = document.getElementById('endTime').value;
    
    notesPerPage = parseInt(limit) || 10;
    currentPage = parseInt(page) ? parseInt(page): 1;
    
    // 保存列表配置
    config.list.sort = sort;
    config.list.limit = notesPerPage;
    updateAndPersistConfig();
    
    try {
        const options = {
            sort: sort,
            limit: notesPerPage,
            page: currentPage
        };
        
        if (startTime) {
            options.startTime = new Date(startTime).getTime();
        }
        
        if (endTime) {
            options.endTime = new Date(endTime).getTime();
        }

        iziToast.info({
            title: '加载中',
            message: '正在获取笔记列表...',
            class: 'loading-toast',
            timeout: false,
        });
        
        const data = await noteSDK.listNotes(options);
        
        closeToast('loading-toast');

        if (data.success) {

            iziToast.success({
                title: '成功',
                message: '笔记列表已加载'
            });

            totalNotes = data.total || data.data.length;
            displayNotes(data.data);
            updatePagination();
            document.getElementById('page').value = data.page || 1;
        } else {
            iziToast.error({
                title: '错误',
                message: data.message || '获取笔记列表失败'
            });
        }
    } catch (error) {
        closeToast('loading-toast');
        iziToast.error({
            title: '错误',
            message: '获取笔记列表失败: ' + error.message
        });
    }
}

// 显示笔记列表
function displayNotes(notes) {
    const notesContainer = document.getElementById('notesList');
    notesContainer.innerHTML = '';
    
    if (!notes || notes.length === 0) {
        notesContainer.innerHTML = '<div class="card">没有找到笔记</div>';
        return;
    }
    
    notes.forEach(note => {
        const noteElement = document.createElement('div');
        noteElement.className = 'note-card';
        
        const created = new Date(note.createdAt).toLocaleString();
        const updated = new Date(note.updatedAt).toLocaleString();
        const textTypeLabel = getTextTypeLabel(note.textType);
        noteElement.innerHTML = `
            <div class="note-title">${note.title} ${textTypeLabel}</div>
            <div class="note-meta">
                <span>创建: ${created}</span>
                <span>更新: ${updated}</span>
            </div>
            <div class="note-meta">
                <span>长度: ${note.length} 字符</span>
                <span>${note.encryption ? '已加密' : '未加密'}</span>
            </div>
            <div class="note-actions">
                <button class="view-btn" encryption="${note.encryption}" data-id="${note.id}">查看</button>
                ${ true ? `<button class="delete-btn btn-danger btn-sm" data-id="${note.id}">删除</button>` : ''}
            </div>
        `;
        
        notesContainer.appendChild(noteElement);
    });
    
    // 添加查看按钮事件
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            viewNote(this.getAttribute('data-id'), this.getAttribute('encryption'));
        });
    });
    
    // 添加删除按钮事件
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            showDeleteConfirmation(this.getAttribute('data-id'));
        });
    });
}

// 获取文本类型标签
function getTextTypeLabel(textType) {
    const labels = {
        'plain': '纯文本',
        'markdown': 'Markdown',
        'html': 'HTML',
        'code': '源代码'
        
    };
    return `<span class="text-type-badge">${labels[textType] || '纯文本'}</span>`;
}

// 显示删除确认对话框
function showDeleteConfirmation(noteId) {
    // 更改策略 直接删除
    deleteNote(noteId);
    return;
    iziToast.question({
        timeout: false,
        close: false,
        overlay: true,
        displayMode: 'once',
        title: '确认删除',
        message: '您确定要删除这个笔记吗？此操作不可撤销。',
        position: 'center',
        buttons: [
            ['<button><b>是</b></button>', function (instance, toast) {
                instance.hide({ transitionOut: 'fadeOut' }, toast, 'button');
                deleteNote(noteId);
            }, true],
            ['<button>否</button>', function (instance, toast) {
                instance.hide({ transitionOut: 'fadeOut' }, toast, 'button');
            }]
        ]
    });
}

// 更新分页控件
function updatePagination() {
    document.getElementById('pageInfo').textContent = `第 ${currentPage} 页`;
    document.getElementById('prevPage').disabled = currentPage === 1;
    
    // 简单判断是否有下一页
    const hasMore = totalNotes > currentPage * notesPerPage
    document.getElementById('nextPage').disabled = !hasMore;
}

// 上一页
function goToPrevPage() {
    if (currentPage > 0) {
        currentPage--;
        document.getElementById('page').value = currentPage;
        loadNotes();
    }
}

// 下一页
function goToNextPage() {
    currentPage++;
    document.getElementById('page').value = currentPage;
    loadNotes();
}

// 查看笔记详情
async function viewNote(noteId, encryption, password) {
    if (!noteSDK) {
        return;
    }
    console.log({
        noteId: noteId ? true : false,
        encryption: encryption ? true : false
    })
    console.log('viewNote', noteId, encryption);

    if (!config.adminToken) {
        // 加密笔记需要密码
        if (!password && (encryption && encryption == 'true')){
            currentEncryptedNoteId = noteId;
            document.getElementById('passwordPrompt').style.display = 'flex';
            return;
        }
    }

    
    try {
        iziToast.info({
            title: '加载中',
            message: '正在加载笔记...',
            class: 'viewNoteToast',
            timeout: false,
        });

        const data = await noteSDK.getNote(noteId, password ? password : undefined);
        
        closeToast('viewNoteToast');

        if (data.success) {

            iziToast.success({
                title: '成功',
                message: '笔记加载成功'
            });

            cancelPassword();

            // 显示模态框
            document.getElementById('modalNoteTitle').textContent = data.title;
            
            // 保存文本类型
            currentNoteTextType = data.textType || 'plain';
            
            // 根据文本类型渲染内容
            renderContentBasedOnType(data.content, currentNoteTextType);
            
            document.getElementById('modalNoteCreated').textContent = `创建: ${new Date(data.createdAt).toLocaleString()}`;
            document.getElementById('modalNoteUpdated').textContent = `更新: ${new Date(data.updatedAt).toLocaleString()}`;
            document.getElementById('modalNoteType').textContent = `类型: ${getTextTypeLabel(currentNoteTextType).replace('<span class="text-type-badge">', '').replace('</span>', '')}`;
            
            // 设置编辑表单的值
            document.getElementById('editTitle').value = data.title;
            document.getElementById('editContent').value = data.content;
            document.getElementById('editTextType').value = currentNoteTextType;
            document.getElementById('editPassword').value = data.password;
            document.getElementById('editExpiration').value = data.expiration ? (() => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
})() : "";
            
            currentNoteId = data.id;
            document.getElementById('viewNoteModal').style.display = 'flex';
            
            document.body.classList.add('NoteModal-open');
            
            // 重置编辑模式
            cancelEdit();
        } else {
            iziToast.error({
                title: '错误',
                message: data.message || '获取笔记详情失败'
            });
        }
    } catch (error) {
        closeToast('viewNoteToast');
        iziToast.error({
            title: '错误',
            message: '获取笔记详情失败: ' + error.message
        });
    }
}

// 密码输入
function submitPassword() {
    const password = document.getElementById('notePassword').value;
    if (!password) {
        iziToast.error({
            title: '错误',
            message: '请输入密码'
        });
        return;
    }
    viewNote(currentEncryptedNoteId, true, password);
}

// 取消密码输入
function cancelPassword() {
    document.getElementById('passwordPrompt').style.display = 'none';
    document.getElementById('notePassword').value = '';
    currentEncryptedNoteId = null;
}

// 启用编辑模式
function enableEditMode() {
    if (!config.adminToken) {
        iziToast.error({
            title: '错误',
            message: '需要管理员权限才能编辑笔记'
        });
        return;
    }
    
    isEditMode = true;
    
    // 隐藏查看模式，显示编辑模式
    // document.getElementById('modalNoteTitle').style.display = 'none'; // 不隐藏标题
    document.getElementById('modalNoteContent').style.display = 'none';
    document.getElementById('editMode').style.display = 'block';
    
    // 切换按钮显示
    document.getElementById('editNote').classList.add('hidden');
    document.getElementById('deleteNote').classList.add('hidden');
    document.getElementById('saveEdit').classList.remove('hidden');
    document.getElementById('cancelEdit').classList.remove('hidden');
}

// 取消编辑
function cancelEdit() {
    isEditMode = false;
    
    // 显示查看模式，隐藏编辑模式
    document.getElementById('modalNoteTitle').style.display = 'block';
    document.getElementById('modalNoteContent').style.display = 'block';
    document.getElementById('editMode').style.display = 'none';
    
    // 切换按钮显示
    document.getElementById('editNote').classList.remove('hidden');
    document.getElementById('deleteNote').classList.remove('hidden');
    document.getElementById('saveEdit').classList.add('hidden');
    document.getElementById('cancelEdit').classList.add('hidden');
}

// 保存编辑
async function saveEdit() {
    if (!noteSDK || !config.adminToken) {
        iziToast.error({
            title: '错误',
            message: '需要管理员权限才能编辑笔记'
        });
        return;
    }
    
    const title = document.getElementById('editTitle').value;
    const content = document.getElementById('editContent').value;
    const textType = document.getElementById('editTextType').value;
    const password = document.getElementById('editPassword').value;
    const expiration = document.getElementById('editExpiration').value;
    
    if (!title || !content) {
        iziToast.error({
            title: '错误',
            message: '标题和内容不能为空'
        });
        return;
    }
    
    try {
        const expirationTimestamp = expiration ? Math.floor(new Date(expiration).getTime() / 1000) : undefined;
        
        iziToast.info({
            title: '加载中',
            message: '正在保存笔记...',
            class: 'saveEditToast',
            timeout: false,
        });

        const data = await noteSDK.updateNote(currentNoteId, {
            title,
            content,
            textType: textType || 'plain',
            password: password || undefined,
            expiration: expirationTimestamp
        });

        closeToast('saveEditToast');
        
        if (data.success) {
            iziToast.success({
                title: '成功',
                message: '笔记已更新'
            });
            
            // 更新查看模式的内容
            document.getElementById('modalNoteTitle').textContent = title;
            
            // 更新文本类型
            currentNoteTextType = textType;
            
            // 根据文本类型重新渲染内容
            renderContentBasedOnType(content, textType);
            
            // 退出编辑模式
            cancelEdit();
            
            // 刷新笔记列表
            loadNotes();
        } else {
            iziToast.error({
                title: '错误',
                message: data.message || '更新笔记失败'
            });
        }
    } catch (error) {
        closeToast('saveEditToast');
        iziToast.error({
            title: '错误',
            message: '更新笔记失败: ' + error.message
        });
    }
}

// 关闭模态框
function closeModal() {
    document.getElementById('viewNoteModal').style.display = 'none';
    currentNoteId = null;
    document.body.classList.remove('NoteModal-open');
    cancelEdit();
}

// 删除笔记
async function deleteNote(noteId) {
    noteId = currentNoteId || noteId;
    
    if (!noteId) return;
    
    if (!noteSDK || !config.adminToken) {
        iziToast.error({
            title: '错误',
            message: '需要管理员权限才能删除笔记'
        });
        return;
    }
    
    try {
        iziToast.info({
            title: '删除中',
            message: '正在删除笔记...',
            class: 'deleteNoteToast',
            timeout: false,
        });
        
        const data = await noteSDK.deleteNote(noteId);

        closeToast('deleteNoteToast');
        
        if (data.success) {
            iziToast.success({
                title: '成功',
                message: '笔记已删除'
            });
            
            // 关闭模态框并刷新列表
            closeModal();
            loadNotes();
        } else {
            iziToast.error({
                title: '错误',
                message: data.message || '删除笔记失败'
            });
        }
    } catch (error) {
        closeToast('deleteNoteToast');
        iziToast.error({
            title: '错误',
            message: '删除笔记失败: ' + error.message
        });
    }
}

// 切换筛选选项显示
function toggleFilters() {
    const filtersContent = document.getElementById('filtersContent');
    const toggleButton = document.getElementById('toggleFilters');
    
    if (filtersContent.classList.contains('show')) {
        filtersContent.classList.remove('show');
        toggleButton.innerHTML = '显示筛选选项 <i class="icon-angle-circled-down"></i>';
    } else {
        filtersContent.classList.add('show');
        toggleButton.innerHTML = '隐藏筛选选项 <i class="icon-angle-circled-up"></i>';
    }
}

// 更新预览样式
function updatePreviewStyle() {
    if (isEditMode) {
        const content = document.getElementById('editContent').value;
        const textType = document.getElementById('editTextType').value;
        renderContentBasedOnType(content, textType);
        document.body.classList.add('NoteModal-open');
    }
}

// 初始化clipboard.js
function initClipboard() {
    // 创建Clipboard实例
    const clipboard = new ClipboardJS('.copy-code-button', {
        target: function(trigger) {
            return trigger.previousElementSibling;
        }
    });
    
    // 复制成功回调
    clipboard.on('success', function(e) {
        // 显示成功反馈
        const button = e.trigger;
        const originalText = button.innerHTML;
        
        button.innerHTML = '<i class="icon-ok"></i> 已复制';
        button.classList.add('copy-success');
        
        // 2秒后恢复原状
        setTimeout(function() {
            button.innerHTML = '<i class="icon-copy"></i> 复制';
            button.classList.remove('copy-success');
        }, 2000);
        
        e.clearSelection();
    });
    
    // 复制失败回调
    clipboard.on('error', function(e) {
        console.error('复制失败:', e.action);
    });
}

// 修改renderContentBasedOnType函数，为代码块添加复制按钮
function renderContentBasedOnType(content, textType) {
    const contentElement = document.getElementById('modalNoteContent');
    const titleEleme = document.querySelector('#modalNoteTitle');
    // 移除之前的类
    contentElement.classList.remove('markdown-content', 'html-content', 'plain-content', 'code-content');
    
    switch(textType) {
        case 'markdown':
            contentElement.classList.add('markdown-content');
            contentElement.innerHTML = marked.parse(content);
            // 高亮代码块
            hljs.highlightAll();
            // 为代码块添加复制按钮
            addCopyButtonsToCodeBlocks();
            break;
        case 'html':
            contentElement.classList.add('html-content');
            contentElement.innerHTML = content;
            hljs.highlightAll();
            // 为代码块添加复制按钮
            addCopyButtonsToCodeBlocks();
            break;
        case 'code':
            contentElement.classList.add('code-content');
            content = '<pre><code>' + hljs.highlightAuto(content).value + '</code></pre>';
            contentElement.innerHTML = content;
            addCopyButtonsToCodeBlocks();
            break;
        case 'plain':
        default:
            contentElement.classList.add('plain-content');
            contentElement.textContent = content;
            break;
    }
    secureExternalLinks();
    titleEleme.focus();
}

// 为代码块添加复制按钮
function addCopyButtonsToCodeBlocks() {
    // 查找所有的代码块
    const codeBlocks = document.querySelectorAll('#modalNoteContent pre');
    
    codeBlocks.forEach(block => {
        // 如果已经添加了复制按钮，则跳过
        if (block.parentNode.classList.contains('code-block-container')) {
            return;
        }
        
        // 创建代码块容器
        const container = document.createElement('div');
        container.className = 'code-block-container';
        
        // 将代码块放入容器
        block.parentNode.insertBefore(container, block);
        container.appendChild(block);
        
        // 创建复制按钮
        const copyButton = document.createElement('button');
        copyButton.className = 'copy-code-button';
        copyButton.setAttribute('data-clipboard-action', 'copy');
        copyButton.innerHTML = '<i class="icon-copy"></i> 复制';
        
        // 将复制按钮添加到容器
        container.appendChild(copyButton);
    });
    
    // 初始化clipboard
    initClipboard();
}

// 实现搜索功能
async function performSearch() {
    if (!noteSDK) {
        iziToast.error({
            title: '错误',
            message: 'SDK未初始化，请检查配置'
        });
        return;
    }
    
    const query = document.getElementById('searchQuery').value.trim();
    if (!query) {
        iziToast.error({
            title: '错误',
            message: '请输入搜索关键词'
        });
        return;
    }
    
    currentSearchQuery = query;
    searchNotesPerPage = parseInt(document.getElementById('searchLimit').value) || 10;
    searchCurrentPage = parseInt(document.getElementById('searchPageNum').value) || 1;

    // 保存搜索配置
    config.search.limit = searchNotesPerPage;
    updateAndPersistConfig();

    try {
        const options = {
            limit: searchNotesPerPage,
            page: searchCurrentPage
        };
        
        iziToast.info({
            title: '搜索中',
            message: `正在搜索包含 "${query}" 的笔记...`,
            class: "search-toast",
            timeout: false,
        });

        const data = await noteSDK.searchNotes(query, options);
        
        closeToast('search-toast');

        if (data.success) {

            iziToast.success({
                title: '成功',
                message: `搜索到 ${data.total || data.data.length} 条包含 "${query}" 的笔记`
            });

            searchTotalNotes = data.total || data.data.length;
            displaySearchResults(data.data, query);
            updateSearchPagination();
            document.getElementById('searchPageNum').value = searchCurrentPage;
            
            // 更新搜索结果信息
            const resultsInfo = document.getElementById('searchResultsInfo');
            if (data.data.length === 0) {
                resultsInfo.textContent = `没有找到包含"${query}"的笔记`;
            } else {
                resultsInfo.textContent = `找到 ${searchTotalNotes} 条包含 "${query}" 的笔记`;
            }
        } else {
            iziToast.error({
                title: '错误',
                message: data.message || '搜索失败'
            });
        }
    } catch (error) {
        closeToast('search-toast');
        iziToast.error({
            title: '错误',
            message: '搜索失败: ' + error.message
        });
    }
}

// 显示搜索结果
function displaySearchResults(notes, query) {
    const resultsContainer = document.getElementById('searchResults');
    resultsContainer.innerHTML = '';
    
    if (!notes || notes.length === 0) {
        resultsContainer.innerHTML = '<div class="card">没有找到相关笔记</div>';
        return;
    }
    
    notes.forEach(note => {
        const noteElement = document.createElement('div');
        noteElement.className = 'note-card';
        
        const created = new Date(note.createdAt).toLocaleString();
        const updated = new Date(note.updatedAt).toLocaleString();
        const textTypeLabel = getTextTypeLabel(note.textType);
        
        // 高亮标题中的搜索关键词
        let highlightedTitle = note.title;
        if (query) {
            const regex = new RegExp(query, 'gi');
            highlightedTitle = note.title.replace(regex, match => 
                `<span class="highlight">${match}</span>`
            );
        }
        
        noteElement.innerHTML = `
            <div class="note-title">${highlightedTitle} ${textTypeLabel}</div>
            <div class="note-meta">
                <span>创建: ${created}</span>
                <span>更新: ${updated}</span>
            </div>
            <div class="note-meta">
                <span>长度: ${note.length} 字符</span>
                <span>${note.encryption ? '已加密' : '未加密'}</span>
            </div>
            <div class="note-actions">
                <button class="view-btn" encryption="${note.encryption}" data-id="${note.id}">查看</button>
                ${ true ? `<button class="delete-btn btn-danger btn-sm" data-id="${note.id}">删除</button>` : ''}
            </div>
        `;
        
        resultsContainer.appendChild(noteElement);
    });
    
    // 添加查看按钮事件
    document.querySelectorAll('#searchResults .view-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            viewNote(this.getAttribute('data-id'), this.getAttribute('encryption'));
        });
    });
    
    // 添加删除按钮事件
    document.querySelectorAll('#searchResults .delete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            showDeleteConfirmation(this.getAttribute('data-id'));
        });
    });
}

// 更新搜索分页控件
function updateSearchPagination() {
    document.getElementById('searchPageInfo').textContent = `第 ${searchCurrentPage} 页`;
    document.getElementById('searchPrevPage').disabled = searchCurrentPage === 1;
    
    // 简单判断是否有下一页
    const hasMore = searchTotalNotes > searchCurrentPage * searchNotesPerPage;
    document.getElementById('searchNextPage').disabled = !hasMore;
}

// 搜索上一页
function goToSearchPrevPage() {
    if (searchCurrentPage > 1) {
        searchCurrentPage--;
        document.getElementById('searchPageNum').value = searchCurrentPage;
        performSearch();
    }
}

// 搜索下一页
function goToSearchNextPage() {
    searchCurrentPage++;
    document.getElementById('searchPageNum').value = searchCurrentPage;
    performSearch();
}

// 关闭 iziToast 通知
function closeToast(className) {
    if (className){
        var toast = document.querySelectorAll('.' + className).forEach(toast => iziToast.hide({
            transitionOut:"fadeOutDown"
        }, toast));
    } else {
        var toast = document.querySelectorAll('.iziToast').forEach(toast => iziToast.hide({
            transitionOut:"fadeOutDown"
        }, toast));;
    }
}

// 外部链接安全处理
function secureExternalLinks() {
  // 获取所有 .content 元素内的链接
  const links = document.querySelectorAll('.note-content a[href]');
  
  links.forEach(link => {
    const href = link.href.toLowerCase();
    
    // 跳过特殊协议链接（如 mailto/tel/javascript）和内部锚点
    if (href.startsWith('mailto:') || 
        href.startsWith('tel:') || 
        href.startsWith('javascript:') || 
        href.startsWith('#')) {
      return;
    }
    
    // 判断是否为外部链接（不同域名）
    if (link.hostname !== window.location.hostname) {
      // 设置在新窗口打开
      link.target = '_blank';
      
      // 安全设置：添加 rel="noopener noreferrer"
      const relValues = new Set((link.rel || '').split(' ').filter(Boolean));
      relValues.add('noopener');
      relValues.add('noreferrer');
      link.rel = Array.from(relValues).join(' ');
    }
  });
}


// 在DOM加载完成后初始化clipboard
document.addEventListener('DOMContentLoaded', function() {
    // 原有的初始化代码
    initTheme();
    loadConfig();
    setupEventListeners();
    loadNotes();
    
    // 初始化clipboard
    initClipboard();

    // 初始化iziToast
    iziToast.settings({
        timeout: 3000,
        closeOnEscape: true,
        position: 'topRight',
        transitionIn: 'fadeIn',
        transitionOut: 'fadeOut'
    });
});