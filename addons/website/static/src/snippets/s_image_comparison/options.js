/** @odoo-module **/
import options from 'web_editor.snippets.options';

options.registry.ImageComparison = options.Class.extend({
    isTopOption: true,
    forceNoDeleteButton: true,
    start: function () {
        console.log('start options', this.$target[0]);
        this.currentImage = this.$target[0].querySelector('img');
        // My hack
        // this.currentImage.click();
        const leftPanelEl = this.$overlay.data('$optionsSection')[0];
        var titleTextEl = leftPanelEl.querySelector('we-title > span');
        titleTextEl.innerText = 'Left Image';
        return this._super(...arguments);
    },
    updateUI: async function () {
        await this._super(...arguments);
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
