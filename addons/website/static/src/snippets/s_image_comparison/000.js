/** @odoo-module */

import publicWidget from 'web.public.widget';

const ImageComparisonWidget = publicWidget.Widget.extend({
    selector: '.s_image_comparison',
    disabledInEditableMode: false, //Maybe not
    start() {
        const sliderEl = this.$target[0].querySelector("input");
        sliderEl.oninput = () => {
            let sliderVal = sliderEl.value;
            this.$target[0].querySelector('.image-right').style.clipPath = "polygon(0 0," + sliderVal + "% 0," + sliderVal + "%100%, 0 100%)";
        };
    }
});
publicWidget.registry.s_image_comparison = ImageComparisonWidget;
export default ImageComparisonWidget;
