/** @odoo-module */

import { patchWebsocketWorkerWithCleanup } from "@web/../tests/helpers/mock_websocket";
import { patchWithCleanup } from "@web/../tests/helpers/utils";
import { nextTick } from "@web/../tests/helpers/utils";
import { browser } from "@web/core/browser/browser";

QUnit.module("Websocket Worker", (hooks) => {
    hooks.beforeEach(() => {
        patchWithCleanup(browser, {
            setTimeout: fn => {
                fn();
                return 1;
            }
        });
    });

    QUnit.test("websocket worker broadcast appropriate events", async (assert) => {
        assert.expect(16);

        const { _worker: worker } = patchWebsocketWorkerWithCleanup({
            mockWebsocket: {
                onopen: () => {
                    assert.step('websocket connected');
                },
                onclose: () => {
                    assert.step('websocket disconnected');
                }
            },
            mockWebsocketWorker: {
                broadcast: type => {
                    assert.step(`broadcast ${type}`);
                },
                sendToClient: (clientUID, type, data) => {
                    assert.step(`send to client ${type} ${clientUID}`);
                }
            },
        });

        // Initial connection to the websocket
        await nextTick();

        assert.verifySteps([
            'websocket connected',
            'broadcast connect',
        ]);

        // Abnormal closure leads to reconnection
        worker.websocket.close(1006);
        await nextTick();

        assert.verifySteps([
            'websocket disconnected',
            'broadcast disconnect',
            'broadcast reconnecting',
            'websocket connected',
            'broadcast reconnect',
        ]);

        // Notification received from the bus
        worker.websocket.dispatchEvent(new MessageEvent('message', {
            data: JSON.stringify([{id: 5, message: 'message from the bus'}]),
        }));
        await nextTick();

        assert.verifySteps([
            'broadcast notification'
        ]);

        // Error received from the socket
        worker.websocket.dispatchEvent(new MessageEvent('message', {
            data: JSON.stringify({
                name: 'odoo.exceptions.AccessDenied',
                debug: '...',
                client_uid: '112233441',
            }),
        }));
        await nextTick();

        assert.verifySteps([
            'send to client server_error 112233441',
        ]);

        // Clean closure
        worker.websocket.close(1000);
        await nextTick();

        assert.verifySteps([
            'websocket disconnected',
            'broadcast disconnect',
        ]);
    });

    QUnit.test("reconnect action reconnects the websocket silently", async (assert) => {
        assert.expect(5);

        const { _worker: worker } = patchWebsocketWorkerWithCleanup({
            mockWebsocket: {
                onopen: () => {
                    assert.step('websocket connected');
                },
                onclose: () => {
                    assert.step('websocket disconnected');
                }
            },
            mockWebsocketWorker: {
                broadcast: type => {
                    assert.step(`broadcast ${type}`);
                },
            },
        });

        await nextTick();

        worker.onMessage({
            action: 'reconnect',
        });
        await nextTick();

        assert.verifySteps([
            // first connection should broadcast the connect event
            'websocket connected',
            'broadcast connect',
            // reconnect action should not since we ask for it, thus it should not be handled as a
            // natural event.
            'websocket disconnected',
            'websocket connected',
        ]);
    });

    QUnit.test("error is relayed to the client that caused it", async (assert) => {
        assert.expect(2);

        let firstClientUID;
        const { _worker: worker } = patchWebsocketWorkerWithCleanup({
            mockWebsocketWorker: {
                sendToClient: (clientUID, type) => {
                    assert.strictEqual(type, 'server_error');
                    assert.strictEqual(clientUID, firstClientUID);
                },
            },
        });

        worker.registerClient({
            postMessage() {},
        });
        worker.registerClient({
            postMessage() {},
        });

        firstClientUID = Object.keys(worker.clientUIDToClient)[0];
        worker.websocket.dispatchEvent(new MessageEvent('message', {
            data: JSON.stringify({
                name: 'odoo.exceptions.AccessDenied',
                debug: '...',
                client_uid: firstClientUID,
            }),
        }));
    });

    QUnit.test("leave action updates client map ", async (assert) => {
        assert.expect(2);

        const { _worker: worker, _client: client } = patchWebsocketWorkerWithCleanup();
        assert.strictEqual(1, Object.keys(worker.clientUIDToClient).length);

        client.onmessage(new MessageEvent('message', {
            data: { action: 'leave' },
        }));
        assert.strictEqual(0, Object.keys(worker.clientUIDToClient).length);
    });
});
