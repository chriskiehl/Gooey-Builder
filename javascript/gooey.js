
fieldMap = {
    FileChooser : ['help', 'command'],
    MultiFileChooser: ['help', 'command'],
    DirChooser: ['help', 'command'],
    FileSaver: ['help', 'command'],
    DateChooser: ['help', 'command'],
    TextField: ['help', 'command', 'nargs'],
    Dropdown: ['help', 'command', 'choices'],
    Counter:  ['help', 'command', 'filled-choices'],
    CheckBox: ['help', 'command'],
    RadioGroup: ['options']
};

previewWidgetMap = {
    Default: '#rpreview-default-template',
    FileChooser : '#rpreview-chooser-template',
    MultiFileChooser: '#rpreview-chooser-template',
    DirChooser: '#rpreview-chooser-template',
    FileSaver: '#rpreview-chooser-template',
    DateChooser: '#rpreview-chooser-date-template',
    TextField: '#rpreview-textfield-template',
    Dropdown: '#rpreview-dropdown-template',
    Counter:  '#rpreview-counter-template',
    CheckBox: '#rpreview-checkbox-template',
    RadioGroup: '#rpreview-radio-template'
};

stuff = {
    'help': '#help-template',
    'command': '#flag-template',
    'nargs': '#nargs-template',
    'choices': '#choices-template',
    'groupname': '#group-name-template',
    'options': '#radio-options-template'
};

function RenderedPreview($) {
    var programTitle = $('.programTitle');
}

function textFieldValue(textField) {
    function value() { return textField.val() }
    return textField.asEventStream("keyup").map(value).toProperty(value())
}

function textElmValue(textField) {
    function value() { return textField.text() }
    return textField.asEventStream("keyup").map(value).toProperty(value())
}

reflowWidgets = _.curry(function(target, section, val) {
    var widgetContainer = $(target);
    var editorItems = _.map($(section).children(), function(x) { return $(x).attr('data-preview-target')});
    if (!editorItems) {return}
    var previewItems = _.map(editorItems, function(previewId) {return $('#' + previewId); });
    var groupedItems = _.chunk(previewItems, _.parseInt(val));
    var rows = _.map(groupedItems, function(itemGroup) {
       return $('<div class="row"></div>').append(itemGroup);
    });
    widgetContainer.html(rows);
});

reflowReqs = reflowWidgets('#req-widget-section', '.required-section');
reflowOpts = reflowWidgets('#opt-widget-section', '.optionals-section');

swapPosition = _.curry(function(position, action, event) {
    group = $(this).parents('.widget-input-group');
    var nextElement = group[position]('.widget-input-group');
    if (nextElement) {
        group[action](nextElement);
    }
});

$(document).ready(function() {
    LIST_TEMPLATE = $('#new-widget-template').children();
    WIDGET_OPTION_PANEL = $('#widget-option-panel-template').children();
    PILL = $('#option-pill-template').children();

    editor = $('.editor-content');

    var programTitleField = textFieldValue($('#programName'));
    var programDescription = textFieldValue($('#programDescription'));
    var widthField = textFieldValue($('#widthField'));
    var heightField = textFieldValue($('#heightField'));
    var reqCols = textFieldValue($('#reqCols'));
    var optCols = textFieldValue($('#optCols'));
    var addRequirement = $('.plus');

    programTitleField.assign($('#program-title'), 'text');
    programDescription.assign($('#preview-settings'), 'text');
    widthField.assign($('#title-bar, .program-window'), 'css', 'width');
    heightField.assign($('.program-window'), 'css', 'height');
    reqCols.onValue(reflowReqs);
    optCols.onValue(reflowOpts);

    editor.on('click', '.move-up', swapPosition('prev', 'insertBefore'));
    editor.on('click', '.move-down', swapPosition('next', 'insertAfter'));

    editor.delegate('h4[contenteditable]', 'keydown', function(e) {
        if (e.keyCode === 13) {
            $(this).blur();
            return false;
        }
    });

    editor.on('click', '.roll-toggle', function(e) {
        var changeUiState = function(action, newClass) {
            rollToggle.parents('.widget-input-group').children('.widget-group-options')[action]();
            var prevClasses = _.dropRight(rollToggle.attr('class').split(' ')).join(' ');
            rollToggle.attr('class', prevClasses + ' ' + newClass);
        };
        var rollToggle = $(this);
//                var children = rollToggle.parents('.widget-input-group').children('.widget-group-options');
        if (rollToggle.attr('class').indexOf('is-expanded') > -1) {
            changeUiState('slideUp', 'is-collapsed');
        } else {
            changeUiState('slideDown', 'is-expanded');
        }
    });

    editor.on('click', '.remove-button', function(e) {
        var group = $(this).parents('.widget-input-group');
        var targetId = group.attr('data-preview-target');
        group.slideUp(function() { $(this).remove(); });
        $('#' + targetId).fadeOut(function() { $(this).remove(); });
    });


    addRequirement.on('click', function(e) {
        function isReq(x) { return x.attr('id').indexOf('required') > -1 }
        var previewSection = isReq($(this)) ? $('#req-widget-section') : $('#opt-widget-section');
        var editSection    = isReq($(this)) ? $('.required-section') : $('.optionals-section');

        var idStamp = new Date().getTime();
        var previewWidget = $(previewWidgetMap.Default).clone();
        previewWidget.attr('id', idStamp);
        previewSection.append(previewWidget);

        var title = editSection
            .append(LIST_TEMPLATE.clone()
            .attr('data-preview-target', idStamp))
            .find('.widget-group-title').last().focus();
        highlightContentEditable(title[0]);

        textElmValue(title).assign(previewWidget.find('.name'), 'text');

        $('.editor-content').animate({ scrollTop: $('.meta-section').height() + previewSection.height() });
    });


    function highlightContentEditable(element) {
        var range = document.createRange();
        range.selectNodeContents(element);
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    }


    $(document).delegate('.widget-selector', 'change', function(e) {
        var fields = _.map(fieldMap[$(this).val()], function(field) { return $(stuff[field]).clone().removeAttr('id') });
        var group = $(this).parents('.widget-group-options');
        group.children().slice(1).remove();
        group.append(fields);

        var groupParent = $(this).parents('.widget-input-group');
        var previewId = groupParent.attr('data-preview-target');
        var target = $('#' + previewId);

        var newWidget = $(previewWidgetMap[$(this).val()]).clone().attr('id', previewId);
        target.replaceWith(newWidget);
        textElmValue(groupParent.find('.widget-group-title')).assign(newWidget.find('.name'), 'text');
        textFieldValue(groupParent.find('.wfield-help')).assign(newWidget.find('.help-msg'), 'text');
        groupParent.find('.wfield-choices').on('blur', function() {
            var choices = _.map($(this).val().split(','), function(choice) {
                return '<option>' + choice + '</option>'
            });
            newWidget.find('select').children().slice(1).remove();
            newWidget.find('select').append(choices);

        })
    });


    $(document).delegate('.add-group-option', 'click', function(e) {
        WIDGET_OPTION_PANEL.clone().insertBefore($(this).next('.options-disp-box')).animate({'left': '0'}, 200);
    });


    $(document).delegate('.wfield-cancel', 'click', function(e) {
        $(this).parents('.widget-option-panel').animate({'left': 400}, 200, function() {
            $(this).remove();
        });
    });


    function rumble(element, amount) {
        if (amount === 0) { return; }
        element.css('position', 'relative')
            .animate({'left': '2px'}, 50)
            .animate({'left': '0px'}, 50);
        return rumble(element, amount - 1);
    };

    $(document).delegate('.options-disp-box', 'change', function(e) {
        var targetWidget = $('#' + $(this).parents('.widget-input-group').attr('data-preview-target'));
        var buttons = targetWidget.find('.radio');
        var names = _.map($(this).children(), function(pill) { return $(pill).data('name'); });
        var radioOptions = _.map(names, function(name) {
            return '<label><input type="radio" name="1" />' + name + '</label>'
        });
        buttons.children().remove();
        buttons.append(radioOptions);
    });

    $(document).delegate('.wfield-submit', 'click', function(e) {
        var panel = $(this).parents('.widget-option-panel');
        var name = panel.find('.wfield-name');
        var help = panel.find('.wfield-help');
        var flag = panel.find('.wfield-command');
        if (name.val() && flag.val()) {
            var id = new Date().getTime();
            var optBox = panel.next('.options-disp-box');
            if (panel.data('id')) {
                var targetPill = $('#' + panel.data('id'))
            } else {
                var targetPill = PILL.clone().appendTo(optBox);
            }
            targetPill.data('name', name.val());
            targetPill.data('help', help.val());
            targetPill.data('flag', flag.val());
            targetPill.data('id', id);
            targetPill.attr('id', id);
            targetPill.attr('title', 'Params: ' + JSON.stringify(targetPill.data()) );
            targetPill.find('p').text(name.val());
            $(this).parents('.widget-option-panel').animate({'left': 400}, function () {
                $(this).remove();
            });
            optBox.change();
        } else {
            if (!name.val()) rumble(name, 4);
            if (!flag.val()) rumble(flag, 4);
        }
    });

    $(document).delegate('.pill-close', 'click', function(e) {
        var parent = $(this).parents('.options-disp-box');
        parent.children().remove();
        parent.change();
    });

    $(document).delegate('.pill-title', 'click', function(e) {
        var panel = WIDGET_OPTION_PANEL.clone();
        var pillData = $(this).parent().data();
        panel.data(pillData);
        panel.find('h3').text('Editing Radio Option');
        panel.find('.wfield-name').val(pillData.name);
        panel.find('.wfield-help').val(pillData.help);
        panel.find('.wfield-command').val(pillData.flag);

        panel.insertBefore($(this).parents('.options-disp-box')).animate({'left': '0'}, 200);
    });

    $('.menu').on('click', function(e) {
        var slideOut = $('#menu-slideout');
        if ($(this).data('expanded') === true) {
            $(this).data('expanded', true);
            slideOut.animate({'height': 'show', 'width': 'show', 'left': -230}, 'fast');
        } else {
            $(this).data('expanded', false);
            slideOut.animate({'height': 'hide', 'width': 'hide', 'left': 0}, 'fast');
        }
    });

    // prime the editor so there's some sample content
    $('#add-required').click();
    $('#add-required').click();
    $('#add-optional').click();
    reflowReqs(1);
    reflowReqs(2);


});
