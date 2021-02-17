/** @odoo-module **/

import { link } from '@mail/model/model_field_command';
import {
    afterEach,
    afterNextRender,
    beforeEach,
    start,
} from '@mail/utils/test_utils';

QUnit.module('mail', {}, function () {
QUnit.module('components', {}, function () {
QUnit.module('attachment_link_preview', {}, function () {
QUnit.module('attachment_link_preview_tests.js', {
    beforeEach() {
        beforeEach(this);

        this.start = async params => {
            const res = await start({ ...params, data: this.data });
            const { afterEvent, components, env, widget } = res;
            this.afterEvent = afterEvent;
            this.components = components;
            this.env = env;
            this.widget = widget;
            return res;
        };
    },
    afterEach() {
        afterEach(this);
    },
});

QUnit.test('auto layout with link preview', async function(assert) {
    assert.expect(1);

    const { createMessageComponent } = await this.start();
    const attachment = this.messaging.models['Attachment'].create({
        description: 'test description',
        filename: "https://tenor.com/view/gato-gif-18532922",
        id: 750,
        mimetype: 'application/o-linkpreview',
        name: "https://tenor.com/view/gato-gif-18532922",
        url: "https://tenor.com/view/gato-gif-18532922",
    });
    const message = this.messaging.models['Message'].create({
        attachments: link(attachment),
        author: link(this.messaging.currentPartner),
        body: "<p>Test</p>",
        id: 100,
    });
    await createMessageComponent(message);

    assert.containsOnce(
        document.body,
        '.o_AttachmentLinkPreview',
        "Attachment is a link preview"
    );
});

QUnit.test('simplest layout', async function (assert) {
    assert.expect(4);

    const { createMessageComponent } = await this.start();
    const attachment = this.messaging.models['Attachment'].create({
        description: 'test description',
        filename: "https://tenor.com/view/gato-gif-18532922",
        id: 750,
        mimetype: 'application/o-linkpreview-with-thumbnail',
        name: "https://tenor.com/view/gato-gif-18532922",
        url: "https://tenor.com/view/gato-gif-18532922",
    });
    const message = this.messaging.models['Message'].create({
        attachments: link(attachment),
        author: link(this.messaging.currentPartner),
        body: "<p>Test</p>",
        id: 100,
    });
    await createMessageComponent(message);

    assert.containsOnce(
        document.body,
        '.o_AttachmentLinkPreview',
        "should have attachment link preview in DOM"
    );
    assert.containsOnce(
        document.body,
        '.o_AttachmentLinkPreview_title',
        "Should display the page title"
    );
    assert.containsOnce(
        document.body,
        '.o_AttachmentLinkPreview_linkImage',
        "attachment should have an image part"
    );
    assert.containsOnce(
        document.body,
        '.o_AttachmentLinkPreview_description',
        "attachment should show the link description"
    );
});

});
});
});
