/** @odoo-module **/
import { messagingService } from "@mail/services/messaging_service/messaging_service";

export function makeFakeMessagingService(param0) {
    return {
        ...messagingService,
        async start() {
            if (param0.start) {
                await param0.start();
            }
            const fakeMessagingservice = messagingService.start(...arguments);
            Object.assign(fakeMessagingservice, param0);
            return fakeMessagingservice;
        },
    }
}
