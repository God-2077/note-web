const generateId = (length = 8) => {
    //简短id生成
    let id = '';
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';

    // 添加时间戳部分（32进制压缩）
    id += Date.now().toString(32).slice(0, 5);

    // 补充随机字符直到达到指定长度
    while (id.length < length) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return id.slice(0, length);
}

export { generateId };