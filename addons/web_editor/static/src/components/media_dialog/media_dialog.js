/** @odoo-module **/

import { useService } from '@web/core/utils/hooks';
import utils from 'web.utils';
import { throttle } from '@web/core/utils/timing';
import { Dialog } from '@web/core/dialog/dialog';
import { ConfirmationDialog } from '@web/core/confirmation_dialog/confirmation_dialog';
import concurrency from 'web.concurrency';
import { getDataURLFromFile } from 'web.utils';
import { UploadProgressToast } from '@web_editor/components/upload_progress_toast/upload_progress_toast';
import session from 'web.session';
import { getCSSVariableValue } from 'web_editor.utils';
import fonts from 'wysiwyg.fonts';

const { useState, Component, useRef, onWillStart, useEffect, useComponent } = owl;

const TABS = {
    IMAGES: {
        id: 'IMAGES',
        title: "Images",
        Component: {},
        props: {},
    },
    DOCUMENTS: {
        id: 'DOCUMENTS',
        title: "Documents",
        Component: {},
        props: {},
    },
    ICONS: {
        id: 'ICONS',
        title: "Icons",
        Component: {},
        props: {},
    },
    VIDEOS: {
        id: 'VIDEOS',
        title: "Videos",
        Component: {},
        props: {},
    },
};
const IMAGE_MIMETYPES = ['image/jpg', 'image/jpeg', 'image/jpe', 'image/png', 'image/svg+xml', 'image/gif'];
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.jpe', '.png', '.svg', '.gif'];

export class AttachmentError extends Dialog {
    setup() {
        super.setup();
        this.title = this.env._t("Alert");
    }
}

AttachmentError.bodyTemplate = "web_editor.AttachmentErrorBody";
AttachmentError.footerTemplate = "web_editor.AttachmentErrorFooter";

export class SearchMedia extends Component {
    setup() {
        this.search = throttle((ev) => this.props.search(ev.target.value), 1000);
    }
}
SearchMedia.template = 'web_editor.SearchMedia';

export class FileSelectorControlPanel extends Component {
    setup() {
        this.state = useState({
            showUrlInput: false,
            urlInput: '',
            isValidUrl: false,
            isValidFileFormat: false
        });

        this.fileInput = useRef('file-input');
    }

    get showSearchServiceSelect() {
        return this.props.searchService && this.props.needle;
    }

    get enableUrlUploadClick() {
        return !this.state.showUrlInput || (this.state.urlInput && this.state.isValidUrl && this.state.isValidFileFormat);
    }

    async onUrlUploadClick() {
        if (!this.state.showUrlInput) {
            this.state.showUrlInput = true;
        } else {
            await this.props.uploadUrl(this.state.urlInput, (attachment) => this.props.onUploaded(attachment));
            this.state.urlInput = '';
        }
    }

    onUrlInput(ev) {
        const { isValidUrl, isValidFileFormat } = this.props.validateUrl(ev.target.value);
        this.state.isValidFileFormat = isValidFileFormat;
        this.state.isValidUrl = isValidUrl;
    }

    onClickUpload() {
        this.fileInput.el.click();
    }

    async onChangeFileInput() {
        const inputFiles = this.fileInput.el.files;
        if (!inputFiles.length) {
            return;
        }
        await this.props.uploadFiles(inputFiles, (attachment) => this.props.onUploaded(attachment));
    }
}
FileSelectorControlPanel.template = 'web_editor.FileSelectorControlPanel';
FileSelectorControlPanel.components = {
    SearchMedia,
};

class RemoveButton extends Component {}
RemoveButton.template = 'web_editor.RemoveButton';

class Attachment extends Component {
    setup() {
        this.dialogs = useService('dialog');
        this.rpc = useService('rpc');
    }

    remove() {
        this.dialogs.add(ConfirmationDialog, {
            body: this.env._t("Are you sure you want to delete this file ?"),
            confirm: async () => {
                const prevented = await this.rpc('/web_editor/attachment/remove', {
                    ids: [this.props.id],
                });
                if (!Object.keys(prevented).length) {
                    this.props.onRemoved(this.props.id);
                } else {
                    this.dialogs.add(AttachmentError, {
                        views: prevented[this.props.id],
                    });
                }
            },
            cancel: () => {},
        });
    }
}
Attachment.components = {
    RemoveButton,
};

const useResizeAfterLoaded = (minRowHeight) => {
    const component = useComponent();
    const getImage = () => component.el.querySelector('img');

    const state = useState({
        loaded: false,
    });

    const onImageLoaded = () => {
        const image = getImage();
        const aspectRatio = image.offsetWidth / image.offsetHeight;
        const width = aspectRatio * minRowHeight;
        component.el.style.flexGrow = width;
        component.el.style.flexBasis = `${width}px`;
        state.loaded = true;
    };

    useEffect(() => {
        const image = getImage();
        image.addEventListener('load', () => onImageLoaded());
        return image.removeEventListener('load', () => onImageLoaded());
    });
    return state;
};

export class ImageAttachment extends Attachment {
    setup() {
        super.setup();

        this.state = useResizeAfterLoaded(this.props.minRowHeight);
    }
}
ImageAttachment.template = 'web_editor.ImageAttachment';

export class LibraryImage extends Component {
    setup() {
        this.state = useResizeAfterLoaded(this.props.minRowHeight);
    }
}
LibraryImage.template = 'web_editor.LibraryImage';

export class FileSelector extends Component {
    setup() {
        this.state = useState({
            attachments: [],
            canLoadMoreAttachments: true,
            isFetchingAttachments: false,
            needle: '',
        });

        this.NUMBER_OF_ATTACHMENTS_TO_DISPLAY = 10;

        onWillStart(async () => {
            this.state.attachments = await this.fetchAttachments(this.NUMBER_OF_ATTACHMENTS_TO_DISPLAY, 0);
        });
    }

    get canLoadMore() {
        return this.state.canLoadMoreAttachments;
    }

    get hasContent() {
        return this.state.attachments.length;
    }

    get isFetching() {
        return this.state.isFetchingAttachments;
    }

    validateUrl(url) {
        const path = url.split('?')[0];
        const isValidUrl = /^.+\..+$/.test(path); // TODO improve
        const isValidFileFormat = true;
        return { isValidUrl, isValidFileFormat, path };
    }

    async fetchAttachments(limit, offset) {
        this.state.isFetchingAttachments = true;
        const attachments = await this.props.fetchAttachments(limit, offset, this.state.needle);
        this.state.canLoadMoreAttachments = attachments.length >= this.NUMBER_OF_ATTACHMENTS_TO_DISPLAY;
        this.state.isFetchingAttachments = false;
        return attachments;
    }

    async loadMore() {
        const newAttachments = await this.fetchAttachments(this.NUMBER_OF_ATTACHMENTS_TO_DISPLAY, this.state.attachments.length);
        this.state.attachments.push(...newAttachments);
    }

    async search(needle) {
        this.state.needle = needle;
        this.state.attachments = await this.fetchAttachments(this.NUMBER_OF_ATTACHMENTS_TO_DISPLAY, 0);
    }

    onUploaded(attachment) {
      this.state.attachments = [attachment, ...this.state.attachments];
    }

    onRemoved(attachmentId) {
        this.state.attachments = this.state.attachments.filter(attachment => attachment.id !== attachmentId);
    }

    selectAttachment(attachment, type = 'attachments') {
        if (!this.props.multiSelect) {
            this.state[type] = this.state[type].map(att => {
                att.selected = att.id === attachment.id;
                return att;
            });
        } else {
            this.state[type] = this.state[type].map(att => {
                if (att.id === attachment.id) {
                    att.selected = !att.selected;
                }
                return att;
            });
        }
    }
}
FileSelector.template = 'web_editor.FileSelector';
FileSelector.components = {
    FileSelectorControlPanel,
};

export class ImageSelector extends FileSelector {
    setup() {
        super.setup();

        this.state.libraryMedia = [];
        this.state.libraryResults = null;
        this.state.isFetchingLibrary = false;
        this.state.searchService = 'all';
        this.state.showOptimized = true;

        this.uploadText = this.env._t("Upload an image");
        this.urlPlaceholder = "https://www.odoo.com/logo.png";
        this.addText = this.env._t("Add URL");
        this.searchPlaceholder = this.env._t("Search an image");
        this.urlWarningTitle = this.env._t("Uploaded image's format is not supported. Try with: " + IMAGE_EXTENSIONS.join(', '));
        this.allLoadedText = this.env._t("All images have been loaded");
        this.showOptimizedOption = true;
        this.MIN_ROW_HEIGHT = 128;
    }

    get canLoadMore() {
        if (this.state.searchService === 'all') {
            return super.canLoadMore || (this.state.libraryResults && this.state.libraryMedia.length < this.state.libraryResults);
        } else if (this.state.searchService === 'media-library') {
            return this.state.libraryResults && this.state.libraryMedia.length < this.state.libraryResults;
        }
        return super.canLoadMore;
    }

    get hasContent() {
        if (this.state.searchService === 'all') {
            return super.hasContent || !!this.state.libraryMedia.length;
        } else if (this.state.searchService === 'media-library') {
            return !!this.state.libraryMedia.length;
        }
        return super.hasContent;
    }

    get isFetching() {
        return super.isFetching || this.state.isFetchingLibrary;
    }

    validateUrl(...args) {
        const { isValidUrl, path } = super.validateUrl(...args);
        const isValidFileFormat = IMAGE_EXTENSIONS.some(format => path.endsWith(format));
        return { isValidFileFormat, isValidUrl };
    }

    async fetchAttachments(limit, offset) {
        const attachments = await super.fetchAttachments(limit, offset);
        // Color-substitution for dynamic SVG attachment
        const primaryColors = {};
        for (let color = 1; color <= 5; color++) {
            primaryColors[color] = getCSSVariableValue('o-color-' + color);
        }
        return attachments.map(attachment => {
            if (attachment.image_src.startsWith('/')) {
                const newURL = new URL(attachment.image_src, window.location.origin);
                // Set the main colors of dynamic SVGs to o-color-1~5
                if (attachment.image_src.startsWith('/web_editor/shape/')) {
                    newURL.searchParams.forEach((value, key) => {
                        const match = key.match(/^c([1-5])$/);
                        if (match) {
                            newURL.searchParams.set(key, primaryColors[match[1]]);
                        }
                    });
                } else {
                    // Set height so that db images load faster
                    newURL.searchParams.set('height', 2 * this.MIN_ROW_HEIGHT);
                }
                attachment.thumbnail_src = newURL.pathname + newURL.search;
            }
            if (attachment.image_src === this.props.media.getAttribute('src')) {
                attachment.selected = true;
            }
            return attachment;
        });
    }

    async fetchLibraryMedia(offset) {
        this.state.isFetchingLibrary = true;
        if (!this.state.needle) {
            return { media: [], results: null };
        }
        try {
            const response = await this.rpc(
                '/web_editor/media_library_search',
                {
                    'query': this.state.needle,
                    'offset': offset,
                },
            );
            this.state.isFetchingLibrary = false;
        return { media: response.media, results: response.results };
        } catch (e) {
            // Either API endpoint doesn't exist or is misconfigured.
            console.error(`Couldn't reach API endpoint.`);
            this.state.isFetchingLibrary = false;
        }
    }

    async loadMore(...args) {
        await super.loadMore(...args);
        if (!this.props.useMediaLibrary) {
            return;
        }
        const { media } = await this.fetchLibraryMedia(this.state.libraryMedia.length);
        this.state.libraryMedia.push(...media);
    }

    async search(...args) {
        await super.search(...args);
        if (!this.props.useMediaLibrary) {
            return;
        }
        if (!this.state.needle) {
            this.state.searchService = 'all';
        }
        const { media, results } = await this.fetchLibraryMedia(0);
        this.state.libraryMedia = media;
        this.state.libraryResults = results;
    }

    selectMedia(media) {
        this.selectAttachment(media, 'libraryMedia');
    }
}
ImageSelector.attachmentsListTemplate = 'web_editor.ImagesListTemplate';
TABS.IMAGES.Component = ImageSelector;
ImageSelector.components = {
    ...FileSelector.components,
    ImageAttachment,
    LibraryImage,
};

export class DocumentAttachment extends Attachment {}
DocumentAttachment.template = 'web_editor.DocumentAttachment';

export class DocumentSelector extends FileSelector {
    setup() {
        super.setup();

        this.uploadText = this.env._t("Upload a document");
        this.urlPlaceholder = "https://www.odoo.com/mydocument";
        this.addText = this.env._t("Add document");
        this.searchPlaceholder = this.env._t("Search a document");
        this.allLoadedText = this.env._t("All documents have been loaded");
    }
}
DocumentSelector.attachmentsListTemplate = 'web_editor.DocumentsListTemplate';
TABS.DOCUMENTS.Component = DocumentSelector;
DocumentSelector.components = {
    ...FileSelector.components,
    DocumentAttachment,
};

export class IconSelector extends Component {
    setup() {
        fonts.computeFonts();

        this.allFonts = fonts.fontIcons.map(({cssData, base}) => {
            const uniqueIcons = Array.from(new Map(cssData.map(icon => {
                const alias = icon.names.join(',');
                return [alias, { ...icon, alias }];
            })).values());
            return { base, icons: uniqueIcons };
        });

        this.state = useState({
            fonts: this.allFonts,
            needle: '',
        });

        this.searchPlaceholder = this.env._t("Search a pictogram");
    }

    search(needle) {
        this.state.needle = needle;
        if (!this.state.needle) {
            this.state.fonts = this.allFonts;
        } else {
            this.state.fonts = this.allFonts.map(font => {
                const icons = font.icons.filter(icon => icon.alias.indexOf(this.state.needle) >= 0);
                return {...font, icons};
            });
        }
    }

    select(fontBase, alias) {
        this.state.fonts = [...this.state.fonts.map(font => {
            if (font.base === fontBase) {
                return { ...font, icons: font.icons.map(icon => {
                    if (icon.alias === alias) {
                        return { ...icon, selected: true };
                    }
                    return { ...icon, selected: false };
                })};
            }
            return font;
        })];
    }
}
IconSelector.template = 'web_editor.IconSelector';
TABS.ICONS.Component = IconSelector;
IconSelector.components = {
    SearchMedia,
};

export class VideoSelector extends Component {}
VideoSelector.template = 'web_editor.VideoSelector';
TABS.VIDEOS.Component = VideoSelector;

export class MediaDialog extends Dialog {
    setup() {
        super.setup();
        this.size = 'modal-xl';
        this.contentClass = 'o_select_media_dialog';
        this.title = this.env._t("Select a media");

        this.rpc = useService('rpc');
        this.orm = useService('orm');

        this.tabs = [];
        if (!this.props.noImages) {
            this.addTab(TABS.IMAGES);
        }
        if (!this.props.noDocuments) {
            this.addTab(TABS.DOCUMENTS);
        }
        if (!this.props.noIcons) {
            this.addTab(TABS.ICONS);
        }
        if (!this.props.noVideos) {
            this.addTab(TABS.VIDEOS);
        }

        this.state = useState({
            activeTab: this.props.activeTab || this.tabs[0].id,
            showUploadProgressToast: false,
            filesToUpload: [],
        });
    }

    addTab(tab) {
        this.tabs.push({
            ...tab,
            props: {
                ...tab.props,
                uploadUrl: (...args) => this.uploadUrl(...args),
                uploadFiles: (...args) => this.uploadFiles(...args, tab.id),
                fetchAttachments: (...args) => this.fetchAttachments(...args, tab.id),
                useMediaLibrary: this.props.useMediaLibrary,
                media: this.props.media,
                multiSelect: this.props.multiImages,
            }
        });
    }

    async uploadUrl(url, onUploaded) {
        const attachment = await this.rpc('/web_editor/attachment/add_url', {
            url,
            'res_model': this.props.resModel,
            'res_id': this.props.resId,
        });
        onUploaded(attachment);
    }

    async uploadFiles(files, onUploaded, type) {
        // Upload the smallest file first to block the user the least possible.
        this.state.filesToUpload = Array.from(files).sort((a, b) => a.size - b.size).map((file, index) => {
            let fileSize = file.size;
            if (!fileSize) {
                fileSize = null;
            } else if (fileSize < 1024) {
                fileSize = fileSize.toFixed(2) + " bytes";
            } else if (fileSize < 1048576) {
                fileSize = (fileSize / 1024).toFixed(2) + " KB";
            } else {
                fileSize = (fileSize / 1048576).toFixed(2) + " MB";
            }

            return {
                id: index,
                name: file.name,
                size: fileSize,
                progress: 0,
                hasError: false,
                uploaded: false,
                errorMessage: '',
            };
        });

        const uploadMutex = new concurrency.Mutex();
        for (const file of this.state.filesToUpload) {
            this.state.showUploadProgressToast = true;
            // Upload one file at a time: no need to parallel as upload is
            // limited by bandwidth.
            uploadMutex.exec(async () => {
                const dataURL = await getDataURLFromFile(files[file.id]);
                try {
                    const xhr = new XMLHttpRequest();
                    xhr.upload.addEventListener('progress', ev => {
                        const rpcComplete = ev.loaded / ev.total * 100;
                        file.progress = rpcComplete;
                    });
                    xhr.upload.addEventListener('load', function () {
                        // Don't show yet success as backend code only starts now
                        file.progress = 100;
                    });
                    const attachment = await this.rpc('/web_editor/attachment/add_data', {
                        'name': file.name,
                        'data': dataURL.split(',')[1],
                        'res_id': this.props.resId,
                        'res_model': this.props.resModel,
                        'is_image': type === TABS.IMAGES.id,
                        'width': 0,
                        'quality': 0,
                    }, {xhr});
                    if (attachment.error) {
                        file.hasError = true;
                        file.errorMessage = attachment.error;
                    } else {
                        file.uploaded = true;
                        onUploaded(attachment);
                    }
                    // this._handleNewAttachment(attachment);
                } catch (error) {
                    file.hasError = true;
                    throw error;
                }
            });
        }

        return uploadMutex.getUnlockedDef().then(() => {
            setTimeout(() => this.state.showUploadProgressToast = false, 3000);
            // if (!this.options.multiImages && !this.noSave) {
            //     this.trigger_up('save_request');
            // }
            // this.noSave = false;
        });
    }

    async fetchAttachments(number, offset, needle, fileType) {
        const res = await this.orm.call(
            'ir.attachment',
            'search_read',
            [],
            {
                domain: this._getAttachmentsDomain(needle, fileType),
                fields: ['name', 'mimetype', 'description', 'checksum', 'url', 'type', 'res_id', 'res_model', 'public', 'access_token', 'image_src', 'image_width', 'image_height', 'original_id'],
                order: 'id desc',
                // Try to fetch first record of next page just to know whether there is a next page.
                limit: number + 1,
                offset: offset,
                context: {...this.props.context, website_id: 1},
            }
        );
        return res;
    }

    /**
     * Returns the domain for attachments used in media dialog.
     * We look for attachments related to the current document. If there is a
     * value for the model field, it is used to search attachments, and the
     * attachments from the current document are filtered to display only
     * user-created documents.
     * In the case of a wizard such as mail, we have the documents uploaded and
     * those of the model.
     *
     * @private
     * @params {string} needle
     * @returns {Array} "ir.attachment" odoo domain.
     */
    _getAttachmentsDomain(needle, fileType) {
        let domain = [];
        const attachedDocumentDomain = [
            '&',
            ['res_model', '=', this.props.resModel],
            ['res_id', '=', this.props.resId || 0]
        ];
        if (this.props.data_res_model) {
            const relatedDomain = ['&',
                ['res_model', '=', this.props.data_res_model],
                ['res_id', '=', this.props.data_res_id || 0]];
            if (!this.options.data_res_id) {
                relatedDomain.unshift('&');
                relatedDomain.push(['create_uid', '=', session.uid]);
            }
            domain = domain.concat(['|'], attachedDocumentDomain, relatedDomain);
        } else {
            domain = domain.concat(attachedDocumentDomain);
        }
        domain = ['|', ['public', '=', true]].concat(domain);

        if (fileType === TABS.IMAGES.id) {
            domain = domain.concat([['mimetype', 'in', IMAGE_MIMETYPES]]);
            if (!this.props.useMediaLibrary) {
                domain.push('|', ['url', '=', false], '!', ['url', '=ilike', '/web_editor/shape/%']);
            }
            domain.push('!', ['name', '=like', '%.crop']);
            domain.push('|', ['type', '=', 'binary'], '!', ['url', '=like', '/%/static/%']);
        } else {
            domain = domain.concat([['mimetype', 'not in', IMAGE_MIMETYPES]]);
            domain = domain.concat('!', utils.assetsDomain());
        }
        if (needle && needle.length) {
            domain.push(['name', 'ilike', needle]);
        }
        return domain;
    }
}
const media = document.createElement('img');
media.src = "/web/image/802-75c4dfa1/Orbit-Corner-Modern-Free-Standing-Bath-prod.jpg";
MediaDialog.bodyTemplate = 'web_editor.MediaDialog';
MediaDialog.components = {
    UploadProgressToast,
    ...Object.keys(TABS).map(key => TABS[key].Component),
};
MediaDialog.defaultProps = {
    useMediaLibrary: true,
    resModel: 'ir.ui.view',
    media,
    multiImages: true,
};
