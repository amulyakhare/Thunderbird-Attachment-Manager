var attachment_manager = {
    onLoad: function () {
        // initialization code
        this.initialized = true;
        addTimeoutEventListeners();
    }
};

function addTimeoutEventListeners() {
    setTimeout(
    function () {
        var el = document.getElementById("threadTree");
        el.addEventListener("select", refreshPane, null);
        var cb = document.getElementById("attachment_sidebarframe").contentDocument.getElementById("selall");
        cb.addEventListener("CheckboxStateChange", selectall, null);
    }, 1000)
    
}

function selectall() {
    var listbox = document.getElementById("attachment_sidebarframe").contentDocument.getElementById("listbox");
    if (document.getElementById("attachment_sidebarframe").contentDocument.getElementById("selall").checked == true) {
        for (i = 0; i < listbox.getRowCount(); i++) {
            var item = listbox.getItemAtIndex(i).getElementsByTagName("checkbox")[0];
            if (item.checked == false) {
                item.checked = true;
            }
        }
    } else {
        for (i = 0; i < listbox.getRowCount(); i++) {
            var item = listbox.getItemAtIndex(i).getElementsByTagName("checkbox")[0];
            if (item.checked == true) {
                item.checked = false;
            }
        }
    }

}

window.addEventListener("load", attachment_manager.onLoad, false);

function getFilePath() {
    const nsIFilePicker = Components.interfaces.nsIFilePicker;
    var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
    fp.init(window, "Dialog Title", nsIFilePicker.modeGetFolder);
    fp.appendFilters(nsIFilePicker.filterAll | nsIFilePicker.filterText);

    var fullfilepath;
    var rv = fp.show();
    if (rv == nsIFilePicker.returnOK || rv == nsIFilePicker.returnReplace) {
        var file = fp.file;
        // Get the path as string. Note that you usually won't 
        // need to work with the string paths.
        fullfilepath = fp.file.path;
        // work with returned nsILocalFile...
    }
    return fullfilepath;
}

function saveAttachments(att, fullfilepath) {
    let ioService = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);
    messenger = Components.classes["@mozilla.org/messenger;1"].createInstance(Components.interfaces.nsIMessenger);

    for (i = 0; i < att.length; i++) {
        let neckoURL = null;
        neckoURL = ioService.newURI(att[i].url, null, null);
        neckoURL.QueryInterface(Components.interfaces.nsIMsgMessageUrl);
        let uri = neckoURL.uri;

        var file = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
        file.initWithPath(fullfilepath + "/" + att[i].name);
        if (!file.exists()) {
            file.create(0x00, 0644);
        }
        messenger.saveAttachmentToFile(file, att[i].url, uri, att[i].contentType, null);
        //alert("123");
    }
}

function getSelectedAttachments() {
    var listbox = document.getElementById("listbox");
    var attachments = new Array();
    //alert(listbox.getRowCount());
    for (i = 0; i < listbox.getRowCount(); i++) {
        if (listbox.getItemAtIndex(i).getElementsByTagName("checkbox")[0].checked == true) {
            attachments.push(listbox.getItemAtIndex(i).value);
        }
    }
    return attachments;
}

function onfor() {
    var attachments = getSelectedAttachments();
    composeMessageWithText(attachments);
    return true;
}

function download() {
    var att = getSelectedAttachments();
    var path = getFilePath();
    saveAttachments(att, path);
    return true;
}

function refreshPane() {
    let msgHdrs = gFolderDisplay.selectedMessages;
    var i = 0;
    var params = new Array();
    //alert(gFolderDisplay.selectedCount);
    for (i = 0; i < gFolderDisplay.selectedCount; i++) {
        MsgHdrToMimeMessage(msgHdrs[i], null, function (aMsgHdr, aMimeMessage) {
            let attachments = aMimeMessage.allAttachments;
            attachments = attachments.filter(function (x) x.isRealAttachment);
            //alert(attachments[0].name);
            params = params.concat(attachments);
        }, true);
    }

    setTimeout(

    function () {
        var listbox = document.getElementById("attachment_sidebarframe").contentDocument.getElementById("listbox");
        var tooltip = clearList(listbox);
        //alert(listbox.itemCount);
        var i = 0;
        for (i = 0; i < params.length; i++) {
            //alert(window.arguments[0][i].contentType);
            //if (window.arguments[0][i].contentType.indexOf("image/") === 0) 
            {
                //  listbox.appendChild(createListItem(window.arguments[0][i].name, window.arguments[0][i].url));
            }
            //else
            {
                listbox.appendChild(createListItem(params[i], params[i].name, "moz-icon://" + params[i].name + "?size=40&contentType=" + params[i].contentType));
            }
        }
    }, 1000)
}

function clearList(listbox) {
    var times = listbox.getRowCount();
    for (i = 0; i < times; i++) {
        listbox.removeItemAt(0);
    }
}

function createListItem(att, name, src) {
    var item = document.createElement("richlistitem");
    item.value = att;
    var check = document.createElement("checkbox");
    check.setAttribute("checked", false);
    var image = document.createElement("image");
    image.setAttribute("src", src);
    var label = document.createElement("label");
    label.setAttribute("value", name);

    if (att.contentType.indexOf("image/") === 0) {
        var dialog = document.getElementById("attachment_sidebarframe").contentDocument.getElementById("attachmentsidebar");
        var tooltip = document.createElement("tooltip");
        tooltip.setAttribute("id", "tip" + name);
        var img = document.createElement("image");
        img.setAttribute("src", att.url);
        img.setAttribute("maxheight", "400");
        img.setAttribute("maxwidth", "400");
        tooltip.appendChild(img);
        dialog.appendChild(tooltip);
        item.tooltip = tooltip.id;
    } else {
        item.tooltipText = name;
    }
    item.appendChild(check);
    item.appendChild(image);
    item.appendChild(label);
    return item;
}

function composeMessageWithText(att) {
    var msgComposeType = Components.interfaces.nsIMsgCompType;
    var msgComposFormat = Components.interfaces.nsIMsgCompFormat;
    var msgComposeService = Components.classes['@mozilla.org/messengercompose;1'].getService();
    msgComposeService = msgComposeService.QueryInterface(Components.interfaces.nsIMsgComposeService);

    gAccountManager = Components.classes['@mozilla.org/messenger/account-manager;1'].getService(Components.interfaces.nsIMsgAccountManager);

    var params = Components.classes['@mozilla.org/messengercompose/composeparams;1'].createInstance(Components.interfaces.nsIMsgComposeParams);
    if (params) {
        params.type = msgComposeType.Template;
        params.format = msgComposFormat.Default;
        var composeFields = Components.classes['@mozilla.org/messengercompose/composefields;1'].createInstance(Components.interfaces.nsIMsgCompFields);
        if (composeFields) {
            params.composeFields = composeFields;
            for (i = 0; i < att.length; i++) {
                attachment = Components.classes["@mozilla.org/messengercompose/attachment;1"].createInstance(Components.interfaces.nsIMsgAttachment);
                attachment.name = att[i].name;
                attachment.url = att[i].url;
                params.composeFields.addAttachment(attachment);
            }

            msgComposeService.OpenComposeWindowWithParams(null, params);
        }
    }
}