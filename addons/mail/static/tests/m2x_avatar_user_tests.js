/** @odoo-module **/

import { Many2OneAvatarUser } from '@mail/js/m2x_avatar_user';
import { beforeEach, start } from '@mail/utils/test_utils';
import { click, legacyExtraNextTick, patchWithCleanup, triggerHotkey } from "@web/../tests/helpers/utils";
import { createWebClient, doAction } from '@web/../tests/webclient/helpers';
import { registry } from "@web/core/registry";
import { makeLegacyCommandService } from "@web/legacy/utils";
import core from 'web.core';
import session from 'web.session';
import makeTestEnvironment from "web.test_env";
import { dom, nextTick } from 'web.test_utils';

QUnit.module('mail', {}, function () {
    QUnit.module('M2XAvatarUser', {
        beforeEach() {
            beforeEach(this);

            // reset the cache before each test
            Many2OneAvatarUser.prototype.partnerIds = {};

            Object.assign(this.serverData.models, {
                foo: {
                    fields: {
                        user_id: { string: "User", type: 'many2one', relation: 'res.users' },
                        user_ids: { string: "Users", type: "many2many", relation: 'res.users',  default:[] },
                    },
                    records: [
                        { id: 1, user_id: 11, user_ids: [11, 23], },
                        { id: 2, user_id: 7 },
                        { id: 3, user_id: 11 },
                        { id: 4, user_id: 23 },
                    ],
                },
            });

            Object.assign(this.serverData.views, {
                'foo,false,list': '<list/>',
                'foo,false,search': '<search/>',
            });

            this.serverData.models['res.partner'].records.push(
                { id: 11, display_name: "Partner 1" },
                { id: 12, display_name: "Partner 2" },
                { id: 13, display_name: "Partner 3" }
            );
            this.serverData.models['res.users'].records.push(
                { id: 11, name: "Mario", partner_id: 11 },
                { id: 7, name: "Luigi", partner_id: 12 },
                { id: 23, name: "Yoshi", partner_id: 13 }
            );
        },
    });

    QUnit.test('many2one_avatar_user widget in list view', async function (assert) {
        assert.expect(4);

        this.serverData.views['foo,false,list'] = '<tree><field name="user_id" widget="many2one_avatar_user"/></tree>';

        const { webClient } = await start({
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

        // sanity check: later on, we'll check that clicking on the avatar doesn't open the record
        await dom.click(webClient.el.querySelector('.o_data_row span'));
        await dom.click(webClient.el.querySelector('.o_data_cell .o_m2o_avatar > img'));
        await dom.click(webClient.el.querySelectorAll('.o_data_cell .o_m2o_avatar > img')[1]);
        await dom.click(webClient.el.querySelectorAll('.o_data_cell .o_m2o_avatar > img')[2]);


        assert.verifySteps([
            'read res.users 11',
            // 'call service openDMChatWindow 1',
            'read res.users 7',
            // 'call service openDMChatWindow 2',
            // 'call service openDMChatWindow 1',
        ]);

        webClient.destroy();
    });

    QUnit.test('many2one_avatar_user widget in kanban view', async function (assert) {
        assert.expect(6);

        this.serverData.views['foo,false,kanban'] =
            `<kanban>
                <templates>
                    <t t-name="kanban-box">
                        <div>
                            <field name="user_id" widget="many2one_avatar_user"/>
                        </div>
                    </t>
                </templates>
            </kanban>`;

        const { webClient } = await start({
            serverData: this.serverData,
            openViewAction: {
                id: 1,
                res_model: 'foo',
                type: 'ir.actions.act_window',
                views: [[false, 'kanban']],
            },
        });

        assert.strictEqual(webClient.el.querySelector('.o_kanban_record').innerText.trim(), '');
        assert.containsN(webClient.el, '.o_m2o_avatar', 4);
        assert.strictEqual(webClient.el.querySelector('.o_m2o_avatar > img').getAttribute('src'), '/web/image/res.users/11/avatar_128');
        assert.strictEqual(webClient.el.querySelectorAll('.o_m2o_avatar > img')[1].getAttribute('src'), '/web/image/res.users/7/avatar_128');
        assert.strictEqual(webClient.el.querySelectorAll('.o_m2o_avatar > img')[2].getAttribute('src'), '/web/image/res.users/11/avatar_128');
        assert.strictEqual(webClient.el.querySelectorAll('.o_m2o_avatar > img')[3].getAttribute('src'), '/web/image/res.users/23/avatar_128');

        webClient.destroy();
    });

    QUnit.test('many2many_avatar_user widget in form view', async function (assert) {
        assert.expect(7);

        this.serverData.views['foo,false,form'] = '<form><field name="user_ids" widget="many2many_avatar_user"/></form>';

        const { webClient } = await start({
            serverData: this.serverData,
            openViewAction: {
                id: 1,
                res_model: 'foo',
                type: 'ir.actions.act_window',
                res_id: 1,
                views: [[false, 'form']],
            },
            mockRPC(route, args) {
                if (args.method === 'read') {
                    assert.step(`read ${args.model} ${args.args[0]}`);
                }
            },
        });

        assert.containsN(webClient.el, '.o_field_many2manytags.avatar.o_field_widget .badge', 2,
            "should have 2 records");
        assert.strictEqual(webClient.el.querySelector('.o_field_many2manytags.avatar.o_field_widget .badge img').getAttribute('src'), '/web/image/res.users/11/avatar_128',
            "should have correct avatar image");

        await dom.click(webClient.el.querySelector('.o_field_many2manytags.avatar .badge .o_m2m_avatar'));
        await dom.click(webClient.el.querySelectorAll('.o_field_many2manytags.avatar .badge .o_m2m_avatar')[1]);

        assert.verifySteps([
            "read foo 1",
            'read res.users 11,23',
            "read res.users 11",
            "read res.users 23",
        ]);

        webClient.destroy();
    });

    QUnit.test('many2many_avatar_user widget with single record in list view', async function (assert) {
        assert.expect(4);

        this.serverData.models.foo.records[1].user_ids = [11];
        this.serverData.views['foo,false,list'] = '<tree editable="top"><field name="user_ids" widget="many2many_avatar_user"/></tree>';

        const { webClient } = await start({
            serverData: this.serverData,
            openViewAction: {
                id: 1,
                res_model: 'foo',
                res_id: 1,
                type: 'ir.actions.act_window',
                views: [[false, 'list']],
            },
        });

        assert.containsN(webClient.el, '.o_data_row:eq(0) .o_field_many2manytags.avatar.o_field_widget .o_m2m_avatar', 2,
            "should have 2 records");
        assert.containsN(webClient.el, '.o_data_row:eq(1) .o_field_many2manytags.avatar.o_field_widget > div > span', 1,
            "should have 1 record in second row");
        assert.containsN(webClient.el, '.o_data_row:eq(1) .o_field_many2manytags.avatar.o_field_widget > div > span', 1,
            "should have img and span in second record");
        await dom.click(webClient.el.querySelectorAll('.o_data_row')[1].querySelector('.o_field_many2manytags.avatar > div > span'));
        assert.containsOnce(webClient.el, '.o_selected_row');

        webClient.destroy();
    });

    QUnit.test('many2many_avatar_user widget in list view', async function (assert) {
        assert.expect(7);

        this.serverData.views['foo,false,list'] = '<tree><field name="user_ids" widget="many2many_avatar_user"/></tree>';

        const { webClient } = await start({
            serverData: this.serverData,
            openViewAction: {
                id: 1,
                res_model: 'foo',
                type: 'ir.actions.act_window',
                views: [[false, 'list']],
            },
            mockRPC(route, args) {
                if (args.method === 'read') {
                    assert.step(`read ${args.model} ${args.args[0]}`);
                }
            },
        });

        assert.containsN(webClient.el.querySelector(".o_data_cell"), '.o_field_many2manytags.avatar.o_field_widget span', 2,
            "should have 2 records");
        assert.strictEqual(webClient.el.querySelector(".o_data_cell .o_field_many2manytags.avatar img.o_m2m_avatar").getAttribute('src'),
            "/web/image/res.users/11/avatar_128",
            "should have right image");
        assert.strictEqual(
            webClient.el.querySelector(".o_data_cell")
                .querySelectorAll(".o_field_many2manytags.avatar img.o_m2m_avatar")[1].getAttribute('src'),
            "/web/image/res.users/23/avatar_128",
            "should have right image"
        );

        // sanity check: later on, we'll check that clicking on the avatar doesn't open the record
        await dom.click(webClient.el.querySelector('.o_data_row .o_field_many2manytags'));

        await dom.click(webClient.el.querySelector('.o_data_cell .o_m2m_avatar'));
        await dom.click(webClient.el.querySelectorAll('.o_data_cell .o_m2m_avatar')[1]);

        assert.verifySteps([
            'read res.users 11,23',
            "read res.users 11",
            "read res.users 23",
        ]);

        webClient.destroy();
    });

    QUnit.test('many2many_avatar_user in kanban view', async function (assert) {
        assert.expect(11);

        this.serverData.models['res.users'].records.push({ id: 15, name: "Tapu", partner_id: 11 },);
        this.serverData.models.foo.records[2].user_ids = [11, 23, 7, 15];
        this.serverData.views['foo,false,kanban'] =
            `<kanban>
                <templates>
                    <t t-name="kanban-box">
                        <div>
                            <field name="user_id"/>
                            <div class="oe_kanban_footer">
                                <div class="o_kanban_record_bottom">
                                    <div class="oe_kanban_bottom_right">
                                        <field name="user_ids" widget="many2many_avatar_user"/>
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
                res_model: 'foo',
                type: 'ir.actions.act_window',
                views: [[false, 'kanban']],
            },
            mockRPC(route, args) {
                if (args.method === 'read') {
                    assert.step(`read ${args.model} ${args.args[0]}`);
                }
            },
        });

        assert.strictEqual(webClient.el.querySelector('.o_kanban_record .o_field_many2manytags img.o_m2m_avatar').getAttribute('src'),
            "/web/image/res.users/11/avatar_128",
            "should have correct avatar image");
        assert.strictEqual(webClient.el.querySelectorAll('.o_kanban_record .o_field_many2manytags img.o_m2m_avatar')[1].getAttribute('src'),
            "/web/image/res.users/23/avatar_128",
            "should have correct avatar image");

        const secondKanbanRecord = webClient.el.querySelectorAll('.o_kanban_record')[2];
        assert.containsN(secondKanbanRecord, '.o_field_many2manytags > span:not(.o_m2m_avatar_empty)', 2,
            "should have 2 records");
        assert.strictEqual(secondKanbanRecord.querySelector('.o_field_many2manytags img.o_m2m_avatar').getAttribute('src'),
            "/web/image/res.users/11/avatar_128",
            "should have correct avatar image");
        assert.strictEqual(secondKanbanRecord.querySelectorAll('.o_field_many2manytags img.o_m2m_avatar')[1].getAttribute('src'),
            "/web/image/res.users/23/avatar_128",
            "should have correct avatar image");
        assert.containsOnce(secondKanbanRecord, '.o_field_many2manytags .o_m2m_avatar_empty',
            "should have o_m2m_avatar_empty span");
        assert.strictEqual(secondKanbanRecord.querySelector('.o_field_many2manytags .o_m2m_avatar_empty').innerText.trim(), "+2",
            "should have +2 in o_m2m_avatar_empty");

        // TODO TSM: change this last jquery call
        $('.o_kanban_record:eq(2) .o_field_many2manytags .o_m2m_avatar_empty').trigger($.Event('mouseenter'));

        await nextTick();
        assert.containsOnce(webClient.el, '.popover',
            "should open a popover hover on o_m2m_avatar_empty");
        assert.strictEqual(
            Array.from(webClient.el.querySelectorAll('.popover .popover-body > div')).map(div => div.innerText.trim())
                .reduce((prevDivValue, currentDivValue) => prevDivValue + currentDivValue),
            "LuigiTapu",
            "should have a right text in popover");

        assert.verifySteps([
            "read res.users 7,11,15,23",
        ]);

        webClient.destroy();
    });

    QUnit.test('many2one_avatar_user widget in list view with no_open_chat set to true', async function (assert) {
        assert.expect(1);

        this.serverData.views['foo,false,list'] =
            `<tree><field name="user_id" widget="many2one_avatar_user" options="{'no_open_chat': 1}"/></tree>`;

        const { webClient } = await start({
            serverData: this.serverData,
            openViewAction: {
                id: 1,
                res_model: 'foo',
                type: 'ir.actions.act_window',
                views: [[false, 'list']],
            },
            mockRPC(route, args) {
                if (args.method === 'read') {
                    assert.step(`read ${args.model} ${args.args[0]}`);
                }
            },
        });

        await nextTick();

        assert.strictEqual(
            Array.from(webClient.el.querySelectorAll('.o_data_cell span')).map(span => span.innerText)
                .reduce((prevCellValue, currentCellValue) => prevCellValue + currentCellValue),
            'MarioLuigiMarioYoshi',
        );

        // sanity check: later on, we'll check that clicking on the avatar doesn't open the record
        await dom.click(webClient.el.querySelector('.o_data_row span'));
        await dom.click(webClient.el.querySelector('.o_data_cell .o_m2o_avatar > img'));
        await dom.click(webClient.el.querySelectorAll('.o_data_cell .o_m2o_avatar > img')[1]);
        await dom.click(webClient.el.querySelectorAll('.o_data_cell .o_m2o_avatar > img')[2]);

        webClient.destroy();
    });

    QUnit.test('many2one_avatar_user widget in kanban view', async function (assert) {
        assert.expect(3);

        this.serverData.views['foo,false,kanban'] =
            `<kanban>
                <templates>
                    <t t-name="kanban-box">
                        <div>
                            <field name="user_id" widget="many2one_avatar_user" options="{'no_open_chat': 1}"/>
                        </div>
                    </t>
                </templates>
            </kanban>`;

        const { webClient } = await start({
            serverData: this.serverData,
            openViewAction: {
                id: 1,
                res_model: 'foo',
                type: 'ir.actions.act_window',
                views: [[false, 'kanban']],
            },
        });

        assert.strictEqual(webClient.el.querySelector('.o_kanban_record').innerText.trim(), '');
        assert.containsN(webClient.el, '.o_m2o_avatar', 4);
        dom.click(webClient.el.querySelector('.o_m2o_avatar > img'));
        dom.click(webClient.el.querySelectorAll('.o_m2o_avatar > img')[1]);
        dom.click(webClient.el.querySelectorAll('.o_m2o_avatar > img')[2]);
        dom.click(webClient.el.querySelectorAll('.o_m2o_avatar > img')[3]);

        assert.verifySteps([], "no read res.user should be done since we don't want to open chat when the user clicks on avatar.");

        webClient.destroy();
    });

    QUnit.test('many2many_avatar_user widget in form view', async function (assert) {
        assert.expect(5);

        this.serverData.views['foo,false,form'] =
            `<form><field name="user_ids" widget="many2many_avatar_user" options="{'no_open_chat': 1}"/></form>`;

        const { webClient } = await start({
            serverData: this.serverData,
            openViewAction: {
                id: 1,
                res_model: 'foo',
                res_id: 1,
                type: 'ir.actions.act_window',
                views: [[false, 'form']],
            },
            mockRPC(route, args) {
                if (args.method === 'read') {
                    assert.step(`read ${args.model} ${args.args[0]}`);
                }
            },
        });

        assert.containsN(webClient.el, '.o_field_many2manytags.avatar.o_field_widget .badge', 2,
            "should have 2 records");
        assert.strictEqual(
            webClient.el.querySelector('.o_field_many2manytags.avatar.o_field_widget .badge img').getAttribute('src'),
            '/web/image/res.users/11/avatar_128',
            "should have correct avatar image"
        );

        await dom.click(webClient.el.querySelector('.o_field_many2manytags.avatar .badge .o_m2m_avatar'));
        await dom.click(webClient.el.querySelectorAll('.o_field_many2manytags.avatar .badge .o_m2m_avatar')[1]);

        assert.verifySteps([
            "read foo 1",
            'read res.users 11,23',
        ]);

        webClient.destroy();
    });

    QUnit.test('many2one_avatar_user widget edited by the smart action "Assign to..."', async function (assert) {
        assert.expect(4);

        const legacyEnv = makeTestEnvironment({ bus: core.bus });
        const serviceRegistry = registry.category("services");
        serviceRegistry.add("legacy_command", makeLegacyCommandService(legacyEnv));

        const views = {
            'foo,false,form': '<form><field name="user_id" widget="many2one_avatar_user"/></form>',
            'foo,false,search': '<search></search>',
        };
        const models = {
            'foo': this.serverData.models.foo,
            'res.partner': this.serverData.models['res.partner'],
            'res.users': this.serverData.models['res.users'],
        }
        const serverData = { models, views}
        const webClient = await createWebClient({serverData});
        await doAction(webClient, {
            res_id: 1,
            type: 'ir.actions.act_window',
            target: 'current',
            res_model: 'foo',
            'view_mode': 'form',
            'views': [[false, 'form']],
        });
        assert.strictEqual(webClient.el.querySelector(".o_m2o_avatar > span").textContent, "Mario")

        triggerHotkey("control+k")
        await nextTick();
        const idx = [...webClient.el.querySelectorAll(".o_command")].map(el => el.textContent).indexOf("Assign to ...ALT + I")
        assert.ok(idx >= 0);

        await click([...webClient.el.querySelectorAll(".o_command")][idx])
        await nextTick();
        assert.deepEqual([...webClient.el.querySelectorAll(".o_command")].map(el => el.textContent), [
            "Your Company, Mitchell Admin",
            "Public user",
            "Mario",
            "Luigi",
            "Yoshi",
          ])
        await click(webClient.el, "#o_command_3")
        await legacyExtraNextTick();
        assert.strictEqual(webClient.el.querySelector(".o_m2o_avatar > span").textContent, "Luigi")
    });

    QUnit.test('many2one_avatar_user widget edited by the smart action "Assign to me"', async function (assert) {
        assert.expect(4);

        patchWithCleanup(session, { user_id: [7] })
        const legacyEnv = makeTestEnvironment({ bus: core.bus });
        const serviceRegistry = registry.category("services");
        serviceRegistry.add("legacy_command", makeLegacyCommandService(legacyEnv));

        const views = {
            'foo,false,form': '<form><field name="user_id" widget="many2one_avatar_user"/></form>',
            'foo,false,search': '<search></search>',
        };
        const models = {
            'foo': this.serverData.models.foo,
            'res.partner': this.serverData.models['res.partner'],
            'res.users': this.serverData.models['res.users'],
        }
        const serverData = { models, views}
        const webClient = await createWebClient({serverData});
        await doAction(webClient, {
            res_id: 1,
            type: 'ir.actions.act_window',
            target: 'current',
            res_model: 'foo',
            'view_mode': 'form',
            'views': [[false, 'form']],
        });
        assert.strictEqual(webClient.el.querySelector(".o_m2o_avatar > span").textContent, "Mario")
        triggerHotkey("control+k")
        await nextTick();
        const idx = [...webClient.el.querySelectorAll(".o_command")].map(el => el.textContent).indexOf("Assign/unassign to meALT + SHIFT + I")
        assert.ok(idx >= 0);

        // Assign me (Luigi)
        triggerHotkey("alt+shift+i")
        await legacyExtraNextTick();
        assert.strictEqual(webClient.el.querySelector(".o_m2o_avatar > span").textContent, "Luigi")

        // Unassign me
        triggerHotkey("control+k");
        await nextTick();
        await click([...webClient.el.querySelectorAll(".o_command")][idx])
        await legacyExtraNextTick();
        assert.strictEqual(webClient.el.querySelector(".o_m2o_avatar > span").textContent, "")
    });

    QUnit.test('many2many_avatar_user widget edited by the smart action "Assign to..."', async function (assert) {
        assert.expect(4);

        const legacyEnv = makeTestEnvironment({ bus: core.bus });
        const serviceRegistry = registry.category("services");
        serviceRegistry.add("legacy_command", makeLegacyCommandService(legacyEnv));

        const views = {
            'foo,false,form': '<form><field name="user_ids" widget="many2many_avatar_user"/></form>',
            'foo,false,search': '<search></search>',
        };
        const models = {
            'foo': this.serverData.models.foo,
            'res.partner': this.serverData.models['res.partner'],
            'res.users': this.serverData.models['res.users'],
        }
        const serverData = { models, views}
        const webClient = await createWebClient({serverData});
        await doAction(webClient, {
            res_id: 1,
            type: 'ir.actions.act_window',
            target: 'current',
            res_model: 'foo',
            'view_mode': 'form',
            'views': [[false, 'form']],
        });
        let userNames = [...webClient.el.querySelectorAll(".o_tag_badge_text")].map((el => el.textContent));
        assert.deepEqual(userNames, ["Mario", "Yoshi"]);

        triggerHotkey("control+k")
        await nextTick();
        const idx = [...webClient.el.querySelectorAll(".o_command")].map(el => el.textContent).indexOf("Assign to ...ALT + I")
        assert.ok(idx >= 0);

        await click([...webClient.el.querySelectorAll(".o_command")][idx])
        await nextTick();
        assert.deepEqual([...webClient.el.querySelectorAll(".o_command")].map(el => el.textContent), [
            "Your Company, Mitchell Admin",
            "Public user",
            "Luigi"
          ]);

        await click(webClient.el, "#o_command_2");
        await legacyExtraNextTick();
        userNames = [...webClient.el.querySelectorAll(".o_tag_badge_text")].map(el => el.textContent);
        assert.deepEqual(userNames, ["Mario", "Yoshi", "Luigi"]);
    });

    QUnit.test('many2many_avatar_user widget edited by the smart action "Assign to me"', async function (assert) {
        assert.expect(4);

        patchWithCleanup(session, { user_id: [7] })
        const legacyEnv = makeTestEnvironment({ bus: core.bus });
        const serviceRegistry = registry.category("services");
        serviceRegistry.add("legacy_command", makeLegacyCommandService(legacyEnv));

        const views = {
            'foo,false,form': '<form><field name="user_ids" widget="many2many_avatar_user"/></form>',
            'foo,false,search': '<search></search>',
        };
        const models = {
            'foo': this.serverData.models.foo,
            'res.partner': this.serverData.models['res.partner'],
            'res.users': this.serverData.models['res.users'],
        }
        const serverData = { models, views}
        const webClient = await createWebClient({serverData});
        await doAction(webClient, {
            res_id: 1,
            type: 'ir.actions.act_window',
            target: 'current',
            res_model: 'foo',
            'view_mode': 'form',
            'views': [[false, 'form']],
        });
        let userNames = [...webClient.el.querySelectorAll(".o_tag_badge_text")].map((el => el.textContent));
        assert.deepEqual(userNames, ["Mario", "Yoshi"]);

        triggerHotkey("control+k");
        await nextTick();
        const idx = [...webClient.el.querySelectorAll(".o_command")].map(el => el.textContent).indexOf("Assign/unassign to meALT + SHIFT + I");
        assert.ok(idx >= 0);

        // Assign me (Luigi)
        triggerHotkey("alt+shift+i");
        await legacyExtraNextTick();
        userNames = [...webClient.el.querySelectorAll(".o_tag_badge_text")].map((el => el.textContent));
        assert.deepEqual(userNames, ["Mario", "Yoshi", "Luigi"]);

        // Unassign me
        triggerHotkey("control+k");
        await nextTick();
        await click([...webClient.el.querySelectorAll(".o_command")][idx]);
        await legacyExtraNextTick();
        userNames = [...webClient.el.querySelectorAll(".o_tag_badge_text")].map((el => el.textContent));
        assert.deepEqual(userNames, ["Mario", "Yoshi"]);
    });

});
