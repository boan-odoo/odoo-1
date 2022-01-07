/** @odoo-module **/

import {
    afterNextRender,
    beforeEach,
    start,
} from '@mail/utils/test_utils';

QUnit.module('im_livechat', {}, function () {
QUnit.module('components', {}, function () {
QUnit.module('chat_window_manager', {}, function () {
QUnit.module('chat_window_manager_tests.js', {
    beforeEach() {
        beforeEach(this);

        this.start = async params => {
            const res = await start(Object.assign(
                { hasChatWindow: true },
                params,
                { serverData: this.serverData }
            ));
            const { afterEvent, env, webClient } = res;
            this.debug = params && params.debug;
            this.afterEvent = afterEvent;
            this.env = env;
            this.webClient = webClient;
            return res;
        };
    },
});

QUnit.test('closing a chat window with no message from admin side unpins it', async function (assert) {
    assert.expect(1);

    this.serverData.models['res.partner'].records.push({ id: 10, name: "Demo" });
    this.serverData.models['res.users'].records.push({
        id: 42,
        partner_id: 10,
    });
    this.serverData.models['mail.channel'].records.push(
        {
            channel_type: "livechat",
            id: 10,
            is_pinned: true,
            members: [this.TEST_USER_IDS.currentPartnerId, 10],
            uuid: 'channel-10-uuid',
        },
    );
    const { createMessagingMenuComponent } = await this.start();
    await createMessagingMenuComponent();

    await afterNextRender(() => document.querySelector(`.o_MessagingMenu_toggler`).click());
    await afterNextRender(() => document.querySelector(`.o_NotificationList_preview`).click());
    await afterNextRender(() => document.querySelector(`.o_ChatWindowHeader_commandClose`).click());
    const channels = await this.env.services.orm.silent.read(
        'mail.channel',
        [10],
    );
    assert.strictEqual(
        channels[0].is_pinned,
        false,
        'Livechat channel should not be pinned',
    );
});

});
});
});
