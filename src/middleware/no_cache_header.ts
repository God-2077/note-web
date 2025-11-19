const no_cache_header = async (c: Context, next: Next) => {
    await next();
    c.header('Cache-Control', 'no-cache');
    c.header('Pragma', 'no-cache');
};

export { no_cache_header };
