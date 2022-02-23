odoo.define('point_of_sale.tests.PosModal', function(require) {
    'use strict';

    const PosModal = require('point_of_sale.PosModal');
    const AbstractAwaitablePopup = require('point_of_sale.AbstractAwaitablePopup');
    const PosComponent = require('point_of_sale.PosComponent');
    const makeTestEnvironment = require('web.test_env');
    const testUtils = require('web.test_utils');
    const Registries = require('point_of_sale.Registries');
    const { mount } = require('@web/../tests/helpers/utils');

    const { EventBus, useSubEnv, xml } = owl;

    QUnit.module('unit tests for PosModal', {
        before() {
            Registries.Component.freeze();
        },
    });

    QUnit.test('allow multiple popups at the same time', async function(assert) {
        assert.expect(10);
        // Note that we are creating new dialogs here to decouple this test from the pos app.
        class CustomDialog1 extends AbstractAwaitablePopup {}
        CustomDialog1.template = xml/* html */`
            <div class="dialog custom-dialog-1">
                <header>
                    <t t-esc="props.title" />
                </header>
                <main>
                    <t t-esc=" props.body" />
                </main>
                <footer>
                    <div class="confirm" t-on-click="confirm">
                        <t t-esc="props.confirmText" />
                    </div>
                    <div class="cancel" t-on-click="cancel">
                        <t t-esc="props.cancelText" />
                    </div>
                </footer>
            </div>
        `;
        CustomDialog1.defaultProps = {
            confirmText: 'Yes',
            cancelText: 'No',
            title: 'custom-dialog-1-title',
            body: 'custom-dialog-1-body'
        };

        class CustomDialog2 extends AbstractAwaitablePopup {}
        CustomDialog2.template = xml/* html */`
            <div class="dialog custom-dialog-2">
                <header>
                    <t t-esc="props.title" />
                </header>
                <main>
                    <t t-esc=" props.body" />
                </main>
                <footer>
                    <div class="confirm" t-on-click="confirm">
                        <t t-esc="props.confirmText" />
                    </div>
                </footer>
            </div>
        `;
        CustomDialog2.defaultProps = {
            confirmText: 'Okay',
            title: 'custom-dialog-2-title',
            body: 'custom-dialog-2-body'
        };

        PosModal.components = { CustomDialog1, CustomDialog2 };

        class Root extends PosComponent {
            setup() {
                super.setup();
                useSubEnv({
                    isDebug: () => false,
                    posbus: new EventBus(),
                });
            }
        }
        Root.env = makeTestEnvironment();
        Root.template = xml/* html */ `
            <div>
                <PosModal />
            </div>
        `;

        const root = await mount(Root, testUtils.prepareTarget());

        // Check 1 dialog
        let dialog1Promise = root.showPopup('CustomDialog1', {});
        await testUtils.nextTick();
        assert.strictEqual(root.el.querySelectorAll('.dialog').length, 1);
        testUtils.dom.click(root.el.querySelector('.custom-dialog-1 .confirm'));
        let result1 = await dialog1Promise;
        assert.strictEqual(result1.confirmed, true);
        await testUtils.nextTick();
        assert.strictEqual(root.el.querySelectorAll('.dialog').length, 0);

        // Check multiple dialogs
        dialog1Promise = root.showPopup('CustomDialog1', {});
        await testUtils.nextTick();

        // Check if the first dialog is shown.
        assert.strictEqual(root.el.querySelectorAll('.dialog').length, 1);

        let dialog2Promise = root.showPopup('CustomDialog2', {});
        await testUtils.nextTick();

        // Check for the second dialog.
        assert.strictEqual(root.el.querySelectorAll('.dialog').length, 2);

        // click cancel on dialog 1
        testUtils.dom.click(root.el.querySelector('.custom-dialog-1 .cancel'));
        await testUtils.nextTick();

        // after cancel on dialog 1, only 1 should remain.
        assert.strictEqual(root.el.querySelectorAll('.dialog').length, 1);
        assert.strictEqual(root.el.querySelectorAll('.custom-dialog-1').length, 0);

        // click confirm on dialog 2
        testUtils.dom.click(root.el.querySelector('.custom-dialog-2 .confirm'));
        await testUtils.nextTick();

        // after confirming dialog 2, no dialog should remain.
        assert.strictEqual(root.el.querySelectorAll('.dialog').length, 0);

        result1 = await dialog1Promise;
        let result2 = await dialog2Promise;
        assert.strictEqual(result1.confirmed, false); // false because it's cancelled.
        assert.strictEqual(result2.confirmed, true); // true because it's confirmed.
    });
});
