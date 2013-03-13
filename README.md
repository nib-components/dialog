# Dialog

Create dialogs using an element on the page or pull the content in via AJAX.

    var Dialog = require('dialog');
    var modal = new Dialog({ url: '/my/content' });
    modal.show();