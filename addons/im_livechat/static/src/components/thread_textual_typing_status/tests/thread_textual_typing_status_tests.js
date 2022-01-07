/** @odoo-module **/

import {
    afterNextRender,
    beforeEach,
    createRootMessagingComponent,
    start,
} from '@mail/utils/test_utils';

QUnit.module('im_livechat', {}, function () {
QUnit.module('components', {}, function () {
QUnit.module('thread_textual_typing_status', {}, function () {
QUnit.module('thread_textual_typing_status_tests.js', {
    beforeEach() {
        beforeEach(this);

        this.createThreadTextualTypingStatusComponent = async thread => {
            await createRootMessagingComponent(this, "ThreadTextualTypingStatus", {
                props: { threadLocalId: thread.localId },
                target: this.webClient.el,
            });
        };

        this.start = async params => {
            const { env, webClient } = await start(Object.assign({}, params, {
                serverData: this.serverData,
            }));
            this.env = env;
            this.webClient = webClient;
        };
    },
});

QUnit.test('receive visitor typing status "is typing"', async function (assert) {
    assert.expect(2);

    this.serverData.models['mail.channel'].records.push({
        anonymous_name: "Visitor 20",
        channel_type: 'livechat',
        id: 20,
        livechat_operator_id: this.TEST_USER_IDS.currentPartnerId,
        members: [this.TEST_USER_IDS.currentPartnerId, this.TEST_USER_IDS.publicPartnerId],
    });
    await this.start();
    const thread = this.messaging.models['Thread'].findFromIdentifyingData({
        id: 20,
        model: 'mail.channel',
    });
    await this.createThreadTextualTypingStatusComponent(thread);

    assert.strictEqual(
        document.querySelector('.o_ThreadTextualTypingStatus').textContent,
        "",
        "Should display no one is currently typing"
    );

    // simulate receive typing notification from livechat visitor "is typing"
    await afterNextRender(() => {
        owl.Component.env.services.bus_service.trigger('notification', [{
            type: 'mail.channel.partner/typing_status',
            payload: {
                channel_id: 20,
                is_typing: true,
                partner_id: this.messaging.publicPartners[0].id,
                partner_name: this.messaging.publicPartners[0].name,
            },
        }]);
    });
    assert.strictEqual(
        document.querySelector('.o_ThreadTextualTypingStatus').textContent,
        "Visitor 20 is typing...",
        "Should display that visitor is typing"
    );
});

});
});
});
