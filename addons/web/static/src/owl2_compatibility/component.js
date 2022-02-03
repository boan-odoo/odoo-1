(function () {
    const hasOwnProperty = Object.prototype.hasOwnProperty;

    owl.Component = class extends owl.Component {
        constructor(...args) {
            super(...args);
            if (typeof this.destroy === "function") {
                throw new Error(`${this.constructor.name} has "destroy" defined`);
            }
        }

        get el() {
            const bdom = this.__owl__.bdom;
            if (!bdom) {
                return null;
            }

            if (hasOwnProperty.call(bdom, "component")) {
                return bdom.component.el;
            } else {
                return bdom.firstNode();
            }
        }

        /**
         * Emit a custom event of type 'eventType' with the given 'payload' on the
         * component's el, if it exists. However, note that the event will only bubble
         * up to the parent DOM nodes. Thus, it must be called between mounted() and
         * willUnmount().
         */
        trigger(eventType, payload) {
            this.__trigger(eventType, payload);
        }
        /**
         * Private trigger method, allows to choose the component which triggered
         * the event in the first place
         */
        __trigger(eventType, payload) {
            if (this.el) {
                const ev = new CustomEvent(eventType, {
                    bubbles: true,
                    cancelable: true,
                    detail: payload,
                });
                this.el.dispatchEvent(ev);
            }
        }
    };
    owl.Component.env = {};

    Object.defineProperty(owl.Component, "components", {
        get() {
            return this._components;
        },
        set(val) {
            this._components = new Proxy(val, {
                get(target, key) {
                    return target[key] || owl.Component._components[key];
                },
            });
        },
    });
    owl.Component._components = {};
})();
