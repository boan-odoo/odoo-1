/** @odoo-module **/

import { MockModels } from '@mail/../tests/helpers/mock_models';
import { MessagingMenuContainer } from '@mail/components/messaging_menu_container/messaging_menu_container';
import { addTimeControlToEnv } from '@mail/env/test_env';
import { insertAndReplace, replace } from '@mail/model/model_field_command';
import { wowlEnvProviderService } from '@mail/services/wowl_env_provider_service/wowl_env_provider_service';
import { getMessagingComponent } from '@mail/utils/messaging_component';
import { nextTick } from '@mail/utils/utils';
import { patchWithCleanup, legacyExtraNextTick } from "@web/../tests/helpers/utils";
import { createWebClient, doAction, getActionManagerServerData } from "@web/../tests/webclient/helpers";
import { registry } from '@web/core/registry';
import { actionService } from "@web/webclient/actions/action_service";
import BusService from 'bus.BusService';
import AbstractStorageService from 'web.AbstractStorageService';
import { ComponentAdapter } from 'web.OwlCompatibility';
import RamStorage from 'web.RamStorage';
import LegacyRegistry from "web.Registry";
import { makeTestPromise } from 'web.test_utils';
import { messagingService } from '../services/messaging_service/messaging_service';
import { registerCleanup } from "@web/../tests/helpers/cleanup";
import { SIZES, uiService } from '@web/core/ui/ui_service';


const { Component } = owl;
const { EventBus } = owl.core;

class WidgetWrapper extends ComponentAdapter {
    constructor() {
        super(...arguments);
        this.env = Component.env;
        owl.hooks.onMounted(() => {
            WidgetWrapper.currentWidget = this.widget;
        });
        owl.hooks.onWillUnmount(() => WidgetWrapper.currentWidget = undefined );
    }
}

/**
 * @param {function} doActionFn
 * @returns
 */
export function makeFakeActionService(doActionFn) {
    return {
        ...actionService,
        start() {
            const originalService = actionService.start(...arguments);
            return {
                ...originalService,
                doAction: doActionFn,
                originalService,
            }
        },
    }
}

/**
 * Make an uiService whom size is adjustable
 * @param {number} size The size of the ui service, this parameter will impact env.isSmall as well
 * as uiService.isSmall.
 */
export function makeFakeUiService(size=SIZES.SM) {
    return {
        ...uiService,
        start(env) {
            const service = uiService.start(...arguments);
            delete env.isSmall;
            env.isSmall = size <= SIZES.SM;
            return {
                ...service,
                isSmall: size <= SIZES.SM,
                size,
            }
        },
    }
}


//------------------------------------------------------------------------------
// Private
//------------------------------------------------------------------------------

/**
 * Create a fake object 'dataTransfer', linked to some files,
 * which is passed to drag and drop events.
 *
 * @param {Object[]} files
 * @returns {Object}
 */
function _createFakeDataTransfer(files) {
    return {
        dropEffect: 'all',
        effectAllowed: 'all',
        files,
        items: [],
        types: ['Files'],
    };
}

//------------------------------------------------------------------------------
// Public: rendering timers
//------------------------------------------------------------------------------

/**
 * Returns a promise resolved at the next animation frame.
 *
 * @returns {Promise}
 */
function nextAnimationFrame() {
    const requestAnimationFrame = Component.scheduler.requestAnimationFrame;
    return new Promise(function (resolve) {
        setTimeout(() => requestAnimationFrame(() => resolve()));
    });
}

/**
 * Returns a promise resolved the next time OWL stops rendering.
 *
 * @param {function} func function which, when called, is
 *   expected to trigger OWL render(s).
 * @param {number} [timeoutDelay=5000] in ms
 * @returns {Promise}
 */
const afterNextRender = (function () {
    const stop = Component.scheduler.stop;
    const stopPromises = [];

    Component.scheduler.stop = function () {
        const wasRunning = this.isRunning;
        stop.call(this);
        if (wasRunning) {
            while (stopPromises.length) {
                stopPromises.pop().resolve();
            }
        }
    };

    async function afterNextRender(func, timeoutDelay = 5000) {
        // Define the potential errors outside of the promise to get a proper
        // trace if they happen.
        const startError = new Error("Timeout: the render didn't start.");
        const stopError = new Error("Timeout: the render didn't stop.");
        // Set up the timeout to reject if no render happens.
        let timeoutNoRender;
        const timeoutProm = new Promise((resolve, reject) => {
            timeoutNoRender = setTimeout(() => {
                let error = startError;
                if (Component.scheduler.isRunning) {
                    error = stopError;
                }
                console.error(error);
                reject(error);
            }, timeoutDelay);
        });
        // Set up the promise to resolve if a render happens.
        const prom = makeTestPromise();
        stopPromises.push(prom);
        // Start the function expected to trigger a render after the promise
        // has been registered to not miss any potential render.
        const funcRes = func();
        // Make them race (first to resolve/reject wins).
        await Promise.race([prom, timeoutProm]);
        clearTimeout(timeoutNoRender);
        // Wait the end of the function to ensure all potential effects are
        // taken into account during the following verification step.
        await funcRes;
        // Wait one more frame to make sure no new render has been queued.
        await nextAnimationFrame();
        if (Component.scheduler.isRunning) {
            await afterNextRender(() => {}, timeoutDelay);
        }
    }

    return afterNextRender;
})();


//------------------------------------------------------------------------------
// Public: test lifecycle
//------------------------------------------------------------------------------

function beforeEach(self) {
    const models = MockModels.generateData();
    const { TEST_USER_IDS } = MockModels;

    models['res.partner'].records.push({
        active: false,
        display_name: "OdooBot",
        id: TEST_USER_IDS.partnerRootId,
    });

    models['res.partner'].records.push({
        display_name: "Your Company, Mitchell Admin",
        id: TEST_USER_IDS.currentPartnerId,
        name: "Mitchell Admin",
    });

    models['res.users'].records.push({
        display_name: "Your Company, Mitchell Admin",
        id: TEST_USER_IDS.currentUserId,
        name: "Mitchell Admin",
        partner_id: TEST_USER_IDS.currentPartnerId,
    });

    models['res.partner'].records.push({
        active: false,
        display_name: "Public user",
        id: TEST_USER_IDS.publicPartnerId,
    });

    models['res.users'].records.push({
        active: false,
        display_name: "Public user",
        id: TEST_USER_IDS.publicUserId,
        name: "Public user",
        partner_id: TEST_USER_IDS.publicPartnerId,
    });

    const originals = {
        '_.debounce': _.debounce,
        '_.throttle': _.throttle,
    };

    (function patch() {
        // patch _.debounce and _.throttle to be fast and synchronous
        _.debounce = _.identity;
        _.throttle = _.identity;
    })();

    registerCleanup(() => {
        _.debounce = originals['_.debounce'];
        _.throttle = originals['_.throttle'];
        self.env = undefined;
        self.webClient = undefined;
    });

    Object.assign(self, {
        serverData: {
            models,
            actions: {},
            views: {
                'mail.message,false,search': '<search/>',
            },
        },
        TEST_USER_IDS,
    });
    Object.defineProperty(self, 'messaging', {
        get() {
            if (!this.env || !this.env.services.messaging) {
                return undefined;
            }
            return this.env.services.messaging.modelManager.messaging;
        },
    });
}

function getAfterEvent(messagingBus) {
    /**
     * Returns a promise resolved after the expected event is received.
     *
     * @param {Object} param0
     * @param {string} param0.eventName event to wait
     * @param {function} param0.func function which, when called, is expected to
     *  trigger the event
     * @param {string} [param0.message] assertion message
     * @param {function} [param0.predicate] predicate called with event data.
     *  If not provided, only the event name has to match.
     * @param {number} [param0.timeoutDelay=5000] how long to wait at most in ms
     * @returns {Promise}
     */
    return async function afterEvent({ eventName, func, message, predicate, timeoutDelay = 5000 }) {
        // Set up the timeout to reject if the event is not triggered.
        let timeoutNoEvent;
        const timeoutProm = new Promise((resolve, reject) => {
            timeoutNoEvent = setTimeout(() => {
                let error = message
                    ? new Error(message)
                    : new Error(`Timeout: the event ${eventName} was not triggered.`);
                console.error(error);
                reject(error);
            }, timeoutDelay);
        });
        // Set up the promise to resolve if the event is triggered.
        const eventProm = new Promise(resolve => {
            messagingBus.on(eventName, null, data => {
                if (!predicate || predicate(data)) {
                    resolve();
                }
            });
        });
        // Start the function expected to trigger the event after the
        // promise has been registered to not miss any potential event.
        const funcRes = func();
        // Make them race (first to resolve/reject wins).
        await Promise.race([eventProm, timeoutProm]);
        clearTimeout(timeoutNoEvent);
        // If the event is triggered before the end of the async function,
        // ensure the function finishes its job before returning.
        return await funcRes;
    };
}

/**
 * Creates a new root Component, with the given props, and mounts it on target.
 * Assumes that self.env is set to the correct value.
 * Components created this way are automatically registered for clean up after
 * the test, which will happen when `afterEach` is called.
 *
 * @param {Object} self the current QUnit instance
 * @param {Object} Component the class of the component to create
 * @param {Object} param2
 * @param {Object} [param2.props={}] forwarded to component constructor
 * @param {DOM.Element} param2.target mount target for the component
 * @returns {Component}
 */
async function createRootComponent(self, Component, { props = {}, target }) {
    Component.env = self.env;
    const component = new Component(null, props);
    delete Component.env;
    registerCleanup(() => component.destroy());
    await afterNextRender(() => component.mount(target));
    return component;
}

/**
 * Creates and returns a new root messaging component, based on the given
 * componentName and with the given props, and mounts it on target.
 * Assumes that self.env is set to the correct value.
 * Components created this way are automatically registered for clean up after
 * the test, which will happen when `afterEach` is called.
 *
 * @param {Object} self the current QUnit instance
 * @param {string} componentName the class name of the component to create
 * @param {Object} param2
 * @param {Object} [param2.props={}] forwarded to component constructor
 * @param {DOM.Element} param2.target mount target for the component
 * @returns {Component}
 */
async function createRootMessagingComponent(self, componentName, { props = {}, target }) {
    return await createRootComponent(self, getMessagingComponent(componentName), { props, target });
}

function getClick({ afterNextRender }) {
    return async function click(selector) {
        await afterNextRender(() => document.querySelector(selector).click());
    };
}

function getCreateChatterContainerComponent({ afterEvent, env, webClient }) {
    return async function createChatterContainerComponent(props, { waitUntilMessagesLoaded = true } = {}) {
        let chatterContainerComponent;
        async function func() {
            chatterContainerComponent = await createRootMessagingComponent({ env }, "ChatterContainer", {
                props,
                target: webClient.el,
            });
        }
        if (waitUntilMessagesLoaded) {
            await afterNextRender(() => afterEvent({
                eventName: 'o-thread-view-hint-processed',
                func,
                message: "should wait until chatter loaded messages after creating chatter container component",
                predicate: ({ hint, threadViewer }) => {
                    return (
                        hint.type === 'messages-loaded' &&
                        threadViewer &&
                        threadViewer.chatter &&
                        threadViewer.chatter.threadModel === props.threadModel &&
                        threadViewer.chatter.threadId === props.threadId
                    );
                },
            }));
        } else {
            await func();
        }
        return chatterContainerComponent;
    };
}

function getCreateComposerComponent({ env, modelManager, webClient }) {
    return async function createComposerComponent(composer, props) {
        const composerView = modelManager.messaging.models['ComposerView'].create({
            qunitTest: insertAndReplace({
                composer: replace(composer),
            }),
        });
        return await createRootMessagingComponent({ env }, "Composer", {
            props: { localId: composerView.localId, ...props },
            target: webClient.el,
        });
    };
}

function getCreateComposerSuggestionComponent({ env, modelManager, webClient }) {
    return async function createComposerSuggestionComponent(composer, props) {
        const composerView = modelManager.messaging.models['ComposerView'].create({
            qunitTest: insertAndReplace({
                composer: replace(composer),
            }),
        });
        await createRootMessagingComponent({ env }, "ComposerSuggestion", {
            props: { ...props, composerViewLocalId: composerView.localId },
            target: webClient.el,
        });
    };
}

function getCreateMessageComponent({ env, modelManager, webClient }) {
    return async function createMessageComponent(message) {
        const messageView = modelManager.messaging.models['MessageView'].create({
            message: replace(message),
            qunitTest: insertAndReplace(),
        });
        await createRootMessagingComponent({ env }, "Message", {
            props: { localId: messageView.localId },
            target: webClient.el,
        });
    };
}

function getCreateMessagingMenuComponent({ env, webClient }) {
    return async function createMessagingMenuComponent() {
        return await createRootComponent({ env }, MessagingMenuContainer, { target: webClient.el });
    };
}

function getCreateNotificationListComponent({ env, modelManager, webClient }) {
    return async function createNotificationListComponent({ filter = 'all' } = {}) {
        const notificationListView = modelManager.messaging.models['NotificationListView'].create({
            filter,
            qunitTestOwner: insertAndReplace(),
        });
        await createRootMessagingComponent({ env }, "NotificationList", {
            props: { localId: notificationListView.localId },
            target: webClient.el,
        });
    };
}

function getCreateThreadViewComponent({ afterEvent, env, webClient }) {
    return async function createThreadViewComponent(threadView, otherProps = {}, { isFixedSize = false, waitUntilMessagesLoaded = true } = {}) {
        let target;
        if (isFixedSize) {
            // needed to allow scrolling in some tests
            const div = document.createElement('div');
            Object.assign(div.style, {
                display: 'flex',
                'flex-flow': 'column',
                height: '300px',
            });
            webClient.el.append(div);
            target = div;
        } else {
            target = webClient.el;
        }
        async function func() {
            return createRootMessagingComponent({ env }, "ThreadView", { props: { localId: threadView.localId, ...otherProps }, target });
        }
        if (waitUntilMessagesLoaded) {
            await afterNextRender(() => afterEvent({
                eventName: 'o-thread-view-hint-processed',
                func,
                message: "should wait until thread loaded messages after creating thread view component",
                predicate: ({ hint, threadViewer }) => {
                    return (
                        hint.type === 'messages-loaded' &&
                        threadViewer.threadView === threadView
                    );
                },
            }));
        } else {
            await func();
        }
    };
}

function getOpenDiscuss(webClient, discuss) {
    return async function openDiscuss() {
        let { default_active_id = 'mail.box_inbox', ...props } = discuss;
        const actionOpenDiscuss = {
            id: default_active_id,
            "type": "ir.actions.client",
            "tag": "mail.discuss",
        };
        await doAction(webClient, actionOpenDiscuss, { props });
    };
}

//------------------------------------------------------------------------------
// Public: start function helpers
//------------------------------------------------------------------------------

/**
 * Creates a properly configured instance of WebClient, with messaging
 * initialized. If requested, open discuss/the requested view.
 *
 * @param {Object} param0
 * @param {Object} [param0.serverData]
 * @param {Object} [param0.legacyParams]
 * @param {Object} [param0.openViewAction=false] If passed, execute an act_window action after the
 * creation of the webClient.
 * @param {Object} [param0.viewOptions={}] Only makes sense when `param0.openViewAction` is set, the
 * parameters to be passed to the act_window action.
 * @param {Object} [param0.autoOpenDiscuss=false]
 * @param {Object} [param0.discuss={}] Only makes sense when `param0.autoOpenDiscuss` is set, the
 * parameters to be passed to the client action.
 * @param {boolean} [param0.hasTimeControl=false]
 * @param {LegacyRegistry} legacyServiceRegistry
 * @returns {WebClient}
 */
async function getWebClientReady(param0, legacyServiceRegistry) {
    param0.serverData = param0.serverData || getActionManagerServerData();
    param0.legacyParams = {
        serviceRegistry: legacyServiceRegistry,
        ...param0.legacyParams,
    };

    const {
        autoOpenDiscuss = false,
        discuss = {},
        hasTimeControl = false,
        openViewAction = false,
        viewOptions = {},
        windowOptions = {},
    } = param0;
    delete param0.autoOpenDiscuss;
    delete param0.hasTimeControl;
    delete param0.openViewAction;
    delete param0.viewOptions;
    delete param0.windowOptions;

    patchWithCleanup(window, {
        innerHeight: 1080,
        innerWidth: 1920,
        Notification: {
            ...window.Notification,
            permission: 'denied',
            requestPermission() {
                return this.permission;
            },
        },
        ...windowOptions,
    });

    const webClient = await createWebClient(param0);
    if (hasTimeControl) {
        addTimeControlToEnv(webClient.env);
    }
    if (openViewAction) {
        await doAction(webClient, openViewAction, {
            props:  Object.assign({}, viewOptions),
        });
    }
    if (autoOpenDiscuss) {
        const openDiscuss = getOpenDiscuss(webClient, discuss);
        await openDiscuss();
    }
    await legacyExtraNextTick();
    return webClient;
}

/**
 * Add required components to the main component registry
 *
 * @param {Object} param0
 * @param {boolean} [param0.hasChatWindow] Will mount chat window if passed
 * @param {boolean} [param0.hasDialog] Wil mount dialog if passed
 * @param {boolean} [param0.hasDiscuss] Will mount discuss if passed
 * @param {Widget} [param0.Widget] Will mount this widget if passed
 */
function setupMainComponentRegistry(param0) {
    const { hasChatWindow, hasDialog, hasDiscuss, Widget } = param0;
    const mainComponentRegistry = registry.category('main_components');

    if (hasChatWindow) {
        mainComponentRegistry.add('ChatWindowManager', {
            Component: getMessagingComponent('ChatWindowManager'),
        });
    }
    if (hasDialog) {
        mainComponentRegistry.add('DialogManager', {
            Component: getMessagingComponent('DialogManager'),
        });
    }
    if (hasDiscuss) {
        registry.category('actions').add('mail.discuss', getMessagingComponent('Discuss'));
    }
    if (Widget) {
        if (mainComponentRegistry.contains('WidgetWrapper')) {
            mainComponentRegistry.remove('WidgetWrapper');
        }
        mainComponentRegistry.add('WidgetWrapper', {
            Component: WidgetWrapper,
            props: {
                Component: Widget,
            },
        });
    }

    delete param0.Widget;
    delete param0.hasChatWindow;
    delete param0.hasDialog;
    delete param0.hasDiscuss;
}

/**
 * Setup both legacy and new service registries
 *
 * @param {Object} param0
 * @param {Object} [param0.services]
 * @param {Object} [param0.legacyServices]
 * @param {number} [param0.loadingBaseDelayDuration=0]
 * @param {Promise} [param0.messagingBeforeCreationDeferred=Promise.resolve()]
 *   Deferred that let tests block messaging creation and simulate resolution.
 *   Useful for testing components behavior when messaging is not yet created.
 * @param {EventBus} messagingBus
 * @returns {LegacyRegistry} The registry containing all the legacy services that will be passed
 * to the webClient as a legacy parameter.
 */
function setupMessagingServiceRegistries(param0={}, messagingBus) {
    const serviceRegistry = registry.category('services');
    const legacyServiceRegistry = new LegacyRegistry();
    const {
        loadingBaseDelayDuration = 0,
        messagingBeforeCreationDeferred = Promise.resolve(),
    } = param0;

    const legacyServices = Object.assign({}, {
        bus_service: BusService.extend({
            _beep() {}, // Do nothing
            _poll() {}, // Do nothing
            _registerWindowUnload() {}, // Do nothing
            isOdooFocused() {
                return true;
            },
            updateOption() {},
        }),
        local_storage: AbstractStorageService.extend({ storage: new RamStorage() }),
    }, param0.legacyServices);

    patchWithCleanup(messagingService, {
        async _startModelManager() {
            const _super = this._super.bind(this);
            await messagingBeforeCreationDeferred;
            return _super(...arguments);
        },
        messagingValues: {
            autofetchPartnerImStatus: false,
            disableAnimation: true,
            isQUnitTest: true,
            loadingBaseDelayDuration,
            messagingBus,
        },
    }, { force: true });

    const services = Object.assign({}, {
        messaging: messagingService,
        wowlEnvProviderService,
    }, param0.services);

    delete param0.services;
    delete param0.legacyServices;
    delete param0.messagingBeforeCreationDeferred;
    delete param0.loadingBaseDelayDuration;


    Object.entries(services).forEach(([serviceName, service]) => {
        serviceRegistry.add(serviceName, service);
    });

    Object.entries(legacyServices).forEach(([serviceName, service]) => {
        legacyServiceRegistry.add(serviceName, service);
    });

    return legacyServiceRegistry;
}

/**
 * Main function used to make a mocked environment with mocked messaging env.
 *
 * @param {Object} [param0={}]
 * @param {boolean} [param0.autoOpenDiscuss=false] makes only sense when
 *   `param0.hasDiscuss` is set: determine whether mounted discuss should be
 *   open initially. Deprecated, call openDiscuss() instead.
 * @param {boolean} [param0.debug=false]
 * @param {Object} [param0.serverData] The data to pass to the webClient
 * @param {Object} [param0.discuss={}] makes only sense when `param0.hasDiscuss`
 *   is set: provide data that is passed to discuss widget (= client action) as
 *   2nd positional argument.
 * @param {Object} [param0.legacyServices]
 * @param {Object} [param0.services]
 * @param {Object} [param0.openViewAction] if passed, open the view with the given action
 * once the webClient is initialized.
 * @param {Object} [param0.viewOptions] makes only sense when `param0.openViewAction`
 *   is set: the view options to pass to the act_window action.
 * @param {function} [param0.mockRPC]
 * @param {boolean} [param0.hasChatWindow=false] if set, mount chat window
 * @param {boolean} [param0.hasDiscuss=false] if set, mount discuss app.
 * @param {boolean} [param0.hasTimeControl=false] if set, all flow of time
 *   with `env.browser.setTimeout` are fully controlled by test itself.
 *     @see addTimeControlToEnv that adds `advanceTime` function in `env.testUtils`.
 * @param {integer} [param0.loadingBaseDelayDuration=0]
 * @param {Deferred|Promise} [param0.messagingBeforeCreationDeferred=Promise.resolve()]
 *   Deferred that let tests block messaging creation and simulate resolution.
 *   Useful for testing working components when messaging is not yet created.
 * @param {Object} [param0.waitUntilEvent]
 * @param {String} [param0.waitUntilEvent.eventName]
 * @param {String} [param0.waitUntilEvent.message]
 * @param {function} [param0.waitUntilEvent.predicate]
 * @param {integer} [param0.waitUntilEvent.timeoutDelay]
 * @param {string} [param0.waitUntilMessagingCondition='initialized'] Determines
 *   the condition of messaging when this function is resolved.
 *   Supported values: ['none', 'created', 'initialized'].
 *   - 'none': the function resolves regardless of whether messaging is created.
 *   - 'created': the function resolves when messaging is created, but
 *     regardless of whether messaging is initialized.
 *   - 'initialized' (default): the function resolves when messaging is
 *     initialized.
 *   To guarantee messaging is not created, test should pass a pending deferred
 *   as param of `messagingBeforeCreationDeferred`. To make sure messaging is
 *   not initialized, test should mock RPC `mail/init_messaging` and block its
 *   resolution.
 * @throws {Error} in case some provided parameters are wrong, such as
 *   `waitUntilMessagingCondition`.
 * @returns {Object}
 */
async function start(param0 = {}) {
    const {
        waitUntilEvent,
        waitUntilMessagingCondition = 'initialized',
    } = param0;
    if (!['none', 'created', 'initialized'].includes(waitUntilMessagingCondition)) {
        throw Error(`Unknown parameter value ${waitUntilMessagingCondition} for 'waitUntilMessaging'.`);
    }
    delete param0.waitUntilEvent;
    delete param0.waitUntilMessagingCondition;

    const messagingBus = new EventBus();
    const afterEvent = getAfterEvent(messagingBus);

    setupMainComponentRegistry(param0);
    const legacyServiceRegistry = setupMessagingServiceRegistries(param0, messagingBus);

    const webClient = waitUntilEvent
        ? await afterEvent({ func: () => getWebClientReady(param0, legacyServiceRegistry), ...waitUntilEvent })
        : await getWebClientReady(param0, legacyServiceRegistry);
    const { modelManager } = webClient.env.services.messaging;

    registerCleanup(async () => {
        const messaging = await webClient.env.services.messaging.get();
        webClient.destroy();
        if (messaging) {
            messaging.delete();
        }
    });

    if (waitUntilMessagingCondition === 'created') {
        await modelManager.messagingCreatedPromise;
    }
    if (waitUntilMessagingCondition === 'initialized') {
        await modelManager.messagingCreatedPromise;
        await modelManager.messagingInitializedPromise;
    }

    return {
        afterEvent,
        afterNextRender,
        click: getClick({ afterNextRender }),
        createChatterContainerComponent: getCreateChatterContainerComponent({ afterEvent, env: webClient.env, webClient }),
        createComposerComponent: getCreateComposerComponent({ env: webClient.env, modelManager, webClient }),
        createComposerSuggestionComponent: getCreateComposerSuggestionComponent({ env: webClient.env, modelManager, webClient }),
        createMessageComponent: getCreateMessageComponent({ env: webClient.env, modelManager, webClient }),
        createMessagingMenuComponent: getCreateMessagingMenuComponent({ env: webClient.env, webClient }),
        createNotificationListComponent: getCreateNotificationListComponent({ env: webClient.env, modelManager, webClient }),
        createThreadViewComponent: getCreateThreadViewComponent({ afterEvent, env: webClient.env, webClient }),
        openDiscuss: getOpenDiscuss(webClient, param0.discuss),
        webClient,
        env: webClient.env,
        widget: WidgetWrapper.currentWidget,
    }
}

//------------------------------------------------------------------------------
// Public: file utilities
//------------------------------------------------------------------------------

/**
 * Drag some files over a DOM element
 *
 * @param {DOM.Element} el
 * @param {Object[]} file must have been create beforehand
 *   @see testUtils.file.createFile
 */
function dragenterFiles(el, files) {
    const ev = new Event('dragenter', { bubbles: true });
    Object.defineProperty(ev, 'dataTransfer', {
        value: _createFakeDataTransfer(files),
    });
    el.dispatchEvent(ev);
}

/**
 * Drop some files on a DOM element
 *
 * @param {DOM.Element} el
 * @param {Object[]} files must have been created beforehand
 *   @see testUtils.file.createFile
 */
function dropFiles(el, files) {
    const ev = new Event('drop', { bubbles: true });
    Object.defineProperty(ev, 'dataTransfer', {
        value: _createFakeDataTransfer(files),
    });
    el.dispatchEvent(ev);
}

/**
 * Paste some files on a DOM element
 *
 * @param {DOM.Element} el
 * @param {Object[]} files must have been created beforehand
 *   @see testUtils.file.createFile
 */
function pasteFiles(el, files) {
    const ev = new Event('paste', { bubbles: true });
    Object.defineProperty(ev, 'clipboardData', {
        value: _createFakeDataTransfer(files),
    });
    el.dispatchEvent(ev);
}

//------------------------------------------------------------------------------
// Export
//------------------------------------------------------------------------------

export {
    afterNextRender,
    beforeEach,
    createRootMessagingComponent,
    dragenterFiles,
    dropFiles,
    nextAnimationFrame,
    nextTick,
    pasteFiles,
    start,
};
