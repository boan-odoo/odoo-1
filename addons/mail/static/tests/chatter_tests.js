/** @odoo-module **/

import { beforeEach, start } from '@mail/utils/test_utils';
import testUtils from 'web.test_utils';


QUnit.module('mail', {}, function () {
QUnit.module('Chatter', {
    beforeEach: function (assert) {
        beforeEach(this);

        this.serverData.models['res.partner'].records.push({ id: 11, im_status: 'online' });
        this.serverData.models['mail.activity.type'].records.push(
            { id: 1, name: "Type 1" },
            { id: 2, name: "Type 2" },
            { id: 3, name: "Type 3", category: 'upload_file' },
            { id: 4, name: "Exception", decoration_type: "warning", icon: "fa-warning" }
        );
        this.serverData.models['ir.attachment'].records.push(
            {
                id: 1,
                mimetype: 'image/png',
                name: 'filename.jpg',
                res_id: 7,
                res_model: 'res.users',
                type: 'url',
            },
            {
                id: 2,
                mimetype: "application/x-msdos-program",
                name: "file2.txt",
                res_id: 7,
                res_model: 'res.users',
                type: 'binary',
            },
            {
                id: 3,
                mimetype: "application/x-msdos-program",
                name: "file3.txt",
                res_id: 5,
                res_model: 'res.users',
                type: 'binary',
            },
        );
        Object.assign(this.serverData.models['res.users'].fields, {
            activity_exception_decoration: {
                string: 'Decoration',
                type: 'selection',
                selection: [['warning', 'Alert'], ['danger', 'Error']],
            },
            activity_exception_icon: {
                string: 'icon',
                type: 'char',
            },
            activity_ids: {
                string: 'Activities',
                type: 'one2many',
                relation: 'mail.activity',
                relation_field: 'res_id',
            },
            activity_state: {
                string: 'State',
                type: 'selection',
                selection: [['overdue', 'Overdue'], ['today', 'Today'], ['planned', 'Planned']],
            },
            activity_summary: {
                string: "Next Activity Summary",
                type: 'char',
            },
            activity_type_icon: {
                string: "Activity Type Icon",
                type: 'char',
            },
            activity_type_id: {
                string: "Activity type",
                type: "many2one",
                relation: "mail.activity.type",
            },
            foo: { string: "Foo", type: "char", default: "My little Foo Value" },
            message_attachment_count: {
                string: 'Attachment count',
                type: 'integer',
            },
            message_follower_ids: {
                string: "Followers",
                type: "one2many",
                relation: 'mail.followers',
                relation_field: "res_id",
            },
            message_ids: {
                string: "messages",
                type: "one2many",
                relation: 'mail.message',
                relation_field: "res_id",
            },
        });

        Object.assign(this.serverData.views, {
            'res.users,false,list': '<list><field name="activity_ids" widget="list_activity"/></list>',
            'res.users,false,search': '<search/>',
        });

        this.start = async params => {
            const res = await start({
                serverData: this.serverData,
                openViewAction: {
                    name: "res.users action",
                    res_model: "res.users",
                    type: "ir.actions.act_window",
                    views: [[false, "list"]],
                },
                mockRPC: route => {
                    if (!['/mail/init_messaging', '/mail/load_message_failures'].includes(route)) {
                        assert.step(route);
                    }
                },
                ...params,
            });
            this.webClient = res.webClient;
            return res;
        };
    },
});

QUnit.test('list activity widget with no activity', async function (assert) {
    assert.expect(4);

    await this.start();

    assert.containsOnce(this.webClient.el, '.o_mail_activity .o_activity_color_default');
    assert.strictEqual(this.webClient.el.querySelector('.o_activity_summary').innerText, '');

    assert.verifySteps(['/web/dataset/search_read']);
});

QUnit.test('list activity widget with activities', async function (assert) {
    assert.expect(6);

    const currentUser = this.serverData.models['res.users'].records.find(user =>
        user.id === this.TEST_USER_IDS.currentUserId
    );
    Object.assign(currentUser, {
        activity_ids: [1, 4],
        activity_state: 'today',
        activity_summary: 'Call with Al',
        activity_type_id: 3,
        activity_type_icon: 'fa-phone',
    });

    this.serverData.models['res.users'].records.push({
        id: 44,
        activity_ids: [2],
        activity_state: 'planned',
        activity_summary: false,
        activity_type_id: 2,
    });

    await this.start();

    const firstRow = this.webClient.el.querySelector('.o_data_row');
    assert.containsOnce(firstRow, '.o_mail_activity .o_activity_color_today.fa-phone');
    assert.strictEqual(firstRow.querySelector('.o_activity_summary').innerText, 'Call with Al');

    const secondRow = this.webClient.el.querySelectorAll('.o_data_row')[1];
    assert.containsOnce(secondRow, '.o_mail_activity .o_activity_color_planned.fa-clock-o');
    assert.strictEqual(secondRow.querySelector('.o_activity_summary').innerText, 'Type 2');

    assert.verifySteps(['/web/dataset/search_read']);
});

QUnit.test('list activity widget with exception', async function (assert) {
    assert.expect(4);

    const currentUser = this.serverData.models['res.users'].records.find(user =>
        user.id === this.TEST_USER_IDS.currentUserId
    );
    Object.assign(currentUser, {
        activity_ids: [1],
        activity_state: 'today',
        activity_summary: 'Call with Al',
        activity_type_id: 3,
        activity_exception_decoration: 'warning',
        activity_exception_icon: 'fa-warning',
    });

    await this.start();

    assert.containsOnce(this.webClient.el, '.o_activity_color_today.text-warning.fa-warning');
    assert.strictEqual(this.webClient.el.querySelector('.o_activity_summary').innerText, 'Warning');

    assert.verifySteps(['/web/dataset/search_read']);
});

QUnit.test('list activity widget: open dropdown', async function (assert) {
    assert.expect(9);
    // TODO TSM -- intercept switch view
    const currentUser = this.serverData.models['res.users'].records.find(user =>
        user.id === this.TEST_USER_IDS.currentUserId
    );
    Object.assign(currentUser, {
        activity_ids: [1, 4],
        activity_state: 'today',
        activity_summary: 'Call with Al',
        activity_type_id: 3,
    });
    this.serverData.models['mail.activity'].records.push(
        {
            id: 1,
            display_name: "Call with Al",
            date_deadline: moment().format("YYYY-MM-DD"), // now
            can_write: true,
            state: "today",
            user_id: this.TEST_USER_IDS.currentUserId,
            create_uid: this.TEST_USER_IDS.currentUserId,
            activity_type_id: 3,
        },
        {
            id: 4,
            display_name: "Meet FP",
            date_deadline: moment().add(1, 'day').format("YYYY-MM-DD"), // tomorrow
            can_write: true,
            state: "planned",
            user_id: this.TEST_USER_IDS.currentUserId,
            create_uid: this.TEST_USER_IDS.currentUserId,
            activity_type_id: 1,
        }
    );

    this.serverData.views['res.users,false,list'] =
        `<list>
            <field name="foo"/>
            <field name="activity_ids" widget="list_activity"/>
        </list>`;

    const expectedSteps = [
        '/web/dataset/search_read',
        // 'switch_view', --> need to add an intecept for switch_view
        'open dropdown',
        'activity_format',
        'action_feedback',
        'read',
    ];

    await this.start({
        mockRPC: (route, args) => {
            if (expectedSteps.includes(args.method || route)) {
                assert.step(args.method || route);
            }
            if (args.method === 'action_feedback') {
                const currentUser = this.serverData.models['res.users'].records.find(user =>
                    user.id === this.TEST_USER_IDS.currentUserId
                );
                Object.assign(currentUser, {
                    activity_ids: [4],
                    activity_state: 'planned',
                    activity_summary: 'Meet FP',
                    activity_type_id: 1,
                });
                return Promise.resolve(true);
            }
        },
    });

    assert.strictEqual(this.webClient.el.querySelector('.o_activity_summary').innerText, 'Call with Al');

    // click on the first record to open it, to ensure that the 'switch_view'
    // assertion is relevant (it won't be opened as there is no action manager,
    // but we'll log the 'switch_view' event)
    await testUtils.dom.click(this.webClient.el.querySelector('.o_data_cell'));

    // from this point, no 'switch_view' event should be triggered, as we
    // interact with the activity widget
    assert.step('open dropdown');
    await testUtils.dom.click(this.webClient.el.querySelector('.o_activity_btn span')); // open the popover
    await testUtils.dom.click(this.webClient.el.querySelector('.o_mark_as_done')); // mark the first activity as done
    await testUtils.dom.click(this.webClient.el.querySelector('.o_activity_popover_done')); // confirm

    assert.strictEqual(this.webClient.el.querySelector('.o_activity_summary').innerText, 'Meet FP');

    assert.verifySteps([
        '/web/dataset/search_read',
        // 'switch_view', --> TODO TSM
        'open dropdown',
        'activity_format',
        'action_feedback',
        'read',
    ]);
});

QUnit.test('list activity exception widget with activity', async function (assert) {
    assert.expect(3);

    const currentUser = this.serverData.models['res.users'].records.find(user =>
        user.id === this.TEST_USER_IDS.currentUserId
    );
    currentUser.activity_ids = [1];
    this.serverData.models['res.users'].records.push({
        id: 13,
        message_attachment_count: 3,
        display_name: "second partner",
        foo: "Tommy",
        message_follower_ids: [],
        message_ids: [],
        activity_ids: [2],
        activity_exception_decoration: 'warning',
        activity_exception_icon: 'fa-warning',
    });
    this.serverData.models['mail.activity'].records.push(
        {
            id: 1,
            display_name: "An activity",
            date_deadline: moment().format("YYYY-MM-DD"), // now
            can_write: true,
            state: "today",
            user_id: 2,
            create_uid: 2,
            activity_type_id: 1,
        },
        {
            id: 2,
            display_name: "An exception activity",
            date_deadline: moment().format("YYYY-MM-DD"), // now
            can_write: true,
            state: "today",
            user_id: 2,
            create_uid: 2,
            activity_type_id: 4,
        }
    );
    this.serverData.views['res.users,false,list'] =  '<tree>' +
                                                        '<field name="foo"/>' +
                                                        '<field name="activity_exception_decoration" widget="activity_exception"/> ' +
                                                    '</tree>';
    await this.start({
        mockRPC: () => {},
    });
    assert.containsN(this.webClient.el, '.o_data_row', 2, "should have two records");
    assert.doesNotHaveClass(this.webClient.el.querySelector('.o_data_row .o_activity_exception_cell div'), 'fa-warning',
        "there is no any exception activity on record");
    assert.hasClass(this.webClient.el.querySelectorAll('.o_data_row .o_activity_exception_cell div')[1], 'fa-warning',
        "there is an exception on a record");
});

QUnit.module('FieldMany2ManyTagsEmail', {
    beforeEach() {
        beforeEach(this);

        Object.assign(this.serverData.models['res.users'].fields, {
            timmy: { string: "pokemon", type: "many2many", relation: 'partner_type' },
        });
        this.serverData.models['res.users'].records.push({
            id: 11,
            display_name: "first record",
            timmy: [],
        });
        Object.assign(this.serverData.models, {
            partner_type: {
                fields: {
                    name: { string: "Partner Type", type: "char" },
                    email: { string: "Email", type: "char" },
                },
                records: [],
            },
        });

        this.serverData.models['partner_type'].records.push(
            { id: 12, display_name: "gold", email: 'coucou@petite.perruche' },
            { id: 14, display_name: "silver", email: '' }
        );

        Object.assign(this.serverData.views, {
            'res.users,false,form':
                '<form string="Partners">' +
                    '<sheet>' +
                        '<field name="display_name"/>' +
                        '<field name="timmy" widget="many2many_tags_email"/>' +
                    '</sheet>' +
                '</form>',
            'res.users,false,search': '<search/>',
            'partner_type,false,form': '<form string="Types"><field name="display_name"/><field name="email"/></form>',
        });
    },
});

QUnit.skip('fieldmany2many tags email', async function (assert) {
    assert.expect(13);
    // TODO TSM -- two issues, action await indefinitly if the second partner doesn't have an email
    // address, not sure how to reproduce this test modal, than click then open view...
    const user11 = this.serverData.models['res.users'].records.find(user => user.id === 11);
    user11.timmy = [12, 14];

    const { webClient } = await start({
        serverData: this.serverData,
        openViewAction: {
            id: 1,
            res_model: 'res.users',
            type: 'ir.actions.act_window',
            views: [[false, 'form']],
        },
        viewOptions: {
            resId: 11,
            mode: 'edit',
        },
        mockRPC: function (route, args) {
            if (args.method === 'read' && args.model === 'partner_type') {
                assert.step(JSON.stringify(args.args[0]));
                assert.deepEqual(args.args[1], ['display_name', 'email'], "should read the email");
            }
        },
    });

    // await testUtils.nextTick();
    // assert.containsN(webClient.el, '.o_field_many2manytags[name="timmy"] .badge.o_tag_color_0', 2,
    //     "two tags should be present");
    // var firstTag = form.$('.o_field_many2manytags[name="timmy"] .badge.o_tag_color_0').first();
    // assert.strictEqual(firstTag.find('.o_badge_text').text(), "gold",
    //     "tag should only show display_name");
    // assert.hasAttrValue(firstTag.find('.o_badge_text'), 'title', "coucou@petite.perruche",
    //     "tag should show email address on mouse hover");

    // webClient.destroy();
    // testUtils.nextTick().then(function () {
    await testUtils.nextTick();
    assert.strictEqual($('.modal-body.o_act_window').length, 1,
        "there should be one modal opened to edit the empty email");
    assert.strictEqual($('.modal-body.o_act_window input[name="display_name"]').val(), "silver",
        "the opened modal should be a form view dialog with the partner_type 14");
    assert.strictEqual($('.modal-body.o_act_window input[name="email"]').length, 1,
        "there should be an email field in the modal");
    // set the email and save the modal (will render the form view)
    testUtils.fields.editInput($('.modal-body.o_act_window input[name="email"]'), 'coucou@petite.perruche');
    testUtils.dom.click($('.modal-footer .btn-primary'));
});

QUnit.test('fieldmany2many tags email (edition)', async function (assert) {
    assert.expect(15);

    const user11 = this.serverData.models['res.users'].records.find(user => user.id === 11);
    user11.timmy = [12];

    var { webClient } = await start({
        serverData: this.serverData,
        openViewAction: {
            id: 1,
            res_model: 'res.users',
            type: 'ir.actions.act_window',
            views: [[false, 'form']],
        },
        viewOptions: {
            resId: 11,
            mode: 'edit',
        },
        mockRPC: function (route, args) {
            if (args.method === 'read' && args.model === 'partner_type') {
                assert.step(JSON.stringify(args.args[0]));
                assert.deepEqual(args.args[1], ['display_name', 'email'], "should read the email");
            }
        },
    });

    assert.verifySteps(['[12]']);
    assert.containsOnce(webClient.el, '.o_field_many2manytags[name="timmy"] .badge.o_tag_color_0',
        "should contain one tag");

    // add an other existing tag
    await testUtils.fields.many2one.clickOpenDropdown('timmy');
    await testUtils.fields.many2one.clickHighlightedItem('timmy');

    assert.strictEqual($('.modal-body.o_act_window').length, 1,
        "there should be one modal opened to edit the empty email");
    assert.strictEqual($('.modal-body.o_act_window input[name="display_name"]').val(), "silver",
        "the opened modal in edit mode should be a form view dialog with the partner_type 14");
    assert.strictEqual($('.modal-body.o_act_window input[name="email"]').length, 1,
        "there should be an email field in the modal");

    // set the email and save the modal (will rerender the form view)
    await testUtils.fields.editInput($('.modal-body.o_act_window input[name="email"]'), 'coucou@petite.perruche');
    await testUtils.dom.click($('.modal-footer .btn-primary'));

    assert.containsN(webClient.el, '.o_field_many2manytags[name="timmy"] .badge.o_tag_color_0', 2,
        "should contain the second tag");
    // should have read [14] three times: when opening the dropdown, when opening the modal, and
    // after the save
    assert.verifySteps(['[14]', '[14]', '[14]']);

    webClient.destroy();
});

QUnit.test('many2many_tags_email widget can load more than 40 records', async function (assert) {
    assert.expect(3);

    this.serverData.models['res.users'].fields.partner_ids = { string: "Partner", type: "many2many", relation: 'res.users' };
    this.serverData.views['res.users,false,form'] = '<form><field name="partner_ids" widget="many2many_tags"/></form>';
    const user11 = this.serverData.models['res.users'].records.find(user => user.id === 11);
    user11.partner_ids = [];
    for (let i = 100; i < 200; i++) {
        this.serverData.models['res.users'].records.push({ id: i, display_name: `partner${i}` });
        user11.partner_ids.push(i);
    }

    const { webClient } = await start({
        serverData: this.serverData,
        openViewAction: {
            id: 1,
            res_model: 'res.users',
            type: 'ir.actions.act_window',
            views: [[false, 'form']],
        },
        viewOptions: {
            resId: 11,
        },
    });
    assert.strictEqual(webClient.el.querySelectorAll('.o_field_widget[name="partner_ids"] .badge').length, 100);
    await testUtils.dom.click(webClient.el.querySelector('.o_form_button_edit'));

    assert.hasClass(webClient.el.querySelector('.o_form_view'), 'o_form_editable');

    // add a record to the relation
    await testUtils.fields.many2one.clickOpenDropdown('partner_ids');
    await testUtils.fields.many2one.clickHighlightedItem('partner_ids');

    assert.strictEqual(webClient.el.querySelectorAll('.o_field_widget[name="partner_ids"] .badge').length, 101);

    webClient.destroy();
});

});
