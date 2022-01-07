/** @odoo-module **/

import {
    beforeEach,
    start,
} from '@mail/utils/test_utils';

QUnit.module('im_livechat', {}, function () {
QUnit.module('components', {}, function () {
QUnit.module('discuss_sidebar_category_item', {}, function () {
QUnit.module('discuss_sidebar_category_item_tests.js', {
    beforeEach() {
        beforeEach(this);

        this.start = async params => {
            const { env, webClient } = await start(Object.assign({}, params, {
                autoOpenDiscuss: true,
                serverData: this.serverData,
                hasDiscuss: true,
            }));
            this.env = env;
            this.webClient = webClient;
        };
    },
});

QUnit.test('livechat - avatar: should have a smiley face avatar for an anonymous livechat item', async function (assert) {
    assert.expect(2);

    this.serverData.models['mail.channel'].records.push({
        anonymous_name: "Visitor 11",
        channel_type: 'livechat',
        id: 11,
        livechat_operator_id: this.TEST_USER_IDS.currentPartnerId,
        members: [this.TEST_USER_IDS.currentPartnerId, this.TEST_USER_IDS.currentPartnerId],
    });
    await this.start();

    const livechatItem = document.querySelector(`
        .o_DiscussSidebarCategoryItem[data-thread-local-id="${
            this.messaging.models['Thread'].findFromIdentifyingData({
                id: 11,
                model: 'mail.channel',
            }).localId
        }"]
    `);
    assert.containsOnce(
        livechatItem,
        `.o_DiscussSidebarCategoryItem_image`,
        "should have an avatar"
    );

    assert.strictEqual(
        livechatItem.querySelector(`:scope .o_DiscussSidebarCategoryItem_image`).getAttribute('src'),
        '/mail/static/src/img/smiley/avatar.jpg',
        'should have the smiley face as the avatar for anonymous users'
    );
});

QUnit.test('livechat - avatar: should have a partner profile picture for a livechat item linked with a partner', async function (assert) {
    assert.expect(2);

    this.serverData.models['res.partner'].records.push({
        id: 10,
        name: "Jean",
    });
    this.serverData.models['mail.channel'].records.push({
        channel_type: 'livechat',
        id: 11,
        livechat_operator_id: this.TEST_USER_IDS.currentPartnerId,
        members: [this.TEST_USER_IDS.currentPartnerId, 10],
    });
    await this.start();

    const livechatItem = document.querySelector(`
        .o_DiscussSidebarCategoryItem[data-thread-local-id="${
            this.messaging.models['Thread'].findFromIdentifyingData({
                id: 11,
                model: 'mail.channel',
            }).localId
        }"]
    `);
    assert.containsOnce(
        livechatItem,
        `.o_DiscussSidebarCategoryItem_image`,
        "should have an avatar"
    );
    assert.strictEqual(
        livechatItem.querySelector(`:scope .o_DiscussSidebarCategoryItem_image`).getAttribute('src'),
        '/web/image/res.partner/10/avatar_128',
        'should have the partner profile picture as the avatar for partners'
    );
});

});
});
});
