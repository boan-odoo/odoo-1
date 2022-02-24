odoo.define('knowledge.knowledge_frontend', function (require) {
    'use strict';

    var publicWidget = require('web.public.widget');

    publicWidget.registry.KnowledgeWidget = publicWidget.Widget.extend({
        selector: '.o_knowledge_form_view',
        events: {
            'keyup #knowledge_search': '_searchArticles',
            'click .o_article_caret': '_onFold',
        },

        _searchArticles: function (e) {
            const $tree = $('.o_tree');
            const search = $('#knowledge_search');
            this._traverse($tree, $li => {
                const keyword = search.val().toLowerCase();
                if ($li.text().toLowerCase().indexOf(keyword) >= 0) {
                    $li.show();
                }
                else {
                    $li.hide();
                }
            })
        },
        /**
         * When the user clicks on the caret to hide and show some files
         * @param {Event} event
         */
        _onFold: function (event) {
            event.stopPropagation();
            const $button = $(event.currentTarget);
            const $icon = $button.find('i');
            const $li = $button.closest('li');
            const $ul = $li.find('ul');
            if ($ul.length !== 0) {
                $ul.toggle();
                if ($ul.is(':visible')) {
                    $icon.removeClass('fa-caret-right');
                    $icon.addClass('fa-caret-down');
                } else {
                    $icon.removeClass('fa-caret-down');
                    $icon.addClass('fa-caret-right');
                }
            }
        },
        /**
         * Helper function to traverses the nested list (dfs)
         * @param {jQuery} $tree
         * @param {Function} callback
         */
        _traverse: function ($tree, callback) {
            const stack = $tree.children('li').toArray();
            while (stack.length > 0) {
                const $li = $(stack.shift());
                const $ul = $li.children('ul');
                callback($li);
                if ($ul.length > 0) {
                    stack.unshift(...$ul.children('li').toArray());
                }
            }
        },
    });
});
