class NoteSDK {
  /**
   * 创建 NoteSDK 实例
   * @param {Object} config - SDK 配置
   * @param {string} config.baseUrl - API 基础地址
   * @param {string} [config.token] - 认证令牌
   * @param {string} [config.password] - 加密笔记密码
   */
  constructor(config) {
    if (!config.baseUrl) {
      throw new Error('baseUrl is required');
    }

    // this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.baseUrl = new URL(config.baseUrl);
    if (this.baseUrl.protocol !== 'http:' && this.baseUrl.protocol !== 'https:') {
      throw new Error('baseUrl must be http or https');
    }
    if (this.baseUrl.pathname.endsWith('/')) {
      this.baseUrl.pathname = this.baseUrl.pathname.slice(0, -1);
    }
    this.token = config.token || null;
    this.password = config.password || null;
    this.headers = {
      'Content-Type': 'application/json',
      'X-Token': this.token
    };
  }

  /**
   * 设置认证令牌
   * @param {string} token - 认证令牌
   * @returns {NoteSDK} - 当前实例（支持链式调用）
   */
  setToken(token) {
    this.token = token;
    this.headers['X-Token'] = token;
    return this;
  }

  /**
   * 设置加密密码
   * @param {string} password - 加密密码
   * @returns {NoteSDK} - 当前实例（支持链式调用）
   */
  setPassword(password) {
    this.password = password;
    return this;
  }

  /**
   * 创建新笔记
   * @param {Object} noteData - 笔记数据
   * @param {string} noteData.title - 笔记标题
   * @param {string} noteData.content - 笔记内容
   * @param {string} [noteData.textType='plain'] - 文本类型
   * @param {string} [noteData.mimeType='text/plain'] - MIME类型
   * @param {string[]} [noteData.folders=[]] - 文件夹数组
   * @param {number} [noteData.expiration] - 过期时间（秒）
   * @param {number} [noteData.expirationTtl] - 相对过期时间（秒）
   * @param {string} [noteData.password] - 加密密码
   * @returns {Promise<Object>} - 创建结果
   */
  async createNote(noteData) {
    const url = `${this.baseUrl}/create`;
    const body = {
      title: noteData.title,
      content: noteData.content,
      textType: noteData.textType || 'plain',
      mimeType: noteData.mimeType || 'text/plain',
      folders: noteData.folders || [],
      expiration: noteData.expiration,
      expirationTtl: noteData.expirationTtl,
      password: noteData.password || this.password
    };

    const response = await this._fetch(url, {
      method: 'POST',
      body: JSON.stringify(body)
    });

    return response;
  }

  /**
   * 更新笔记
   * @param {string} id - 笔记ID
   * @param {Object} updateData - 更新数据
   * @param {string} [updateData.title] - 新标题
   * @param {string} [updateData.content] - 新内容
   * @param {string} [updateData.textType] - 新文本类型
   * @param {string} [updateData.mimeType] - 新MIME类型
   * @param {string[]} [updateData.folders=[]] - 新文件夹数组
   * @param {number} [updateData.expiration] - 新过期时间（秒）
   * @param {number} [updateData.expirationTtl] - 新相对过期时间（秒）
   * @param {string} [updateData.password] - 新加密密码
   * @returns {Promise<Object>} - 更新结果
   */
  async updateNote(id, updateData) {
    const url = `${this.baseUrl}/update/${id}`;
    const body = {
      title: updateData.title,
      content: updateData.content,
      textType: updateData.textType,
      mimeType: updateData.mimeType || 'text/plain',
      folders: updateData.folders || [],
      expiration: updateData.expiration,
      expirationTtl: updateData.expirationTtl,
      password: updateData.password || this.password
    };

    const response = await this._fetch(url, {
      method: 'PUT',
      body: JSON.stringify(body)
    });

    return response;
  }

  /**
   * 获取笔记详情
   * @param {string} id - 笔记ID
   * @param {string} [password] - 加密密码（可选）
   * @returns {Promise<Object>} - 笔记详情
   */
  async getNote(id, password) {
    const url = `${this.baseUrl}/notes/${id}`;
    const params = new URLSearchParams();

    if (password || this.password) {
      params.append('pwd', password || this.password);
    }

    const fullUrl = `${url}?${params.toString()}`;
    return this._fetch(fullUrl);
  }

  /**
   * 获取笔记 Raw 链接
   * @param {string} id - 笔记ID
   * @param {string} [password] - 加密密码（可选）
   * @param {string} [textType='plain'] - 文本类型(plain(Content-type: text/plain), markdown(渲染成HTML), html(Content-type: text/html))
   * @returns {Promise<string>} - 原始笔记内容
   */

  getNoteRawUrl(id, password, textType) {
    const map = {
      'plain': 'text',
      'markdown': 'md',
      'html': 'html'
    }
    let suffix;
    if (textType && map[textType]) {
      suffix = map[textType]
    } else if (textType) {
      throw new TypeError('Invalid textType');
    } else {
      suffix = ''
    }
    suffix = `/${suffix}`

    const url = `${this.baseUrl}/notes/${id}/raw${suffix}`;

    if (password) {
      url += `?pwd=${password}`;
    }

    return url
  }

  /**
   * 删除笔记
   * @param {string} id - 笔记ID
   * @returns {Promise<Object>} - 删除结果
   */
  async deleteNote(id) {
    const url = `${this.baseUrl}/delete/${id}`;
    return this._fetch(url, { method: 'DELETE' });
  }

  /**
   * 列出笔记
   * @param {Object} [options] - 列表选项
   * @param {string} [options.sort='date'] - 排序方式 (date, update, a-z, z-a)
   * @param {number} [options.limit=100] - 每页数量
   * @param {number} [options.page=1] - 页码
   * @param {string[]} [options.folders] - 文件夹数组
   * @param {number} [options.startTime] - 开始时间戳
   * @param {number} [options.endTime] - 结束时间戳
   * @returns {Promise<Object>} - 笔记列表
   */
  async listNotes(options = {}) {
    const url = `${this.baseUrl}/list`;
    const params = new URLSearchParams({
      sort: options.sort || 'date',
      limit: options.limit || 100,
      page: options.page || 1,
      ...(options.folders && options.folders.length > 0 && { folders: options.folders.join(',') }),
      ...(options.startTime && { startTime: options.startTime }),
      ...(options.endTime && { endTime: options.endTime })
    });

    return this._fetch(`${url}?${params.toString()}`);
  }

  /**
   * 搜索笔记
   * @param {string} query - 搜索关键词
   * @param {Object} [options] - 搜索选项
   * @param {number} [options.limit=20] - 每页数量
   * @param {string[]} [options.folders] - 文件夹数组
   * @param {number} [options.page=1] - 页码
   * @returns {Promise<Object>} - 搜索结果
   */
  async searchNotes(query, options = {}) {
    const url = `${this.baseUrl}/search`;
    const params = new URLSearchParams({
      q: query,
      ...(options.folders && options.folders.length > 0 && { folders: options.folders.join(',') }),
      ...(options.limit && { limit: options.limit }),
      ...(options.page && { page: options.page })
    });

    return this._fetch(`${url}?${params.toString()}`);
  }

  /**
   * 验证管理员权限
   * @returns {Promise<Object>} - 验证结果
   */
  async verifyAdmin() {
    const url = `${this.baseUrl}/verify-admin`;
    return this._fetch(url);
  }

  /**
   * 获取版本信息
   * @returns {Promise<Object>} - 版本信息
   */
  async getVersion() {
    const url = `${this.baseUrl}/version`;
    return this._fetch(url);
  }

  /**
   * 内部 fetch 方法
   * @private
   */
  async _fetch(url, options = {}) {
    const config = {
      headers: this.headers,
      ...options
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Request failed with status ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }
}

// 导出为 ES6 模块
// export default NoteSDK;

window.NoteSDK = NoteSDK;