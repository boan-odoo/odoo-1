/** @odoo-module **/

import { afterNextRender, beforeEach, start } from '@mail/utils/test_utils';

QUnit.module('mail', {}, function () {
QUnit.module('components', {}, function () {
QUnit.module('thread_preview', {}, function () {
QUnit.module('thread_preview_tests.js', {
    beforeEach() {
        beforeEach(this);

        this.start = async params => {
            const res = await start(Object.assign({}, params, {
                serverData: this.serverData,
            }));
            const { env, webClient } = res;
            this.env = env;
            this.webClient = webClient;
            return res;
        };
    },
});

QUnit.test('mark as read', async function (assert) {
    assert.expect(8);
    this.serverData.models['mail.channel'].records.push({
        id: 11,
        message_unread_counter: 1,
        seen_message_id: 99,
    });
    this.serverData.models['mail.message'].records.push({
        id: 100,
        model: 'mail.channel',
        res_id: 11,
    });

    const { click, createMessagingMenuComponent } = await this.start({
        hasChatWindow: true,
        async mockRPC(route, args) {
            if (route.includes('set_last_seen_message')) {
                assert.step('set_last_seen_message');
            }
                    },
    });
    await createMessagingMenuComponent();
    await click('.o_MessagingMenu_toggler');
    assert.containsOnce(
        document.body,
        '.o_ThreadPreview_markAsRead',
        "should have the mark as read button"
    );
    assert.containsOnce(
        document.body,
        '.o_ThreadPreview_counter',
        "should have an unread counter"
    );

    await afterNextRender(() =>
        document.querySelector('.o_ThreadPreview_markAsRead').click()
    );
    assert.verifySteps(
        ['set_last_seen_message'],
        "should have marked the thread as seen"
    );
    assert.hasClass(
        document.querySelector('.o_ThreadPreview'),
        'o-muted',
        "should be muted once marked as read"
    );
    assert.containsNone(
        document.body,
        '.o_ThreadPreview_markAsRead',
        "should no longer have the mark as read button"
    );
    assert.containsNone(
        document.body,
        '.o_ThreadPreview_counter',
        "should no longer have an unread counter"
    );
    assert.containsNone(
        document.body,
        '.o_ChatWindow',
        "should not have opened the thread"
    );
});

});
});
});
