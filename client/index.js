(function($, JSONEditor, location) {

    var mainRoute = '/rss';

    var id = ((location.search || '').match(/id=([^&]*)/) || [])[1] || '';

    var editor = new JSONEditor($('#editor_holder').get(0), {
            ajax: true,
            expand_height: true,
            schema: {
                $ref: [mainRoute, (id ? 'schema.json' : 'keys.json')].join('/')
            }
        })
        .on('ready', function() {
            $.get([mainRoute, id].join('/'), function(data) {
                editor.setValue(data);
                $('#loading').hide();
            });
        });

    $('#submit').on('click', function() {
        $.ajax({
            type: 'PUT',
            url: [mainRoute, id].join('/'),
            data: JSON.stringify(editor.getValue()),
            dataType: 'json',
            contentType: 'application/json'
        }).done(function(res) {
            console.log(res.data);
        }).fail(function(e) {
            console.error('Error:', e);
        });
    });

    $('#reload').on('click', function() {
        $.post('/reload')
            .always(function() {
                (function reload() {
                    $.get(mainRoute)
                        .done(location.reload.bind(location))
                        .fail(function() {
                            $('#loading').show();
                            setTimeout(reload, 3000);
                        });
                })();
            });
    });

    /* Exports */

    window.RSSTest = function(unique) {
        $.get([mainRoute, 'test', id, unique].join('/')).done(function(data) {
            console.dir(data);
        }).fail(function(e) {
            console.error('Error:', e);
        });
    };

})(window.$, window.JSONEditor, window.location);