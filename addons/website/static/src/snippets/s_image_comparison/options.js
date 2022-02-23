/** @odoo-module **/
import options from 'web_editor.snippets.options';

options.registry.ImageComparison = options.Class.extend({
    isTopOption: true,
    forceNoDeleteButton: true,
    start: function () {
        const leftPanelEl = this.$overlay.data('$optionsSection')[0];
        var titleTextEl = leftPanelEl.querySelector('we-title > span');
        this.counterEl = document.createElement('span');
        titleTextEl.prepend(this.counterEl);
        return this._super(...arguments);
    },
    updateUI: async function () {
        await this._super(...arguments);
        this.counterEl.textContent = 'Left ';
    },
    cleanForSave() {
        console.log('cleanForSave');
        const sliderVal = 50;
        this.$target[0].querySelector('.image-right').style.clipPath = "polygon(0 0," + sliderVal + "% 0," + sliderVal + "%100%, 0 100%)";
    },
});
export default {
    ImageComparison: options.registry.ImageComparison,
};
