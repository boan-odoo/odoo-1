/** @odoo-module **/

import { beforeEach, start } from '@mail/utils/test_utils';

QUnit.module('mail', {}, function () {
QUnit.module('components', {}, function () {
QUnit.module('composer_suggestion', {}, function () {
QUnit.module('composer_suggestion_command_tests.js', {
    beforeEach() {
        beforeEach(this);

        this.start = async params => {
            const res = await start({ ...params, serverData: this.serverData });
            const { env, webClient } = res;
            this.env = env;
            this.webClient = webClient;
            return res;
        };
    },
});

QUnit.test('command suggestion displayed', async function (assert) {
    assert.expect(1);

    this.serverData.models['mail.channel'].records.push({ id: 20 });
    const { createComposerSuggestionComponent } = await this.start();
    const thread = this.messaging.models['Thread'].findFromIdentifyingData({
        id: 20,
        model: 'mail.channel',
    });
    const command = this.messaging.models['ChannelCommand'].create({
        methodName: '',
        name: 'whois',
        help: "Displays who it is",
    });
    await createComposerSuggestionComponent(thread.composer, {
        isActive: true,
        modelName: 'ChannelCommand',
        recordLocalId: command.localId,
    });

    assert.containsOnce(
        document.body,
        `.o_ComposerSuggestion`,
        "Command suggestion should be present"
    );
});

QUnit.test('command suggestion correct data', async function (assert) {
    assert.expect(5);

    this.serverData.models['mail.channel'].records.push({ id: 20 });
    const { createComposerSuggestionComponent } = await this.start();
    const thread = this.messaging.models['Thread'].findFromIdentifyingData({
        id: 20,
        model: 'mail.channel',
    });
    const command = this.messaging.models['ChannelCommand'].create({
        methodName: '',
        name: 'whois',
        help: "Displays who it is",
    });
    await createComposerSuggestionComponent(thread.composer, {
        isActive: true,
        modelName: 'ChannelCommand',
        recordLocalId: command.localId,
    });

    assert.containsOnce(
        document.body,
        '.o_ComposerSuggestion',
        "Command suggestion should be present"
    );
    assert.containsOnce(
        document.body,
        '.o_ComposerSuggestion_part1',
        "Command name should be present"
    );
    assert.strictEqual(
        document.querySelector(`.o_ComposerSuggestion_part1`).textContent,
        "whois",
        "Command name should be displayed"
    );
    assert.containsOnce(
        document.body,
        '.o_ComposerSuggestion_part2',
        "Command help should be present"
    );
    assert.strictEqual(
        document.querySelector(`.o_ComposerSuggestion_part2`).textContent,
        "Displays who it is",
        "Command help should be displayed"
    );
});

QUnit.test('command suggestion active', async function (assert) {
    assert.expect(2);

    this.serverData.models['mail.channel'].records.push({ id: 20 });
    const { createComposerSuggestionComponent } = await this.start();
    const thread = this.messaging.models['Thread'].findFromIdentifyingData({
        id: 20,
        model: 'mail.channel',
    });
    const command = this.messaging.models['ChannelCommand'].create({
        methodName: '',
        name: 'whois',
        help: "Displays who it is",
    });
    await createComposerSuggestionComponent(thread.composer, {
        isActive: true,
        modelName: 'ChannelCommand',
        recordLocalId: command.localId,
    });

    assert.containsOnce(
        document.body,
        '.o_ComposerSuggestion',
        "Command suggestion should be displayed"
    );
    assert.hasClass(
        document.querySelector('.o_ComposerSuggestion'),
        'active',
        "should be active initially"
    );
});

});
});
});
