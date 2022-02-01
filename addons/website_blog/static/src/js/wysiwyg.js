odoo.define('website_blog.wysiwyg', function (require) {
'use strict';


const publicWidget = require('web.public.widget');
const Wysiwyg = require('web_editor.wysiwyg');
require('website.editor.snippets.options');

Wysiwyg.include({
    custom_events: Object.assign({}, Wysiwyg.prototype.custom_events, {
        'set_blog_post_updated_tags': '_onSetBlogPostUpdatedTags',
    }),

    /**
     * @override
     */
    init() {
        this._super(...arguments);
        this.blogTagsPerBlogPost = {};
    },
    /**
     * @override
     */
    async start() {
        await this._super(...arguments);
        $('.js_tweet, .js_comment').off('mouseup').trigger('mousedown');
        const postContentEl = document.getElementById('o_wblog_post_content');
        if (postContentEl) {
            // Patch all droppable snippet templates.
            const usesRegularCover = document.body.querySelector("#o_wblog_post_main.container");
            const targetClass = usesRegularCover ? 'container' : 'o_container_small';
            const removedClass = usesRegularCover ? 'o_container_small' : 'container';
            document.body.querySelectorAll([
                    `#o_scroll section .${removedClass}`,
                    "#o_scroll section .container-fluid",
            ]).forEach(section => {
                section.classList.remove("container-fluid");
                section.classList.remove(removedClass);
                section.classList.add(targetClass);
            });
            // Adjust breadcrumb and tags width upon blog post content changes.
            const breadcrumbEl = postContentEl.querySelector('.breadcrumb');
            const tagsEl = postContentEl.querySelector('.o_wblog_post_tags');
            if (breadcrumbEl || tagsEl) {
                this._widthObserver = new MutationObserver(records => {
                    if (_.any(records, record => (record.type === 'childList' ||
                        (record.type === 'attributes' && record.attributeName === 'class')) &&
                        ![breadcrumbEl, tagsEl].includes(record.target)
                    )) {
                        if (breadcrumbEl) {
                            publicWidget.registry.websiteBlog.adjustWidth(postContentEl, breadcrumbEl);
                        }
                        if (tagsEl) {
                            publicWidget.registry.websiteBlog.adjustWidth(postContentEl, tagsEl);
                        }
                    }
                });
                this._widthObserver.observe(postContentEl, {
                    childList: true,
                    subtree: true,
                    attributes: true,
                });
            }
        }
    },
    /**
     * @override
     */
    destroy() {
        if (this._widthObserver) {
            this._widthObserver.disconnect();
        }
        return this._super(...arguments);
    },

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * @override
     */
    async _saveViewBlocks() {
        const ret = await this._super(...arguments);
        await this._saveBlogTags(); // Note: important to be called after save otherwise cleanForSave is not called before
        return ret;
    },

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * Saves the blog tags in the database.
     *
     * @private
     */
    async _saveBlogTags() {
        for (const [key, tags] of Object.entries(this.blogTagsPerBlogPost)) {
            const proms = tags.filter(tag => typeof tag.id === 'string').map(tag => {
                return this._rpc({
                    model: 'blog.tag',
                    method: 'create',
                    args: [{
                        'name': tag.name,
                    }],
                });
            });
            const createdIDs = await Promise.all(proms);

            await this._rpc({
                model: 'blog.post',
                method: 'write',
                args: [parseInt(key), {
                    'tag_ids': [[6, 0, tags.filter(tag => typeof tag.id === 'number').map(tag => tag.id).concat(createdIDs)]],
                }],
            });
        }
    },

    //--------------------------------------------------------------------------
    // Handlers
    //--------------------------------------------------------------------------

    /**
     * @private
     * @param {OdooEvent} ev
     */
    _onSetBlogPostUpdatedTags: function (ev) {
        this.blogTagsPerBlogPost[ev.data.blogPostID] = ev.data.tags;
    },
});

});
