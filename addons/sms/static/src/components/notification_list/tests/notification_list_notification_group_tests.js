/** @odoo-module **/

import { beforeEach, start, makeFakeActionService } from '@mail/utils/test_utils';

QUnit.module('sms', {}, function () {
QUnit.module('components', {}, function () {
QUnit.module('notification_list', {}, function () {
QUnit.module('notification_list_notification_group_tests.js', {
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
    assert.expect(6);

    this.serverData.models['mail.message'].records.push(
        // message that is expected to have a failure
        {
            id: 11, // random unique id, will be used to link failure to message
            message_type: 'sms', // message must be sms (goal of the test)
            model: 'mail.channel', // expected value to link message to channel
            res_id: 31, // id of a random channel
        }
    );
    this.serverData.models['mail.notification'].records.push(
        // failure that is expected to be used in the test
        {
            mail_message_id: 11, // id of the related message
            notification_status: 'exception', // necessary value to have a failure
            notification_type: 'sms', // expected failure type for sms message
        }
    );

    const { createNotificationListComponent } = await this.start({
        services: {
            action: makeFakeActionService((action, options) => {
                assert.step('do_action');
                assert.strictEqual(
                    action,
                    'sms.sms_cancel_action',
                    "action should be the one to cancel sms"
                );
                assert.strictEqual(
                    options.additional_context.default_model,
                    'mail.channel',
                    "action should have the group model as default_model"
                );
                assert.strictEqual(
                    options.additional_context.unread_counter,
                    1,
                    "action should have the group notification length as unread_counter"
                );
            }),
        },
    });
    await createNotificationListComponent();

    assert.containsOnce(
        document.body,
        '.o_NotificationGroup_markAsRead',
        "should have 1 mark as read button"
    );

    document.querySelector('.o_NotificationGroup_markAsRead').click();
    assert.verifySteps(
        ['do_action'],
        "should do an action to display the cancel sms dialog"
    );
});

QUnit.test('notifications grouped by notification_type', async function (assert) {
    assert.expect(11);

    this.serverData.models['mail.message'].records.push(
        // first message that is expected to have a failure
        {
            id: 11, // random unique id, will be used to link failure to message
            message_type: 'sms', // different type from second message
            model: 'res.partner', // same model as second message (and not `mail.channel`)
            res_id: 31, // same res_id as second message
            res_model_name: "Partner", // random related model name
        },
        // second message that is expected to have a failure
        {
            id: 12, // random unique id, will be used to link failure to message
            message_type: 'email', // different type from first message
            model: 'res.partner', // same model as first message (and not `mail.channel`)
            res_id: 31, // same res_id as first message
            res_model_name: "Partner", // same related model name for consistency
        }
    );
    this.serverData.models['mail.notification'].records.push(
        // first failure that is expected to be used in the test
        {
            mail_message_id: 11, // id of the related first message
            notification_status: 'exception', // necessary value to have a failure
            notification_type: 'sms', // different type from second failure
        },
        // second failure that is expected to be used in the test
        {
            mail_message_id: 12, // id of the related second message
            notification_status: 'exception', // necessary value to have a failure
            notification_type: 'email', // different type from first failure
        }
    );
    const { createNotificationListComponent } = await this.start();
    await createNotificationListComponent();

    assert.containsN(
        document.body,
        '.o_NotificationGroup',
        2,
        "should have 2 notifications group"
    );
    const groups = document.querySelectorAll('.o_NotificationGroup');
    assert.containsOnce(
        groups[0],
        '.o_NotificationGroup_name',
        "should have 1 group name in first group"
    );
    assert.strictEqual(
        groups[0].querySelector('.o_NotificationGroup_name').textContent,
        "Partner",
        "should have model name as group name"
    );
    assert.containsOnce(
        groups[0],
        '.o_NotificationGroup_counter',
        "should have 1 group counter in first group"
    );
    assert.strictEqual(
        groups[0].querySelector('.o_NotificationGroup_counter').textContent.trim(),
        "(1)",
        "should have 1 notification in first group"
    );
    assert.strictEqual(
        groups[0].querySelector('.o_NotificationGroup_inlineText').textContent.trim(),
        "An error occurred when sending an email.",
        "should have the group text corresponding to email"
    );
    assert.containsOnce(
        groups[1],
        '.o_NotificationGroup_name',
        "should have 1 group name in second group"
    );
    assert.strictEqual(
        groups[1].querySelector('.o_NotificationGroup_name').textContent,
        "Partner",
        "should have second model name as group name"
    );
    assert.containsOnce(
        groups[1],
        '.o_NotificationGroup_counter',
        "should have 1 group counter in second group"
    );
    assert.strictEqual(
        groups[1].querySelector('.o_NotificationGroup_counter').textContent.trim(),
        "(1)",
        "should have 1 notification in second group"
    );
    assert.strictEqual(
        groups[1].querySelector('.o_NotificationGroup_inlineText').textContent.trim(),
        "An error occurred when sending an SMS.",
        "should have the group text corresponding to sms"
    );
});

QUnit.test('grouped notifications by document model', async function (assert) {
    // If all failures linked to a document model refers to different documents,
    // a single notification should group all failures that are linked to this
    // document model.
    assert.expect(12);

    this.serverData.models['mail.message'].records.push(
        // first message that is expected to have a failure
        {
            id: 11, // random unique id, will be used to link failure to message
            message_type: 'sms', // message must be sms (goal of the test)
            model: 'res.partner', // same model as second message (and not `mail.channel`)
            res_id: 31, // different res_id from second message
            res_model_name: "Partner", // random related model name
        },
        // second message that is expected to have a failure
        {
            id: 12, // random unique id, will be used to link failure to message
            message_type: 'sms', // message must be sms (goal of the test)
            model: 'res.partner', // same model as first message (and not `mail.channel`)
            res_id: 32, // different res_id from first message
            res_model_name: "Partner", // same related model name for consistency
        }
    );
    this.serverData.models['mail.notification'].records.push(
        // first failure that is expected to be used in the test
        {
            mail_message_id: 11, // id of the related first message
            notification_status: 'exception', // necessary value to have a failure
            notification_type: 'sms', // expected failure type for sms message
        },
        // second failure that is expected to be used in the test
        {
            mail_message_id: 12, // id of the related second message
            notification_status: 'exception', // necessary value to have a failure
            notification_type: 'sms', // expected failure type for sms message
        }
    );
    const fakeActionService = makeFakeActionService((action, options) => {
        assert.step('do_action');
        assert.strictEqual(
            action.name,
            "SMS Failures",
            "action should have 'SMS Failures' as name",
        );
        assert.strictEqual(
            action.type,
            'ir.actions.act_window',
            "action should have the type act_window"
        );
        assert.strictEqual(
            action.view_mode,
            'kanban,list,form',
            "action should have 'kanban,list,form' as view_mode"
        );
        assert.strictEqual(
            JSON.stringify(action.views),
            JSON.stringify([[false, 'kanban'], [false, 'list'], [false, 'form']]),
            "action should have correct views"
        );
        assert.strictEqual(
            action.target,
            'current',
            "action should have 'current' as target"
        );
        assert.strictEqual(
            action.res_model,
            'res.partner',
            "action should have the group model as res_model"
        );
        assert.strictEqual(
            JSON.stringify(action.domain),
            JSON.stringify([['message_has_sms_error', '=', true]]),
            "action should have 'message_has_sms_error' as domain"
        );
    });

    const { createNotificationListComponent } = await this.start({ services: { action: fakeActionService } });
    await createNotificationListComponent();

    assert.containsOnce(
        document.body,
        '.o_NotificationGroup',
        "should have 1 notification group"
    );
    assert.containsOnce(
        document.body,
        '.o_NotificationGroup_counter',
        "should have 1 group counter"
    );
    assert.strictEqual(
        document.querySelector('.o_NotificationGroup_counter').textContent.trim(),
        "(2)",
        "should have 2 notifications in the group"
    );

    document.querySelector('.o_NotificationGroup').click();
    assert.verifySteps(
        ['do_action'],
        "should do an action to display the related records"
    );
});

});
});
});
