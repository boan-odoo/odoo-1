odoo.define("web.component_extension_tests", function (require) {
"use strict";

const makeTestEnvironment = require("web.test_env");
const testUtils = require("web.test_utils");

const { Component, tags } = owl;
const { xml } = tags;

QUnit.module("web", {
    afterEach: function () {
        // TODO: better than override destroy? (this was done for old widget)
        testUtils.cleanTarget();
    }
}, function () {
    QUnit.module("Component Extension");

    QUnit.test("Component destroyed while performing successful RPC", async function (assert) {
        assert.expect(1);

        class Parent extends Component {}
        Parent.env = makeTestEnvironment({
            rpc: () => Promise.resolve(),
        });
        Parent.template = xml`<div/>`;

        const parent = new Parent();

        parent.rpc({}).then(() => { throw new Error(); });
        parent.destroy();

        assert.ok(true, "Promise should still be pending");
    });

    QUnit.test("Component destroyed while performing failed RPC", async function (assert) {
        assert.expect(1);

        class Parent extends Component {}
        Parent.env = makeTestEnvironment({
            rpc: () => Promise.reject(),
        });
        Parent.template = xml`<div/>`;

        const parent = new Parent();

        parent.rpc({}).catch(() => { throw new Error(); });
        parent.destroy();

        assert.ok(true, "Promise should still be pending");
    });
});

});
