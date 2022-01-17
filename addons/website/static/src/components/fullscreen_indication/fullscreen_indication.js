/** @odoo-module **/

const { Component, xml, useEffect } = owl;

export class FullscreenIndication extends Component {
    setup() {
        useEffect(() => {
            setTimeout(() => this.el.classList.add('o_visible'));

            this.autofade = setTimeout(() => {
                this.el.classList.remove('o_visible');
            }, 2000);

            return () => clearTimeout(this.autofade);
        });
    }
}
FullscreenIndication.template = xml`
<div class="o_fullscreen_indication">
    <p>Press <span>esc</span> to exit full screen</p>
</div>`;
