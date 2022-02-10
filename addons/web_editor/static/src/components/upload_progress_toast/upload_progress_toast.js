/** @odoo-module */

const { Component } = owl;

const NO_OP = () => {};

export class ProgressBar extends Component {}
ProgressBar.template = 'web_editor.ProgressBar';

export class UploadProgressToast extends Component {}
UploadProgressToast.props = {
    close: { type: Function, optional: true },
    files: Array,
};
UploadProgressToast.defaultProps = {
    close: NO_OP,
};
UploadProgressToast.template = 'web_editor.UploadProgressToast';
UploadProgressToast.components = {
    ProgressBar
};
