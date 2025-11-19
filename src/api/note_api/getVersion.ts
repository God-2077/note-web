import { Context } from 'hono';
import { defaultJsonResponse, JsonResponseType, mergeObject } from '../../models/models';
import { getClientIp, getConnInfo } from '../../utils/getIp';

const getVersion = async (c: Context) => {
    // const {
    // id,
    // tag,
    // timestamp
    // } = c.env.CF_VERSION_METADATA;

    const user_agent = c.req.header('User-Agent') || null;
    const requestId = c.get("requestId") || null;

    const { id: versionId, tag: versionTag, timestamp: versionTimestamp } = c.env.CF_VERSION_METADATA;

    // 将版本信息以 JSON 格式返回
    return c.json(mergeObject(defaultJsonResponse, {
        code: 200,
        success: true,
        message: "successful",
        data: {
            requestId,
            ip: getClientIp(c),
            user_agent,
            getConnInfo: getConnInfo(c),
            workerVersion: {
                versionId,
                versionTag,
                versionTimestamp
            }
        }
    }) as JsonResponseType);

}

export { getVersion }