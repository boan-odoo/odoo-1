/** @odoo-module **/

import { beforeEach, start } from '@mail/utils/test_utils';
import { patchWithCleanup } from '@web/../tests/helpers/utils';

QUnit.module('mail', {}, function () {
QUnit.module('widgets', {}, function () {
QUnit.module('notification_alert', {}, function () {
QUnit.module('notification_alert_tests.js', {
    beforeEach() {
        beforeEach(this);

        Object.assign(this.serverData.views, {
            'mail.message,false,form':
                `<form>
                    <widget name="notification_alert"/>
                </form>`,
            'mail.message,false,search': '<search/>',
        });

        this.start = async params => {
            let { webClient } = await start(Object.assign({
                serverData: this.serverData,
                openViewAction: {
                    id: 1,
                    res_model: "mail.message",
                    type: "ir.actions.act_window",
                    views: [[false, "form"]],
                },
            }, params));
            this.webClient = webClient;
        };
    },
});

QUnit.test('notification_alert widget: display blocked notification alert', async function (assert) {
    assert.expect(1);

    await this.start();

    assert.containsOnce(
        document.body,
        '.o_notification_alert',
        "Blocked notification alert should be displayed"
    );
});

QUnit.test('notification_alert widget: no notification alert when granted', async function (assert) {
    assert.expect(1);

    await this.start({
        windowOptions: {
            Notification: { permission: 'granted' },
        },
    });

    assert.containsNone(
        document.body,
        '.o_notification_alert',
        "Blocked notification alert should not be displayed"
    );
});

QUnit.test('notification_alert widget: no notification alert when default', async function (assert) {
    assert.expect(1);

    await this.start({
        windowOptions: {
            Notification: { permission: 'default' },
        },
    });

    assert.containsNone(
        document.body,
        '.o_notification_alert',
        "Blocked notification alert should not be displayed"
    );
});

});
});
});
