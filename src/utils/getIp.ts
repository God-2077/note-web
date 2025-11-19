import { Context } from 'hono';


const getConnInfo = (c: Context) => ({
  remote: {
    address: c.req.header("x-vercel-proxied-for") || c.req.header("cf-connecting-ip")
  }
});

const getClientIp = (c: Context) => {
    try {
        const connInfo = getConnInfo(c);
        return connInfo?.remote?.address || null;
    } catch {
        return null;
    }
};

export { getClientIp, getConnInfo };
