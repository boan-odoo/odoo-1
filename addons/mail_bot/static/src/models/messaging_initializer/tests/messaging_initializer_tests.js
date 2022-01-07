/** @odoo-module **/

import { beforeEach, start } from '@mail/utils/test_utils';
import { patchWithCleanup } from '@web/../tests/helpers/utils';
import session from 'web.session';

QUnit.module('mail_bot', {}, function () {
QUnit.module('models', {}, function () {
QUnit.module('messaging_initializer', {}, function () {
QUnit.module('messaging_initializer_tests.js', {
    beforeEach() {
        beforeEach(this);

        this.start = async params => {
            const { env, webClient } = await start(Object.assign({}, params, {
                serverData: this.serverData,
            }));
            this.env = env;
            this.webClient = webClient;
        };
    },
});


QUnit.test('OdooBot initialized at init', async function (assert) {
    // TODO this test should be completed in combination with
    // implementing _mockMailChannelInitOdooBot task-2300480
    assert.expect(2);

    patchWithCleanup(session, {
        odoobot_initialized: false,
    });

    await this.start({
        mockRPC(route, args) {
            if (args.method === 'init_odoobot') {
                assert.step('init_odoobot');
            }
        },
    });

    assert.verifySteps(
        ['init_odoobot'],
        "should have initialized OdooBot at init"
    );
});

});
});
});
