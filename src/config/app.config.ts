export default () => ({
    port : (process.env.PORT, 10) || 3000,
    nodeEnv : process.env.NODE_ENV || "development",
    appName : process.env.APP_NAME || "clinigen-API"
})