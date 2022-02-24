/** @odoo-module */

import emojis from '../../js/knowledge_emojis.js'
const { Component, useState, onMounted } = owl;

class EmojiPicker extends Component {
    /**
     * @override
     */
    setup () {
        super.setup();
        this.uid = this.getUniqueID();
        this.emojis = emojis;
        this.state = useState({
            term: ''
        });
        onMounted(() => this._mounted());
    }

    /**
     * @returns {String}
     */
    getUniqueID () {
        return _.uniqueId('o_emoji_picker_');
    }

    /**
     * @returns {Object}
     */
    getAllEmojis () {
        return emojis;
    }

    /**
     * Callback function called when the user clicks on an emoji.
     * @param {String} unicode
     */
    onEmojiClick (unicode) {
        if (this.props.onEmojiClick) {
            this.props.onEmojiClick(unicode);
        }
    }

    /**
     * Callback function called when the user clicks on a nav item.
     * @param {Event} event
     */
    onNavItemClick (event) {
        event.preventDefault();
        event.stopPropagation();
        const id = $(event.target).attr('href').substring(1);
        const $pane = $(this.el).find('.o_emoji_pane');
        const $title = $pane.find(`[id="${id}"]`);
        if ($title.length === 0) {
            return;
        }
        $pane.animate({
            scrollTop: $title.position().top + $pane.scrollTop()
        });
    }

    /**
     * Callback function called when the user types something on the search box.
     * @param {Event} event
     */
    _onInputChange (event) {
        this.state.term = event.target.value;
    }

    /**
     * @param {Array} emoji
     * @returns {boolean}
     */
    isVisible (emoji) {
        if (this.state.term.length === 0) {
            return true;
        }
        return emoji[1].some(text => {
            return text.indexOf(this.state.term) >= 0;
        });
    }

    /**
     * Callback function called when the component is mounted to the dom.
     */
    _mounted () {
        const $pane = $(this.el).find('.o_emoji_pane');
        $pane.scrollspy();
    }
}

EmojiPicker.template = 'knowledge.EmojiPicker';
EmojiPicker.props = ['onEmojiClick'];

export default EmojiPicker;
