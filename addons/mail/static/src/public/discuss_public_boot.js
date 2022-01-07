/** @odoo-module **/

import { data } from 'mail.discuss_public_channel_template';

import { messagingService } from '@mail/services/messaging_service/messaging_service';
import { getMessagingComponent } from '@mail/utils/messaging_component';

import { processTemplates } from '@web/core/assets';
import { MainComponentsContainer } from '@web/core/main_components_container';
import { registry } from '@web/core/registry';
import { makeEnv, startServices } from '@web/env';
import { session } from '@web/session';

import * as AbstractService from 'web.AbstractService';
import * as legacyEnv from 'web.env';
import {
    makeLegacyCrashManagerService,
    makeLegacyDialogMappingService,
    makeLegacyNotificationService,
    makeLegacyRpcService,
    makeLegacySessionService,
    mapLegacyEnvToWowlEnv,
} from '@web/legacy/utils';

import * as legacySession from 'web.session';

const { Component, config, mount, whenReady } = owl;

Component.env = legacyEnv;

(async function boot() {
    await whenReady();
    config.mode = Component.env.isDebug() ? 'dev' : 'prod';
    AbstractService.prototype.deployServices(Component.env);
    const serviceRegistry = registry.category('services');
    serviceRegistry.add('legacy_rpc', makeLegacyRpcService(Component.env));
    serviceRegistry.add('legacy_session', makeLegacySessionService(Component.env, legacySession));
    serviceRegistry.add('legacy_notification', makeLegacyNotificationService(Component.env));
    serviceRegistry.add('legacy_crash_manager', makeLegacyCrashManagerService(Component.env));
    serviceRegistry.add('legacy_dialog_mapping', makeLegacyDialogMappingService(Component.env));
    serviceRegistry.add("messaging", {
        ...messagingService,
        messagingValues: { autofetchPartnerImStatus: false },
    });
    await legacySession.is_bound;
    Component.env.qweb.addTemplates(legacySession.owlTemplates);
    Object.assign(odoo, {
        info: {
            db: session.db,
            server_version: session.server_version,
            server_version_info: session.server_version_info,
            isEnterprise: session.server_version_info.slice(-1)[0] === 'e',
        },
        isReady: false,
    });
    const env = makeEnv();
    const [, templates] = await Promise.all([
        startServices(env),
        odoo.loadTemplatesPromise.then(processTemplates),
    ]);
    env.qweb.addTemplates(templates);
    mapLegacyEnvToWowlEnv(Component.env, env);
    odoo.isReady = true;
    env.bus.trigger('WEB_CLIENT_READY');
    createAndMountDiscussPublicView(env);
})();

async function createAndMountDiscussPublicView(env) {
    const messaging = await env.services.messaging.get();
    // needed by the attachment viewer
    messaging.models['Thread'].insert(messaging.models['Thread'].convertData(data.channelData));
    const discussPublicView = messaging.models['DiscussPublicView'].create(data.discussPublicViewData);
    if (discussPublicView.shouldDisplayWelcomeViewInitially) {
        discussPublicView.switchToWelcomeView();
    } else {
        discussPublicView.switchToThreadView();
    }

    const componentsRegistry = registry.category('main_components');
    componentsRegistry.add('dialog_manager', {
        Component: getMessagingComponent('DialogManager'),
    });
    componentsRegistry.add('discuss_public_view', {
        Component: getMessagingComponent('DiscussPublicView'),
        props: {
            localId: discussPublicView.localId,
        },
    });

    const mainComponent = await mount(MainComponentsContainer, { env, target: document.body });
    mainComponent.el.classList.add("h-100");
}
