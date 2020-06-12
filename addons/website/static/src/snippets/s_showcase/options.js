odoo.define('website.s_showcase_options', function (require) {
'use strict';

const snippetOptions = require('web_editor.snippets.options');

snippetOptions.registry.Showcase = snippetOptions.SnippetOptionsWidget.extend({
    /**
     * @override
     */
    onMove: function () {
        const $showcaseCol = this.$target.parent().closest('.row > div');
        const isLeftCol = $showcaseCol.index() <= 0;
        const $title = this.$target.children('.s_showcase_title');
        $title.toggleClass('flex-lg-row-reverse', isLeftCol);
        $title.find('.s_showcase_icon').toggleClass('mr-lg-0 ml-3', isLeftCol);
    },
});
});
