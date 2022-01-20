odoo.define('mass_mailing.snippets.options', function (require) {
"use strict";

var options = require('web_editor.snippets.options');
const {ColorpickerWidget} = require('web.Colorpicker');
const {_t} = require('web.core');
const {generateHTMLId} = require('web_editor.utils');
const session = require('web.session');

// Snippet option for resizing  image and column width inline like excel
options.registry.mass_mailing_sizing_x = options.Class.extend({
    /**
     * @override
     */
    start: function () {
        var def = this._super.apply(this, arguments);

        this.containerWidth = this.$target.parent().closest("td, table, div").width();

        var self = this;
        var offset, sib_offset, target_width, sib_width;

        this.$overlay.find(".o_handle.e, .o_handle.w").removeClass("readonly");
        this.isIMG = this.$target.is("img");
        if (this.isIMG) {
            this.$overlay.find(".o_handle.w").addClass("readonly");
        }

        var $body = $(this.ownerDocument.body);
        this.$overlay.find(".o_handle").on('mousedown', function (event) {
            event.preventDefault();
            var $handle = $(this);
            var compass = false;

            _.each(['n', 's', 'e', 'w'], function (handler) {
                if ($handle.hasClass(handler)) { compass = handler; }
            });
            if (self.isIMG) { compass = "image"; }

            $body.on("mousemove.mass_mailing_width_x", function (event) {
                event.preventDefault();
                offset = self.$target.offset().left;
                target_width = self.get_max_width(self.$target);
                if (compass === 'e' && self.$target.next().offset()) {
                    sib_width = self.get_max_width(self.$target.next());
                    sib_offset = self.$target.next().offset().left;
                    self.change_width(event, self.$target, target_width, offset, true);
                    self.change_width(event, self.$target.next(), sib_width, sib_offset, false);
                }
                if (compass === 'w' && self.$target.prev().offset()) {
                    sib_width = self.get_max_width(self.$target.prev());
                    sib_offset = self.$target.prev().offset().left;
                    self.change_width(event, self.$target, target_width, offset, false);
                    self.change_width(event, self.$target.prev(), sib_width, sib_offset, true);
                }
                if (compass === 'image') {
                    self.change_width(event, self.$target, target_width, offset, true);
                }
            });
            $body.one("mouseup", function () {
                $body.off('.mass_mailing_width_x');
            });
        });

        return def;
    },
    change_width: function (event, target, target_width, offset, grow) {
        target.css("width", Math.round(grow ? (event.pageX - offset) : (offset + target_width - event.pageX)));
        this.trigger_up('cover_update');
    },
    get_int_width: function (el) {
        return parseInt($(el).css("width"), 10);
    },
    get_max_width: function ($el) {
        return this.containerWidth - _.reduce(_.map($el.siblings(), this.get_int_width), function (memo, w) { return memo + w; });
    },
    onFocus: function () {
        this._super.apply(this, arguments);

        if (this.$target.is("td, th")) {
            this.$overlay.find(".o_handle.e, .o_handle.w").toggleClass("readonly", this.$target.siblings().length === 0);
        }
    },
});

// Adding compatibility for the outlook compliance of mailings.
// Commit of such compatibility : a14f89c8663c9cafecb1cc26918055e023ecbe42
options.registry.BackgroundImage = options.registry.BackgroundImage.extend({
    start: function () {
        this._super();
        if (this.snippets && this.snippets.split('.')[0] === "mass_mailing") {
            var $table_target = this.$target.find('table:first');
            if ($table_target.length) {
                this.$target = $table_target;
            }
        }
    }
});

options.registry.ImageTools.include({

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * @override
     */
    async updateUIVisibility() {
        await this._super(...arguments);

        // The image shape option should work correctly with this update of the
        // ImageTools option but unfortunately, SVG support in mail clients
        // prevents the final rendering of the image. For now, we disable the
        // feature.
        const imgShapeContainerEl = this.el.querySelector('.o_we_image_shape');
        if (imgShapeContainerEl) {
            imgShapeContainerEl.classList.toggle('d-none', !odoo.debug);
        }
    },

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * @override
     */
    _getCSSColorValue(color) {
        const doc = this.options.document;
        if (doc && doc.querySelector('.o_mass_mailing_iframe') && !ColorpickerWidget.isCSSColor(color)) {
            const tempEl = doc.body.appendChild(doc.createElement('div'));
            tempEl.className = `bg-${color}`;
            const colorValue = window.getComputedStyle(tempEl).getPropertyValue("background-color").trim();
            tempEl.parentNode.removeChild(tempEl);
            return ColorpickerWidget.normalizeCSSColor(colorValue).replace(/"/g, "'");
        }
        return this._super(...arguments);
    },
    /**
     * @override
     */
    async _renderCustomWidgets(uiFragment) {
        await this._super(...arguments);

        const imgShapeTitleEl = uiFragment.querySelector('.o_we_image_shape we-title');
        if (imgShapeTitleEl) {
            const warningEl = document.createElement('i');
            warningEl.classList.add('fa', 'fa-exclamation-triangle', 'ml-1');
            warningEl.title = _t("Be aware that this option may not work on many mail clients");
            imgShapeTitleEl.appendChild(warningEl);
        }
    },
});

options.registry.SocialMediaMassMailing = options.Class.extend({
    async willStart() {
        this.$target[0].querySelectorAll(':scope > a').forEach(el => el.setAttribute('id', generateHTMLId(30)));
        await this._super(...arguments);

        [this.dbSocialValues] = await this._rpc({
            model: 'res.company',
            method: 'read',
            args: [session.company_id, ['social_facebook', 'social_twitter', 'social_youtube',
                'social_instagram', 'social_linkedin', 'social_github']],
        });

        delete this.dbSocialValues.id;
    },
    destroy () {
        this._super(...arguments);
        debugger;
    },
    async cleanForSave() {
        console.log('willclean');
        console.log("this.dbSocialValues:", this.dbSocialValues);

        debugger
        console.log("this:", this);
        await this._rpc({
            model: 'res.company',
            method: 'try_set_social_media_links',
            args: [[], this.dbSocialValues],
        });
        // console.log("r:", r);
    },

    /**
     * Applies the we-list on the target and rebuilds the social links.
     *
     * @see this.selectClass for parameters
     */
    async renderListItems(previewMode, widgetValue, params) {
        const entries = JSON.parse(widgetValue);
        // Handle element deletation.
        const entriesIds = entries.map(entry => entry.id);
        const anchorsEls = this.$target[0].querySelectorAll(':scope > a');
        const deletedEl = Array.from(anchorsEls).find(aEl => !entriesIds.includes(aEl.id));
        if (deletedEl) {
            deletedEl.remove();
        }

        for (const entry of entries) {
            let anchorEl = this.$target[0].querySelector(`#${entry.id}`);
            if (!anchorEl) {
                // It's a new social media.
                anchorEl = this.$target[0].querySelector(':scope > a').cloneNode(true);
                anchorEl.href = '#';
                anchorEl.setAttribute('id', entry.id);
            }
            // Handle visibility of the link
            anchorEl.classList.toggle('d-none', !entry.selected);

            const dbField = anchorEl.href.split('/company/social/')[1];
            if (dbField) {
                // Handle URL change for DB links.
                this.dbSocialValues['social_' + dbField] = entry.display_name;
            } else {
                // Handle URL change for custom links.
                const href = anchorEl.getAttribute('href');
                if (href !== entry.display_name) {
                    if (this._isValidURL(entry.display_name)) {
                        // Propose an icon only for valid URLs (no mailto).
                        const socialMedia = this._findRelevantSocialMedia(entry.display_name);

                        // Remove social media social media classes
                        let regx = new RegExp('\\b' + "s_social_media_" + '[^1-9][^ ]*[ ]?\\b', 'g');
                        anchorEl.className = anchorEl.className.replace(regx, '');

                        // Remove every fa classes except fa-x sizes
                        const faElement = anchorEl.querySelector('.fa');
                        debugger
                        regx = new RegExp('\\b' + "fa-" + '[^1-9][^ ]*[ ]?\\b', 'g');
                        faElement.className = faElement.className.replace(regx, '');

                        if (socialMedia) {
                            anchorEl.classList.add(`s_social_media_${socialMedia}`);
                             faElement.classList.add(`fa-${socialMedia}`);
                        } else {
                            faElement.classList.add(`fa-pencil`);
                        }
                    }
                    anchorEl.setAttribute('href', entry.display_name);
                }
            }
            // Place the link at the correct position
            this.$target[0].appendChild(anchorEl);
        }
    },
    /**
     * @override
     */
    _computeWidgetState: function (methodName, params) {
        if (methodName !== 'renderListItems') {
            return this._super(methodName, params);
        }
        const listEntries = [];
        for (const anchorEl of this.$target[0].querySelectorAll(':scope > a')) {
            const dbField = anchorEl.href.split('/company/social/')[1];
            const entry = {
                id: anchorEl.id,
                selected: !anchorEl.classList.contains('d-none'),
                display_name: dbField ? this.dbSocialValues['social_' + dbField] : anchorEl.getAttribute('href'),
                undeletable: Boolean(dbField),
                placeholder: `https://${dbField || 'example'}.com/yourPage`,
            };
            listEntries.push(entry);
        }
        // console.log("listEntries:", listEntries);
        return JSON.stringify(listEntries);
    },
    /**
     * Finds the social network for the given url.
     *
     * @param  {String} url
     * @return {String} The social network to which the url leads to.
     */
    _findRelevantSocialMedia(url) {
        const supportedSocialMedia = [
            ['facebook', /^(https?:\/\/)(www\.)?(facebook|fb|m\.facebook)\.(com|me)\/.+$/gm],
            ['twitter', /^(https?:\/\/)((www\.)?twitter\.com)\/.+$/gm],
            ['youtube', /^(https?:\/\/)(www\.)?(youtube.com|youtu.be)\/.+$/gm],
            ['instagram', /^(https?:\/\/)(www\.)?(instagram.com|instagr.am|instagr.com)\/.+$/gm],
            ['linkedin', /^(https?:\/\/)((www\.)?linkedin\.com)\/.+$/gm],
            ['github', /^(https?:\/\/)((www\.)?github\.com)\/.+$/gm],
        ];
        for (const [socialMedia, regex] of supportedSocialMedia) {
            if (regex.test(url)) {
                return socialMedia;
            }
        }
        // Check if an icon matches the URL domain
        try {
            const domain = new URL(url).hostname.split('.').slice(-2)[0];
            fonts.computeFonts();
            return fonts.fontIcons[0].alias.find(el => el.includes(domain)).split('fa-').pop();
        } catch (error) {
            return false;
        }
    },
    /**
     * @param  {String} str
     * @returns {boolean} is the string a valid URL.
     */
    _isValidURL(str) {
        try {
            new URL(str);
        } catch (error) {
            return false;
        }
        return true;
    },
    /**
     * @override
     */
    _renderCustomXML(uiFragment) {
        const anchorEls = this.$target[0].querySelectorAll(':scope > a:not(.d-none)');
        uiFragment.querySelector('we-list').dataset.defaults = JSON.stringify(
            Array.from(anchorEls).map(el => el.id)
        );
    }
});

});
