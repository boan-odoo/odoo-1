/** @odoo-module **/

import { getMessagingComponent } from './utils/messaging_component';
import { messagingService } from '@mail/services/messaging_service/messaging_service';
import { registry } from '@web/core/registry';
import { systrayService } from '@mail/services/systray_service/systray_service';
import { wowlEnvProviderService } from '@mail/services/wowl_env_provider_service/wowl_env_provider_service';

const serviceRegistry = registry.category('services');
const componentsRegistry = registry.category('main_components');

serviceRegistry.add("messaging", messagingService);
serviceRegistry.add("systray_service", systrayService);
serviceRegistry.add("wowlEnvProviderService", wowlEnvProviderService);

componentsRegistry.add('chat_window_manager', {
    Component: getMessagingComponent("ChatWindowManager"),
});
componentsRegistry.add('dialog_manager', {
    Component: getMessagingComponent('DialogManager'),
});

registry.category('actions').add("mail.discuss", getMessagingComponent('Discuss'));
