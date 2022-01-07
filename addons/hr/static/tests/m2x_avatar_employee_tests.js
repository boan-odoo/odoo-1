/** @odoo-module **/

import { Many2OneAvatarEmployee } from '@hr/js/m2x_avatar_employee';
import {
    afterNextRender,
    beforeEach,
    start
} from '@mail/utils/test_utils';
import { dom } from 'web.test_utils';
import { makeFakeNotificationService } from '@web/../tests/helpers/mock_services';


QUnit.module('hr', {}, function () {
    QUnit.module('M2XAvatarEmployee', {
        beforeEach() {
            beforeEach(this);

            // reset the cache before each test
            Many2OneAvatarEmployee.prototype.partnerIds = {};

            Object.assign(this.serverData.models, {
                'foo': {
                    fields: {
                        employee_id: { string: "Employee", type: 'many2one', relation: 'hr.employee.public' },
                        employee_ids: { string: "Employees", type: "many2many", relation: 'hr.employee.public' },
                    },
                    records: [
                        { id: 1, employee_id: 11, employee_ids: [11, 23] },
                        { id: 2, employee_id: 7 },
                        { id: 3, employee_id: 11 },
                        { id: 4, employee_id: 23 },
                    ],
                },
            });

            Object.assign(this.serverData.views, {
                'foo,false,list': '<list/>',
                'foo,false,search': '<search/>',
            });

            this.serverData.models['hr.employee.public'].records.push(
                { id: 11, name: "Mario", user_id: 11, user_partner_id: 11 },
                { id: 7, name: "Luigi", user_id: 12, user_partner_id: 12 },
                { id: 23, name: "Yoshi", user_id: 13, user_partner_id: 13 }
            );
            this.serverData.models['res.users'].records.push(
                { id: 11, partner_id: 11 },
                { id: 12, partner_id: 12 },
                { id: 13, partner_id: 13 }
            );
            this.serverData.models['res.partner'].records.push(
                { id: 11, display_name: "Mario" },
                { id: 12, display_name: "Luigi" },
                { id: 13, display_name: "Yoshi" }
            );
        },
    });

    QUnit.test('many2one_avatar_employee widget in list view', async function (assert) {
        assert.expect(11);

         this.serverData.views['foo,false,list'] =
             '<tree><field name="employee_id" widget="many2one_avatar_employee"/></tree>';

         const { webClient } = await start({
            hasChatWindow: true,
            serverData: this.serverData,
             openViewAction: {
                 id: 1,
                 res_model: "foo",
                 type: "ir.actions.act_window",
                 views: [[false, "list"]],
             },
             mockRPC(route, args) {
                 if (args.method === 'read') {
                     assert.step(`read ${args.model} ${args.args[0]}`);
                 }
             },
         });

        assert.strictEqual(
            Array.from(webClient.el.querySelectorAll('.o_data_cell span'))
                .map(span => span.innerText).reduce((prevCellValue, currentCellValue) => prevCellValue + currentCellValue),
            'MarioLuigiMarioYoshi'
        );

        // click on first employee
        await afterNextRender(() =>
            dom.click(webClient.el.querySelector('.o_data_cell .o_m2o_avatar > img'))
        );
        assert.verifySteps(
            ['read hr.employee.public 11'],
            "first employee should have been read to find its partner"
        );
        assert.containsOnce(
            document.body,
            '.o_ChatWindowHeader_name',
            'should have opened chat window'
        );
        assert.strictEqual(
            document.querySelector('.o_ChatWindowHeader_name').textContent,
            "Mario",
            'chat window should be with clicked employee'
        );

        // click on second employee
        await afterNextRender(() =>
            dom.click(webClient.el.querySelectorAll('.o_data_cell .o_m2o_avatar > img')[1]
        ));
        assert.verifySteps(
            ['read hr.employee.public 7'],
            "second employee should have been read to find its partner"
        );
        assert.containsN(
            document.body,
            '.o_ChatWindowHeader_name',
            2,
            'should have opened second chat window'
        );
        assert.strictEqual(
            document.querySelectorAll('.o_ChatWindowHeader_name')[1].textContent,
            "Luigi",
            'chat window should be with clicked employee'
        );

        // click on third employee (same as first)
        await afterNextRender(() =>
            dom.click(webClient.el.querySelectorAll('.o_data_cell .o_m2o_avatar > img')[2])
        );
        assert.verifySteps(
            [],
            "employee should not have been read again because we already know its partner"
        );
        assert.containsN(
            document.body,
            '.o_ChatWindowHeader_name',
            2,
            "should still have only 2 chat windows because third is the same partner as first"
        );

        webClient.destroy();
    });

    QUnit.test('many2one_avatar_employee widget in kanban view', async function (assert) {
        assert.expect(6);

        this.serverData.views['foo,false,kanban'] =
            `<kanban>
                <templates>
                    <t t-name="kanban-box">
                        <div>
                            <field name="employee_id" widget="many2one_avatar_employee"/>
                        </div>
                    </t>
                </templates>
            </kanban>`;

        const { webClient } = await start({
            serverData: this.serverData,
            openViewAction: {
                id: 1,
                res_model: "foo",
                type: "ir.actions.act_window",
                views: [[false, "kanban"]],
            },
        });

        assert.strictEqual(webClient.el.querySelector('.o_kanban_record').innerText.trim(), '');
        assert.containsN(webClient.el, '.o_m2o_avatar', 4);
        const many2oneAvatarSrc = Array.from(webClient.el.querySelectorAll('.o_m2o_avatar > img')).map(img => img.getAttribute('src'));
        assert.strictEqual(many2oneAvatarSrc[0], '/web/image/hr.employee.public/11/avatar_128');
        assert.strictEqual(many2oneAvatarSrc[1], '/web/image/hr.employee.public/7/avatar_128');
        assert.strictEqual(many2oneAvatarSrc[2], '/web/image/hr.employee.public/11/avatar_128');
        assert.strictEqual(many2oneAvatarSrc[3], '/web/image/hr.employee.public/23/avatar_128');

        webClient.destroy();
    });

    QUnit.test('many2one_avatar_employee: click on an employee not associated with a user', async function (assert) {
        assert.expect(6);

        this.serverData.models['hr.employee.public'].records[0].user_id = false;
        this.serverData.models['hr.employee.public'].records[0].user_partner_id = false;
        this.serverData.views['foo,false,form'] = '<form><field name="employee_id" widget="many2one_avatar_employee"/></form>';

        const { webClient } = await start({
            serverData: this.serverData,
            openViewAction: {
                id: 1,
                res_model: "foo",
                res_id: 1,
                type: "ir.actions.act_window",
                views: [[false, "form"]],
            },
            mockRPC(route, args) {
                if (args.method === 'read') {
                    assert.step(`read ${args.model} ${args.args[0]}`);
                }
            },
            services: {
                notification: makeFakeNotificationService(message => {
                    assert.ok(
                        true,
                        "should display a toast notification after failing to open chat"
                    );
                    assert.strictEqual(
                        message,
                        "You can only chat with employees that have a dedicated user.",
                        "should display the correct information in the notification"
                    );
                }),
            },
        });

        assert.strictEqual(webClient.el.querySelector('.o_field_widget[name=employee_id]').innerText.trim(), 'Mario');

        await dom.click(webClient.el.querySelector('.o_m2o_avatar > img'));

        assert.verifySteps([
            'read foo 1',
            'read hr.employee.public 11',
        ]);

        webClient.destroy();
    });

    QUnit.test('many2many_avatar_employee widget in form view', async function (assert) {
        assert.expect(8);

        this.serverData.views['foo,false,form'] = '<form><field name="employee_ids" widget="many2many_avatar_employee"/></form>';

        const { webClient } = await start({
            hasChatWindow: true,
            serverData: this.serverData,
            openViewAction: {
                id: 1,
                res_model: "foo",
                res_id: 1,
                type: "ir.actions.act_window",
                views: [[false, "form"]],
            },
            mockRPC(route, args) {
                if (args.method === 'read') {
                    assert.step(`read ${args.model} ${args.args[0]}`);
                }
            },
        });

        assert.containsN(webClient.el, '.o_field_many2manytags.avatar.o_field_widget .badge', 2,
            "should have 2 records");
        assert.strictEqual(webClient.el.querySelector('.o_field_many2manytags.avatar.o_field_widget .badge img').getAttribute('src'),
            '/web/image/hr.employee.public/11/avatar_128',
            "should have correct avatar image");

        await dom.click(webClient.el.querySelector('.o_field_many2manytags.avatar .badge .o_m2m_avatar'));
        await dom.click(webClient.el.querySelectorAll('.o_field_many2manytags.avatar .badge .o_m2m_avatar')[1]);

        assert.verifySteps([
            "read foo 1",
            'read hr.employee.public 11,23',
            "read hr.employee.public 11",
            "read hr.employee.public 23",
        ]);

        assert.containsN(
            document.body,
            '.o_ChatWindowHeader_name',
            2,
            "should have 2 chat windows"
        );

        webClient.destroy();
    });

    QUnit.test('many2many_avatar_employee widget in list view', async function (assert) {
        assert.expect(10);

        this.serverData.views['foo,false,list'] = '<tree><field name="employee_ids" widget="many2many_avatar_employee"/></tree>';

        const { webClient } = await start({
            hasChatWindow: true,
            serverData: this.serverData,
            openViewAction: {
                id: 1,
                res_model: "foo",
                type: "ir.actions.act_window",
                views: [[false, "list"]],
            },
            mockRPC(route, args) {
                if (args.method === 'read') {
                    assert.step(`read ${args.model} ${args.args[0]}`);
                }
            },
        });

        assert.containsN(webClient.el, '.o_data_cell .o_field_many2manytags > span', 2,
            "should have two avatar");

        // click on first employee badge
        await afterNextRender(() =>
            dom.click(webClient.el.querySelector('.o_data_cell .o_m2m_avatar'))
        );
        assert.verifySteps(
            ['read hr.employee.public 11,23', "read hr.employee.public 11"],
            "first employee should have been read to find its partner"
        );
        assert.containsOnce(
            document.body,
            '.o_ChatWindowHeader_name',
            'should have opened chat window'
        );
        assert.strictEqual(
            document.querySelector('.o_ChatWindowHeader_name').textContent,
            "Mario",
            'chat window should be with clicked employee'
        );

        // click on second employee
        await afterNextRender(() =>
            dom.click(webClient.el.querySelectorAll('.o_data_cell .o_m2m_avatar')[1]
            ));
        assert.verifySteps(
            ['read hr.employee.public 23'],
            "second employee should have been read to find its partner"
        );
        assert.containsN(
            document.body,
            '.o_ChatWindowHeader_name',
            2,
            'should have opened second chat window'
        );
        assert.strictEqual(
            document.querySelectorAll('.o_ChatWindowHeader_name')[1].textContent,
            "Yoshi",
            'chat window should be with clicked employee'
        );

        webClient.destroy();
    });

    QUnit.test('many2many_avatar_employee widget in kanban view', async function (assert) {
        assert.expect(7);

        this.serverData.views['foo,false,kanban'] =
            `<kanban>
                <templates>
                    <t t-name="kanban-box">
                        <div>
                            <div class="oe_kanban_footer">
                                <div class="o_kanban_record_bottom">
                                    <div class="oe_kanban_bottom_right">
                                        <field name="employee_ids" widget="many2many_avatar_employee"/>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </t>
                </templates>
            </kanban>`;

        const { webClient } = await start({
            serverData: this.serverData,
            openViewAction: {
                id: 1,
                res_model: "foo",
                type: "ir.actions.act_window",
                views: [[false, "kanban"]],
            },
            mockRPC(route, args) {
                if (args.method === 'read') {
                    assert.step(`read ${args.model} ${args.args[0]}`);
                }
            },
        });

        assert.containsN(webClient.el, '.o_kanban_record:first .o_field_many2manytags img.o_m2m_avatar', 2,
            "should have 2 avatar images");
        assert.strictEqual(
            webClient.el.querySelector('.o_kanban_record .o_field_many2manytags img.o_m2m_avatar').getAttribute('src'),
            "/web/image/hr.employee.public/11/avatar_128",
            "should have correct avatar image"
        );
        assert.strictEqual(
            webClient.el.querySelectorAll('.o_kanban_record .o_field_many2manytags img.o_m2m_avatar')[1].getAttribute('src'),
            "/web/image/hr.employee.public/23/avatar_128",
            "should have correct avatar image");

        await dom.click(webClient.el.querySelector('.o_kanban_record .o_field_many2manytags img.o_m2m_avatar'));
        await dom.click(webClient.el.querySelectorAll('.o_kanban_record .o_field_many2manytags img.o_m2m_avatar')[1]);

        assert.verifySteps([
            "read hr.employee.public 11,23",
            "read hr.employee.public 11",
            "read hr.employee.public 23"
        ]);

        webClient.destroy();
    });

    QUnit.test('many2many_avatar_employee: click on an employee not associated with a user', async function (assert) {
        assert.expect(10);

        this.serverData.models['hr.employee.public'].records[0].user_id = false;
        this.serverData.models['hr.employee.public'].records[0].user_partner_id = false;
        this.serverData.views['foo,false,form'] ='<form><field name="employee_ids" widget="many2many_avatar_employee"/></form>';
        const { webClient } = await start({
            hasChatWindow: true,
            serverData: this.serverData,
            openViewAction: {
                id: 1,
                res_model: "foo",
                res_id: 1,
                type: "ir.actions.act_window",
                views: [[false, "form"]],
            },
            mockRPC(route, args) {
                if (args.method === 'read') {
                    assert.step(`read ${args.model} ${args.args[0]}`);
                }
            },
            services: {
                notification: makeFakeNotificationService(message => {
                    assert.ok(
                        true,
                        "should display a toast notification after failing to open chat"
                    );
                    assert.strictEqual(
                        message,
                        "You can only chat with employees that have a dedicated user.",
                        "should display the correct information in the notification"
                    );
                }),
            },
        });

        assert.containsN(webClient.el, '.o_field_many2manytags.avatar.o_field_widget .badge', 2,
            "should have 2 records");
        assert.strictEqual(
            webClient.el.querySelector('.o_field_many2manytags.avatar.o_field_widget .badge img').getAttribute('src'),
            '/web/image/hr.employee.public/11/avatar_128',
            "should have correct avatar image");

        await dom.click(webClient.el.querySelector('.o_field_many2manytags.avatar.o_field_widget .badge img'));
        await dom.click(webClient.el.querySelectorAll('.o_field_many2manytags.avatar.o_field_widget .badge img')[1]);

        assert.verifySteps([
            'read foo 1',
            'read hr.employee.public 11,23',
            "read hr.employee.public 11",
            "read hr.employee.public 23"
        ]);

        assert.containsOnce(document.body, '.o_ChatWindowHeader_name',
            "should have 1 chat window");

        webClient.destroy();
    });
});
