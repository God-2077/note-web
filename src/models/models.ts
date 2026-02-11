interface JsonResponseType {
    code: number;
    success: boolean;
    message: string;
    error?: string;
    data: object | null;
}

const defaultJsonResponse: JsonResponseType = {
    code: 200,
    success: true,
    message: "",
    error: "",
    data: null
};

const invalidtokenJsonResponse: JsonResponseType = {
    code: 401,
    success: false,
    message: "Invalid Token",
    error: "",
    data: null
};

const defaultErrorJsonResponse: JsonResponseType = {
    code: 500,
    success: false,
    message: "Internal server error",
    error: "",
    data: null
};

const notFoundJsonResponse: JsonResponseType = {
    code: 404,
    success: false,
    message: "Not Found",
    error: "",
    data: null
};

const rateLimitJsonResponse: JsonResponseType = {
    code: 429,
    success: false,
    message: "Rate limit exceeded",
    error: "Too Many Requests",
    data: null
}


interface NoteType {
    id: string | number;
    title: string;
    content: string;
    length: number;
    textType: string | null;
    mimeType: string | null;
    folders: string[];
    ip: string | null;
    user_agent: string | null;
    encryption: boolean;
    password: string | null;
    createdAt: number | null;
    updatedAt: number | null;
    expiration: number | null;
}

const defaultNote: NoteType = {
    id: '', // 假设id默认值为空字符串（根据实际业务可调整，如0）
    title: "",
    content: "",
    length: NaN,
    textType: "markdown",
    mimeType: "text/markdown",
    folders: [],
    ip: null,
    user_agent: "Unknown",
    encryption: false,
    password: null,
    createdAt: null,
    updatedAt: null,
    expiration: null,
};



interface NoteIndexItemType {
    id: string | number;
    title: string;
    length: number;
    textType: string;
    mimeType: string;
    encryption: boolean;
    folders: string[];
    createdAt: number | null;
    updatedAt: number | null;
    expiration: number | null;
}

const defaultNoteIndexItem: NoteIndexItemType = {
    "id": "",
    "title": "Untitled",
    "length": 0,
    "textType": "plain",
    "mimeType": "text/plain",
    "encryption": false,
    "folders": [],
    "createdAt": 0,
    "updatedAt": 0,
    "expiration": null
};



interface List {
    total: number;
    page: number;
    limit: number;
    sort: string;
    startTime: number;
    endTime: number;
    totalPages: number;
    folders: string[];
    notes: NoteIndexItemType[];
}

const defaultList: List = {
    "total": 0,
    "page": 0,
    "limit": 0,
    "sort": "",
    "startTime": 0,
    "endTime": 0,
    "totalPages": 0,
    "folders": [],
    "notes": []
}

function mergeObject(obj1: object, obj2: object): object {
    /**
     * 合并两个对象，将 obj2 中的属性合并到 obj1 中。
     * 如果 obj2 中的属性值为 null 或 undefined，则不合并。
     * @param obj1 目标对象
     * @param obj2 源对象
     * @returns 合并后的对象
     */
    const keys = Object.keys(obj1);
    keys.forEach((key) => {
        obj1[key] = obj2[key] ?? obj1[key];
    });
    return obj1;
}

function mergelistitem(list: Object[], item: object): Object[] {
    /**
    * 合并列表中的每个对象与给定的模板对象。
    * @param list 需要合并的对象列表
    * @param item 模板对象，用于合并到列表中的每个对象
    * @returns 合并后的列表
    */
    for (let i = 0; i < list.length; i++) {
        list[i] = mergeObject(item, list[i]);
    }
    return list;
}


export {
    JsonResponseType,
    defaultJsonResponse,
    invalidtokenJsonResponse,
    defaultErrorJsonResponse,
    NoteType,
    defaultNote,
    NoteIndexItemType,
    defaultNoteIndexItem,
    List,
    defaultList,
    mergeObject,
    notFoundJsonResponse,
    mergelistitem,
    rateLimitJsonResponse
}