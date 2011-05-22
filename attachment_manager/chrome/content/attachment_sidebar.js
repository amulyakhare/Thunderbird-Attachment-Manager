var attachment_manager = {
    
    removeListeners: function() {
    	var el = document.getElementById("threadTree");
        el.removeEventListener("select", refreshPane, null);
        var cb = document.getElementById("attachment_sidebarframe").contentDocument.getElementById("selall");
        cb.removeEventListener("CheckboxStateChange", selectall, null);
    },
    
	//function to add event listeners to the checkbox and the thread tree.
    addListeners: function() {
    	setTimeout( function() {
        	var el = document.getElementById("threadTree");
            el.addEventListener("select", refreshPane, null);
        	var cb = document.getElementById("attachment_sidebarframe").contentDocument.getElementById("selall");
        	cb.addEventListener("CheckboxStateChange", selectall, null);
        	},500)
    }
};

//function to select all / deselect all the attachments in the list box.
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

//function to refresh the list box display each time the email selection changes.
function refreshPane() {
    let msgHdrs = gFolderDisplay.selectedMessages;
    var i = 0;
    var params = new Array();
    for (i = 0; i < gFolderDisplay.selectedCount; i++) {
        MsgHdrToMimeMessage(msgHdrs[i], null, function (aMsgHdr, aMimeMessage) {
            let attachments = aMimeMessage.allAttachments;
            attachments = attachments.filter(function (x) x.isRealAttachment);
            params = params.concat(attachments);
        }, true);
    }
    
    
	/*a timeout is required because the above function requires 
	certain time to be able to retieve the params array.*/
    setTimeout(

    function () {
        var listbox = document.getElementById("attachment_sidebarframe").contentDocument.getElementById("listbox");
        var tooltip = clearList(listbox);
        var i = 0;
        for (i = 0; i < params.length; i++) {
            listbox.appendChild(createListItem(params[i], params[i].name, "moz-icon://" + params[i].name + "?size=40&contentType=" + params[i].contentType));
        }
    }, 1000)
}

//a function that creates a list box item for the attachment and returns it.
function createListItem(att, name, src) {
    var item = document.createElement("richlistitem");
    item.value = att;
    var check = document.createElement("checkbox");
    check.setAttribute("checked", false);
    var image = document.createElement("image");
    image.setAttribute("src", src);
    var label = document.createElement("label");
    label.setAttribute("value", name);

	//if it is an image attachment, enable preview by hover using the tooltip property.
    if (att.contentType.indexOf("image/") === 0) {
        var dialog = document.getElementById("attachment_sidebarframe").contentDocument.getElementById("attachmentsidebar");
        var tooltip = document.createElement("tooltip");
        tooltip.setAttribute("id", "tip" + name);
        var img = document.createElement("image");
        img.setAttribute("src", att.url);
        img.setAttribute("maxheight", "400");
        img.setAttribute("maxwidth", "400");
        image.setAttribute("src",att.url);
        image.setAttribute("maxheight", "40");
        image.setAttribute("maxwidth", "40");
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

//function that is called when the forward button is clicked.
function onfor() {
    var attachments = getSelectedAttachments();
    composeMessageWithText(attachments);
    return true;
}

//function that is called when the download button is clicked.
function download() {
    var att = getSelectedAttachments();
    var path = getFilePath();
    saveAttachments(att, path);
    return true;
}

//function returns an array of attachments that were selected by the uses.
function getSelectedAttachments() {
    var listbox = document.getElementById("listbox");
    var attachments = new Array();
    for (i = 0; i < listbox.getRowCount(); i++) {
        if (listbox.getItemAtIndex(i).getElementsByTagName("checkbox")[0].checked == true) {
            attachments.push(listbox.getItemAtIndex(i).value);
        }
    }
    return attachments;
}

//function that open a file picker window and returns the path of the located chosen by the user.
function getFilePath() {
    const nsIFilePicker = Components.interfaces.nsIFilePicker;
    var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
    fp.init(window, "Pick a Folder", nsIFilePicker.modeGetFolder);
    fp.appendFilters(nsIFilePicker.filterAll | nsIFilePicker.filterText);

    var fullfilepath;
    var rv = fp.show();
    if (rv == nsIFilePicker.returnOK || rv == nsIFilePicker.returnReplace) {
        var file = fp.file;
        // Get the path as string. 
        fullfilepath = fp.file.path;
    }
    return fullfilepath;
}

//function that saves attachments to a particular path in the computer.
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
    }
}

//function that resets the listbox to empty.
function clearList(listbox) {
    var times = listbox.getRowCount();
    for (i = 0; i < times; i++) {
        listbox.removeItemAt(0);
    }
}

//function that opens a new compose window with attachments pre-attached.
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
