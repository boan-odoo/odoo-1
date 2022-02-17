/** @odoo-module **/

import Widget from 'web.Widget';
import { qweb as QWeb, _t } from 'web.core';
import sections from './knowledge_emoji.js';

const EmojiPickerWidget = Widget.extend({
    events: {
        'click': '_onOpen'
    },

    /**
     * @param {Event} event
     */
    _onOpen: function (event) {
        const $panel = $(QWeb.render('knowledge.knowledge_emoji_panel', {
            sections
        }));

        const $container = $panel.find('.o_emoji_pane');
        $container.scrollspy();

        $panel.find('a').on('click', event => {
            event.preventDefault();
            event.stopPropagation();
            const id = $(event.target).attr('href').substring(1);
            const $title = $container.find(`[id="${id}"]`);
            if ($title.length === 0) {
                return;
            }
            $container.animate({
                scrollTop: $title.position().top + $container.scrollTop()
            });
        });

        $container.find('.o_emoji').on('click', event => {
            const $emoji = $(event.target);
            this.trigger_up('emoji_picked', {
                unicode: $emoji.text()
            });
        });

        const $input = $panel.find('input');
        $input.on('click', event => {
            event.stopPropagation();
        });

        $input.on('input', () => {
            const value = $input.val().toLowerCase();
            $panel.find('.o_emoji').each(function () {
                const $emoji = $(this);
                const description = $emoji.data('description').toLowerCase();
                $emoji.toggleClass('d-none', description.indexOf(value) === -1);
            });
            $panel.find('.o_section').each(function () {
                const $section = $(this);
                const n = $section.find('.o_emoji:not(.d-none)').length;
                $section.toggleClass('d-none', n === 0);
            });
        });

        $panel.find('.nav-link:first').toggleClass('active', true);

        const $menu = this.$el.find('.dropdown-menu');
        $menu.empty();
        $menu.append($panel);
    },
});

export default EmojiPickerWidget;
