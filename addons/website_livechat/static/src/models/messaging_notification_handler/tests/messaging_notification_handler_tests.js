/** @odoo-module **/

import {
    afterNextRender,
    beforeEach,
    start
} from '@mail/utils/test_utils';
import { ViewAdapter } from '@web/legacy/action_adapters';
import { patchWithCleanup } from '@web/../tests/helpers/utils';


QUnit.module('website_livechat', {}, function () {
QUnit.module('models', {}, function () {
QUnit.module('messaging_notification_handler', {}, function () {
QUnit.module('messaging_notification_handler_tests.js', {
    beforeEach() {
        beforeEach(this);

        this.start = async params => {
            const { env, webClient } = await start(Object.assign({}, {
                serverData: this.serverData,
            }, params));
            this.env = env;
            this.webClient = webClient;
        };
    },
});

QUnit.test('should open chat window on send chat request to website visitor', async function (assert) {
    assert.expect(3);

    this.serverData.models['website.visitor'].records.push({
        display_name: "Visitor #11",
        id: 11,
    });
    Object.assign(this.serverData.views,{
        'website.visitor,false,form':
            `<form>
                <header>
                    <button name="action_send_chat_request" string="Send chat request" class="btn btn-primary" type="button"/>
                </header>
                <field name="name"/>
            </form>`,
        'website.visitor,false,search': '<search/>',
    });

    await this.start({
        hasChatWindow: true,
        serverData: this.serverData,
        openViewAction: {
            id: 1,
            res_model: 'website.visitor',
            res_id: 11,
            type: 'ir.actions.act_window',
            views: [[false, 'form']],
        },
    });

    patchWithCleanup(ViewAdapter.prototype, {
        _trigger_up: async function({ name, data }) {
            if (name === 'execute_action') {
                this.env.services.rpc({
                    route: '/web/dataset/call_button',
                    params: {
                        args: [data.env.resIDs],
                        kwargs: { context: data.env.context },
                        method: data.action_data.name,
                        model: data.env.model,
                    }
                });
            }
        },
    });

    await afterNextRender(() =>
        document.querySelector('button[name="action_send_chat_request"]').click()
    );
    assert.containsOnce(
        document.body,
        '.o_ChatWindow',
        "should have a chat window open after sending chat request to website visitor"
    );
    assert.hasClass(
        document.querySelector('.o_ChatWindow'),
        'o-focused',
        "chat window of livechat should be focused on open"
    );
    assert.strictEqual(
        document.querySelector('.o_ChatWindowHeader_name').textContent,
        "Visitor #11",
        "chat window of livechat should have name of visitor in the name"
    );
});

});
});
});
