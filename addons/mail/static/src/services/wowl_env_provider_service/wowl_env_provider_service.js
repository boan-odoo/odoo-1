/** @odoo-module **/

export const wowlEnvProviderService = {
    async: true,

    async start(env) {
        await owl.utils.whenReady();
        owl.Component.wowlEnv = env; 
    }
}
